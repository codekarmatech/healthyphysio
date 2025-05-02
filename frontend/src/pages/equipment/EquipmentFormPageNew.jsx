import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import equipmentService from '../../services/equipmentService';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo: null,
    price: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    is_available: true,
    category: '',
    quantity: 1,
    has_serial_number: true,
    tracking_id: '',
    condition: 'new'
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [serialNumberError, setSerialNumberError] = useState(null);
  const [serialNumberChecking, setSerialNumberChecking] = useState(false);
  
  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await equipmentService.getAllCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load equipment categories. Please try again later.');
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch equipment data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchEquipment = async () => {
        try {
          setLoading(true);
          const response = await equipmentService.getEquipmentById(id);
          const equipment = response.data;
          
          setFormData({
            name: equipment.name,
            description: equipment.description || '',
            photo: null, // We don't load the file itself, just the URL
            price: equipment.price,
            serial_number: equipment.serial_number || '',
            purchase_date: equipment.purchase_date,
            is_available: equipment.is_available,
            category: equipment.category?.id || '',
            quantity: equipment.quantity || 1,
            has_serial_number: equipment.has_serial_number !== false,
            tracking_id: equipment.tracking_id || '',
            condition: equipment.condition || 'new'
          });
          
          if (equipment.photo) {
            setPhotoPreview(equipment.photo);
          }
          
          setError(null);
        } catch (err) {
          console.error('Error fetching equipment:', err);
          setError('Failed to load equipment data. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEquipment();
    }
  }, [id, isEditMode]);
  
  // Check if serial number already exists
  const checkSerialNumber = useCallback(async (serialNumber) => {
    if (!serialNumber.trim()) {
      setSerialNumberError(null);
      return;
    }
    
    try {
      setSerialNumberChecking(true);
      const response = await equipmentService.checkSerialNumberExists(
        serialNumber, 
        isEditMode ? id : null
      );
      
      if (response.data.exists) {
        setSerialNumberError('This serial number is already in use by another equipment item.');
      } else {
        setSerialNumberError(null);
      }
    } catch (err) {
      console.error('Error checking serial number:', err);
      // Don't set an error, just let the form submission handle it
    } finally {
      setSerialNumberChecking(false);
    }
  }, [isEditMode, id]);

  // Debounce function for serial number check
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Debounced serial number check
  const debouncedCheckSerialNumber = useCallback((serialNumber) => {
    const debouncedFn = debounce((value) => {
      checkSerialNumber(value);
    }, 500);
    debouncedFn(serialNumber);
  }, [checkSerialNumber]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Handle file upload
      if (files && files[0]) {
        setFormData({
          ...formData,
          [name]: files[0]
        });
        
        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else if (name === 'serial_number') {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Check for duplicate serial number
      if (formData.has_serial_number && value.trim()) {
        debouncedCheckSerialNumber(value);
      }
    } else if (name === 'has_serial_number') {
      // When toggling has_serial_number, reset serial number error
      setSerialNumberError(null);
      
      // If turning off serial number, clear the serial number field
      setFormData({
        ...formData,
        [name]: checked,
        serial_number: checked ? formData.serial_number : '',
        // If no serial number, ensure we have a tracking ID
        tracking_id: !checked ? (formData.tracking_id || `EQ-${Date.now()}`) : formData.tracking_id
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.category) {
      setError('Please select a category for the equipment.');
      return;
    }
    
    if (formData.has_serial_number && !formData.serial_number.trim()) {
      setError('Serial number is required when "Has Serial Number" is checked.');
      return;
    }
    
    if (serialNumberError) {
      setError('Please fix the serial number issue before submitting.');
      return;
    }
    
    // Generate tracking ID if not provided and no serial number
    if (!formData.has_serial_number && !formData.tracking_id) {
      setFormData({
        ...formData,
        tracking_id: `EQ-${Date.now()}`
      });
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data with quantity handling
      const dataToSubmit = { ...formData };
      
      // If quantity > 1 and this is a new item, we'll create multiple items
      if (!isEditMode && formData.quantity > 1) {
        // For multiple items, we'll create them one by one
        const baseData = { ...formData, quantity: 1 };
        
        // Create the first item and store its ID for reference
        const firstItemResponse = await equipmentService.createEquipment(baseData);
        const firstItemId = firstItemResponse.data.id;
        
        // Create the rest of the items
        const promises = [];
        for (let i = 1; i < formData.quantity; i++) {
          // For items after the first, generate unique tracking IDs or serial numbers
          const itemData = { ...baseData };
          
          if (formData.has_serial_number) {
            // If using serial numbers, append a suffix to make them unique
            itemData.serial_number = `${formData.serial_number}-${i+1}`;
          } else {
            // If using tracking IDs, generate a new one
            itemData.tracking_id = `EQ-${Date.now()}-${i+1}`;
          }
          
          // Add a reference to the first item
          itemData.related_to = firstItemId;
          
          promises.push(equipmentService.createEquipment(itemData));
        }
        
        // Wait for all items to be created
        await Promise.all(promises);
      } else {
        // For single item or update, just submit as is
        if (isEditMode) {
          await equipmentService.updateEquipment(id, dataToSubmit);
        } else {
          await equipmentService.createEquipment(dataToSubmit);
        }
      }
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(isEditMode ? `/equipment/${id}` : '/equipment');
      }, 1500);
    } catch (err) {
      console.error('Error saving equipment:', err);
      setError('Failed to save equipment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to={isEditMode ? `/equipment/${id}` : '/equipment'}
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {isEditMode ? 'Update the equipment details below.' : 'Fill in the equipment details below.'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Equipment saved successfully! Redirecting...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Category Selection */}
              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {categories.length === 0 && (
                  <div className="mt-1">
                    <Link to="/equipment/categories" className="text-sm text-primary-600 hover:text-primary-500">
                      Create categories first
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Equipment Name */}
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Equipment Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Quantity (only for new equipment) */}
              {!isEditMode && (
                <div className="sm:col-span-3">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Number of identical items to create
                  </p>
                </div>
              )}
              
              {/* Price */}
              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Has Serial Number Toggle */}
              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="has_serial_number"
                      name="has_serial_number"
                      type="checkbox"
                      checked={formData.has_serial_number}
                      onChange={handleChange}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="has_serial_number" className="font-medium text-gray-700">
                      Has Serial Number
                    </label>
                    <p className="text-gray-500">
                      Check this if the equipment has a manufacturer serial number for tracking
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Serial Number (only if has_serial_number is true) */}
              {formData.has_serial_number && (
                <div className="sm:col-span-3">
                  <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
                    Serial Number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="serial_number"
                      id="serial_number"
                      required={formData.has_serial_number}
                      value={formData.serial_number}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        serialNumberError ? 'border-red-300' : ''
                      }`}
                    />
                  </div>
                  {serialNumberChecking && (
                    <p className="mt-1 text-sm text-gray-500">
                      Checking serial number...
                    </p>
                  )}
                  {serialNumberError && (
                    <p className="mt-1 text-sm text-red-600">
                      {serialNumberError}
                    </p>
                  )}
                  {formData.quantity > 1 && formData.has_serial_number && (
                    <p className="mt-1 text-sm text-gray-500">
                      For multiple items, suffixes will be added to the serial number (e.g., SN-001, SN-002)
                    </p>
                  )}
                </div>
              )}
              
              {/* Tracking ID (only if has_serial_number is false) */}
              {!formData.has_serial_number && (
                <div className="sm:col-span-3">
                  <label htmlFor="tracking_id" className="block text-sm font-medium text-gray-700">
                    Tracking ID
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="tracking_id"
                      id="tracking_id"
                      value={formData.tracking_id}
                      onChange={handleChange}
                      placeholder="Auto-generated if left empty"
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Internal ID for tracking equipment without serial numbers
                  </p>
                </div>
              )}
              
              {/* Condition */}
              <div className="sm:col-span-3">
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <div className="mt-1">
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="new">New</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
              
              {/* Purchase Date */}
              <div className="sm:col-span-3">
                <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                  Purchase Date *
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="purchase_date"
                    id="purchase_date"
                    required
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Description */}
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Photo */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Photo
                </label>
                <div className="mt-1 flex items-center">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Equipment preview"
                        className="h-32 w-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setFormData({
                            ...formData,
                            photo: null
                          });
                        }}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center text-gray-400 relative">
                      <svg className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Availability */}
              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_available"
                      name="is_available"
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={handleChange}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_available" className="font-medium text-gray-700">
                      Available for allocation
                    </label>
                    <p className="text-gray-500">
                      Uncheck this if the equipment is not available for allocation (e.g., under maintenance, reserved, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Link
                to="/equipment"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Equipment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormPage;
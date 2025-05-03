import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import assessmentService from '../../services/assessmentService';
import { assessmentTemplates } from '../../data/assessmentTemplates';

const AssessmentForm = ({ templateId, patientId, appointmentId, initialData = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [template, setTemplate] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Find the template based on templateId
  useEffect(() => {
    // Check if this is a custom template from session storage
    if (templateId === 'custom-assessment') {
      const customTemplateJson = sessionStorage.getItem('customTemplate');
      if (customTemplateJson) {
        try {
          const customTemplate = JSON.parse(customTemplateJson);
          setTemplate(customTemplate);
          
          // Initialize form data with default values
          const initialFormData = {};
          customTemplate.sections.forEach(section => {
            if (section.fields) {
              section.fields.forEach(field => {
                initialFormData[field.id] = field.defaultValue || '';
              });
            }
            if (section.subsections) {
              section.subsections.forEach(subsection => {
                subsection.fields.forEach(field => {
                  initialFormData[field.id] = field.defaultValue || '';
                });
              });
            }
          });
          
          // If initialData is provided, merge it with the default values
          if (initialData) {
            setFormData({ ...initialFormData, ...initialData });
          } else {
            setFormData(initialFormData);
          }
          
          setLoading(false);
          return;
        } catch (err) {
          console.error('Error parsing custom template:', err);
          // Fall through to regular template lookup
        }
      }
    }
    
    // Regular template lookup
    const selectedTemplate = assessmentTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setTemplate(selectedTemplate);
      
      // Initialize form data with default values
      const initialFormData = {};
      selectedTemplate.sections.forEach(section => {
        if (section.fields) {
          section.fields.forEach(field => {
            initialFormData[field.id] = field.defaultValue || '';
          });
        }
        if (section.subsections) {
          section.subsections.forEach(subsection => {
            subsection.fields.forEach(field => {
              initialFormData[field.id] = field.defaultValue || '';
            });
          });
        }
      });
      
      // If initialData is provided, merge it with the default values
      if (initialData) {
        setFormData({ ...initialFormData, ...initialData });
      } else {
        setFormData(initialFormData);
      }
      
      setLoading(false);
    } else {
      setError('Template not found');
      setLoading(false);
    }
  }, [templateId, initialData]);
  
  // Load existing assessment data if editing
  useEffect(() => {
    const fetchAssessment = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await assessmentService.getById(id);
          if (response.data) {
            setFormData(response.data.data || {});
          }
          setLoading(false);
        } catch (err) {
          console.error('Error fetching assessment:', err);
          setError('Failed to load assessment data');
          setLoading(false);
        }
      }
    };
    
    if (id) {
      fetchAssessment();
    }
  }, [id]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle checkbox groups
      const fieldId = name.split('-')[0];
      const option = name.split('-')[1];
      
      setFormData(prevData => {
        const currentValues = Array.isArray(prevData[fieldId]) ? [...prevData[fieldId]] : [];
        
        if (checked) {
          return {
            ...prevData,
            [fieldId]: [...currentValues, option]
          };
        } else {
          return {
            ...prevData,
            [fieldId]: currentValues.filter(item => item !== option)
          };
        }
      });
    } else {
      // Handle other input types
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };
  
  const handleComplexTableChange = (fieldId, rowIndex, colIndex, value) => {
    setFormData(prevData => {
      const tableData = prevData[fieldId] ? [...prevData[fieldId]] : [];
      
      // Ensure the row exists
      if (!tableData[rowIndex]) {
        tableData[rowIndex] = [];
      }
      
      // Update the cell value
      tableData[rowIndex][colIndex] = value;
      
      return {
        ...prevData,
        [fieldId]: tableData
      };
    });
  };
  
  // Save assessment ID to recent assessments in localStorage
  const saveToRecentAssessments = (assessmentId, templateId) => {
    try {
      // Get existing recent assessments or initialize empty array
      const recentAssessmentsJson = localStorage.getItem('recentAssessments');
      let recentAssessments = recentAssessmentsJson ? JSON.parse(recentAssessmentsJson) : [];
      
      // Add the new assessment to the beginning of the array
      recentAssessments.unshift({
        id: assessmentId,
        templateId: templateId,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the 5 most recent assessments
      recentAssessments = recentAssessments.slice(0, 5);
      
      // Save back to localStorage
      localStorage.setItem('recentAssessments', JSON.stringify(recentAssessments));
      
      // Also save the most recent assessment ID for quick access
      localStorage.setItem('recentAssessmentId', assessmentId);
    } catch (error) {
      console.error('Error saving recent assessment:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const assessmentData = {
        template_id: templateId,
        patient_id: patientId,
        appointment_id: appointmentId,
        data: formData,
        status: 'completed',
        created_by: user?.id || null,
        last_updated: new Date().toISOString()
      };
      
      // If this is a custom assessment, include the template definition
      if (templateId === 'custom-assessment') {
        // Get the custom template from session storage
        const customTemplateJson = sessionStorage.getItem('customTemplate');
        if (customTemplateJson) {
          assessmentData.custom_template = customTemplateJson;
        }
      }
      
      let response;
      
      if (id) {
        // Update existing assessment
        response = await assessmentService.update(id, assessmentData);
      } else {
        // Create new assessment
        response = await assessmentService.create(assessmentData);
      }
      
      setSaving(false);
      
      // Clear the custom template from session storage after successful save
      if (templateId === 'custom-assessment') {
        sessionStorage.removeItem('customTemplate');
      }
      
      // Save to recent assessments in localStorage
      saveToRecentAssessments(response.data.id, templateId);
      
      // Redirect to the assessment detail page
      navigate(`/assessments/${response.data.id}`);
    } catch (err) {
      console.error('Error saving assessment:', err);
      setError('Failed to save assessment. Please try again.');
      setSaving(false);
    }
  };
  
  const nextSection = () => {
    if (template && currentSection < template.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.id}
            name={field.id}
            value={formData[field.id] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            name={field.id}
            value={formData[field.id] || ''}
            onChange={handleInputChange}
            min={field.min}
            max={field.max}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );
        
      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            name={field.id}
            value={formData[field.id] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );
        
      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.id}
            value={formData[field.id] || ''}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );
        
      case 'select':
        return (
          <select
            id={field.id}
            name={field.id}
            value={formData[field.id] || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox-group':
        return (
          <div className="mt-2 space-y-2">
            {field.options.map((option, index) => {
              const isChecked = Array.isArray(formData[field.id]) && formData[field.id].includes(option);
              return (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${field.id}-${option}`}
                    name={`${field.id}-${option}`}
                    checked={isChecked}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`${field.id}-${option}`} className="ml-2 block text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        );
        
      case 'complex-table':
        return (
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {field.columns.map((column, colIndex) => (
                    <th
                      key={colIndex}
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {field.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row}</td>
                    {Array.from({ length: field.columns.length - 1 }, (_, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap">
                        {field.options ? (
                          <select
                            value={formData[field.id]?.[rowIndex]?.[colIndex] || ''}
                            onChange={(e) => handleComplexTableChange(field.id, rowIndex, colIndex, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="">Select</option>
                            {field.options.map((option, optIndex) => (
                              <option key={optIndex} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData[field.id]?.[rowIndex]?.[colIndex] || ''}
                            onChange={(e) => handleComplexTableChange(field.id, rowIndex, colIndex, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      default:
        return <p>Unsupported field type: {field.type}</p>;
    }
  };
  
  const renderSection = (section) => {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{section.description}</p>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {section.fields && section.fields.map((field) => (
            <div key={field.id} className="mb-6">
              <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
          
          {section.subsections && section.subsections.map((subsection, index) => (
            <div key={index} className="mt-8 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">{subsection.title}</h4>
              {subsection.fields.map((field) => (
                <div key={field.id} className="mb-6">
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!template) {
    return <div>No template selected</div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{template.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{template.description}</p>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            Section {currentSection + 1} of {template.sections.length}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {template.sections[currentSection].title}
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${((currentSection + 1) / template.sections.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {renderSection(template.sections[currentSection])}
        
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevSection}
            disabled={currentSection === 0}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              currentSection === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Previous
          </button>
          
          {currentSection < template.sections.length - 1 ? (
            <button
              type="button"
              onClick={nextSection}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Assessment'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
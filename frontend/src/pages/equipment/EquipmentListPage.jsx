import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import equipmentService from '../../services/equipmentService';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * EquipmentListPage component
 *
 * This page displays a list of equipment items with filtering by category.
 * It uses the standardized DashboardLayout for consistent UI across the application.
 */
const EquipmentListPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await equipmentService.getAllCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch equipment
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await equipmentService.getAllEquipment(categoryFilter || null);
        setEquipment(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Failed to load equipment. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [categoryFilter]);

  return (
    <DashboardLayout title="Equipment Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all equipment items</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex space-x-4">
            <Link
              to="/equipment/categories"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" clipRule="evenodd" />
                <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2z" />
              </svg>
              Manage Categories
            </Link>
            <Link
              to="/equipment/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Equipment
            </Link>
          </div>
        )}
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-grow">
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <div className="flex">
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      setSearchParams({ category: value });
                    } else {
                      setSearchParams({});
                    }
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categoryFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {categoryFilter && (
              <div className="mt-4 sm:mt-0 sm:ml-4">
                <div className="text-sm font-medium text-gray-700">
                  Showing equipment in category:
                  <span className="ml-1 text-primary-600">
                    {categories.find(c => c.id.toString() === categoryFilter)?.name || 'Unknown'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
      ) : equipment.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500">No equipment found.</p>
          {user?.role === 'admin' && (
            <Link
              to="/equipment/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Your First Equipment
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {equipment.map((item) => (
              <li key={item.id}>
                <Link to={`/equipment/${item.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="h-12 w-12 rounded-md object-cover mr-4"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center mr-4">
                            <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {item.name}
                          </p>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="truncate mr-2">
                              {item.has_serial_number
                                ? `Serial: ${item.serial_number || 'N/A'}`
                                : `Tracking ID: ${item.tracking_id || 'N/A'}`}
                            </span>
                            {item.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_available ? 'Available' : 'In Use'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        ${item.price}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EquipmentListPage;
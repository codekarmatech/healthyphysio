import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import assessmentService from '../../services/assessmentService';
import { assessmentTemplates } from '../../data/assessmentTemplates';

const AssessmentDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [template, setTemplate] = useState(null);
  
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const response = await assessmentService.getById(id);
        
        if (response.data) {
          setAssessment(response.data);
          
          // Check if this is a custom template
          if (response.data.template_id === 'custom-assessment' && response.data.custom_template) {
            try {
              // If the assessment has a stored custom template, use it
              const customTemplate = typeof response.data.custom_template === 'string' 
                ? JSON.parse(response.data.custom_template)
                : response.data.custom_template;
              
              setTemplate(customTemplate);
            } catch (err) {
              console.error('Error parsing custom template:', err);
              // Fall back to finding a template
              const foundTemplate = assessmentTemplates.find(t => t.id === response.data.template_id);
              if (foundTemplate) {
                setTemplate(foundTemplate);
              }
            }
          } else {
            // Find the template from the standard templates
            const foundTemplate = assessmentTemplates.find(t => t.id === response.data.template_id);
            if (foundTemplate) {
              setTemplate(foundTemplate);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment data');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchAssessment();
    }
  }, [id]);
  
  const renderFieldValue = (field, value) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400">Not provided</span>;
    }
    
    switch (field.type) {
      case 'checkbox-group':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
        
      case 'complex-table':
        if (!Array.isArray(value) || value.length === 0) {
          return <span className="text-gray-400">No data</span>;
        }
        
        return (
          <div className="overflow-x-auto">
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
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {value[rowIndex]?.[colIndex] || <span className="text-gray-400">N/A</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      default:
        return value;
    }
  };
  
  const renderSection = (section, data) => {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{section.description}</p>
          )}
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {section.fields && section.fields.map((field, index) => (
              <div
                key={field.id}
                className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {renderFieldValue(field, data[field.id])}
                </dd>
              </div>
            ))}
          </dl>
          
          {section.subsections && section.subsections.map((subsection, subIndex) => (
            <div key={subIndex} className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h4 className="text-md font-medium text-gray-900">{subsection.title}</h4>
              </div>
              <dl>
                {subsection.fields.map((field, fieldIndex) => (
                  <div
                    key={field.id}
                    className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                      fieldIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {renderFieldValue(field, data[field.id])}
                    </dd>
                  </div>
                ))}
              </dl>
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
  
  if (!assessment || !template) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Assessment not found</h3>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{template.title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {assessment.patient_name} - {new Date(assessment.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to={`/assessments/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </Link>
          <Link
            to="/assessments"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Assessments
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Assessment Information</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {assessment.patient_name}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Assessment Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {template.title}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date Created</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(assessment.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      assessment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {assessment.status || 'Pending'}
                  </span>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Therapist</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {assessment.therapist_name || user?.first_name + ' ' + user?.last_name}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {template.sections.map((section, index) => (
        <div key={index} className="mb-6">
          {renderSection(section, assessment.data || {})}
        </div>
      ))}
    </div>
  );
};

export default AssessmentDetail;
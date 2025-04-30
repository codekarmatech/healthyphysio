import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentTemplates, commonAssessmentTypes } from '../../data/assessmentTemplates';
import CustomAssessmentBuilder from './CustomAssessmentBuilder';

const AssessmentTemplateSelector = ({ patientId, appointmentId }) => {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const navigate = useNavigate();
  
  // Filter out the custom assessment template from the display list
  const displayTemplates = assessmentTemplates.filter(template => !template.isCustom);
  
  // Group templates by type
  const mainTemplates = displayTemplates.filter(template => 
    template.id === 'neuro-assessment' || template.id === 'ortho-assessment'
  );
  
  const handleCustomClick = () => {
    setShowCustomBuilder(true);
  };
  
  if (showCustomBuilder) {
    return <CustomAssessmentBuilder patientId={patientId} appointmentId={appointmentId} />;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Assessment Type</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the type of assessment you want to perform
        </p>
      </div>
      
      {/* Main assessment templates */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comprehensive Assessments</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {mainTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{template.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
              <div className="mt-4">
                <Link
                  to={`/assessments/new/${template.id}${patientId ? `?patientId=${patientId}` : ''}${
                    appointmentId ? `&appointmentId=${appointmentId}` : ''
                  }`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Select
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {/* Custom Assessment Option */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300 border-2 border-dashed border-indigo-300">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Custom Assessment</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a customized assessment by selecting specific sections from neurological and orthopedic templates
            </p>
            <div className="mt-4">
              <button
                onClick={handleCustomClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Custom
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Common assessment types */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Specialized Assessments</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {commonAssessmentTypes.map((template) => (
          <div
            key={template.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{template.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
              <div className="mt-4">
                <Link
                  to={`/assessments/new/${template.id}${patientId ? `?patientId=${patientId}` : ''}${
                    appointmentId ? `&appointmentId=${appointmentId}` : ''
                  }`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Select
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentTemplateSelector;
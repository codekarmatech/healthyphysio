import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentTemplates, commonAssessmentTypes } from '../../data/assessmentTemplates';
import CustomAssessmentBuilder from './CustomAssessmentBuilder';

const AssessmentTemplateSelector = ({ patientId, appointmentId }) => {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [mainTemplates, setMainTemplates] = useState([]);
  const [specializedTemplates, setSpecializedTemplates] = useState([]);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Process templates and load recent assessments on component mount
  useEffect(() => {
    // Filter out the custom assessment template from the display list
    const filteredTemplates = assessmentTemplates.filter(template => !template.isCustom);
    
    // Group templates by type
    const mainTemplatesList = filteredTemplates.filter(template => 
      template.id === 'neuro-assessment' || template.id === 'ortho-assessment'
    );
    setMainTemplates(mainTemplatesList);
    
    // Set specialized templates (which are the commonAssessmentTypes)
    setSpecializedTemplates(commonAssessmentTypes);
    
    // Load recent assessments from localStorage
    try {
      const recentAssessmentsJson = localStorage.getItem('recentAssessments');
      if (recentAssessmentsJson) {
        const parsedAssessments = JSON.parse(recentAssessmentsJson);
        
        // Enrich with template information
        const enrichedAssessments = parsedAssessments.map(assessment => {
          const template = assessmentTemplates.find(t => t.id === assessment.templateId);
          return {
            ...assessment,
            templateName: template ? template.title : 'Unknown Template',
            date: new Date(assessment.timestamp).toLocaleDateString()
          };
        });
        
        setRecentAssessments(enrichedAssessments);
      }
    } catch (error) {
      console.error('Error loading recent assessments:', error);
    }
    
    setIsLoading(false);
  }, []);
  
  const handleCustomClick = () => {
    setShowCustomBuilder(true);
  };
  
  // Navigate to recent assessment if available
  const navigateToRecentAssessment = () => {
    const recentAssessmentId = localStorage.getItem('recentAssessmentId');
    if (recentAssessmentId) {
      navigate(`/assessments/${recentAssessmentId}`);
    } else {
      // Show a notification that no recent assessment exists
      alert('No recent assessment found');
    }
  };
  
  // Navigate to a specific assessment template
  const navigateToTemplate = (templateId) => {
    navigate(`/assessments/new/${templateId}${patientId ? `?patientId=${patientId}` : ''}${
      appointmentId ? `&appointmentId=${appointmentId}` : ''
    }`);
  };
  
  // Navigate to a specific assessment by ID
  const navigateToAssessment = (assessmentId) => {
    navigate(`/assessments/${assessmentId}`);
  };
  
  if (showCustomBuilder) {
    return <CustomAssessmentBuilder patientId={patientId} appointmentId={appointmentId} />;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Select Assessment Type</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose the type of assessment you want to perform
          </p>
        </div>
        <div>
          <button
            onClick={navigateToRecentAssessment}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Recent Assessment
          </button>
        </div>
      </div>
      
      {/* Main assessment templates */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comprehensive Assessments</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {mainTemplates.length > 0 ? (
          mainTemplates.map((template) => (
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
          ))
        ) : (
          <div className="col-span-3 text-center py-4 text-gray-500">Loading templates...</div>
        )}
        
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
      
      {/* Specialized assessment types */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Specialized Assessments</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {specializedTemplates.length > 0 ? (
          specializedTemplates.map((template) => (
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
          ))
        ) : (
          <div className="col-span-3 text-center py-4 text-gray-500">Loading specialized templates...</div>
        )}
      </div>
      
      {/* Recently used templates section */}
      <div className="mt-12">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Assessments</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-4">
            Quick access to your recently created assessments and templates
          </p>
          
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading recent assessments...</p>
            </div>
          ) : recentAssessments.length > 0 ? (
            <div className="space-y-6">
              {/* Recent assessments */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Assessments</h4>
                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {recentAssessments.map((assessment) => (
                      <li key={assessment.id}>
                        <button
                          onClick={() => navigateToAssessment(assessment.id)}
                          className="block hover:bg-gray-50 w-full text-left"
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="truncate text-sm font-medium text-indigo-600">{assessment.templateName}</p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  View
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  ID: {assessment.id.substring(0, 8)}...
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  Created on {assessment.date}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Quick template buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Start New Assessment</h4>
                <div className="flex flex-wrap gap-4">
                  {recentAssessments.slice(0, 3).map((assessment) => (
                    <button
                      key={`template-${assessment.templateId}`}
                      onClick={() => navigateToTemplate(assessment.templateId)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      New {assessment.templateName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-gray-300 rounded-md">
              <p className="text-gray-500">No recent assessments found</p>
              <p className="text-sm text-gray-400 mt-1">Your recent assessments will appear here after you create them</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentTemplateSelector;
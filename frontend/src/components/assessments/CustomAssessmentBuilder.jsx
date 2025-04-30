import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { neuroAssessmentTemplate, orthoAssessmentTemplate } from '../../data/assessmentTemplates';

const CustomAssessmentBuilder = ({ patientId, appointmentId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedSections, setSelectedSections] = useState({});
  const [customTemplate, setCustomTemplate] = useState({
    id: 'custom-assessment',
    title: 'Custom Assessment',
    description: 'Custom assessment with selected sections',
    sections: []
  });
  const [step, setStep] = useState(1); // 1: Select template, 2: Select sections, 3: Review
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customName, setCustomName] = useState('Custom Assessment');
  
  // Get the source template based on selection
  const getSourceTemplate = () => {
    if (selectedTemplateId === 'neuro-assessment') {
      return neuroAssessmentTemplate;
    } else if (selectedTemplateId === 'ortho-assessment') {
      return orthoAssessmentTemplate;
    }
    return null;
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setStep(2);
    
    // Initialize selected sections
    const template = templateId === 'neuro-assessment' ? neuroAssessmentTemplate : orthoAssessmentTemplate;
    const initialSections = {};
    template.sections.forEach(section => {
      initialSections[section.id] = false;
    });
    setSelectedSections(initialSections);
  };
  
  // Toggle section selection
  const toggleSection = (sectionId) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Build the custom template based on selected sections
  const buildCustomTemplate = () => {
    const sourceTemplate = getSourceTemplate();
    if (!sourceTemplate) return;
    
    // Always include patient info and assessment plan sections
    const mandatorySections = ['patient-info', 'assessment-plan'];
    mandatorySections.forEach(sectionId => {
      selectedSections[sectionId] = true;
    });
    
    // Filter selected sections
    const filteredSections = sourceTemplate.sections.filter(
      section => selectedSections[section.id]
    );
    
    // Create the custom template
    const newTemplate = {
      id: 'custom-assessment',
      title: customName || 'Custom Assessment',
      description: `Custom assessment based on ${sourceTemplate.title}`,
      sections: filteredSections
    };
    
    setCustomTemplate(newTemplate);
    setStep(3);
  };
  
  // Start the assessment with the custom template
  const startAssessment = () => {
    // Store the custom template in session storage
    sessionStorage.setItem('customTemplate', JSON.stringify(customTemplate));
    
    // Navigate to the assessment form with the custom template
    navigate(`/assessments/new/custom-assessment${patientId ? `?patientId=${patientId}` : ''}${
      appointmentId ? `&appointmentId=${appointmentId}` : ''
    }`);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Custom Assessment</h2>
        <p className="mt-1 text-sm text-gray-500">
          Build a customized assessment by selecting specific sections
        </p>
      </div>
      
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              1
            </div>
            <div className="ml-2 text-sm font-medium">Select Template</div>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              2
            </div>
            <div className="ml-2 text-sm font-medium">Select Sections</div>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              3
            </div>
            <div className="ml-2 text-sm font-medium">Review & Create</div>
          </div>
        </div>
      </div>
      
      {/* Step 1: Select Template */}
      {step === 1 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Base Template</h3>
          <p className="text-sm text-gray-500 mb-6">
            Choose a base template to customize. You'll be able to select specific sections in the next step.
          </p>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className="border rounded-lg p-6 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
              onClick={() => handleTemplateSelect('neuro-assessment')}
            >
              <h4 className="text-lg font-medium text-gray-900">Neurological Assessment</h4>
              <p className="mt-2 text-sm text-gray-500">
                Comprehensive assessment for patients with neurological conditions
              </p>
            </div>
            
            <div
              className="border rounded-lg p-6 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
              onClick={() => handleTemplateSelect('ortho-assessment')}
            >
              <h4 className="text-lg font-medium text-gray-900">Orthopedic Assessment</h4>
              <p className="mt-2 text-sm text-gray-500">
                Comprehensive assessment for patients with musculoskeletal conditions
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2: Select Sections */}
      {step === 2 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Select Sections from {selectedTemplateId === 'neuro-assessment' ? 'Neurological' : 'Orthopedic'} Assessment
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Choose the sections you want to include in your custom assessment. Patient Information and Assessment & Plan sections are mandatory.
          </p>
          
          <div className="mb-6">
            <label htmlFor="custom-name" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Assessment Name
            </label>
            <input
              type="text"
              id="custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div className="space-y-4">
            {getSourceTemplate()?.sections.map((section) => (
              <div key={section.id} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={section.id}
                    type="checkbox"
                    checked={selectedSections[section.id] || ['patient-info', 'assessment-plan'].includes(section.id)}
                    onChange={() => toggleSection(section.id)}
                    disabled={['patient-info', 'assessment-plan'].includes(section.id)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={section.id} className="font-medium text-gray-700">
                    {section.title}
                    {['patient-info', 'assessment-plan'].includes(section.id) && (
                      <span className="ml-2 text-xs text-indigo-600">(Required)</span>
                    )}
                  </label>
                  {section.description && (
                    <p className="text-gray-500">{section.description}</p>
                  )}
                  {section.subsections && (
                    <div className="mt-2 ml-4 space-y-2">
                      <p className="text-xs text-gray-500">Includes:</p>
                      <ul className="list-disc list-inside text-xs text-gray-500">
                        {section.subsections.map((subsection) => (
                          <li key={subsection.id || subsection.title}>{subsection.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={buildCustomTemplate}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Review & Create */}
      {step === 3 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Custom Assessment</h3>
          <p className="text-sm text-gray-500 mb-6">
            Review the sections you've selected for your custom assessment.
          </p>
          
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900">{customTemplate.title}</h4>
            <p className="text-sm text-gray-500">{customTemplate.description}</p>
          </div>
          
          <div className="border rounded-lg divide-y">
            {customTemplate.sections.map((section) => (
              <div key={section.id} className="p-4">
                <h5 className="font-medium text-gray-900">{section.title}</h5>
                {section.description && (
                  <p className="text-sm text-gray-500">{section.description}</p>
                )}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Subsections:</p>
                    <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
                      {section.subsections.map((subsection) => (
                        <li key={subsection.id || subsection.title}>{subsection.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={startAssessment}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomAssessmentBuilder;
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

const FeatureNotApprovedPage = () => {
  const { user } = useAuth();
  const { feature } = useParams();
  
  // Feature-specific content
  const featureInfo = {
    'treatment-plans': {
      title: 'Treatment Plans',
      description: 'Treatment plans allow you to view and manage patient treatment schedules and interventions.',
      icon: (
        <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    'reports': {
      title: 'Reports',
      description: 'Reports allow you to submit and view patient progress reports and treatment outcomes.',
      icon: (
        <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      )
    },
    'attendance': {
      title: 'Attendance',
      description: 'Attendance tracking allows you to mark your presence at patient appointments and track your work hours.',
      icon: (
        <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      )
    }
  };

  // Default to treatment plans if feature param is not recognized
  const currentFeature = featureInfo[feature] || featureInfo['treatment-plans'];

  return (
    <DashboardLayout title={`${currentFeature.title} - Access Required`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
              <div className="flex">
                <div className="py-1">
                  <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Additional Approval Required</p>
                  <p className="text-sm">You need specific approval to access {currentFeature.title}.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              {currentFeature.icon}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {currentFeature.title} Access Required
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Hello, {user?.first_name || user?.username}! Your account has been approved, but you need <span className="font-semibold text-yellow-600">additional approval</span> to access {currentFeature.title}.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">About {currentFeature.title}:</h2>
              <p className="text-gray-600 mb-4">{currentFeature.description}</p>
              
              <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">Why is additional approval needed?</h3>
              <p className="text-gray-600">
                To ensure patient data security and quality of care, access to {currentFeature.title.toLowerCase()} requires specific approval from administrators. This helps us maintain high standards of service and compliance with healthcare regulations.
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">Next Steps:</h2>
              <ol className="text-left text-gray-600 space-y-3 list-decimal pl-5">
                <li>Our administrators have been notified of your account activation</li>
                <li>They will review your credentials for {currentFeature.title.toLowerCase()} access</li>
                <li>You'll receive an email notification when access is granted</li>
                <li>If you need urgent access, please contact your supervisor</li>
              </ol>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/therapist/dashboard" 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Return to Dashboard
              </Link>
              <Link 
                to="/therapist/profile" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeatureNotApprovedPage;

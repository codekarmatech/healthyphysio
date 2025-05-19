import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

const PendingApprovalPage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Approval Required">
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
                  <p className="font-bold">Approval Required</p>
                  <p className="text-sm">Your account is pending approval from an administrator.</p>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome, {user?.first_name || user?.username}!
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Your therapist account is currently <span className="font-semibold text-yellow-600">pending approval</span>.
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">What this means:</h2>
              <ul className="text-left text-gray-600 space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>You can access your dashboard and profile</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>You can update your profile information</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>You <strong>cannot</strong> access treatment plans until approved</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>You <strong>cannot</strong> submit reports until approved</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">Next Steps:</h2>
              <ol className="text-left text-gray-600 space-y-3 list-decimal pl-5">
                <li>Our administrators are reviewing your account</li>
                <li>You'll receive an email notification when your account is approved</li>
                <li>Once approved, you'll have full access to all therapist features</li>
                <li>If you have questions, please contact our support team</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/therapist/dashboard"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Go to Dashboard
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

export default PendingApprovalPage;

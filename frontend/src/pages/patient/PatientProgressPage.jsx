import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import patientService from '../../services/patientService';
import treatmentPlanService from '../../services/treatmentPlanService';

const PatientProgressPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const patientId = user?.patient_id || user?.id;
        
        // Fetch treatment progress
        const progressResponse = await patientService.getTreatmentProgress(patientId);
        setProgress(progressResponse?.data || null);
        
        // Fetch treatment plans
        const plansResponse = await treatmentPlanService.getAllTreatmentPlans({ patient: patientId });
        setTreatmentPlans(plansResponse?.data || []);
        
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError('Failed to load progress data.');
        // Use mock data for development
        setProgress({
          overall_progress: 65,
          pain_level: { current: 3, initial: 7, improvement: 57 },
          mobility: { current: 70, initial: 45, improvement: 56 },
          strength: { current: 60, initial: 30, improvement: 100 },
          sessions_completed: 12,
          sessions_total: 20,
          next_milestone: 'Complete 15 sessions'
        });
        setTreatmentPlans([
          {
            id: 1,
            title: 'Lower Back Pain Recovery',
            status: 'approved',
            start_date: '2024-01-15',
            end_date: '2024-03-15',
            progress_percentage: 60
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  const ProgressBar = ({ value, label, color = 'primary' }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full bg-${color}-600`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, subtitle, icon, trend }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="p-3 bg-primary-100 rounded-md">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <span className={`ml-2 text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                  </span>
                )}
              </dd>
              {subtitle && <dd className="text-sm text-gray-500">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="My Progress">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your recovery journey and treatment progress
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : error && !progress ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Overall Recovery Progress</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#0891b2"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(progress?.overall_progress || 0) * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{progress?.overall_progress || 0}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">
              Next milestone: {progress?.next_milestone || 'Keep up the good work!'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Pain Level"
              value={`${progress?.pain_level?.current || 0}/10`}
              subtitle={`Started at ${progress?.pain_level?.initial || 0}/10`}
              trend={progress?.pain_level?.improvement ? -progress.pain_level.improvement : 0}
              icon={<svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
            <StatCard
              title="Mobility"
              value={`${progress?.mobility?.current || 0}%`}
              subtitle={`Started at ${progress?.mobility?.initial || 0}%`}
              trend={progress?.mobility?.improvement}
              icon={<svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <StatCard
              title="Strength"
              value={`${progress?.strength?.current || 0}%`}
              subtitle={`Started at ${progress?.strength?.initial || 0}%`}
              trend={progress?.strength?.improvement}
              icon={<svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            />
            <StatCard
              title="Sessions"
              value={`${progress?.sessions_completed || 0}/${progress?.sessions_total || 0}`}
              subtitle="Completed"
              icon={<svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
          </div>

          {/* Treatment Plans */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Active Treatment Plans</h2>
            {treatmentPlans.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active treatment plans</p>
            ) : (
              <div className="space-y-4">
                {treatmentPlans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{plan.title}</h3>
                        <p className="text-xs text-gray-500">
                          {plan.start_date} - {plan.end_date}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.status === 'approved' ? 'bg-green-100 text-green-800' :
                        plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {plan.status}
                      </span>
                    </div>
                    <ProgressBar value={plan.progress_percentage || 0} label="Progress" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientProgressPage;

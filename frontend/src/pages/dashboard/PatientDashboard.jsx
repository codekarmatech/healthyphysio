import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, ChartCard, SampleDataNotice, ProgressRing, QuickActionCard } from '../../components/dashboard/ui';
import { PatientSessionConfirmation } from '../../components/attendance';
import PatientPaymentSection from '../../components/patient/PatientPaymentSection';
import api from '../../services/api';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);

  // Sample data for when backend data is not available
  const getSampleData = useCallback(() => ({
    stats: {
      upcomingAppointments: 3,
      completedSessions: 12,
      pendingExercises: 5,
      progressPercentage: 68,
      attendanceRate: 92,
      painLevel: { current: 3, initial: 7 },
      mobility: { current: 75, initial: 45 }
    },
    appointments: [
      {
        id: 1,
        therapist_name: 'Dr. Sarah Johnson',
        datetime: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
        issue: 'Lower back pain - Follow-up'
      },
      {
        id: 2,
        therapist_name: 'Dr. Michael Chen',
        datetime: new Date(Date.now() + 172800000).toISOString(),
        status: 'scheduled',
        issue: 'Shoulder mobility assessment'
      }
    ],
    recentSessions: [
      {
        id: 101,
        therapist_name: 'Dr. Sarah Johnson',
        datetime: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        issue: 'Lower back pain treatment'
      }
    ],
    exercises: [
      { id: 1, name: 'Shoulder Mobility', duration: 15, status: 'pending' },
      { id: 2, name: 'Lower Back Stretches', duration: 20, status: 'pending' },
      { id: 3, name: 'Core Strengthening', duration: 25, status: 'completed' }
    ]
  }), []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/patient/dashboard/summary/');
      
      if (response.data) {
        setDashboardData({
          stats: {
            upcomingAppointments: response.data.upcoming_appointments?.length || 0,
            completedSessions: response.data.stats?.total_sessions || 0,
            attendanceRate: response.data.stats?.attendance_rate || 0,
            progressPercentage: 65,
            painLevel: { current: 3, initial: 7 },
            mobility: { current: 75, initial: 45 },
            pendingExercises: 3
          },
          appointments: response.data.upcoming_appointments || [],
          recentSessions: response.data.recent_sessions || [],
          exercises: []
        });
        setUsingSampleData(false);
      }
    } catch (error) {
      console.log('Using sample data for dashboard preview');
      setDashboardData(getSampleData());
      setUsingSampleData(true);
    } finally {
      setLoading(false);
    }
  }, [getSampleData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = dashboardData?.stats || getSampleData().stats;
  const appointments = dashboardData?.appointments || [];
  const exercises = dashboardData?.exercises || getSampleData().exercises;

  if (loading) {
    return (
      <DashboardLayout title="Patient Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Sample Data Notice */}
        {usingSampleData && <SampleDataNotice />}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, <span className="text-primary-600">{user?.firstName || user?.first_name || 'Patient'}</span>!
            </h1>
            <p className="mt-2 text-gray-500">Here's an overview of your recovery journey</p>
          </div>
          <Link
            to="/patient/appointments/new"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book Appointment
          </Link>
        </div>

        {/* Session Confirmation - Shows when therapist is at patient's house */}
        <PatientSessionConfirmation />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Upcoming Appointments"
            value={stats.upcomingAppointments}
            subtitle="Scheduled sessions"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            iconBg="bg-gradient-to-br from-primary-500 to-primary-600"
            borderColor="border-l-primary-500"
            linkTo="/patient/appointments"
            linkText="View all"
          />
          <StatCard
            title="Completed Sessions"
            value={stats.completedSessions}
            subtitle="Total treatments"
            trend="+3 this month"
            trendDirection="up"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            iconBg="bg-gradient-to-br from-green-500 to-green-600"
            borderColor="border-l-green-500"
          />
          <StatCard
            title="Pending Exercises"
            value={stats.pendingExercises}
            subtitle="Due today"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            iconBg="bg-gradient-to-br from-secondary-500 to-secondary-600"
            borderColor="border-l-secondary-500"
            linkTo="/patient/exercises"
            linkText="Start exercises"
          />
          <StatCard
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            subtitle="Session attendance"
            trend="+5%"
            trendDirection="up"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
            borderColor="border-l-purple-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recovery Progress */}
          <ChartCard
            title="Recovery Progress"
            subtitle="Your overall treatment progress"
            className="lg:col-span-1"
          >
            <div className="flex flex-col items-center py-4">
              <ProgressRing progress={stats.progressPercentage} size={160} strokeWidth={12} color="primary">
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900">{stats.progressPercentage}%</span>
                  <p className="text-xs text-gray-500 mt-1">Complete</p>
                </div>
              </ProgressRing>
              
              <div className="w-full mt-8 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Pain Level</span>
                    <span className="font-medium text-green-600">{stats.painLevel.current}/10 (was {stats.painLevel.initial})</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${(1 - stats.painLevel.current/10) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Mobility</span>
                    <span className="font-medium text-primary-600">{stats.mobility.current}% (was {stats.mobility.initial}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full" style={{ width: `${stats.mobility.current}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Upcoming Appointments */}
          <ChartCard
            title="Upcoming Appointments"
            subtitle={`${appointments.length} scheduled`}
            className="lg:col-span-2"
            actions={
              <Link to="/patient/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all →
              </Link>
            }
          >
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                <Link to="/patient/appointments/new" className="text-primary-600 font-medium hover:text-primary-700">
                  Book your first appointment →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((appointment) => (
                  <Link
                    key={appointment.id}
                    to={`/patient/appointments/${appointment.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 hover:bg-primary-50/50 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-primary-500/20">
                      {appointment.therapist_name?.charAt(0) || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {appointment.therapist_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{appointment.issue}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">{formatDate(appointment.datetime)}</p>
                      <p className="text-xs text-gray-500">{formatTime(appointment.datetime)}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Payment Section */}
        <PatientPaymentSection />

        {/* Quick Actions & Exercises */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <ChartCard title="Quick Actions" subtitle="Common tasks">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickActionCard
                title="Book Session"
                icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                to="/patient/appointments/new"
                color="primary"
              />
              <QuickActionCard
                title="My Exercises"
                icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                to="/patient/exercises"
                color="secondary"
              />
              <QuickActionCard
                title="View Progress"
                icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                to="/patient/progress"
                color="success"
              />
              <QuickActionCard
                title="Equipment"
                icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                to="/patient/equipment"
                color="warning"
              />
            </div>
          </ChartCard>

          {/* Today's Exercises */}
          <ChartCard 
            title="Today's Exercises" 
            subtitle={`${exercises.filter(e => e.status === 'pending').length} pending`}
            actions={
              <Link to="/patient/exercises" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all →
              </Link>
            }
          >
            <div className="space-y-3">
              {exercises.slice(0, 3).map((exercise) => (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    exercise.status === 'completed' ? 'bg-green-50/50' : 'bg-gray-50/80 hover:bg-secondary-50/50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    exercise.status === 'completed' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-secondary-100 text-secondary-600'
                  }`}>
                    {exercise.status === 'completed' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${exercise.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {exercise.name}
                    </p>
                    <p className="text-sm text-gray-500">{exercise.duration} minutes</p>
                  </div>
                  {exercise.status !== 'completed' && (
                    <Link
                      to={`/patient/exercises/${exercise.id}`}
                      className="px-3 py-1.5 text-sm font-medium text-secondary-600 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      Start
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;

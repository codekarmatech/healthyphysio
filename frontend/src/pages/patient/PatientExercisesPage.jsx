import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import treatmentPlanService from '../../services/treatmentPlanService';

const PatientExercisesPage = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const patientId = user?.patient_id || user?.id;
        
        // Fetch daily treatments/exercises from treatment plans
        const response = await treatmentPlanService.getAllDailyTreatments({ patient: patientId });
        setExercises(response?.data || []);
        
      } catch (err) {
        console.error('Error fetching exercises:', err);
        setError('Failed to load exercises.');
        // Use mock data for development
        setExercises([
          {
            id: 1,
            title: 'Shoulder Mobility Exercises',
            description: 'Gentle stretching and rotation exercises for shoulder mobility',
            duration: 15,
            repetitions: 10,
            sets: 3,
            status: 'pending',
            scheduled_date: new Date().toISOString().split('T')[0],
            instructions: [
              'Stand with feet shoulder-width apart',
              'Slowly raise arms overhead',
              'Hold for 5 seconds',
              'Lower arms slowly'
            ],
            video_url: null
          },
          {
            id: 2,
            title: 'Lower Back Strengthening',
            description: 'Core strengthening exercises to support lower back',
            duration: 20,
            repetitions: 15,
            sets: 2,
            status: 'completed',
            scheduled_date: new Date().toISOString().split('T')[0],
            instructions: [
              'Lie on your back with knees bent',
              'Tighten abdominal muscles',
              'Lift hips off the floor',
              'Hold for 3 seconds'
            ],
            video_url: null
          },
          {
            id: 3,
            title: 'Neck Tension Relief',
            description: 'Gentle neck stretches to relieve tension',
            duration: 10,
            repetitions: 5,
            sets: 2,
            status: 'pending',
            scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            instructions: [
              'Sit upright in a comfortable position',
              'Slowly tilt head to the right',
              'Hold for 15 seconds',
              'Repeat on the left side'
            ],
            video_url: null
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [user, filter]);

  const handleMarkComplete = async (exerciseId) => {
    try {
      // Update exercise status
      setExercises(exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, status: 'completed' } : ex
      ));
    } catch (err) {
      console.error('Error marking exercise complete:', err);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const today = new Date().toISOString().split('T')[0];
    if (filter === 'today') {
      return exercise.scheduled_date === today;
    } else if (filter === 'upcoming') {
      return exercise.scheduled_date > today;
    } else if (filter === 'completed') {
      return exercise.status === 'completed';
    }
    return true;
  });

  return (
    <DashboardLayout title="My Exercises">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">My Exercises</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your prescribed exercises and daily routines
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['today', 'upcoming', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`${
                  filter === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : error && filteredExercises.length === 0 ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No exercises found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'today' ? "No exercises scheduled for today." : 
             filter === 'completed' ? "You haven't completed any exercises yet." :
             "No exercises available."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${
                      exercise.status === 'completed' ? 'bg-green-100' : 'bg-primary-100'
                    }`}>
                      <svg className={`h-6 w-6 ${
                        exercise.status === 'completed' ? 'text-green-600' : 'text-primary-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {exercise.status === 'completed' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        )}
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{exercise.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{exercise.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exercise.duration} min
                        </span>
                        <span>{exercise.sets} sets × {exercise.repetitions} reps</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    exercise.status === 'completed' ? 'bg-green-100 text-green-800' :
                    exercise.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exercise.status === 'completed' ? 'Completed' : 
                     exercise.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>

                {/* Instructions */}
                {exercise.instructions && exercise.instructions.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      {exercise.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Action Buttons */}
                {exercise.status !== 'completed' && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleMarkComplete(exercise.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Complete
                    </button>
                    {exercise.video_url && (
                      <a
                        href={exercise.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Watch Video
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientExercisesPage;

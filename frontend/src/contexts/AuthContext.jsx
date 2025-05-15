import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const stored = localStorage.getItem('user');
  const [currentUser, setCurrentUser] = useState(
    stored ? JSON.parse(stored) : null
  );
  const [therapistProfile, setTherapistProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Function to fetch therapist profile
  const fetchTherapistProfile = useCallback(async (userId) => {
    console.log('Fetching therapist profile for user ID:', userId);
    try {
      // Try multiple endpoints in sequence until one succeeds
      const endpoints = [
        '/users/therapists/profile/',
        userId ? `/users/therapists/${userId}/` : null,
        userId ? `/users/therapist-profile/${userId}/` : null,
        '/users/therapist-status/'
      ].filter(Boolean); // Remove null entries

      let profileData = null;

      // Try each endpoint until one succeeds
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch therapist profile from: ${endpoint}`);
          const response = await api.get(endpoint);
          if (response.data) {
            profileData = response.data;
            console.log('Successfully fetched therapist profile:', profileData);
            break;
          }
        } catch (endpointError) {
          console.log(`Failed to fetch from ${endpoint}:`, endpointError.message);
          // Continue to next endpoint
        }
      }

      if (profileData) {
        // Check if the profile data has changed before updating state and localStorage
        const currentProfile = JSON.parse(localStorage.getItem('therapistProfile') || '{}');
        const hasChanged = JSON.stringify(currentProfile) !== JSON.stringify(profileData);

        if (hasChanged) {
          console.log('Therapist profile has changed, updating state and localStorage');
          setTherapistProfile(profileData);
          localStorage.setItem('therapistProfile', JSON.stringify(profileData));

          // Log approval status changes for debugging
          if (currentProfile.attendance_approved !== profileData.attendance_approved) {
            console.log(`Attendance approval changed from ${currentProfile.attendance_approved} to ${profileData.attendance_approved}`);
          }
        } else {
          console.log('Therapist profile unchanged');
        }

        return profileData;
      }

      console.log('No therapist profile data found from any endpoint');
      return null;
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
      return null;
    }
  }, []);

  // Effect for initial auth check
  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedTherapistProfile = localStorage.getItem('therapistProfile');

        if (token && storedUser) {
          // Set default auth header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Use the stored user data
          const user = JSON.parse(storedUser);
          setCurrentUser(user);

          // Use stored therapist profile if available
          if (storedTherapistProfile) {
            setTherapistProfile(JSON.parse(storedTherapistProfile));
          }

          // Always fetch fresh therapist profile if user is a therapist
          if (user.role === 'therapist') {
            fetchTherapistProfile(user.id);
          }

          setLoading(false);
          return;
        }

        // If no token or user data, clear authentication
        setCurrentUser(null);
        setTherapistProfile(null);
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Only clear token on actual auth errors, not on parsing errors
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('therapistProfile');
          axios.defaults.headers.common['Authorization'] = '';
          api.defaults.headers.common['Authorization'] = '';
          setCurrentUser(null);
          setTherapistProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [fetchTherapistProfile]);

  // Effect for periodic refresh of therapist profile
  useEffect(() => {
    // Only set up refresh interval if user is a therapist
    if (!currentUser || currentUser.role !== 'therapist') {
      return;
    }

    console.log('Setting up periodic therapist profile refresh');

    // Refresh therapist profile every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Periodic refresh of therapist profile');
      fetchTherapistProfile(currentUser.id);
    }, 30000); // 30 seconds

    // Clean up interval on unmount
    return () => {
      console.log('Clearing therapist profile refresh interval');
      clearInterval(refreshInterval);
    };
  }, [currentUser, fetchTherapistProfile]);

  const login = async (identifier, password) => {
    try {
      setError('');
      const response = await api.post('/auth/login/', {
                username: identifier,
                email:    identifier,
                phone:    identifier,
                password
              });
      const { access, refresh, user } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);

      // Save token and set user
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setCurrentUser(user);

      // If user is a therapist, fetch their therapist profile
      if (user.role === 'therapist') {
        try {
          const therapistProfile = await fetchTherapistProfile(user.id);
          console.log('Fetched therapist profile:', therapistProfile);
        } catch (profileError) {
          console.error('Error fetching therapist profile:', profileError);
          // Continue with login even if profile fetch fails
        }
      }

      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/dashboard');
      } else if (user.role === 'therapist') {
        navigate('/therapist/dashboard');
      }

      return user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to call the logout endpoint
      await api.post('/auth/logout/', {
        refresh: localStorage.getItem('refreshToken')
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('therapistProfile');

      // Clear authorization headers
      axios.defaults.headers.common['Authorization'] = '';
      api.defaults.headers.common['Authorization'] = '';

      // Reset state
      setCurrentUser(null);
      setTherapistProfile(null);

      // Navigate to login page
      navigate('/login');
    }
  };

  const resetPassword = async (email) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.response?.data?.message || 'Failed to reset password');
      throw error;
    }
  };

  const updateProfile = async (userData) => {
    try {
      setError('');
      const response = await axios.put('/api/auth/profile', userData);
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
      throw error;
    }
  };

  const value = {
    user: currentUser,
    setUser: setCurrentUser,
    therapistProfile,
    setTherapistProfile,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    fetchTherapistProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
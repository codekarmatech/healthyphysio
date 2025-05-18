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
  }, [currentUser, fetchTherapistProfile, navigate]);

  /**
   * Authenticate a user with their identifier (username, email, or phone) and password
   *
   * This function handles the authentication process securely by:
   * 1. Determining the type of identifier provided (email, phone, or username)
   * 2. Creating the appropriate payload for the authentication request
   * 3. Sending the authentication request to the backend API
   * 4. Handling the response and storing the authentication tokens
   * 5. Setting up the authenticated user session
   *
   * @param {string} identifier - The user's username, email, or phone number
   * @param {string} password - The user's password
   * @returns {Object} The authenticated user object
   */
  const login = async (identifier, password) => {
    try {
      setError('');

      // Determine if identifier is an email, phone, or username
      const isEmail = /\S+@\S+\.\S+/.test(identifier);
      const isPhone = /^\d+$/.test(identifier);

      // Create payload based on identifier type
      const payload = {
        password
      };

      if (isEmail) {
        payload.email = identifier;
      } else if (isPhone) {
        payload.phone = identifier;
      } else {
        payload.username = identifier;
      }

      // Log the payload for debugging (without the password)
      console.log('Login payload:', { ...payload, password: '[REDACTED]' });

      // Use the API service to make the request to ensure consistent error handling
      const response = await api.post('/auth/token/', payload);

      // Extract authentication data from response
      const { access, refresh, user } = response.data;

      if (!access || !refresh || !user) {
        throw new Error('Invalid response from authentication server');
      }

      // Store authentication tokens securely
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      // Set authorization headers for future API requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // Update application state
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
        navigate('/doctor/dashboard');
      } else if (user.role === 'therapist') {
        navigate('/therapist/dashboard');
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard');
      } else {
        // Default fallback
        navigate('/dashboard');
      }

      return user;
    } catch (error) {
      console.error('Login error:', error);

      // Handle different types of errors with appropriate user-friendly messages
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          setError('Invalid credentials. Please check your username/email/phone and password.');
        } else if (status === 403) {
          setError('Your account does not have permission to access the system.');
        } else if (status === 404) {
          setError('Authentication service not available. Please contact support.');
        } else if (status === 400) {
          // Handle validation errors
          if (data.error) {
            setError(data.error);
          } else if (data.detail) {
            setError(data.detail);
          } else if (data.username && Array.isArray(data.username)) {
            setError(data.username[0]);
          } else if (data.password && Array.isArray(data.password)) {
            setError(data.password[0]);
          } else if (data.email && Array.isArray(data.email)) {
            setError(data.email[0]);
          } else if (data.phone && Array.isArray(data.phone)) {
            setError(data.phone[0]);
          } else {
            setError('Invalid login information provided.');
          }
        } else {
          setError(`Authentication failed: ${data.detail || data.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from authentication server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Authentication error: ${error.message}`);
      }

      // Rethrow the error for the component to handle
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
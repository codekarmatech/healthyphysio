import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const fetchTherapistProfile = async (userId) => {
    try {
      // Try to get the current user's profile first
      try {
        // First try the profile endpoint
        const response = await api.get('/users/therapists/profile/');
        if (response.data) {
          setTherapistProfile(response.data);
          // Store therapist profile in localStorage for persistence
          localStorage.setItem('therapistProfile', JSON.stringify(response.data));
          return response.data;
        }
      } catch (profileError) {
        console.log('Could not fetch current user profile, trying by ID');
        // If that fails, try to get by user ID
        try {
          const response = await api.get(`/users/therapists/${userId}/`);
          if (response.data) {
            setTherapistProfile(response.data);
            // Store therapist profile in localStorage for persistence
            localStorage.setItem('therapistProfile', JSON.stringify(response.data));
            return response.data;
          }
        } catch (idError) {
          console.log('Could not fetch by ID, trying therapist-profile endpoint');
          // Try one more endpoint
          const response = await api.get(`/users/therapist-profile/${userId}/`);
          if (response.data) {
            setTherapistProfile(response.data);
            // Store therapist profile in localStorage for persistence
            localStorage.setItem('therapistProfile', JSON.stringify(response.data));
            return response.data;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
      return null;
    }
  };

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
          } else if (user.role === 'therapist') {
            // Fetch therapist profile if not in localStorage
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
  }, []);

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
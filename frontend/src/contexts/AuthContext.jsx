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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set default auth header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          const response = await axios.get('/api/auth/me');
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear token if invalid
        localStorage.removeItem('token');
        axios.defaults.headers.common['Authorization'] = '';
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
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/dashboard');
      } else if (user.role === 'therapist') {
        navigate('/dashboard');
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
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data regardless of API response
      localStorage.removeItem('token');
      axios.defaults.headers.common['Authorization'] = '';
      setCurrentUser(null);
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
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
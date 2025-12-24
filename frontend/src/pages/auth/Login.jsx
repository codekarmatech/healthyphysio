import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import { COMPANY_INFO, CSS_CLASSES } from '../../constants';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  /**
   * Handle form submission for login
   *
   * This function:
   * 1. Prevents the default form submission behavior
   * 2. Sets the loading state and clears any previous errors
   * 3. Attempts to log in using the AuthContext login function
   * 4. Handles any errors that occur during login
   * 5. Resets the loading state when done
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Trim the credentials to prevent whitespace issues
      const trimmedUsername = credentials.username.trim();
      const trimmedPassword = credentials.password;

      // Attempt to log in
      await login(trimmedUsername, trimmedPassword);

      // If we get here, login was successful
      // The AuthContext will handle redirection based on user role
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const data = error.response.data;

        // Log detailed error information for debugging
        console.error('Authentication error details:', {
          status,
          data,
          headers: error.response.headers,
          config: error.config
        });

        if (status === 401) {
          setError('Invalid credentials. Please check your username/email/phone and password.');
        } else if (status === 403) {
          setError('Your account does not have permission to access the system.');
        } else if (status === 404) {
          setError('Authentication service not available. Please contact support.');
        } else if (status === 400) {
          // Handle validation errors
          console.error('Validation error details:', data);

          // Try to extract the error message from various possible formats
          let errorMessage = 'Invalid login information provided.';

          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.username && Array.isArray(data.username)) {
            errorMessage = data.username[0];
          } else if (data.password && Array.isArray(data.password)) {
            errorMessage = data.password[0];
          } else if (data.email && Array.isArray(data.email)) {
            errorMessage = data.email[0];
          } else if (data.phone && Array.isArray(data.phone)) {
            errorMessage = data.phone[0];
          } else if (data.non_field_errors) {
            errorMessage = data.non_field_errors.join(', ');
          } else {
            // Try to extract error from any field
            const fieldErrors = Object.entries(data)
              .filter(([key, value]) => Array.isArray(value) || typeof value === 'string')
              .map(([key, value]) => Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`)
              .join('; ');

            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }

          setError(errorMessage);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Login - PhysioWay | Access Your Account';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      <Navbar />
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-20">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-100/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-t from-secondary-100/20 to-transparent"></div>
      <div className="absolute top-20 right-20 w-20 h-20 bg-primary-200/30 rounded-full animate-float"></div>
      <div className="absolute bottom-32 left-20 w-16 h-16 bg-secondary-200/30 rounded-full animate-pulse-slow"></div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-3xl text-white">🏥</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                {COMPANY_INFO.name}
              </h1>
              <p className="text-sm text-gray-600 font-medium">{COMPANY_INFO.tagline}</p>
            </div>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to access your physiotherapy dashboard
          </p>
        </div>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-10 px-8 shadow-2xl rounded-3xl border border-white/20">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2">
                  Username / Email / Mobile
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">👤</span>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300 text-gray-900"
                    value={credentials.username}
                    onChange={handleChange}
                    placeholder="Enter username, email or mobile number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔒</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300 text-gray-900"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`${CSS_CLASSES.button.primary} w-full py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500 font-medium">
                  New to PhysioWay?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center space-y-4">
              <Link 
                to="/register" 
                className="block w-full py-3 px-4 border-2 border-primary-200 rounded-2xl text-primary-600 font-semibold hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 transform hover:scale-105"
              >
                Create New Account
              </Link>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Forgot Password?
                </Link>
                <span className="text-gray-300">•</span>
                <Link to="/contact" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Need Help?
                </Link>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">
                  24/7 Support Available
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs">
                  <a href={`mailto:${COMPANY_INFO.email}`} className="text-primary-600 hover:text-primary-700 transition-colors">
                    📧 {COMPANY_INFO.email}
                  </a>
                  <span className="text-gray-300">•</span>
                  <a href={`tel:${COMPANY_INFO.phone}`} className="text-primary-600 hover:text-primary-700 transition-colors">
                    📞 {COMPANY_INFO.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
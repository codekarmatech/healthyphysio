import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">PhysioWay</h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username / Email / Mobile
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Enter username, email or mobile number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={credentials.password}
                  onChange={handleChange}
                />
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

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  Create a new account
                </Link>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Contact us: <a href="mailto:contact@physioway.com" className="text-primary-600">contact@physioway.com</a> | <a href="tel:+916353202177" className="text-primary-600">+91 6353202177</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
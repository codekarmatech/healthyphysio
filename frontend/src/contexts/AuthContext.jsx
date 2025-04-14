/**
 * Purpose: Provides JWT authentication and user role management
 * Connected to: POST /api/auth/login/, POST /api/auth/refresh/
 * Props/Params: children (React nodes)
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and validate it
    if (token) {
      // For now, just decode the token to get user info
      // In Phase 3, this will validate with the backend
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: tokenData.user_id,
          role: tokenData.role,
          name: tokenData.name || 'User'
        });
      } catch (error) {
        console.error('Invalid token', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials) => {
    // In Phase 1, we'll use dummy data
    // This will be replaced with actual API call in Phase 3
    return new Promise((resolve) => {
      setTimeout(() => {
        // Purpose: Generate secure dummy token for development only
        const payload = {
          user_id: 1,
          role: credentials?.role || 'patient',
          name: credentials?.username || 'Test User',
          exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
        };
        
        // Create a proper JWT structure (header.payload.signature)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payloadStr = btoa(JSON.stringify(payload));
        const dummyToken = `${header}.${payloadStr}.dummy-signature-for-dev`;
        
        localStorage.setItem('token', dummyToken);
        setToken(dummyToken);
        
        setUser({
          id: payload.user_id,
          role: payload.role,
          name: payload.name
        });
        
        resolve({ success: true });
      }, 500);
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => !!user;

  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Role hierarchy: admin > therapist/doctor > patient
    if (user.role === 'admin') return true;
    if (requiredRole === user.role) return true;
    
    // Doctor/therapist role differentiation
    if (user.role === 'doctor' && requiredRole === 'therapist') return false;
    if (user.role === 'therapist' && requiredRole === 'doctor') return false;
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      hasRole,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
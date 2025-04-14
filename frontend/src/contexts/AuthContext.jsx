/**
 * Purpose: Provides JWT authentication and user role management
 * Connected Endpoints: POST /api/auth/login/, POST /api/auth/refresh/
 * Validation: Token expiry, role-based access control
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
        
        // Check token expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (tokenData.exp && tokenData.exp < currentTime) {
          console.error('Token expired');
          logout();
          return;
        }
        
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
        // Development-only mock token generator
        const payload = {
          user_id: 1,
          role: credentials?.role || 'patient',
          name: credentials?.username || 'Test User',
          exp: Math.floor(Date.now() / 1000) + 3600 // 1-hour expiry
        };
        
        // Create JWT structure (header.payload.signature)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payloadStr = btoa(JSON.stringify(payload));
        const dummyToken = `${header}.${payloadStr}.development-signature`;
        
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
    
    // Role hierarchy: admin > therapist > doctor > patient
    if (user.role === 'admin') return true;
    if (requiredRole === user.role) return true;
    
    const roleHierarchy = {
      'admin': 4,
      'therapist': 3,
      'doctor': 2,
      'patient': 1
    };
    
    // Check if user's role is higher in hierarchy than required role
    return roleHierarchy[user.role] > roleHierarchy[requiredRole];
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
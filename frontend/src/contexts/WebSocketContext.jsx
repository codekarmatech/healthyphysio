/**
 * Purpose: Provides WebSocket connection for real-time updates
 * Connected Endpoints: ws://localhost:8000/ws/attendance/
 * Validation: Connection status, message validation
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Connect to WebSocket
  const connect = useCallback((sessionCode) => {
    if (!sessionCode || !token) {
      setError('Session code and authentication are required');
      return;
    }

    // Close existing connection if any
    if (socket) {
      socket.close();
    }

    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_HOST || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/attendance/${sessionCode}/?token=${token}`;

    try {
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log(`WebSocket connected: ${sessionCode}`);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'status_update') {
            // Add message to history
            setMessages(prev => [...prev, {
              type: data.action_type,
              timestamp: data.timestamp,
              user: data.user_name,
              success: data.success
            }]);
            
            // Update session data if available
            if (data.session_data) {
              setSessionData(data.session_data);
            }
          } else if (data.type === 'session_state') {
            // Initial state
            setSessionData(data.data);
          } else if (data.error) {
            setError(data.error);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Error processing message from server');
        }
      };

      newSocket.onclose = (event) => {
        setIsConnected(false);
        if (event.code !== 1000) {
          setError(`WebSocket disconnected: ${event.reason || 'Unknown reason'}`);
        }
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
      };

      newSocket.onerror = (error) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', error);
      };

      setSocket(newSocket);
    } catch (err) {
      setError(`Failed to connect: ${err.message}`);
      console.error('WebSocket connection error:', err);
    }
  }, [token]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'User disconnected');
      setSocket(null);
      setIsConnected(false);
      setSessionData(null);
      setMessages([]);
    }
  }, [socket]);

  // Send message to WebSocket
  const sendMessage = useCallback((action, data = {}) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({
        action,
        ...data
      });
      socket.send(message);
      return true;
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      return false;
    }
  }, [socket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{
      connect,
      disconnect,
      sendMessage,
      isConnected,
      sessionData,
      messages,
      error,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

export default WebSocketContext;
/**
 * Purpose: Validates session codes against the required format
 * Connected to: GET /api/sessions/validate/ (Phase 3)
 * Props/Params: sessionCode (string), onValidate (callback)
 */

import React, { useState, useEffect } from 'react';

const SessionCodeValidator = ({ sessionCode, onValidate }) => {
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    validateSessionCode(sessionCode);
  }, [sessionCode]);

  const isValidDate = (dateStr) => {
    const year = parseInt(dateStr.slice(0,4));
    const month = parseInt(dateStr.slice(4,6)) - 1;
    const day = parseInt(dateStr.slice(6,8));
    const date = new Date(year, month, day);
    return date.getFullYear() === year &&
           date.getMonth() === month &&
           date.getDate() === day;
  };

  const validateSessionCode = (code) => {
    // Reset states
    setError('');
    
    // Check if code exists
    if (!code) {
      setIsValid(false);
      setError('Session code is required');
      onValidate(false, 'Session code is required');
      return;
    }
    
    // Regex pattern: PT-YYYYMMDD-INITIALS-XXXX
    const pattern = /^PT-\d{8}-[A-Z]{3}-[A-Z0-9]{4}$/;
    
    if (!pattern.test(code)) {
      setIsValid(false);
      setError('Invalid session code format. Expected: PT-YYYYMMDD-INITIALS-XXXX');
      onValidate(false, 'Invalid session code format');
      return;
    }
    
    // Extract and validate the date part
    const datePart = code.split('-')[1];
    if (!isValidDate(datePart)) {
      setIsValid(false);
      setError('Session code contains invalid date');
      onValidate(false, 'Invalid date in session code');
      return;
    }
    
    // In Phase 1, we'll just validate the format
    // In Phase 3, this will make an API call to validate against the database
    setIsValid(true);
    onValidate(true);
  };

  return (
    <div className="session-code-validator">
      {error && <div className="error-message">{error}</div>}
      {isValid && <div className="success-message">Session code is valid</div>}
    </div>
  );
};

export default SessionCodeValidator;
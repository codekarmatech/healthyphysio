/**
 * Purpose: Patient-side check-in approval UI
 * Connected to: POST /api/attendance/approve/
 * Props/Params: sessionCode (string), therapistPhoto (encrypted URL)
 */

import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import SessionCodeValidator from '../../components/SessionCodeValidator';
import EncryptedPhotoViewer from '../../components/EncryptedPhotoViewer';

const SessionApproval = ({ sessionCode, therapistData }) => {
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidation = (valid, errorMessage) => {
    setIsCodeValid(valid);
    if (!valid && errorMessage) {
      setError(errorMessage);
    } else {
      setError('');
    }
  };

  const handleApprove = async () => {
    if (!isCodeValid) {
      setError('Please enter a valid session code');
      return;
    }

    setLoading(true);
    
    // In Phase 1, we'll simulate the API call
    // This will be replaced with actual API call in Phase 3
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsApproved(true);
      setIsRejected(false);
    } catch (err) {
      setError('Failed to approve session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!isCodeValid) {
      setError('Please enter a valid session code');
      return;
    }

    setLoading(true);
    
    // In Phase 1, we'll simulate the API call
    // This will be replaced with actual API call in Phase 3
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRejected(true);
      setIsApproved(false);
    } catch (err) {
      setError('Failed to reject session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-approval">
      <h2>Session Approval</h2>
      
      <div className="session-details">
        <h3>Session Code: {DOMPurify.sanitize(sessionCode)}</h3>
        <SessionCodeValidator 
          sessionCode={sessionCode} 
          onValidate={handleValidation} 
        />
      </div>
      
      {isCodeValid && therapistData && (
        <div className="therapist-details">
          <h3>Therapist: {DOMPurify.sanitize(therapistData.name)}</h3>
          <EncryptedPhotoViewer 
            photoUrl={therapistData.photoUrl} 
            sessionDate={therapistData.sessionDate}
            blurUntilSession={true}
          />
        </div>
      )}
      
      {error && <div className="error-message">{DOMPurify.sanitize(error)}</div>}
      
      <div className="approval-actions">
        <button 
          onClick={handleApprove} 
          disabled={!isCodeValid || loading || isApproved}
          className={isApproved ? 'approved' : ''}
        >
          {isApproved ? 'Approved' : 'Approve Check-in'}
        </button>
        
        <button 
          onClick={handleReject} 
          disabled={!isCodeValid || loading || isRejected}
          className={isRejected ? 'rejected' : ''}
        >
          {isRejected ? 'Rejected' : 'Reject Check-in'}
        </button>
      </div>
      
      {isApproved && (
        <div className="success-message">
          Check-in approved successfully! Your session is now in progress.
        </div>
      )}
      
      {isRejected && (
        <div className="warning-message">
          Check-in rejected. Please contact the clinic if this was a mistake.
        </div>
      )}
    </div>
  );
};

export default SessionApproval;
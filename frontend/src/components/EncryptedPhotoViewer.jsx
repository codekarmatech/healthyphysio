/**
 * Purpose: Displays therapist photos with conditional blurring
 * Connected to: GET /api/therapists/{id}/photo/
 * Props/Params: photoUrl (string), sessionDate (Date), blurUntilSession (boolean)
 */

import React, { useState, useEffect } from 'react';

const EncryptedPhotoViewer = ({ photoUrl, sessionDate, blurUntilSession = true }) => {
  const [isBlurred, setIsBlurred] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!blurUntilSession) {
      setIsBlurred(false);
      return;
    }

    // Check if session date is today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Ensure proper timezone handling by converting to UTC
    const sessionDay = new Date(sessionDate.toLocaleString('en-US', {
      timeZone: 'UTC'
    }));
    sessionDay.setHours(0, 0, 0, 0);
    
    setIsBlurred(sessionDay > today);
  }, [sessionDate, blurUntilSession]);

  const handleImageError = () => {
    setError('Unable to load therapist photo');
  };

  return (
    <div className="encrypted-photo-viewer">
      {error ? (
        <div className="photo-error">{error}</div>
      ) : (
        <div className={`photo-container ${isBlurred ? 'blurred' : ''}`}>
          <img 
            src={photoUrl} 
            alt="Therapist" 
            onError={handleImageError}
            className={isBlurred ? 'blurred-image' : ''}
          />
          {isBlurred && (
            <div className="blur-notice">
              Photo will be visible on the day of your session
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EncryptedPhotoViewer;
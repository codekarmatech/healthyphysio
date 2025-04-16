    /**
 * Purpose: Manage the 3-step patient signup process.
 * Props: None (for now)
 */

import React, { useState } from 'react';
import PatientSignupStep1 from './PatientSignupStep1';
import PatientSignupStep2 from './PatientSignupStep2';
import PatientSignupStep3 from './PatientSignupStep3';
import { json } from 'react-router-dom';

const PatientSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  const nextStep = async (stepData) => {
      setError(null)
    if (currentStep === 1) {
        try{
            const response = await fetch('/api/users/register/patient/step1/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(stepData), // Data from step 1
              });
              const data = await response.json();
              if (response.ok) {
                setUserId(data.user_id); // Store the user ID
                setFormData({ ...formData, ...stepData });
                setCurrentStep(2);
              } else {
                  setError(data.error || "Something went wrong");
              }
        }catch(error){
            setError("Something went wrong")
        }
    } else if (currentStep === 2) {
        try{
            const response = await fetch('/api/users/register/patient/step2/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...stepData, user_id: userId }), // Include user ID
              });
              const data = await response.json();
              if (response.ok) {
                setFormData({ ...formData, ...stepData });
                setCurrentStep(3);
              } else {
                setError(data.error || "Something went wrong");
              }
        }catch(error){
            setError("Something went wrong")
        }
    }
  };

  const handleSubmit = async (finalData) => {
    try{
        const response = await fetch('/api/users/register/patient/step3/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...finalData, user_id: userId }), // Include user ID
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data.message); // e.g., "Patient registration complete."
        // Redirect or show success message
      } else {
        setError(data.error || "Something went wrong");
      }
    }catch(error){
        setError("Something went wrong");
    }
  };

  switch (currentStep) {
    case 1:
        return (
            <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <PatientSignupStep1 onSubmit={nextStep} />
            </div>
        );
    case 2:
        return (
            <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <PatientSignupStep2 initialData={formData} onSubmit={nextStep} />
            </div>
        );
    case 3:
        return (
            <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <PatientSignupStep3 initialData={formData} onSubmit={handleSubmit} />
            </div>
        );
    default:
      return <div>Signup complete or error!</div>; // Handle completion/error
  }
};

export default PatientSignup;
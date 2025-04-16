/**
 * Purpose: Orchestrates the 3-step therapist signup process.
 * Props: None (for now)
 */

import React, { useState } from 'react';
import TherapistSignupStep1 from './TherapistSignupStep1';
import TherapistSignupStep2 from './TherapistSignupStep2';
import TherapistSignupStep3 from './TherapistSignupStep3';

const TherapistSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const nextStep = (stepData) => {
    setFormData({ ...formData, ...stepData });
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = (finalData) => {
    const completeData = { ...formData, ...finalData };
    console.log("Complete therapist signup data:", completeData);
    // In the future, we'll make the final API call here.
  };

  switch (currentStep) {
    case 1:
      return <TherapistSignupStep1 onSubmit={nextStep} />;
    case 2:
      return <TherapistSignupStep2 initialData={formData} onSubmit={nextStep} />;
    case 3:
      return (        
        <TherapistSignupStep3 initialData={formData} onSubmit={handleSubmit} />
      );
    default:
      return <div>Signup complete or error!</div>; // Handle completion/error
  }
};

export default TherapistSignup;
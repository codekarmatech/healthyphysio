
import React, { useState } from 'react';
import DoctorSignupStep1 from './DoctorSignupStep1';
import DoctorSignupStep2 from './DoctorSignupStep2';
import DoctorSignupStep3 from './DoctorSignupStep3';

const DoctorSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const nextStep = (stepData) => {
    setFormData({ ...formData, ...stepData });
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = (finalData) => {
    const completeData = { ...formData, ...finalData };
    console.log("Complete doctor signup data:", completeData);
    // In the future, we'll make the final API call here.
  };

  switch (currentStep) {
    case 1:
      return <DoctorSignupStep1 onSubmit={nextStep} />;
    case 2:
      return <DoctorSignupStep2 initialData={formData} onSubmit={nextStep} />;
    case 3:
      return (
        <DoctorSignupStep3 initialData={formData} onSubmit={handleSubmit} />
      );
    default:
      return <div>Signup complete or error!</div>; // Handle completion/error
  }
};

export default DoctorSignup;
/**
 * Purpose: Collect therapist's professional information during signup (Step 2)
 * Props: 
 *   - initialData: Object (optional) - Data from previous steps to pre-populate fields.
 * API Calls: None (for now, will eventually POST to /api/auth/register/therapist/step2/)
 */

import React, { useState } from 'react';

const TherapistSignupStep2 = ({ initialData = {} }) => {
  const [formData, setFormData] = useState({
    specialization: "",
    experience: "",
    licenseNumber: "",
    residentialAddress: "",
    ...initialData, 
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Therapist Step 2 data:", formData);
    // In the future, we'll make an API call here
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="specialization">Specialization:</label>
        <input
          type="text"
          id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="experience">Years of Experience:</label>
        <input
          type="number"
          id="experience"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="licenseNumber">License Number:</label>
        <input
          type="text"
          id="licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="residentialAddress">Residential Address:</label>
        <input
          type="text"
          id="residentialAddress"
          name="residentialAddress"
          value={formData.residentialAddress}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Next</button>
    </form>
  );
};

export default TherapistSignupStep2;
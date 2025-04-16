/**
 * Purpose: Collect doctor's professional information during signup (Step 2).
 * Props:
 *   - initialData: Object (optional) - Data from previous steps to pre-populate
 *     fields.
 *   - onSubmit: Function - Callback function to be called with the form data.
 * API Calls: None (will eventually POST to /api/auth/register/doctor/step2/)
 */

import React, { useState } from 'react';

const DoctorSignupStep2 = ({ initialData = {} }) => {
  const [formData, setFormData] = useState({
    specialization: "",
    licenseNumber: "",
    hospitalAffiliation: "",
    yearsOfExperience: "",
    ...initialData,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Doctor Step 2 data:", formData);
    onSubmit(formData);
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
        <label htmlFor="hospitalAffiliation">Hospital Affiliation:</label>
        <input
          type="text"
          id="hospitalAffiliation"
          name="hospitalAffiliation"
          value={formData.hospitalAffiliation}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="yearsOfExperience">Years of Experience:</label>
        <input
          type="number"
          id="yearsOfExperience"
          name="yearsOfExperience"
          value={formData.yearsOfExperience}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Next</button>
    </form>
  );
};

export default DoctorSignupStep2;
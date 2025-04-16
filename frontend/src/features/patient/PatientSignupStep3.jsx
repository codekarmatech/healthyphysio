/**
 * Purpose: Collect patient's referral, treatment preference, and disease information during signup (Step 3).
 * Props: 
 *   - initialData: Object (optional) - Data from previous steps to pre-populate fields.
 *   - onSubmit: Function - Callback function to handle form submission with all data.
 * API Calls: Will eventually POST to /api/auth/register/patient/step3/ (or similar) via onSubmit.
 */

import React, { useState } from 'react';

const PatientSignupStep3 = ({ initialData = {}, onSubmit }) => {
  const [formData, setFormData] = useState({
    referred_by: "",
    referenceDetail: "",
    treatmentLocation: "",
    disease: "",
    ...initialData, // Merge with initial data
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="referred_by">Referred By:</label>
        <input
          type="text"
          id="referred_by"
          name="referred_by"
          value={formData.referred_by}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="referenceDetail">Reference Details:</label>
        <input
          type="text"
          id="referenceDetail"
          name="referenceDetail"
          value={formData.referenceDetail}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="treatmentLocation">Preferred Treatment Location:</label>
        <select
          id="treatmentLocation"
          name="treatmentLocation"
          value={formData.treatmentLocation}
          onChange={handleChange}
          required
        >
          <option value="">Select Location</option>
          <option value="Home visit">Home visit</option>
          <option value="Telephonic consultation">Telephonic consultation</option>
        </select>
      </div>
      <div>
        <label htmlFor="disease">Disease/Condition:</label>
        <input
          type="text"
          id="disease"
          name="disease"
          value={formData.disease}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default PatientSignupStep3;
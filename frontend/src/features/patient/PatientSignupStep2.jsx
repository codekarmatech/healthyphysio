/**
 * Purpose: Collect patient's personal information during signup (Step 2).
 * Props:
 *   - initialData: (object, optional) Data from previous step to pre-populate form.
 * API Calls: None (for now, will eventually POST to /api/auth/register/patient/step2/)
 */

import React, { useState } from 'react';

const PatientSignupStep2 = ({ initialData = {} }) => {
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
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
    console.log("Step 2 data (merged with initial):", formData);
    // In the future, we'll make an API call here
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="gender">Gender:</label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="age">Age:</label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="address">Address:</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="city">City:</label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="state">State:</label>
        <input
          type="text"
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="zipCode">Zip Code:</label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Next</button>
    </form>
  );
};

export default PatientSignupStep2;
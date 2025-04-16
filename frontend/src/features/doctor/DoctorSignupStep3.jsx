/**
 * Purpose: Collect doctor's area of practice during signup (Step 3).
 * Props:
 *   - initialData: Object (optional) - Data from previous steps to pre-populate the field.
 *   - onSubmit: Function - Callback function to be called with all form data upon submission.
 * API Calls: None (will eventually trigger registration completion)
 */

import React, { useState } from 'react';

const DoctorSignupStep3 = ({ initialData = {}, onSubmit }) => {
  const [formData, setFormData] = useState({
    area: "",
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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="area">Area of Practice:</label>
        <input
          type="text"
          id="area"
          name="area"
          value={formData.area}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default DoctorSignupStep3;
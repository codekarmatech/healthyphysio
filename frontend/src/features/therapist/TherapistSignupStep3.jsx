/**
 * Purpose: Collect therapist's preferred work areas during signup (Step 3).
 * Props:
 *   - initialData: Object (optional) - Data from previous steps to pre-populate fields.
 *   - onSubmit: Function - Callback function to be called with all form data upon submission.
 * API Calls: None (will eventually trigger registration completion)
 */

import React, { useState } from 'react';

const TherapistSignupStep3 = ({ initialData = {}, onSubmit }) => {
  const predefinedAreas = ["Ortho", "Neuro", "Cardio", "Pediatrics", "Geriatrics", "Sports"];
  const [formData, setFormData] = useState({
    preferredAreas: [],
    customArea: "",
    showCustomAreaInput: false,
    ...initialData,
  });
  const [error, setError] = useState("");

  const handleAreaChange = (area) => {
    let updatedAreas = [...formData.preferredAreas];
    if (updatedAreas.includes(area)) {
      updatedAreas = updatedAreas.filter((a) => a !== area);
    } else {
      updatedAreas.push(area);
    }

    setFormData({
      ...formData,
      preferredAreas: updatedAreas,
    });

    if (updatedAreas.length > 3) {
      setError("You can select a maximum of 3 preferred areas.");
    } else {
      setError("");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.preferredAreas.length <= 3) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Preferred Areas (select up to 3):</label>
        {predefinedAreas.map((area) => (
          <div key={area}>
            <label>
              <input
                type="checkbox"
                value={area}
                checked={formData.preferredAreas.includes(area)}
                onChange={() => handleAreaChange(area)}
              />
              {area}
            </label>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label>
          <input
            type="checkbox"
            name="showCustomAreaInput"
            checked={formData.showCustomAreaInput}
            onChange={handleChange}
          />
          Add a custom area
        </label>
      </div>

      {formData.showCustomAreaInput && (
        <div>
          <label htmlFor="customArea">Custom Area:</label>
          <input
            type="text"
            id="customArea"
            name="customArea"
            value={formData.customArea}
            onChange={handleChange}
          />
        </div>
      )}

      <button type="submit" disabled={formData.preferredAreas.length > 3}>
        Submit
      </button>
    </form>
  );
};

export default TherapistSignupStep3;
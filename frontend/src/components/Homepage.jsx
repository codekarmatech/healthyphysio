import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

function Homepage() {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  return (
    <div>
      <h2>Welcome to Our Physiotherapy Platform</h2>
      <p>Some information about physiotherapy...</p>

      <h3>Select your role:</h3>
      <div>
        <button onClick={() => handleRoleSelect('patient')}>Patient</button>
        <button onClick={() => handleRoleSelect('doctor')}>Doctor</button>
        <button onClick={() => handleRoleSelect('therapist')}>Therapist</button>
      </div>

      {selectedRole && (
        <div>
          <h3>{`Signup or Login as a ${selectedRole}`}</h3>
          {
            selectedRole === 'patient' && (
              <div>
                <Link to="/patient/signup">Patient Signup</Link> {/* Link to Patient Signup */}
                <button>Patient Login (Not Implemented)</button> 
              </div>
            )
          }
          {
            selectedRole === 'doctor' && (
              <div>
                <button>Doctor Signup (Not Implemented)</button>
                <button>Doctor Login (Not Implemented)</button>
              </div>
            )
          }
           {
            selectedRole === 'therapist' && (
              <div>
                <button>Therapist Signup (Not Implemented)</button>
                <button>Therapist Login (Not Implemented)</button>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

export default Homepage;
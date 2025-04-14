/**
 * Purpose: Generate and validate session codes
 * Connected to: Admin appointment creation, session validation
 * Props/Params: Patient name, appointment date
 */

// Generate a session code in the format PT-YYYYMMDD-INITIALS-XXXX
export const generateSessionCode = (patientName, appointmentDate) => {
  // Extract initials (up to 3 characters) from patient name
  const nameParts = patientName.split(' ');
  let initials = '';
  
  for (let i = 0; i < Math.min(3, nameParts.length); i++) {
    if (nameParts[i].length > 0) {
      initials += nameParts[i][0].toUpperCase();
    }
  }
  
  // Pad initials with 'X' if less than 3 characters
  initials = initials.padEnd(3, 'X');
  
  // Format date as YYYYMMDD
  const dateStr = appointmentDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Generate random 4-character alphanumeric code (excluding confusing characters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  
  return `PT-${dateStr}-${initials}-${randomPart}`;
};

// Validate session code format
export const validateSessionCode = (code) => {
  if (!code) return false;
  
  const pattern = /^PT-\d{8}-[A-Z]{3}-[A-Z0-9]{4}$/;
  return pattern.test(code);
};

// Extract date from session code
export const extractDateFromSessionCode = (code) => {
  if (!validateSessionCode(code)) return null;
  
  const datePart = code.split('-')[1];
  const year = datePart.slice(0, 4);
  const month = datePart.slice(4, 6);
  const day = datePart.slice(6, 8);
  
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
};
"""
Purpose: Validate session codes
Connected Endpoints: All session code inputs
Validation: Format, date validity, existence
"""

import re
from datetime import datetime

def is_valid_session_date(date_str):
    """
    Validate that a date string in YYYYMMDD format is a valid date
    Mirrors the frontend validation logic
    """
    if not date_str or len(date_str) != 8:
        return False
    
    try:
        year = int(date_str[0:4])
        month = int(date_str[4:6])
        day = int(date_str[6:8])
        
        # Create date object and check if it's valid
        date = datetime(year, month, day)
        
        # Check if the components match (catches invalid dates like Feb 30)
        return date.year == year and date.month == month and date.day == day
    except ValueError:
        return False

def validate_session_code(session_code):
    """
    Validate a session code format: PT-YYYYMMDD-INITIALS-XXXX
    Returns (is_valid, error_message)
    """
    if not session_code:
        return False, "Session code is required"
    
    # Check format with regex
    pattern = r'^PT-\d{8}-[A-Z]{3}-[A-Z0-9]{4}$'
    if not re.match(pattern, session_code):
        return False, "Invalid session code format. Expected: PT-YYYYMMDD-INITIALS-XXXX"
    
    # Extract and validate date part
    date_part = session_code.split('-')[1]
    if not is_valid_session_date(date_part):
        return False, "Session code contains invalid date"
    
    return True, ""
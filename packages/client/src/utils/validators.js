export const ETHIOPIAN_PHONE_REGEX = /^\+251[0-9]{9}$/;

export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s+/g, '');
  return Boolean(cleanPhone.match(/^(?:\+251|251|0)?9\d{8}$/));
};

export const parseTabSeparatedData = (data) => {
  try {
    const rows = data.trim().split('\n');
    // Skip header row if it exists
    const dataRows = rows.length > 1 ? rows.slice(1) : rows;
    
    return dataRows.map(row => {
      const [name, contact, email, department, location] = row.split('\t').map(cell => cell?.trim() || '');
      
      // Only return rows that have at least a name and location
      if (!name || !location) {
        return null;
      }

      return {
        name,
        contact,
        email,
        department,
        location
      };
    }).filter(Boolean); // Remove any null entries
  } catch (error) {
    console.error("Error parsing tab-separated data:", error);
    return [];
  }
};

export const formatPhoneNumber = (phone) => {
  // If phone is null, undefined, or empty string, return empty string
  if (!phone) return '';

  const cleanPhone = phone.replace(/[^\d+]/g, ''); // Remove non-digit characters except '+'
  
  // If already in international format with +251, return it
  if (cleanPhone.startsWith('+251') && cleanPhone.length === 13) {
    return cleanPhone;
  } 
  
  // If starts with 251 (no plus)
  else if (cleanPhone.startsWith('251') && cleanPhone.length === 12) {
    return `+${cleanPhone}`; // Add "+" if it starts with "251" and has 12 digits
  } 
  
  // If starts with 0
  else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return `+251${cleanPhone.substring(1)}`; // Replace leading "0" with "+251"
  } 
  
  // If starts with 9 and is 9 digits
  else if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
    return `+251${cleanPhone}`; // Add "+251" if it starts with "9" and has 9 digits
  } 
  
  // Return original if no transformation applies
  else {
    return phone;
  }
};

// Add email regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address
 */
export const validateEmail = (email) => {
  if (!email) return true; // Optional, so empty is valid
  return Boolean(email.match(EMAIL_REGEX));
};

// Helper function to validate candidate data
export const validateCandidateData = (data) => {
  const errors = [];

  // Required fields: only name, department, and location
  if (!data.name?.trim()) {
    errors.push("Name is required");
  }

  if (!data.department?.trim()) {
    errors.push("Department is required");
  }

  if (!data.location?.trim() && !data.areaName?.trim()) {
    errors.push("Location/Address is required");
  }

  // Optional fields with format validation
  if (data.phone && data.phone.trim() && !validatePhoneNumber(data.phone)) {
    errors.push("Phone number format is invalid (optional field)");
  }

  if (data.email && data.email.trim() && !validateEmail(data.email)) {
    errors.push("Email format is invalid (optional field)");
  }

  // Validate coordinates only if they are provided
  // Convert them to numbers first if they're strings
  const lat = typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude;
  const lng = typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude;
  
  const hasLatitude = typeof lat === 'number' && !isNaN(lat);
  const hasLongitude = typeof lng === 'number' && !isNaN(lng);
  
  // Only validate coordinates if both are provided or neither is provided
  if ((hasLatitude && !hasLongitude) || (!hasLatitude && hasLongitude)) {
    errors.push("Both latitude and longitude must be provided together");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Add geolocation validation
export const validateGeolocation = (lat, lng) => {
  const validLat = typeof lat === 'number' && lat >= -90 && lat <= 90;
  const validLng = typeof lng === 'number' && lng >= -180 && lng <= 180;
  return validLat && validLng;
};

// Add new function to handle file type checks
export const isValidFileType = (filename) => {
  const validTypes = ['.csv', '.xlsx', '.xls'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validTypes.includes(extension);
};

// Add new function to validate file uploads
export const validateFileUpload = (file) => {
  const errors = [];

  // Check if file is provided
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }

  // Validate file type
  const validTypes = ['.csv', '.xlsx', '.xls'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!validTypes.includes(extension)) {
    errors.push('Invalid file type. Please upload a CSV or Excel file');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFileContents = (rows) => {
  const errors = [];
  const processedRows = [];
  
  if (!rows || rows.length < 2) {
    errors.push('File must contain at least a header row and one data row');
    return { errors, validRows: [], isValid: false };
  }

  // Validate headers
  const headers = rows[0].map(h => h?.toLowerCase()?.trim());
  const requiredFields = ['name', 'location', 'contact'];
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    return { errors, validRows: [], isValid: false };
  }

  // Get field indexes
  const fieldIndexes = {
    name: headers.indexOf('name'),
    location: headers.indexOf('location'),
    contact: headers.indexOf('contact'),
    email: headers.indexOf('email'),
    department: headers.indexOf('department')
  };

  // Validate each row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors = [];
    
    // Skip empty rows
    if (!row.some(cell => cell?.trim())) continue;

    const candidate = {
      name: row[fieldIndexes.name]?.trim() || '',
      location: row[fieldIndexes.location]?.trim() || '',
      contact: row[fieldIndexes.contact]?.trim() || '',
      email: fieldIndexes.email >= 0 ? row[fieldIndexes.email]?.trim() || '' : '',
      department: fieldIndexes.department >= 0 ? row[fieldIndexes.department]?.trim() || '' : ''
    };

    // Required field validation
    if (!candidate.name) rowErrors.push('Name is required');
    if (!candidate.location) rowErrors.push('Location is required');
    if (!candidate.contact) rowErrors.push('Contact is required');

    // Phone number validation
    if (candidate.contact && !validatePhoneNumber(candidate.contact)) {
      rowErrors.push('Invalid phone number format (should be Ethiopian format)');
    }

    // Email validation if provided
    if (candidate.email && !validateEmail(candidate.email)) {
      rowErrors.push('Invalid email format');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: i + 1,
        errors: rowErrors
      });
    } else {
      processedRows.push(candidate);
    }
  }

  return {
    errors,
    validRows: processedRows,
    isValid: errors.length === 0 && processedRows.length > 0
  };
};

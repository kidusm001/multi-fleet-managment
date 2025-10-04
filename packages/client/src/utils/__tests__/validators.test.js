import {
  validatePhoneNumber,
  validateEmail,
  validateGeolocation,
  isValidFileType,
  validateFileUpload,
  validateEmployeeUploadData,
  validateFileContents,
} from '../validators';

describe('Validators', () => {
  describe('validatePhoneNumber', () => {
    it('should validate Ethiopian phone numbers', () => {
      expect(validatePhoneNumber('+251912345678')).toBe(true);
      expect(validatePhoneNumber('0912345678')).toBe(true);
      expect(validatePhoneNumber('912345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('12345')).toBe(false);
      expect(validatePhoneNumber('+1234567890')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber(null)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
    });

    it('should accept empty email (optional)', () => {
      expect(validateEmail('')).toBe(true);
      expect(validateEmail(null)).toBe(true);
    });
  });

  describe('validateGeolocation', () => {
    it('should validate correct coordinates', () => {
      expect(validateGeolocation(9.03, 38.74)).toBe(true);
      expect(validateGeolocation(0, 0)).toBe(true);
      expect(validateGeolocation(-90, -180)).toBe(true);
      expect(validateGeolocation(90, 180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateGeolocation(91, 38)).toBe(false);
      expect(validateGeolocation(9, 181)).toBe(false);
      expect(validateGeolocation('9', '38')).toBe(false);
      expect(validateGeolocation(null, null)).toBe(false);
    });
  });

  describe('isValidFileType', () => {
    it('should accept valid file types', () => {
      expect(isValidFileType('employees.csv')).toBe(true);
      expect(isValidFileType('data.xlsx')).toBe(true);
      expect(isValidFileType('report.xls')).toBe(true);
    });

    it('should reject invalid file types', () => {
      expect(isValidFileType('document.pdf')).toBe(false);
      expect(isValidFileType('image.png')).toBe(false);
      expect(isValidFileType('file.txt')).toBe(false);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate file with correct type and size', () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const result = validateFileUpload(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
      const result = validateFileUpload(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds 10MB limit');
    });

    it('should reject files with invalid type', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFileUpload(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid file type');
    });

    it('should handle no file provided', () => {
      const result = validateFileUpload(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No file selected');
    });
  });

  describe('validateEmployeeUploadData', () => {
    it('should validate correct employee data', () => {
      const data = {
        name: 'John Doe',
        department: 'Engineering',
        location: 'Addis Ababa',
        phone: '+251912345678',
        email: 'john@example.com',
      };
      
      const result = validateEmployeeUploadData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name, department, and location', () => {
      const data = {
        phone: '+251912345678',
      };
      
      const result = validateEmployeeUploadData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Department is required');
      expect(result.errors).toContain('Location/Address is required');
    });

    it('should validate optional phone format', () => {
      const data = {
        name: 'John Doe',
        department: 'Engineering',
        location: 'Addis Ababa',
        phone: 'invalid',
      };
      
      const result = validateEmployeeUploadData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Phone number format is invalid');
    });

    it('should validate optional email format', () => {
      const data = {
        name: 'John Doe',
        department: 'Engineering',
        location: 'Addis Ababa',
        email: 'invalid-email',
      };
      
      const result = validateEmployeeUploadData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Email format is invalid');
    });

    it('should validate coordinates together', () => {
      const dataOnlyLat = {
        name: 'John Doe',
        department: 'Engineering',
        location: 'Addis Ababa',
        latitude: 9.03,
      };
      
      const result = validateEmployeeUploadData(dataOnlyLat);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Both latitude and longitude must be provided');
    });
  });

  describe('validateFileContents', () => {
    it('should validate correct file contents', () => {
      const rows = [
        ['name', 'location', 'contact', 'email', 'department'],
        ['John Doe', 'Addis Ababa', '+251912345678', 'john@example.com', 'Engineering'],
      ];
      
      const result = validateFileContents(rows);
      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files without required columns', () => {
      const rows = [
        ['name', 'email'], // missing location and contact
        ['John Doe', 'john@example.com'],
      ];
      
      const result = validateFileContents(rows);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Missing required columns');
    });

    it('should validate individual row data', () => {
      const rows = [
        ['name', 'location', 'contact'],
        ['John Doe', 'Addis Ababa', '+251912345678'], // valid
        ['', 'Addis Ababa', '+251912345678'], // missing name
        ['Jane Doe', '', '+251912345678'], // missing location
      ];
      
      const result = validateFileContents(rows);
      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
    });

    it('should skip empty rows', () => {
      const rows = [
        ['name', 'location', 'contact'],
        ['John Doe', 'Addis Ababa', '+251912345678'],
        ['', '', ''], // empty row
        ['Jane Doe', 'Addis Ababa', '+251912345678'],
      ];
      
      const result = validateFileContents(rows);
      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
    });
  });
});

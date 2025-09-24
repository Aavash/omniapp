import {
  formatCurrency,
  getInitials,
  getFullName,
  isValidEmail,
} from '../helpers';

describe('Helper Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('getInitials', () => {
    it('should return initials from first and last name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD');
      expect(getInitials('jane', 'smith')).toBe('JS');
    });

    it('should handle empty names', () => {
      expect(getInitials('', '')).toBe('');
      expect(getInitials('John', '')).toBe('J');
    });
  });

  describe('getFullName', () => {
    it('should combine first and last name', () => {
      expect(getFullName('John', 'Doe')).toBe('John Doe');
      expect(getFullName('Jane', 'Smith')).toBe('Jane Smith');
    });
  });

  describe('isValidEmail', () => {
    it('should validate email addresses correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });
});

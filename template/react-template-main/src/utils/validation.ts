/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Thai format)
 */
export const isValidThaiPhone = (phone: string): boolean => {
  const phoneRegex = /^(0[689]{1}[0-9]{8})$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

/**
 * Validate Thai ID card number
 */
export const isValidThaiID = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i)) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id.charAt(12));
};

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (value: string): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
};

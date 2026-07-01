export const validateName = (name: string): string | null => {
  if (!name) return null;
  if (name.length > 25) return 'Full name cannot exceed 25 characters';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return null;
  if (password.length > 25) return 'Password cannot exceed 25 characters';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  if (email.length > 50) return 'Email cannot exceed 50 characters';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

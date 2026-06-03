// Centralized validation regexes/helpers shared by every form (single source of truth).
export const NAME_REGEX = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(078|079|073|072)\d{7}$/;
export const RECOVERY_CODE_REGEX = /^\d{4}$/;
export const USERNAME_MIN = 3;
export const PASSWORD_MIN = 6;

export function validateFullName(value) {
  if (!value || !value.trim()) return 'Full name is required.';
  if (!NAME_REGEX.test(value.trim())) return 'Letters only (spaces, hyphens, apostrophes allowed).';
  return '';
}

export function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address.';
  return '';
}

export function validatePhone(value) {
  if (!value || !value.trim()) return 'Phone number is required.';
  if (!PHONE_REGEX.test(value.trim())) return 'Must be 10 digits starting with 078, 079, 073 or 072.';
  return '';
}

export function validateUsername(value) {
  if (!value || !value.trim()) return 'Username is required.';
  if (value.trim().length < USERNAME_MIN) return 'At least 3 characters.';
  if (/\s/.test(value.trim())) return 'No spaces allowed.';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < PASSWORD_MIN) return 'At least 6 characters.';
  return '';
}

export function validateRecoveryCode(value) {
  if (!value || !value.trim()) return 'Recovery code is required.';
  if (!RECOVERY_CODE_REGEX.test(value.trim())) return 'Exactly 4 digits.';
  return '';
}

export function validateRequired(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') return `${label} is required.`;
  return '';
}

export function validatePositiveNumber(value, label) {
  const n = Number(value);
  if (value === '' || value === undefined || value === null || Number.isNaN(n)) return `${label} is required.`;
  if (!(n > 0)) return `${label} must be greater than zero.`;
  return '';
}

export function validateNonNegativeInteger(value, label) {
  const n = Number(value);
  if (value === '' || Number.isNaN(n)) return `${label} is required.`;
  if (!Number.isInteger(n) || n < 0) return `${label} must be a non-negative whole number.`;
  return '';
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

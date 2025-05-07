import { ERROR_MESSAGES } from '../constants';

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return ERROR_MESSAGES.REQUIRED;
  if (!emailRegex.test(email)) return ERROR_MESSAGES.INVALID_EMAIL;
  return null;
};

export const validateNumber = (
  value: string,
  min?: number,
  max?: number
): string | null => {
  if (!value) return ERROR_MESSAGES.REQUIRED;
  const numValue = Number(value);
  if (isNaN(numValue)) return ERROR_MESSAGES.INVALID_NUMBER;
  if (min !== undefined && numValue < min) return ERROR_MESSAGES.MIN_VALUE(min);
  if (max !== undefined && numValue > max) return ERROR_MESSAGES.MAX_VALUE(max);
  return null;
};

export const validateRequired = (value: string): string | null => {
  if (!value) return ERROR_MESSAGES.REQUIRED;
  return null;
}; 
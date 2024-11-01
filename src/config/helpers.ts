import { Result, ValidationError } from 'express-validator';

// Get error message of the first validation error
export const getFirstErrorMsg = (errors: Result<ValidationError>) => {
  return errors.array({ onlyFirstError: true })[0].msg;
};

// Generate a user id between 1000000 and 9999999, both inclusive
export const getUserId = () => {
  const min = Math.ceil(1000000);
  const max = Math.floor(9999999);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Check for production environment
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

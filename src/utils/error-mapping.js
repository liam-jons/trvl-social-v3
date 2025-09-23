/**
 * Centralized Error Mapping Utility
 * Maps API error codes to user-friendly messages for consistent error handling
 */

/**
 * Error code constants for type safety
 */
export const ERROR_CODES = {
  // Age Verification Errors
  COPPA_AGE_RESTRICTION: 'COPPA_AGE_RESTRICTION',
  AGE_VERIFICATION_FAILED: 'AGE_VERIFICATION_FAILED',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  MISSING_BIRTH_DATE: 'MISSING_BIRTH_DATE',
  MISSING_USER_EMAIL: 'MISSING_USER_EMAIL',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  AGE_CALCULATION_FAILED: 'AGE_CALCULATION_FAILED',

  // Network and Server Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Authentication Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
  PASSWORDS_DO_NOT_MATCH: 'PASSWORDS_DO_NOT_MATCH',

  // Permission Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ACCESS_DENIED: 'ACCESS_DENIED',

  // Method Errors
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',

  // Unknown Error
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Maps error codes to user-friendly messages
 */
const ERROR_MESSAGES = {
  // Age Verification Messages
  [ERROR_CODES.COPPA_AGE_RESTRICTION]: 'You must be at least 13 years old to create an account',
  [ERROR_CODES.AGE_VERIFICATION_FAILED]: 'Age verification failed. Please check your date of birth',
  [ERROR_CODES.INVALID_DATE_FORMAT]: 'Please enter a valid date of birth',
  [ERROR_CODES.MISSING_BIRTH_DATE]: 'Date of birth is required',
  [ERROR_CODES.MISSING_USER_EMAIL]: 'User email is required for verification',
  [ERROR_CODES.DECRYPTION_FAILED]: 'Unable to verify birth date information. Please try again',
  [ERROR_CODES.AGE_CALCULATION_FAILED]: 'Unable to calculate age from the provided date',

  // Network and Server Messages
  [ERROR_CODES.NETWORK_ERROR]: 'Connection error. Please check your internet connection and try again',
  [ERROR_CODES.SERVER_ERROR]: 'Server error occurred. Please try again later',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again',
  [ERROR_CODES.MAX_RETRIES_EXCEEDED]: 'Service is temporarily unavailable. Please try again later',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is currently unavailable. Please try again later',

  // Authentication Messages
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.EMAIL_NOT_CONFIRMED]: 'Please check your email and confirm your account',
  [ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many attempts. Please wait a moment and try again',
  [ERROR_CODES.WEAK_PASSWORD]: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
  [ERROR_CODES.EMAIL_ALREADY_REGISTERED]: 'An account with this email already exists',

  // Validation Messages
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your information and try again',
  [ERROR_CODES.REQUIRED_FIELD_MISSING]: 'Please fill in all required fields',
  [ERROR_CODES.INVALID_EMAIL_FORMAT]: 'Please enter a valid email address',
  [ERROR_CODES.PASSWORDS_DO_NOT_MATCH]: 'Passwords do not match',

  // Permission Messages
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action',
  [ERROR_CODES.ACCESS_DENIED]: 'Access denied',

  // Method Messages
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 'This action is not allowed',

  // Unknown Error
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again'
};

/**
 * Maps Supabase error messages to our error codes
 */
const SUPABASE_ERROR_MAP = {
  'Invalid login credentials': ERROR_CODES.INVALID_CREDENTIALS,
  'Email not confirmed': ERROR_CODES.EMAIL_NOT_CONFIRMED,
  'Too many requests': ERROR_CODES.TOO_MANY_REQUESTS,
  'Password should be at least 6 characters': ERROR_CODES.WEAK_PASSWORD,
  'User already registered': ERROR_CODES.EMAIL_ALREADY_REGISTERED,
  'duplicate key value violates unique constraint': ERROR_CODES.EMAIL_ALREADY_REGISTERED,
  'new row violates row-level security policy': ERROR_CODES.FORBIDDEN,
  'JWT expired': ERROR_CODES.UNAUTHORIZED,
  'Invalid API key': ERROR_CODES.UNAUTHORIZED,
  'Database connection failed': ERROR_CODES.SERVER_ERROR,
  'Internal server error': ERROR_CODES.INTERNAL_SERVER_ERROR,
  'Service temporarily unavailable': ERROR_CODES.SERVICE_UNAVAILABLE
};

/**
 * Gets user-friendly error message from error code or object
 * @param {string|Error|Object} error - Error code, Error object, or error response object
 * @param {string} defaultMessage - Default message if no mapping found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred. Please try again.') => {
  if (!error) {
    return defaultMessage;
  }

  // Handle string error codes directly
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || defaultMessage;
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check if error message maps to a known error
    const mappedCode = SUPABASE_ERROR_MAP[error.message];
    if (mappedCode) {
      return ERROR_MESSAGES[mappedCode];
    }

    // Check if error has a code property
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    return error.message || defaultMessage;
  }

  // Handle error response objects (from API calls)
  if (typeof error === 'object') {
    // Check for direct error code
    if (error.error && ERROR_MESSAGES[error.error]) {
      return ERROR_MESSAGES[error.error];
    }

    // Check for code property
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    // Check for message property and map it
    if (error.message) {
      const mappedCode = SUPABASE_ERROR_MAP[error.message];
      if (mappedCode) {
        return ERROR_MESSAGES[mappedCode];
      }
      return error.message;
    }

    // Check for details property (Supabase edge function errors)
    if (error.details) {
      return error.details;
    }
  }

  return defaultMessage;
};

/**
 * Checks if an error is retryable (network/server errors)
 * @param {string|Error|Object} error - Error to check
 * @returns {boolean} True if error might be resolved by retrying
 */
export const isRetryableError = (error) => {
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.SERVER_ERROR,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.SERVICE_UNAVAILABLE
  ];

  if (typeof error === 'string') {
    return retryableCodes.includes(error);
  }

  if (error?.error) {
    return retryableCodes.includes(error.error);
  }

  if (error?.code) {
    return retryableCodes.includes(error.code);
  }

  // Check for network/timeout errors
  if (error instanceof Error) {
    const isNetworkError = error.message.toLowerCase().includes('network') ||
                          error.message.toLowerCase().includes('timeout') ||
                          error.message.toLowerCase().includes('connection');
    return isNetworkError;
  }

  return false;
};

/**
 * Checks if an error is age-related (should not be retried)
 * @param {string|Error|Object} error - Error to check
 * @returns {boolean} True if error is age verification related
 */
export const isAgeVerificationError = (error) => {
  const ageErrorCodes = [
    ERROR_CODES.COPPA_AGE_RESTRICTION,
    ERROR_CODES.AGE_VERIFICATION_FAILED,
    ERROR_CODES.INVALID_DATE_FORMAT,
    ERROR_CODES.MISSING_BIRTH_DATE,
    ERROR_CODES.AGE_CALCULATION_FAILED
  ];

  if (typeof error === 'string') {
    return ageErrorCodes.includes(error);
  }

  if (error?.error) {
    return ageErrorCodes.includes(error.error);
  }

  if (error?.code) {
    return ageErrorCodes.includes(error.code);
  }

  return false;
};

/**
 * Standardizes error response format
 * @param {string} code - Error code
 * @param {string} message - Error message (optional, will use mapped message if not provided)
 * @param {Object} details - Additional error details (optional)
 * @returns {Object} Standardized error object
 */
export const createErrorResponse = (code, message = null, details = null) => {
  return {
    success: false,
    error: code,
    code,
    message: message || getErrorMessage(code),
    ...(details && { details })
  };
};

/**
 * Maps Supabase auth errors to our error format
 * @param {Object} supabaseError - Error from Supabase auth
 * @returns {Object} Standardized error object
 */
export const mapSupabaseError = (supabaseError) => {
  if (!supabaseError) {
    return createErrorResponse(ERROR_CODES.UNKNOWN_ERROR);
  }

  // Handle Supabase error object structure
  const errorMessage = supabaseError.message || supabaseError.error_description || 'Unknown error';
  const mappedCode = SUPABASE_ERROR_MAP[errorMessage] || ERROR_CODES.UNKNOWN_ERROR;

  return createErrorResponse(mappedCode, getErrorMessage(mappedCode), {
    originalError: errorMessage,
    supabaseCode: supabaseError.code || supabaseError.error
  });
};

export default {
  ERROR_CODES,
  getErrorMessage,
  isRetryableError,
  isAgeVerificationError,
  createErrorResponse,
  mapSupabaseError
};
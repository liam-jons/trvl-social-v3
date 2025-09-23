/**
 * Server-Side Age Verification Service
 * Handles COPPA compliance by validating age on the server
 */

import { supabase } from '../lib/supabase';

/**
 * Calls the server-side age verification Edge Function
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @param {number} minAge - Minimum age requirement (default: 13)
 * @returns {Promise<{success: boolean, age?: number, error?: string, message?: string}>}
 */
export const verifyAgeServerSide = async (dateOfBirth, minAge = 13) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-age', {
      body: {
        dateOfBirth,
        minAge
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Server-side age verification failed'
      };
    }

    return data;
  } catch (error) {
    console.error('Age verification service error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to connect to age verification service'
    };
  }
};

/**
 * Validates age with retry logic for network failures
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @param {number} minAge - Minimum age requirement
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<{success: boolean, age?: number, error?: string, message?: string}>}
 */
export const verifyAgeWithRetry = async (dateOfBirth, minAge = 13, maxRetries = 3) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await verifyAgeServerSide(dateOfBirth, minAge);

      // If verification succeeded or failed for age reasons (not server error), return immediately
      if (result.success || result.error === 'COPPA_AGE_RESTRICTION' || result.error === 'AGE_VERIFICATION_FAILED') {
        return result;
      }

      // If it's a validation error (invalid date format, etc.), don't retry
      if (result.error === 'VALIDATION_ERROR' || result.error === 'INVALID_DATE_FORMAT') {
        return result;
      }

      lastError = result;

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      lastError = {
        success: false,
        error: 'NETWORK_ERROR',
        message: `Verification attempt ${attempt} failed: ${error.message}`
      };

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted
  return lastError || {
    success: false,
    error: 'MAX_RETRIES_EXCEEDED',
    message: 'Age verification failed after multiple attempts'
  };
};

/**
 * Comprehensive age verification combining client and server validation
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @param {number} minAge - Minimum age requirement
 * @returns {Promise<{success: boolean, age?: number, error?: string, message?: string, clientValid?: boolean, serverValid?: boolean}>}
 */
export const comprehensiveAgeVerification = async (dateOfBirth, minAge = 13) => {
  // Import client-side validation
  const { validateAge: clientValidateAge } = await import('../utils/age-verification');

  // First run client-side validation for immediate feedback
  const clientResult = clientValidateAge(dateOfBirth, minAge);

  // If client validation fails, no need to call server
  if (!clientResult.isValid) {
    return {
      success: false,
      error: 'CLIENT_VALIDATION_FAILED',
      message: clientResult.error,
      age: clientResult.age,
      clientValid: false,
      serverValid: false
    };
  }

  // Run server-side verification
  const serverResult = await verifyAgeWithRetry(dateOfBirth, minAge);

  return {
    ...serverResult,
    clientValid: clientResult.isValid,
    serverValid: serverResult.success,
    age: serverResult.age || clientResult.age
  };
};

/**
 * Gets user-friendly error message for age verification errors
 * @param {string} errorCode - Error code from verification
 * @param {string} message - Error message from verification
 * @returns {string} - User-friendly error message
 */
export const getAgeVerificationErrorMessage = (errorCode, message) => {
  switch (errorCode) {
    case 'COPPA_AGE_RESTRICTION':
    case 'AGE_VERIFICATION_FAILED':
      return message; // Server provides specific age-related message

    case 'INVALID_DATE_FORMAT':
    case 'VALIDATION_ERROR':
      return message; // Server provides specific validation message

    case 'SERVER_ERROR':
    case 'NETWORK_ERROR':
      return 'Unable to verify age at this time. Please try again.';

    case 'MAX_RETRIES_EXCEEDED':
      return 'Age verification is temporarily unavailable. Please try again later.';

    default:
      return 'An error occurred during age verification. Please try again.';
  }
};

export default {
  verifyAgeServerSide,
  verifyAgeWithRetry,
  comprehensiveAgeVerification,
  getAgeVerificationErrorMessage
};
/**
 * Age Verification Utility
 * Handles COPPA compliance and client-side age validation
 */

/**
 * Calculates the exact age of a person based on their birth date
 * @param {string|Date} birthDate - The birth date
 * @returns {number|null} - Age in years, or null if invalid date
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    const today = new Date();

    // Validate date
    if (isNaN(birth.getTime())) return null;

    // Handle timezone issues by normalizing to UTC midnight
    const birthUTC = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
    const todayUTC = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let age = todayUTC.getFullYear() - birthUTC.getFullYear();
    const monthDiff = todayUTC.getMonth() - birthUTC.getMonth();
    const dayDiff = todayUTC.getDate() - birthUTC.getDate();

    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if a user meets the minimum age requirement
 * @param {string|Date} birthDate - The birth date
 * @param {number} minAge - Minimum age requirement (default: 13 for COPPA)
 * @returns {boolean} - True if user is old enough
 */
export const isUserOldEnough = (birthDate, minAge = 13) => {
  const age = calculateAge(birthDate);
  return age !== null && age >= minAge;
};

/**
 * Validates date format and range
 * @param {string} dateString - Date string to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
export const validateDateFormat = (dateString) => {
  if (!dateString) {
    return { isValid: false, error: 'Date of birth is required' };
  }

  try {
    // First check if this is a leap year issue by parsing the input string
    if (isInvalidLeapYearDate(dateString)) {
      return { isValid: false, error: 'Please enter a valid date' };
    }

    const date = new Date(dateString);
    const today = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Please enter a valid date' };
    }

    // Check if date is in the future
    if (date > today) {
      return { isValid: false, error: 'Date of birth cannot be in the future' };
    }

    // Check if date is too far in the past (120+ years)
    const maxAge = 120;
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - maxAge);

    if (date < minDate) {
      return { isValid: false, error: 'Please enter a valid date of birth' };
    }

    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
};

/**
 * Handles leap year edge cases, particularly February 29th birthdays
 * @param {Date} date - Date to check
 * @returns {boolean} - True if the date handles leap year correctly
 */
export const handleLeapYear = (date) => {
  if (!date || isNaN(date.getTime())) return false;

  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // Check if it's February 29th
  if (month === 1 && day === 29) {
    // Verify this is actually a leap year
    if (!isLeapYear(year)) {
      return false; // Feb 29th in non-leap year is invalid
    }
  }

  // Additional check: verify the date is actually what we think it is
  // JavaScript Date constructor can "fix" invalid dates (e.g., Feb 30 becomes Mar 2)
  const originalInput = new Date(year, month, day);
  const actualMonth = originalInput.getMonth();
  const actualDay = originalInput.getDate();
  const actualYear = originalInput.getFullYear();

  return actualMonth === month && actualDay === day && actualYear === year;
};

/**
 * Helper function to check if a year is a leap year
 * @param {number} year - Year to check
 * @returns {boolean} - True if leap year
 */
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Helper function to check if a date string represents an invalid date
 * @param {string} dateString - Date string to check (e.g., "2021-02-29", "2024-02-30")
 * @returns {boolean} - True if this is an invalid date
 */
const isInvalidLeapYearDate = (dateString) => {
  // Match YYYY-MM-DD format
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Check for Feb 29 in non-leap years
  if (month === 2 && day === 29) {
    return !isLeapYear(year);
  }

  // Check for Feb 30 or 31 (always invalid)
  if (month === 2 && day >= 30) {
    return true;
  }

  // Check for invalid days in other months
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month >= 1 && month <= 12) {
    return day > daysInMonth[month - 1] || day < 1;
  }

  // Invalid month
  if (month < 1 || month > 12) {
    return true;
  }

  return false;
};

/**
 * Gets contextual error message for age verification
 * @param {string|Date} birthDate - The birth date
 * @param {number} minAge - Minimum age requirement
 * @returns {string|null} - Error message or null if valid
 */
export const getAgeVerificationError = (birthDate, minAge = 13) => {
  // First validate the date format
  const formatValidation = validateDateFormat(birthDate);
  if (!formatValidation.isValid) {
    return formatValidation.error;
  }

  try {
    const birth = new Date(birthDate);
    const today = new Date();

    // Handle leap year edge case
    if (!handleLeapYear(birth)) {
      return 'Invalid date: February 29th is not valid for non-leap years';
    }

    const age = calculateAge(birthDate);

    if (age === null) {
      return 'Please enter a valid date of birth';
    }

    if (age < minAge) {
      if (age === minAge - 1) {
        // Special message for users who are exactly one year too young
        const nextBirthday = new Date(birth);
        nextBirthday.setFullYear(today.getFullYear());

        // If birthday already passed this year, add one more year
        if (nextBirthday <= today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const birthdayStr = nextBirthday.toLocaleDateString(undefined, options);

        return `You'll be able to create an account on ${birthdayStr} when you turn ${minAge}`;
      }

      return `You must be at least ${minAge} years old to create an account`;
    }

    return null; // No error
  } catch (error) {
    return 'Please enter a valid date of birth';
  }
};

/**
 * Comprehensive age validation function that combines all checks
 * @param {string} dateString - Date string to validate
 * @param {number} minAge - Minimum age requirement
 * @returns {object} - Complete validation result
 */
export const validateAge = (dateString, minAge = 13) => {
  const formatValidation = validateDateFormat(dateString);

  if (!formatValidation.isValid) {
    return {
      isValid: false,
      error: formatValidation.error,
      age: null,
      isOldEnough: false
    };
  }

  const age = calculateAge(dateString);
  const isOldEnough = isUserOldEnough(dateString, minAge);
  const error = getAgeVerificationError(dateString, minAge);

  return {
    isValid: error === null,
    error: error,
    age: age,
    isOldEnough: isOldEnough
  };
};

/**
 * Utility function to get the maximum allowed date (13 years ago from today)
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const getMaxAllowedDate = () => {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() - 13);
  return maxDate.toISOString().split('T')[0];
};

/**
 * Utility function to get the minimum allowed date (120 years ago from today)
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const getMinAllowedDate = () => {
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);
  return minDate.toISOString().split('T')[0];
};

/**
 * Debounced validation function for real-time validation
 * @param {Function} validationFunction - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounceValidation = (validationFunction, delay = 300) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);

    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(validationFunction(...args));
      }, delay);
    });
  };
};
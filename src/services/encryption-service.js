/**
 * Birth Date Encryption Service
 * Provides secure encryption/decryption for birth dates to ensure COPPA compliance
 * Uses AES-256-GCM for authenticated encryption with unique IVs per operation
 */

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256, // 256-bit key
  ivLength: 12,   // 96-bit IV for GCM
  tagLength: 128, // 128-bit authentication tag
};

/**
 * Derives a consistent encryption key from a master key and salt
 * @param {string} masterKey - Base key material (from environment or secure storage)
 * @param {string} salt - Salt for key derivation (user ID or constant salt)
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
async function deriveEncryptionKey(masterKey, salt) {
  try {
    // Convert master key to key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(masterKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Gets the master key from environment variables or throws an error
 * @returns {string} Master encryption key
 */
function getMasterKey() {
  const masterKey = import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY;

  if (!masterKey) {
    throw new Error('VITE_BIRTH_DATE_ENCRYPTION_KEY environment variable is required');
  }

  // Validate key length (should be at least 32 bytes for security)
  if (masterKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters long');
  }

  return masterKey;
}

/**
 * Encrypts a birth date string using AES-256-GCM
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @param {string} userId - User ID for key derivation (optional, uses default salt if not provided)
 * @returns {Promise<string>} Base64-encoded encrypted data (IV + encrypted data + tag)
 */
export async function encryptBirthDate(birthDate, userId = 'default') {
  try {
    if (!birthDate) {
      throw new Error('Birth date is required for encryption');
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      throw new Error('Birth date must be in YYYY-MM-DD format');
    }

    const masterKey = getMasterKey();
    const encryptionKey = await deriveEncryptionKey(masterKey, userId);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));

    // Encrypt the birth date
    const encodedBirthDate = new TextEncoder().encode(birthDate);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
        tagLength: ENCRYPTION_CONFIG.tagLength,
      },
      encryptionKey,
      encodedBirthDate
    );

    // Combine IV + encrypted data for storage
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Return as base64 string for database storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Birth date encryption failed:', error);
    throw new Error(`Failed to encrypt birth date: ${error.message}`);
  }
}

/**
 * Decrypts an encrypted birth date
 * @param {string} encryptedData - Base64-encoded encrypted birth date
 * @param {string} userId - User ID for key derivation (optional, uses default salt if not provided)
 * @returns {Promise<string>} Decrypted birth date in YYYY-MM-DD format
 */
export async function decryptBirthDate(encryptedData, userId = 'default') {
  try {
    if (!encryptedData) {
      throw new Error('Encrypted data is required for decryption');
    }

    const masterKey = getMasterKey();
    const encryptionKey = await deriveEncryptionKey(masterKey, userId);

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength);
    const encrypted = combined.slice(ENCRYPTION_CONFIG.ivLength);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
        tagLength: ENCRYPTION_CONFIG.tagLength,
      },
      encryptionKey,
      encrypted
    );

    // Convert back to string
    const birthDate = new TextDecoder().decode(decryptedData);

    // Validate decrypted date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      throw new Error('Decrypted data is not a valid date format');
    }

    return birthDate;
  } catch (error) {
    console.error('Birth date decryption failed:', error);
    throw new Error(`Failed to decrypt birth date: ${error.message}`);
  }
}

/**
 * Validates encrypted birth date data without decrypting
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {boolean} True if data appears to be valid encrypted birth date
 */
export function validateEncryptedData(encryptedData) {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return false;
    }

    // Check if it's valid base64
    const decoded = atob(encryptedData);
    const combined = new Uint8Array(
      decoded.split('').map(char => char.charCodeAt(0))
    );

    // Check minimum length (IV + some encrypted data + tag)
    const minLength = ENCRYPTION_CONFIG.ivLength + 10 + (ENCRYPTION_CONFIG.tagLength / 8);
    if (combined.length < minLength) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generates a secure random encryption key (for setup/testing purposes)
 * @returns {string} Random hex string suitable for use as encryption key
 */
export function generateEncryptionKey() {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  return Array.from(keyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a birth date to age without decrypting (for audit logs)
 * Note: This function exists for logging purposes and should only be used with encrypted data
 * @param {string} encryptedBirthDate - Encrypted birth date
 * @param {string} userId - User ID for decryption
 * @returns {Promise<number|null>} Age in years, or null if decryption fails
 */
export async function getAgeFromEncryptedBirthDate(encryptedBirthDate, userId) {
  try {
    const birthDate = await decryptBirthDate(encryptedBirthDate, userId);
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    // Don't log the error details to avoid exposing sensitive information
    return null;
  }
}

/**
 * Audit-safe birth date validation (doesn't log actual dates)
 * @param {string} encryptedBirthDate - Encrypted birth date
 * @param {string} userId - User ID for decryption
 * @param {number} minAge - Minimum required age (default: 13)
 * @returns {Promise<{isValid: boolean, age?: number, error?: string}>}
 */
export async function validateEncryptedBirthDateAge(encryptedBirthDate, userId, minAge = 13) {
  try {
    if (!validateEncryptedData(encryptedBirthDate)) {
      return { isValid: false, error: 'Invalid encrypted data format' };
    }

    const age = await getAgeFromEncryptedBirthDate(encryptedBirthDate, userId);

    if (age === null) {
      return { isValid: false, error: 'Failed to decrypt birth date' };
    }

    const isValid = age >= minAge;

    return {
      isValid,
      age: isValid ? age : undefined, // Only return age if validation passes
      error: isValid ? undefined : `User must be at least ${minAge} years old`
    };
  } catch (error) {
    return { isValid: false, error: 'Age validation failed' };
  }
}

// Export configuration for external use
export { ENCRYPTION_CONFIG };

// Default export with all encryption functions
export default {
  encryptBirthDate,
  decryptBirthDate,
  validateEncryptedData,
  generateEncryptionKey,
  getAgeFromEncryptedBirthDate,
  validateEncryptedBirthDateAge,
  ENCRYPTION_CONFIG,
};
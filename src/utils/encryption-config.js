/**
 * Encryption Configuration and Environment Setup
 * Centralizes encryption configuration and provides utilities for setup
 */

// Default encryption configuration
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  tagLength: 128,

  // Security settings
  keyDerivationIterations: 100000,
  minimumKeyLength: 32,

  // Environment variable names
  envVarNames: {
    client: 'VITE_BIRTH_DATE_ENCRYPTION_KEY',
    server: 'BIRTH_DATE_ENCRYPTION_KEY',
  },
};

/**
 * Validates encryption environment setup
 * @returns {Object} Validation result with success status and any errors
 */
export function validateEncryptionEnvironment() {
  const errors = [];
  const warnings = [];

  // Check if encryption key is configured
  const clientKey = import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY;

  if (!clientKey) {
    errors.push('VITE_BIRTH_DATE_ENCRYPTION_KEY environment variable is not set');
  } else {
    // Validate key length
    if (clientKey.length < ENCRYPTION_CONFIG.minimumKeyLength) {
      errors.push(`Encryption key must be at least ${ENCRYPTION_CONFIG.minimumKeyLength} characters long`);
    }

    // Check if key appears to be randomly generated
    if (clientKey === 'your-encryption-key-here' || clientKey.includes('example') || clientKey.includes('test')) {
      warnings.push('Encryption key appears to be a placeholder. Use a securely generated random key in production.');
    }
  }

  // Check browser compatibility
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    errors.push('Web Crypto API is not available. HTTPS is required for encryption features.');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    hasKey: !!clientKey,
    keyLength: clientKey ? clientKey.length : 0,
  };
}

/**
 * Generates a secure random encryption key for development/setup
 * @returns {string} Hex-encoded random key
 */
export function generateSecureKey() {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('Crypto API not available for key generation');
  }

  const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  return Array.from(keyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates that an encryption key meets security requirements
 * @param {string} key - The key to validate
 * @returns {Object} Validation result
 */
export function validateEncryptionKey(key) {
  const errors = [];

  if (!key) {
    errors.push('Key is required');
    return { valid: false, errors };
  }

  if (typeof key !== 'string') {
    errors.push('Key must be a string');
  }

  if (key.length < ENCRYPTION_CONFIG.minimumKeyLength) {
    errors.push(`Key must be at least ${ENCRYPTION_CONFIG.minimumKeyLength} characters long`);
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(password|123456|test|example)/i, // Common weak starts
    /^[a-zA-Z]+$/, // Only letters
    /^[0-9]+$/, // Only numbers
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(key)) {
      errors.push('Key appears to be weak. Use a randomly generated key.');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    entropy: calculateKeyEntropy(key),
  };
}

/**
 * Calculates approximate entropy of a key
 * @param {string} key - The key to analyze
 * @returns {number} Estimated entropy in bits
 */
function calculateKeyEntropy(key) {
  const charFreq = {};
  for (const char of key) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  let entropy = 0;
  const length = key.length;

  for (const freq of Object.values(charFreq)) {
    const probability = freq / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy * length;
}

/**
 * Checks if encryption is properly configured and ready to use
 * @returns {Promise<Object>} Configuration status
 */
export async function checkEncryptionReadiness() {
  const envValidation = validateEncryptionEnvironment();

  if (!envValidation.success) {
    return {
      ready: false,
      reason: 'Environment validation failed',
      ...envValidation,
    };
  }

  // Test basic encryption operations
  try {
    const { encryptBirthDate, decryptBirthDate } = await import('../services/encryption-service');

    const testDate = '1990-01-01';
    const testUserId = 'test@example.com';

    const encrypted = await encryptBirthDate(testDate, testUserId);
    const decrypted = await decryptBirthDate(encrypted, testUserId);

    if (decrypted !== testDate) {
      throw new Error('Encryption round-trip test failed');
    }

    return {
      ready: true,
      message: 'Encryption is properly configured and operational',
      ...envValidation,
    };
  } catch (error) {
    return {
      ready: false,
      reason: `Encryption test failed: ${error.message}`,
      ...envValidation,
    };
  }
}

/**
 * Development helper: Sets up encryption for development environment
 * This should only be used in development!
 */
export function setupDevelopmentEncryption() {
  if (import.meta.env.PROD) {
    throw new Error('setupDevelopmentEncryption should not be called in production');
  }

  const validation = validateEncryptionEnvironment();

  if (!validation.hasKey) {
    const newKey = generateSecureKey();
    console.warn('🔐 Generated new encryption key for development:');
    console.warn(`VITE_BIRTH_DATE_ENCRYPTION_KEY=${newKey}`);
    console.warn('Add this to your .env file and restart the development server.');
    return { key: newKey, action: 'generated' };
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Encryption warnings:', validation.warnings);
  }

  return { action: 'validated', ...validation };
}

/**
 * Production helper: Validates encryption setup for production deployment
 */
export function validateProductionEncryption() {
  const validation = validateEncryptionEnvironment();

  if (!validation.success) {
    throw new Error(`Production encryption validation failed: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Production encryption warnings:', validation.warnings);
  }

  // Additional production checks
  const clientKey = import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY;
  const keyValidation = validateEncryptionKey(clientKey);

  if (!keyValidation.valid) {
    throw new Error(`Production encryption key validation failed: ${keyValidation.errors.join(', ')}`);
  }

  if (keyValidation.entropy < 128) {
    console.warn('⚠️ Encryption key has low entropy. Consider generating a new random key.');
  }

  return {
    valid: true,
    entropy: keyValidation.entropy,
    message: 'Production encryption validated successfully',
  };
}

/**
 * Gets environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    hasEncryptionKey: !!import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY,

    // Security headers check (for HTTPS requirement)
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,

    // Browser compatibility
    hasCryptoAPI: typeof crypto !== 'undefined' && !!crypto.subtle,

    // Feature flags
    encryptionEnabled: !!import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY &&
                     typeof crypto !== 'undefined' &&
                     !!crypto.subtle,
  };
}

export default {
  ENCRYPTION_CONFIG,
  validateEncryptionEnvironment,
  generateSecureKey,
  validateEncryptionKey,
  checkEncryptionReadiness,
  setupDevelopmentEncryption,
  validateProductionEncryption,
  getEnvironmentConfig,
};
/**
 * Tests for Birth Date Encryption Service
 * Verifies COPPA compliance encryption implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  encryptBirthDate,
  decryptBirthDate,
  validateEncryptedData,
  generateEncryptionKey,
  getAgeFromEncryptedBirthDate,
  validateEncryptedBirthDateAge,
  ENCRYPTION_CONFIG,
} from '../encryption-service.js';

// Mock environment variable for testing
const TEST_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long-for-testing-purposes-secure';

// Setup test environment
beforeAll(() => {
  // Mock the import.meta.env for testing
  if (!import.meta.env) {
    import.meta.env = {};
  }
  import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

  // Ensure Web Crypto API is available in test environment
  if (typeof global !== 'undefined' && !global.crypto) {
    const { webcrypto } = require('node:crypto');
    global.crypto = webcrypto;
  }
});

afterAll(() => {
  // Clean up
  if (import.meta.env) {
    delete import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY;
  }
});

describe('Encryption Service Configuration', () => {
  it('should have correct configuration values', () => {
    expect(ENCRYPTION_CONFIG.algorithm).toBe('AES-GCM');
    expect(ENCRYPTION_CONFIG.keyLength).toBe(256);
    expect(ENCRYPTION_CONFIG.ivLength).toBe(12);
    expect(ENCRYPTION_CONFIG.tagLength).toBe(128);
  });

  it('should generate valid encryption keys', () => {
    const key = generateEncryptionKey();
    expect(key).toBeDefined();
    expect(typeof key).toBe('string');
    expect(key.length).toBe(64); // 32 bytes = 64 hex chars
    expect(/^[0-9a-f]+$/.test(key)).toBe(true);
  });

  it('should generate unique keys each time', () => {
    const key1 = generateEncryptionKey();
    const key2 = generateEncryptionKey();
    expect(key1).not.toBe(key2);
  });
});

describe('Birth Date Encryption/Decryption', () => {
  const testBirthDate = '1990-05-15';
  const testUserId = 'test@example.com';

  it('should encrypt and decrypt birth dates correctly', async () => {
    const encrypted = await encryptBirthDate(testBirthDate, testUserId);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(testBirthDate);

    const decrypted = await decryptBirthDate(encrypted, testUserId);
    expect(decrypted).toBe(testBirthDate);
  });

  it('should produce different encrypted values for the same date with different user IDs', async () => {
    const encrypted1 = await encryptBirthDate(testBirthDate, 'user1@example.com');
    const encrypted2 = await encryptBirthDate(testBirthDate, 'user2@example.com');

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should produce different encrypted values for the same date/user (due to random IV)', async () => {
    const encrypted1 = await encryptBirthDate(testBirthDate, testUserId);
    const encrypted2 = await encryptBirthDate(testBirthDate, testUserId);

    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same value
    const decrypted1 = await decryptBirthDate(encrypted1, testUserId);
    const decrypted2 = await decryptBirthDate(encrypted2, testUserId);
    expect(decrypted1).toBe(testBirthDate);
    expect(decrypted2).toBe(testBirthDate);
  });

  it('should fail to decrypt with wrong user ID', async () => {
    const encrypted = await encryptBirthDate(testBirthDate, testUserId);

    await expect(decryptBirthDate(encrypted, 'wrong@example.com')).rejects.toThrow();
  });

  it('should validate date format during encryption', async () => {
    await expect(encryptBirthDate('invalid-date', testUserId)).rejects.toThrow('Birth date must be in YYYY-MM-DD format');
    await expect(encryptBirthDate('1990/05/15', testUserId)).rejects.toThrow('Birth date must be in YYYY-MM-DD format');
    await expect(encryptBirthDate('', testUserId)).rejects.toThrow('Birth date is required for encryption');
  });

  it('should handle edge cases', async () => {
    const edgeCases = [
      '2000-02-29', // Leap year
      '1900-01-01', // Very old date
      '2020-12-31', // Recent date
    ];

    for (const date of edgeCases) {
      const encrypted = await encryptBirthDate(date, testUserId);
      const decrypted = await decryptBirthDate(encrypted, testUserId);
      expect(decrypted).toBe(date);
    }
  });
});

describe('Encrypted Data Validation', () => {
  it('should validate encrypted data format', async () => {
    const encrypted = await encryptBirthDate('1990-05-15', 'test@example.com');
    expect(validateEncryptedData(encrypted)).toBe(true);

    // Invalid cases
    expect(validateEncryptedData('')).toBe(false);
    expect(validateEncryptedData('not-base64!')).toBe(false);
    expect(validateEncryptedData('dGVzdA==')).toBe(false); // Valid base64 but too short
    expect(validateEncryptedData(null)).toBe(false);
    expect(validateEncryptedData(undefined)).toBe(false);
  });
});

describe('Age Calculation from Encrypted Data', () => {
  it('should calculate age from encrypted birth date', async () => {
    const birthDate = '1990-05-15';
    const userId = 'test@example.com';
    const encrypted = await encryptBirthDate(birthDate, userId);

    const age = await getAgeFromEncryptedBirthDate(encrypted, userId);

    // Calculate expected age
    const birth = new Date(birthDate);
    const today = new Date();
    let expectedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      expectedAge--;
    }

    expect(age).toBe(expectedAge);
  });

  it('should return null for invalid encrypted data', async () => {
    const age = await getAgeFromEncryptedBirthDate('invalid-data', 'test@example.com');
    expect(age).toBeNull();
  });

  it('should validate age from encrypted birth date', async () => {
    // Test with someone who is 25 (should pass 13+ requirement)
    const today = new Date();
    const birthDate25 = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const encrypted25 = await encryptBirthDate(birthDate25, 'adult@example.com');

    const validation25 = await validateEncryptedBirthDateAge(encrypted25, 'adult@example.com', 13);
    expect(validation25.isValid).toBe(true);
    expect(validation25.age).toBe(25);

    // Test with someone who is 10 (should fail 13+ requirement)
    const birthDate10 = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const encrypted10 = await encryptBirthDate(birthDate10, 'child@example.com');

    const validation10 = await validateEncryptedBirthDateAge(encrypted10, 'child@example.com', 13);
    expect(validation10.isValid).toBe(false);
    expect(validation10.age).toBeUndefined(); // Age not returned for failed validation
    expect(validation10.error).toContain('at least 13 years old');
  });
});

describe('Error Handling', () => {
  it('should handle missing encryption key gracefully', async () => {
    const originalKey = import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY;
    delete import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY;

    await expect(encryptBirthDate('1990-05-15', 'test@example.com')).rejects.toThrow('VITE_BIRTH_DATE_ENCRYPTION_KEY environment variable is required');

    // Restore key
    import.meta.env.VITE_BIRTH_DATE_ENCRYPTION_KEY = originalKey;
  });

  it('should handle corrupted encrypted data', async () => {
    const encrypted = await encryptBirthDate('1990-05-15', 'test@example.com');

    // Corrupt the data
    const corrupted = encrypted.slice(0, -5) + 'xxxxx';

    await expect(decryptBirthDate(corrupted, 'test@example.com')).rejects.toThrow();
  });

  it('should handle invalid base64 data', async () => {
    await expect(decryptBirthDate('not-valid-base64!', 'test@example.com')).rejects.toThrow();
  });
});

describe('Security Properties', () => {
  it('should use different IVs for each encryption', async () => {
    const encrypted1 = await encryptBirthDate('1990-05-15', 'test@example.com');
    const encrypted2 = await encryptBirthDate('1990-05-15', 'test@example.com');

    // Decrypt the base64 to compare raw bytes
    const bytes1 = new Uint8Array(atob(encrypted1).split('').map(c => c.charCodeAt(0)));
    const bytes2 = new Uint8Array(atob(encrypted2).split('').map(c => c.charCodeAt(0)));

    // IVs are the first 12 bytes - they should be different
    const iv1 = bytes1.slice(0, 12);
    const iv2 = bytes2.slice(0, 12);

    expect(Array.from(iv1)).not.toEqual(Array.from(iv2));
  });

  it('should fail authentication with tampered data', async () => {
    const encrypted = await encryptBirthDate('1990-05-15', 'test@example.com');

    // Tamper with the encrypted data (flip one bit)
    const bytes = new Uint8Array(atob(encrypted).split('').map(c => c.charCodeAt(0)));
    bytes[bytes.length - 1] ^= 1; // Flip last bit
    const tampered = btoa(String.fromCharCode(...bytes));

    await expect(decryptBirthDate(tampered, 'test@example.com')).rejects.toThrow();
  });

  it('should have minimum data size due to IV and authentication tag', async () => {
    const encrypted = await encryptBirthDate('1990-05-15', 'test@example.com');
    const bytes = new Uint8Array(atob(encrypted).split('').map(c => c.charCodeAt(0)));

    // Should have at least IV (12 bytes) + ciphertext (10 bytes for date) + tag (16 bytes)
    expect(bytes.length).toBeGreaterThanOrEqual(12 + 10 + 16);
  });
});

describe('Integration with Age Verification', () => {
  it('should work with the age verification workflow', async () => {
    const testEmail = 'test@example.com';

    // Simulate a user who is 20 years old
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate()).toISOString().split('T')[0];

    // Encrypt the birth date (simulating client-side encryption)
    const encryptedBirthDate = await encryptBirthDate(birthDate, testEmail);

    // Validate the encrypted data
    expect(validateEncryptedData(encryptedBirthDate)).toBe(true);

    // Calculate age from encrypted data (simulating server-side verification)
    const age = await getAgeFromEncryptedBirthDate(encryptedBirthDate, testEmail);
    expect(age).toBe(20);

    // Validate age requirement
    const validation = await validateEncryptedBirthDateAge(encryptedBirthDate, testEmail, 13);
    expect(validation.isValid).toBe(true);
    expect(validation.age).toBe(20);
  });
});
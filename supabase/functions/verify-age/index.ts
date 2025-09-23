// Age Verification Edge Function
// COPPA Compliance - Server-Side Age Verification with Encrypted Birth Date Support
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withCors } from "../../../src/utils/cors-config.ts"

// Encryption configuration (must match client-side)
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  tagLength: 128,
};

/**
 * Gets the master encryption key from environment
 */
function getMasterKey(): string {
  const masterKey = Deno.env.get('BIRTH_DATE_ENCRYPTION_KEY');
  if (!masterKey) {
    throw new Error('BIRTH_DATE_ENCRYPTION_KEY environment variable is required');
  }
  if (masterKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters long');
  }
  return masterKey;
}

/**
 * Derives encryption key from master key and salt (Deno version)
 */
async function deriveEncryptionKey(masterKey: string, salt: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(masterKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
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
    ['decrypt'] // Only need decrypt in edge function
  );
}

/**
 * Decrypts birth date (Deno version)
 */
async function decryptBirthDate(encryptedData: string, userEmail: string): Promise<string> {
  try {
    const masterKey = getMasterKey();
    const encryptionKey = await deriveEncryptionKey(masterKey, userEmail);

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength);
    const encrypted = combined.slice(ENCRYPTION_CONFIG.ivLength);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
        tagLength: ENCRYPTION_CONFIG.tagLength,
      },
      encryptionKey,
      encrypted
    );

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

interface AgeVerificationRequest {
  dateOfBirth?: string; // Plain text date (for backward compatibility)
  encryptedBirthDate?: string; // Encrypted birth date
  userEmail?: string; // For key derivation when decrypting
  minAge?: number;
}

interface AgeVerificationResponse {
  success: boolean;
  age?: number;
  error?: string;
  code?: string;
  message?: string;
}

/**
 * Calculates exact age with timezone safety
 */
function calculateAge(birthDateString: string): number | null {
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();

    // Validate date
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    // Normalize to UTC midnight to avoid timezone issues
    const birthUTC = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
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
}

/**
 * Validates date format and range
 */
function validateDateFormat(dateString: string): { isValid: boolean; error?: string } {
  if (!dateString) {
    return { isValid: false, error: 'Date of birth is required' };
  }

  try {
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

    // Check for leap year edge cases
    const month = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();

    // Verify February 29th is valid for leap years
    if (month === 1 && day === 29) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      if (!isLeapYear) {
        return { isValid: false, error: 'Invalid date: February 29th is not valid for non-leap years' };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
}

/**
 * Logs age verification attempts for compliance monitoring
 */
async function logVerificationAttempt(
  request: Request,
  dateOfBirth: string,
  age: number | null,
  success: boolean,
  reason?: string
) {
  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const origin = request.headers.get('origin') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Log to console (will appear in Supabase Edge Function logs)
  console.log(JSON.stringify({
    timestamp,
    event: 'age_verification_attempt',
    success,
    age,
    reason,
    userAgent,
    origin,
    ip: ip.split(',')[0], // Get first IP if forwarded
    dateOfBirth: dateOfBirth ? 'provided' : 'missing' // Don't log actual birth date for privacy
  }));
}

serve(withCors(async (req) => {

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed'
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { dateOfBirth, encryptedBirthDate, userEmail, minAge = 13 }: AgeVerificationRequest = await req.json();

    let actualBirthDate: string;
    let isEncrypted = false;

    // Validate input - either plain text or encrypted birth date required
    if (!dateOfBirth && !encryptedBirthDate) {
      await logVerificationAttempt(req, '', null, false, 'missing_birth_date_data');

      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_BIRTH_DATE',
          message: 'Date of birth is required',
          code: 'VALIDATION_ERROR'
        } as AgeVerificationResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle encrypted birth date
    if (encryptedBirthDate) {
      if (!userEmail) {
        await logVerificationAttempt(req, '', null, false, 'missing_user_email_for_decryption');

        return new Response(
          JSON.stringify({
            success: false,
            error: 'MISSING_USER_EMAIL',
            message: 'User email required for encrypted birth date verification',
            code: 'VALIDATION_ERROR'
          } as AgeVerificationResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      try {
        actualBirthDate = await decryptBirthDate(encryptedBirthDate, userEmail);
        isEncrypted = true;
      } catch (decryptionError) {
        await logVerificationAttempt(req, '', null, false, `decryption_failed: ${decryptionError.message}`);

        return new Response(
          JSON.stringify({
            success: false,
            error: 'DECRYPTION_FAILED',
            message: 'Failed to decrypt birth date',
            code: 'VALIDATION_ERROR'
          } as AgeVerificationResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // Use plain text birth date (backward compatibility)
      actualBirthDate = dateOfBirth!;
    }

    // Validate date format
    const formatValidation = validateDateFormat(actualBirthDate);
    if (!formatValidation.isValid) {
      await logVerificationAttempt(req, isEncrypted ? 'encrypted' : actualBirthDate, null, false, `invalid_format: ${formatValidation.error}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_DATE_FORMAT',
          message: formatValidation.error,
          code: 'VALIDATION_ERROR'
        } as AgeVerificationResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate age
    const age = calculateAge(actualBirthDate);

    if (age === null) {
      await logVerificationAttempt(req, isEncrypted ? 'encrypted' : actualBirthDate, null, false, 'age_calculation_failed');

      return new Response(
        JSON.stringify({
          success: false,
          error: 'AGE_CALCULATION_FAILED',
          message: 'Unable to calculate age from provided date',
          code: 'VALIDATION_ERROR'
        } as AgeVerificationResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check age requirement
    if (age < minAge) {
      await logVerificationAttempt(req, isEncrypted ? 'encrypted' : actualBirthDate, age, false, `under_age: ${age} < ${minAge}`);

      let message = `You must be at least ${minAge} years old to create an account`;

      // Special message for users who are exactly one year too young
      if (age === minAge - 1) {
        const birthDate = new Date(actualBirthDate);
        const today = new Date();
        const nextBirthday = new Date(birthDate);
        nextBirthday.setFullYear(today.getFullYear());

        // If birthday already passed this year, add one more year
        if (nextBirthday <= today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };
        const birthdayStr = nextBirthday.toLocaleDateString('en-US', options);

        message = `You'll be able to create an account on ${birthdayStr} when you turn ${minAge}`;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'COPPA_AGE_RESTRICTION',
          message,
          code: 'AGE_VERIFICATION_FAILED',
          age
        } as AgeVerificationResponse),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Success - user is old enough
    await logVerificationAttempt(req, isEncrypted ? 'encrypted' : actualBirthDate, age, true, 'verification_passed');

    return new Response(
      JSON.stringify({
        success: true,
        age,
        message: 'Age verification successful'
      } as AgeVerificationResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Age verification error:', error);

    await logVerificationAttempt(req, '', null, false, `server_error: ${error.message}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during age verification',
        code: 'SERVER_ERROR'
      } as AgeVerificationResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}, { secure: true })); // Use secure CORS headers for age verification endpoint
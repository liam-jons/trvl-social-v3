# Age Verification API Documentation

## Overview

The TRVL Social age verification system implements COPPA compliance by validating user ages through a multi-layered approach combining client-side and server-side validation with encrypted birth date storage.

## Architecture

```
Client Form → Age Verification Service → Edge Function → Database
     ↓              ↓                      ↓              ↓
Validation    Server Validation    Encryption/Decryption  Storage
```

## Endpoints

### 1. Age Verification Edge Function

**Endpoint:** `POST /functions/v1/verify-age`

#### Request Body

```json
{
  "dateOfBirth": "1995-06-15",          // Plain text date (YYYY-MM-DD)
  "encryptedBirthDate": "base64string", // Alternative: encrypted birth date
  "userEmail": "user@example.com",      // Required for encrypted dates
  "minAge": 13                          // Minimum age requirement (default: 13)
}
```

#### Success Response (200)

```json
{
  "success": true,
  "age": 28,
  "message": "Age verification successful"
}
```

#### Error Responses

##### Age Restriction (403)

```json
{
  "success": false,
  "error": "COPPA_AGE_RESTRICTION",
  "message": "You must be at least 13 years old to create an account",
  "code": "AGE_VERIFICATION_FAILED",
  "age": 12
}
```

##### Validation Error (400)

```json
{
  "success": false,
  "error": "INVALID_DATE_FORMAT",
  "message": "Please enter a valid date",
  "code": "VALIDATION_ERROR"
}
```

##### Server Error (500)

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An error occurred during age verification",
  "code": "SERVER_ERROR"
}
```

## Error Codes Reference

### Age Verification Errors

| Code | Description | Retryable | User Action |
|------|-------------|-----------|-------------|
| `COPPA_AGE_RESTRICTION` | User is under minimum age | No | Show age requirement message |
| `AGE_VERIFICATION_FAILED` | General age verification failure | No | Check date of birth |
| `INVALID_DATE_FORMAT` | Invalid date format provided | No | Fix date format |
| `MISSING_BIRTH_DATE` | No birth date provided | No | Provide birth date |
| `AGE_CALCULATION_FAILED` | Cannot calculate age | No | Check date validity |

### System Errors

| Code | Description | Retryable | User Action |
|------|-------------|-----------|-------------|
| `NETWORK_ERROR` | Connection failure | Yes | Retry request |
| `SERVER_ERROR` | Internal server error | Yes | Retry after delay |
| `SERVICE_UNAVAILABLE` | Service temporarily down | Yes | Retry later |
| `MAX_RETRIES_EXCEEDED` | All retry attempts failed | No | Try again later |

### Encryption Errors

| Code | Description | Retryable | User Action |
|------|-------------|-----------|-------------|
| `DECRYPTION_FAILED` | Cannot decrypt birth date | No | Contact support |
| `MISSING_USER_EMAIL` | Email required for decryption | No | Provide email |

## Client-Side Integration

### 1. Basic Age Verification

```javascript
import { comprehensiveAgeVerification } from '../services/age-verification-service';

const result = await comprehensiveAgeVerification('1995-06-15', 13);

if (result.success) {
  console.log('User age:', result.age);
  // Proceed with registration
} else {
  console.error('Age verification failed:', result.message);
  // Handle error based on result.error code
}
```

### 2. Error Handling with Retry

```javascript
import { getErrorMessage, isRetryableError } from '../utils/error-mapping';

const handleAgeVerification = async (dateOfBirth, maxRetries = 3) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const result = await comprehensiveAgeVerification(dateOfBirth, 13);

      if (result.success) {
        return result;
      }

      // Don't retry age-related errors
      if (!isRetryableError(result.error)) {
        throw new Error(getErrorMessage(result.error));
      }

      attempts++;
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    } catch (error) {
      if (attempts === maxRetries - 1) {
        throw error;
      }
      attempts++;
    }
  }
};
```

### 3. Form Integration

```javascript
const handleSubmit = async (formData) => {
  try {
    setLoading(true);
    setError(null);

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      role: formData.role,
    });

    if (result.success) {
      // Registration successful
      setRegistrationSuccess(true);
    } else {
      // Handle specific error types
      if (result.code === 'COPPA_AGE_RESTRICTION') {
        setErrors(prev => ({ ...prev, ageError: result.error }));
      } else if (isRetryableError(result.code)) {
        setErrors(prev => ({ ...prev, networkError: result.error }));
        setShowRetryOption(true);
      } else {
        setErrors(prev => ({ ...prev, serverError: result.error }));
      }
    }
  } catch (error) {
    setErrors(prev => ({ ...prev, generalError: getErrorMessage(error) }));
  } finally {
    setLoading(false);
  }
};
```

## Compliance Logging

### Logged Events

The system automatically logs the following events for COPPA compliance:

1. **Age Verification Attempts**
   - Successful verifications
   - Failed verifications
   - Underage attempts
   - Encryption/decryption failures

2. **Registration Events**
   - Successful registrations
   - Failed registrations
   - Age verification status

### Log Structure

```json
{
  "event_type": "age_verification_attempt",
  "event_data": {
    "result": "success|failure",
    "calculated_age": 28,
    "error_code": "COPPA_AGE_RESTRICTION",
    "was_encrypted": true,
    "is_underage": false
  },
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "origin": "https://trvl-social.com",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "session_id": "uuid-v4",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Privacy Protection

- Birth dates are never logged in plain text
- Email addresses are hashed using SHA-256
- User agents are truncated to remove sensitive information
- IP addresses are logged only for abuse detection

## Testing Scenarios

### 1. Valid Age Testing

```javascript
// Test user over 13
const result = await verifyAge('1995-06-15', 13);
expect(result.success).toBe(true);
expect(result.age).toBeGreaterThanOrEqual(13);

// Test user exactly 13
const birthDate = new Date();
birthDate.setFullYear(birthDate.getFullYear() - 13);
const result = await verifyAge(birthDate.toISOString().split('T')[0], 13);
expect(result.success).toBe(true);
```

### 2. Underage Testing

```javascript
// Test user under 13
const result = await verifyAge('2015-06-15', 13);
expect(result.success).toBe(false);
expect(result.error).toBe('COPPA_AGE_RESTRICTION');
expect(result.age).toBeLessThan(13);
```

### 3. Invalid Date Testing

```javascript
// Test invalid date format
const result = await verifyAge('invalid-date', 13);
expect(result.success).toBe(false);
expect(result.error).toBe('INVALID_DATE_FORMAT');

// Test future date
const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const result = await verifyAge(futureDate.toISOString().split('T')[0], 13);
expect(result.success).toBe(false);
```

### 4. Encryption Testing

```javascript
// Test encrypted birth date verification
const encrypted = await encryptBirthDate('1995-06-15', 'user@example.com');
const result = await verifyAge(null, 13, encrypted, 'user@example.com');
expect(result.success).toBe(true);
```

### 5. Network Failure Testing

```javascript
// Simulate network failure
jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
const result = await verifyAge('1995-06-15', 13);
expect(result.success).toBe(false);
expect(result.error).toBe('NETWORK_ERROR');
```

## Rate Limiting

- **Age Verification:** 10 requests per minute per IP
- **Registration:** 3 attempts per 15 minutes per IP
- **Underage Attempts:** Tracked for compliance monitoring

## Security Considerations

### 1. Birth Date Encryption

- Uses AES-GCM with 256-bit keys
- User email as salt for key derivation
- PBKDF2 with 100,000 iterations
- Encrypted data stored in base64 format

### 2. Input Validation

- Server-side validation of all inputs
- Date format validation (YYYY-MM-DD)
- Range validation (120 years max age)
- Leap year validation

### 3. Error Information Disclosure

- Error messages are user-friendly and don't expose system details
- Detailed errors logged server-side only
- Consistent error structure across all endpoints

## Monitoring and Alerts

### Metrics to Monitor

1. **Age Verification Success Rate**
   - Target: >95% for valid dates
   - Alert: <90% success rate

2. **Underage Attempt Rate**
   - Monitor for unusual patterns
   - Alert: >10% underage attempts per hour

3. **Encryption Failure Rate**
   - Target: <1% failures
   - Alert: >5% encryption failures

4. **Response Time**
   - Target: <500ms for age verification
   - Alert: >2s response time

### Compliance Reporting

Monthly compliance reports include:
- Total verification attempts
- Underage attempts blocked
- System availability metrics
- Data encryption status

## Migration Guide

### From Plain Text to Encrypted Storage

1. **Phase 1:** Deploy encryption capability (backward compatible)
2. **Phase 2:** Update registration to use encryption
3. **Phase 3:** Migrate existing plain text dates
4. **Phase 4:** Remove plain text support

### API Version Compatibility

- v1: Plain text birth dates only
- v2: Supports both plain text and encrypted (current)
- v3: Encrypted only (planned)

## Support and Troubleshooting

### Common Issues

1. **"Age calculation failed"**
   - Check date format (YYYY-MM-DD)
   - Verify date is not in future
   - Ensure valid calendar date

2. **"Decryption failed"**
   - Verify email matches encryption email
   - Check environment variables
   - Validate encrypted data format

3. **"Service unavailable"**
   - Check edge function deployment
   - Verify environment variables
   - Monitor function logs

### Debug Mode

Enable debug logging by setting `DEBUG_AGE_VERIFICATION=true` in environment:

```javascript
// Additional logging in debug mode
if (process.env.DEBUG_AGE_VERIFICATION) {
  console.log('Age verification debug info:', {
    dateOfBirth: 'provided',
    encryptionStatus: 'encrypted',
    calculatedAge: result.age
  });
}
```

---

**Last Updated:** 2024-01-15
**Version:** 2.0
**Maintainer:** TRVL Social Engineering Team
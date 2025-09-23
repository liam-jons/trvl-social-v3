# Server-Side Age Verification Implementation

## Overview

This implementation provides robust server-side age verification for COPPA compliance, ensuring users are at least 13 years old before account creation. The system includes multiple layers of protection to prevent client-side bypass attempts.

## Architecture

### 1. Supabase Edge Function (`/supabase/functions/verify-age/index.ts`)

**Purpose**: Primary server-side age verification logic
**Endpoint**: `https://your-project.supabase.co/functions/v1/verify-age`

**Features**:
- Validates date format and range (not future, not > 120 years old)
- Calculates age with timezone safety
- Handles leap year edge cases
- Logs verification attempts for compliance
- Returns standardized error codes
- CORS support for browser requests

**Request Format**:
```json
{
  "dateOfBirth": "YYYY-MM-DD",
  "minAge": 13
}
```

**Response Format**:
```json
{
  "success": boolean,
  "age": number,
  "error": string,
  "message": string,
  "code": string
}
```

**Error Codes**:
- `COPPA_AGE_RESTRICTION`: User is under minimum age
- `INVALID_DATE_FORMAT`: Invalid date provided
- `VALIDATION_ERROR`: General validation failure
- `SERVER_ERROR`: Internal server error

### 2. Age Verification Service (`/src/services/age-verification-service.js`)

**Purpose**: Client-side service to interact with Edge Function

**Key Functions**:
- `verifyAgeServerSide()`: Basic server verification
- `verifyAgeWithRetry()`: Verification with retry logic for network failures
- `comprehensiveAgeVerification()`: Combined client + server validation

**Retry Logic**:
- Maximum 3 attempts for network/server errors
- Exponential backoff (1s, 2s, 4s delays)
- No retry for age verification failures or validation errors

### 3. Database Protection (`/supabase/migrations/20250920081000_add_age_verification_constraints.sql`)

**Purpose**: Database-level protection against direct manipulation

**Features**:
- CHECK constraint: `date_part('year', age(date_of_birth)) >= 13`
- Updated `handle_new_user()` function to extract `date_of_birth` from metadata
- `validate_age_on_update()` trigger for profile updates
- Age verification logs table for compliance monitoring

### 4. Updated Registration Flow

**AuthStore Changes** (`/src/stores/authStore.js`):
- Calls `comprehensiveAgeVerification()` before `auth.signUp()`
- Includes `date_of_birth` in user metadata
- Handles age verification error codes

**RegisterForm Changes** (`/src/components/auth/RegisterForm.jsx`):
- Displays server-side age verification errors
- Maintains existing client-side validation
- Passes `dateOfBirth` to signUp function

## Security Features

### Multi-Layer Protection

1. **Client-Side Validation**: Immediate feedback, user experience
2. **Server-Side Edge Function**: Cannot be bypassed by client manipulation
3. **Database Constraints**: Final protection against direct database access
4. **Database Triggers**: Validates updates to existing profiles

### Logging and Compliance

- All verification attempts logged with timestamps
- Failed attempts logged with reasons
- Compliance monitoring through database logs
- No sensitive data (actual birth dates) in logs

### Error Handling

- Standardized error codes across all layers
- User-friendly error messages
- Retry logic for network failures
- Fallback handling for server unavailability

## Usage Examples

### Basic Age Verification

```javascript
import { verifyAgeServerSide } from '../services/age-verification-service';

const result = await verifyAgeServerSide('2000-01-01', 13);
if (result.success) {
  console.log('User is', result.age, 'years old');
} else {
  console.error('Verification failed:', result.message);
}
```

### Comprehensive Verification (Recommended)

```javascript
import { comprehensiveAgeVerification } from '../services/age-verification-service';

const result = await comprehensiveAgeVerification('2000-01-01', 13);
console.log('Client valid:', result.clientValid);
console.log('Server valid:', result.serverValid);
console.log('Overall success:', result.success);
```

### Integration in Registration

```javascript
const signUp = async (userData) => {
  const ageVerification = await comprehensiveAgeVerification(
    userData.dateOfBirth,
    13
  );

  if (!ageVerification.success) {
    throw new Error(ageVerification.message);
  }

  // Proceed with actual registration
  return await auth.signUp(userData);
};
```

## Testing

### Test Coverage

- ✅ Valid age verification (13+)
- ✅ Underage rejection (< 13)
- ✅ Edge cases (exactly 13, leap years)
- ✅ Invalid date formats
- ✅ Network failure retry logic
- ✅ Server error handling
- ✅ Client-side validation integration

### Manual Testing Scenarios

1. **Valid Registration**: Birth date > 13 years ago
2. **Underage Rejection**: Birth date < 13 years ago
3. **Edge Case**: Exactly 13 years old today
4. **Invalid Dates**: Future dates, invalid formats
5. **Leap Years**: February 29th on leap/non-leap years
6. **Server Bypass Attempts**: Direct API calls, client manipulation

### Test Data

```javascript
// Valid test cases
'1990-01-01' // Valid adult
'2010-01-01' // Valid 13+ year old

// Invalid test cases
'2020-01-01' // Too young
'2025-01-01' // Future date
'2021-02-29' // Invalid leap year date
'invalid-date' // Invalid format
```

## Deployment

### Prerequisites

1. Supabase project with Edge Functions enabled
2. Environment variables configured for functions
3. Database migrations applied
4. RLS policies configured

### Deployment Steps

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy verify-age
   ```

2. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

3. **Update Environment Variables**:
   - Ensure function URLs are accessible from client
   - Configure CORS policies if needed

4. **Test Integration**:
   - Test registration flow end-to-end
   - Verify error handling
   - Check database constraints

## Monitoring

### Key Metrics

- Age verification success rate
- Failed verification reasons
- Server response times
- Database constraint violations

### Log Monitoring

```sql
-- Check recent verification attempts
SELECT
  verification_date,
  verification_result,
  calculated_age,
  error_reason
FROM age_verification_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Monitor underage registration attempts
SELECT
  DATE(created_at) as date,
  COUNT(*) as attempts,
  COUNT(CASE WHEN verification_result = false THEN 1 END) as rejections
FROM age_verification_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Alerts

Consider setting up alerts for:
- High failure rates (> 10% within 1 hour)
- Repeated underage attempts from same IP
- Server errors in Edge Function
- Database constraint violations

## Compliance Notes

### COPPA Compliance

- ✅ Server-side age verification prevents client bypass
- ✅ Minimum age of 13 enforced at multiple layers
- ✅ Verification attempts logged for audit trails
- ✅ No collection of personal data for underage users

### Privacy Considerations

- Date of birth stored securely in database
- Verification logs don't contain actual birth dates
- User-friendly error messages without exposing system details
- Compliance with data retention policies

### Legal Requirements

- Clear disclosure of age requirements in UI
- Terms of service updated to reflect age restrictions
- Privacy policy covers age verification process
- Data handling procedures documented

## Troubleshooting

### Common Issues

1. **Edge Function Timeout**:
   - Check function logs in Supabase dashboard
   - Verify network connectivity
   - Consider increasing timeout limits

2. **Database Constraint Violations**:
   - Check migration status
   - Verify constraint syntax
   - Test with sample data

3. **Client-Server Mismatch**:
   - Ensure consistent date formats
   - Check timezone handling
   - Verify API endpoints

### Debug Commands

```bash
# Check function logs
supabase functions logs verify-age

# Test function locally
supabase functions serve --env-file .env.local

# Test database constraints
psql -c "SELECT * FROM age_verification_logs LIMIT 10;"
```

## Future Enhancements

### Potential Improvements

1. **Enhanced Logging**: Integration with external monitoring services
2. **Rate Limiting**: Prevent spam verification attempts
3. **Geolocation**: Country-specific age requirements
4. **Analytics**: Detailed verification metrics dashboard
5. **Caching**: Cache verification results for performance

### Maintenance

- Regular monitoring of logs and metrics
- Periodic testing of all verification paths
- Updates for new legal requirements
- Performance optimization based on usage patterns
# Supabase Edge Functions CORS Configuration

This document outlines how to configure CORS policies for Supabase Edge Functions to ensure secure cross-origin access.

## Overview

Supabase Edge Functions require proper CORS configuration to prevent unauthorized cross-origin requests. Our implementation uses both code-level CORS handling and platform-level configuration.

## Code-Level CORS Implementation

All Edge Functions now use the `withCors` wrapper from `/src/utils/cors-config.ts`:

```typescript
import { withCors } from "../../../src/utils/cors-config.ts"

serve(withCors(async (req) => {
  // Your function logic here
}, { secure: true })); // Use secure headers for production
```

This provides:
- Origin validation against `ALLOWED_ORIGINS` environment variable
- Automatic preflight request handling
- Security headers for enhanced protection
- CORS violation logging

## Platform-Level Configuration

### Via Supabase CLI

Configure CORS policies for Edge Functions using the Supabase CLI:

```bash
# Set allowed origins for a specific function
supabase functions config set \
  --function-name verify-age \
  --cors-origins "https://trvlsocial.com,https://www.trvlsocial.com"

# Verify configuration
supabase functions config get --function-name verify-age
```

### Via Supabase Dashboard

1. Go to Supabase Dashboard > Edge Functions
2. Select your function (e.g., `verify-age`)
3. Navigate to Settings tab
4. Configure CORS settings:
   - **Allowed Origins**: `https://trvlsocial.com,https://www.trvlsocial.com`
   - **Allowed Methods**: `GET, POST, OPTIONS`
   - **Allowed Headers**: `Content-Type, Authorization, X-Client-Info, ApiKey`
   - **Allow Credentials**: `true`

## Environment Configuration

Edge Functions use environment variables for CORS configuration:

```bash
# Development
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

# Production
ALLOWED_ORIGINS="https://trvlsocial.com,https://www.trvlsocial.com"
```

Set these in Supabase Dashboard > Project Settings > Environment Variables.

## Security Considerations

### 1. No Wildcard Origins
- ❌ Never use `*` for origins in production
- ✅ Always specify exact domains

### 2. Minimal Allowed Origins
- Only include domains that actually need access
- Regularly audit and remove unused origins

### 3. Secure Headers
- Use `secure: true` option in `withCors` for production functions
- Implements additional security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'self'`

### 4. CORS Violation Monitoring
- All unauthorized access attempts are logged
- Monitor logs for potential security threats
- Set up alerts for repeated violations

## Testing CORS Configuration

### 1. Automated Testing
```bash
# Test all functions with current configuration
npm run test:cors

# Test production configuration
npm run test:cors:production
```

### 2. Manual Testing
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://trvlsocial.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://your-project.supabase.co/functions/v1/verify-age

# Test actual request
curl -X POST \
  -H "Origin: https://trvlsocial.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"test": true}' \
  https://your-project.supabase.co/functions/v1/verify-age
```

### 3. Browser Testing
```javascript
// Test from browser console
fetch('https://your-project.supabase.co/functions/v1/verify-age', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ test: true })
})
.then(response => {
  console.log('Status:', response.status);
  console.log('CORS headers:', {
    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods')
  });
})
.catch(error => console.error('CORS Error:', error));
```

## Deployment Checklist

Before deploying Edge Functions to production:

- [ ] Verify `ALLOWED_ORIGINS` environment variable is set correctly
- [ ] Confirm all functions use `withCors` wrapper
- [ ] Test CORS configuration with production domains
- [ ] Verify no wildcard origins remain in code
- [ ] Enable CORS violation monitoring
- [ ] Document any function-specific CORS requirements

## Troubleshooting

### Common Issues

1. **CORS Error: "Access blocked by CORS policy"**
   - Check if origin is in `ALLOWED_ORIGINS`
   - Verify environment variables are set correctly
   - Ensure preflight requests are handled

2. **Function Returns 403 for Valid Origins**
   - Check case sensitivity in origin URLs
   - Verify HTTPS vs HTTP protocol matches
   - Confirm no trailing slashes in origin configuration

3. **OPTIONS Request Timing Out**
   - Ensure `withCors` wrapper is properly implemented
   - Check if platform-level CORS is conflicting
   - Verify function deployment is successful

### Debug Mode

Enable debug logging in development:

```typescript
import { withCors } from "../../../src/utils/cors-config.ts"

serve(withCors(async (req) => {
  console.log('Request origin:', req.headers.get('origin'));
  console.log('Request method:', req.method);
  // Your function logic
}, { secure: false })); // Debug mode for development
```

## Best Practices

1. **Environment-Specific Configuration**
   - Use different origins for dev/staging/production
   - Test thoroughly in each environment

2. **Monitoring and Alerting**
   - Set up monitoring for CORS violations
   - Alert on repeated unauthorized access attempts

3. **Regular Security Audits**
   - Review allowed origins quarterly
   - Remove unused or outdated domains
   - Update CORS policies when domains change

4. **Documentation**
   - Document all allowed origins and their purposes
   - Maintain change log for CORS policy updates
   - Share configuration with team members

## Related Files

- `/src/utils/cors-config.ts` - TypeScript CORS utility for Edge Functions
- `/src/utils/cors-config.js` - JavaScript CORS utility for API routes
- `/scripts/test-cors.js` - Comprehensive CORS testing script
- `/scripts/test-cors-simple.js` - Quick CORS validation script
- `/supabase/functions/verify-age/index.ts` - Example implementation
# Environment Variable Migration Guide

This guide provides step-by-step instructions for migrating from direct `import.meta.env` usage to the new type-safe environment validation system using `src/env.js`.

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Migration Overview](#migration-overview)
- [Step-by-Step Migration](#step-by-step-migration)
- [Code Examples](#code-examples)
- [Files Requiring Migration](#files-requiring-migration)
- [Common Patterns](#common-patterns)
- [Testing Your Migration](#testing-your-migration)
- [Troubleshooting](#troubleshooting)

## Why Migrate?

### Benefits of Type-Safe Environment Variables

**Before** (Direct `import.meta.env` access):
```javascript
// ❌ No validation - fails at runtime if missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// ❌ No type safety - could be undefined
const apiKey = import.meta.env.VITE_API_KEY;

// ❌ Typos not caught until runtime
const url = import.meta.env.VITE_SUPABSE_URL; // Typo!
```

**After** (Type-safe `env` object):
```javascript
// ✅ Validation at build time
// ✅ TypeScript autocompletion
// ✅ Fails fast with clear error messages
import { env } from '@/env.js';

const supabaseUrl = env.VITE_SUPABASE_URL;
const apiKey = env.VITE_API_KEY;
```

### Key Advantages

1. **Build-Time Validation**: Catch missing environment variables before deployment
2. **Type Safety**: Full TypeScript support with autocomplete
3. **Clear Error Messages**: Know exactly which variable is missing or invalid
4. **Centralized Configuration**: Single source of truth for all environment variables
5. **Better Developer Experience**: IDE autocomplete for all environment variables

## Migration Overview

### Migration Strategy

1. **Identify** all files using `import.meta.env` or `process.env`
2. **Update** each file to import and use the `env` object
3. **Test** that the application still works correctly
4. **Verify** no runtime errors related to environment variables

### Migration Phases

**Phase 1: Core Services** (Priority)
- Database configuration (`lib/supabase.js`)
- Payment services (`services/stripe-service.js`)
- Authentication services

**Phase 2: Application Services**
- Analytics and monitoring
- AI services
- Email services
- Third-party integrations

**Phase 3: Components and Pages**
- React components using environment variables
- Configuration files
- Utility functions

## Step-by-Step Migration

### Step 1: Identify Files to Migrate

Use grep to find all files with environment variable usage:

```bash
# Find all files using import.meta.env
grep -r "import\.meta\.env" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Find all files using process.env
grep -r "process\.env" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

Current files requiring migration: **~40 files**

### Step 2: Update Individual Files

For each file identified:

1. **Add the import**:
   ```javascript
   import { env } from '@/env.js';
   ```

2. **Replace all occurrences**:
   - `import.meta.env.VITE_*` → `env.VITE_*`
   - `process.env.*` → `env.*`

3. **Remove any fallback logic** (now handled by validation):
   ```javascript
   // Before
   const apiKey = import.meta.env.VITE_API_KEY || 'default';

   // After
   const apiKey = env.VITE_API_KEY; // Validation ensures it exists
   ```

4. **Test the file** individually if possible

### Step 3: Verify the Migration

After migrating each file:

```bash
# Run the development server
npm run dev

# Run tests
npm run test

# Build the application
npm run build
```

### Step 4: Remove Old Patterns

Search for any remaining direct environment variable access:

```bash
# Should return no results after migration
grep -r "import\.meta\.env\." src/ --include="*.js" --include="*.jsx"
```

## Code Examples

### Example 1: Simple Service File

**Before**:
```javascript
// src/services/analytics-service.js
class AnalyticsService {
  constructor() {
    this.ga4Id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    this.mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;
  }

  initialize() {
    if (this.ga4Id) {
      // Initialize GA4
    }
  }
}
```

**After**:
```javascript
// src/services/analytics-service.js
import { env } from '@/env.js';

class AnalyticsService {
  constructor() {
    this.ga4Id = env.VITE_GA4_MEASUREMENT_ID;
    this.mixpanelToken = env.VITE_MIXPANEL_TOKEN;
  }

  initialize() {
    // Optional variables are typed as string | undefined
    if (this.ga4Id) {
      // Initialize GA4
    }
  }
}
```

### Example 2: Configuration Object

**Before**:
```javascript
// src/config/supabase-config.js
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
};
```

**After**:
```javascript
// src/config/supabase-config.js
import { env } from '@/env.js';

export const supabaseConfig = {
  url: env.VITE_SUPABASE_URL,
  anonKey: env.VITE_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
};
```

### Example 3: React Component

**Before**:
```javascript
// src/components/common/ErrorBoundary.jsx
import { useEffect } from 'react';

function ErrorBoundary({ children }) {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  useEffect(() => {
    if (sentryDsn) {
      // Initialize Sentry
    }
  }, [sentryDsn]);

  return <>{children}</>;
}
```

**After**:
```javascript
// src/components/common/ErrorBoundary.jsx
import { useEffect } from 'react';
import { env } from '@/env.js';

function ErrorBoundary({ children }) {
  useEffect(() => {
    if (env.VITE_SENTRY_DSN) {
      // Initialize Sentry
    }
  }, []);

  return <>{children}</>;
}
```

### Example 4: Conditional Logic

**Before**:
```javascript
// src/utils/feature-flags.js
export function isFeatureEnabled(featureName) {
  const envVar = `VITE_FEATURE_${featureName}`;
  return import.meta.env[envVar] === 'true';
}
```

**After**:
```javascript
// src/utils/feature-flags.js
import { env } from '@/env.js';

export function isFeatureEnabled(featureName) {
  // Access specific feature flags directly
  switch (featureName) {
    case 'VENDOR_FORUM_V2':
      return env.VITE_FEATURE_VENDOR_FORUM_V2 === 'true';
    case 'GROUP_VIDEO_CALLS':
      return env.VITE_FEATURE_GROUP_VIDEO_CALLS === 'true';
    case 'AI_RECOMMENDATIONS':
      return env.VITE_FEATURE_AI_RECOMMENDATIONS === 'true';
    case 'BETA':
      return env.VITE_FEATURE_BETA === 'true';
    default:
      return false;
  }
}
```

### Example 5: Service Initialization

**Before**:
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**After**:
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { env } from '@/env.js';

// No need for manual validation - env.js handles it
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);
```

### Example 6: Test Files

**Before**:
```javascript
// src/services/__tests__/encryption-service.test.js
describe('EncryptionService', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('should encrypt data', () => {
    const service = new EncryptionService();
    // ...
  });
});
```

**After**:
```javascript
// src/services/__tests__/encryption-service.test.js
import { env } from '@/env.js';

describe('EncryptionService', () => {
  it('should encrypt data', () => {
    // env object is already available and validated
    const service = new EncryptionService();
    // ...
  });
});
```

## Files Requiring Migration

### High Priority (Core Infrastructure)

1. **Database & Storage**:
   - `/src/lib/supabase.js` - Supabase client initialization
   - `/src/services/image-asset-service.js` - Image storage
   - `/src/test-db-connection.js` - Database testing

2. **Payment Processing**:
   - `/src/services/stripe-service.js` - Stripe integration
   - `/src/services/invoice-service.js` - Invoice generation
   - `/src/components/booking/PaymentPage.jsx` - Payment UI
   - `/src/components/booking/MultiCurrencyPayment.jsx` - Multi-currency

3. **Authentication & Security**:
   - `/src/utils/encryption-config.js` - Encryption configuration
   - `/src/services/encryption-service.js` - Encryption service

### Medium Priority (Application Services)

4. **Analytics & Monitoring**:
   - `/src/services/monitoring-manager.js` - Monitoring orchestration
   - `/src/services/sentry-service.js` - Error tracking
   - `/src/services/google-analytics-service.js` - Analytics
   - `/src/services/mixpanel-service.js` - Product analytics
   - `/src/services/datadog-service.js` - Application monitoring
   - `/src/services/analytics-service.js` - Analytics aggregation

5. **AI & ML Services**:
   - `/src/services/ai-service.js` - AI service integration
   - `/src/services/nlp-service.js` - Natural language processing
   - `/src/services/explanation-generator.js` - AI explanations

6. **Communication**:
   - `/src/services/whatsapp-service.js` - WhatsApp integration
   - `/src/services/booking-chat-service.js` - Booking chat

7. **Third-Party Integrations**:
   - `/src/services/location-service.js` - Location services
   - `/src/services/currency-service.js` - Currency conversion
   - `/src/contexts/MapboxContext.jsx` - Mapbox maps

### Lower Priority (Components & Utilities)

8. **React Components**:
   - `/src/components/common/ErrorBoundaryWrapper.jsx` - Error boundary
   - `/src/components/vendor/adventures/MediaUpload.jsx` - Media upload
   - `/src/pages/TestCompatibilityPage.jsx` - Test page

9. **Utilities & Config**:
   - `/src/utils/logger.js` - Logging utility
   - `/src/services/api-service.js` - API client

10. **Test Files**:
    - `/src/services/__tests__/encryption-service.test.js`
    - `/src/services/ai-service.test.js`
    - `/src/utils/personality-calculator.test.js`
    - `/src/test/setup.js`

## Common Patterns

### Pattern 1: Optional Environment Variables

When a variable is optional (marked with `.optional()` in schema):

```javascript
import { env } from '@/env.js';

// Optional variables are typed as string | undefined
if (env.VITE_SENTRY_DSN) {
  initializeSentry(env.VITE_SENTRY_DSN);
}
```

### Pattern 2: Feature Flags

```javascript
import { env } from '@/env.js';

// Feature flags are enum types: 'true' | 'false' | undefined
const isEnabled = env.VITE_FEATURE_BETA === 'true';

if (isEnabled) {
  // Show beta features
}
```

### Pattern 3: Environment-Specific Logic

```javascript
import { env } from '@/env.js';

const isDevelopment = env.NODE_ENV === 'development';
const isProduction = env.NODE_ENV === 'production';

if (isDevelopment) {
  console.log('Debug info:', env.VITE_SUPABASE_URL);
}
```

### Pattern 4: Default Values

For optional variables that need defaults:

```javascript
import { env } from '@/env.js';

// If variable has .default() in schema, it's never undefined
const appName = env.VITE_APP_NAME; // Always string, defaults to 'TRVL Social'

// For truly optional variables, use ?? operator
const customEndpoint = env.VITE_CUSTOM_ENDPOINT ?? 'https://default-api.com';
```

### Pattern 5: Conditional Initialization

```javascript
import { env } from '@/env.js';

class MonitoringService {
  constructor() {
    // Initialize only if DSN is provided
    if (env.VITE_SENTRY_DSN) {
      this.sentry = initializeSentry({
        dsn: env.VITE_SENTRY_DSN,
        environment: env.VITE_SENTRY_ENVIRONMENT,
      });
    }
  }
}
```

## Testing Your Migration

### Unit Tests

Ensure tests work with the new env system:

```javascript
// src/services/__tests__/stripe-service.test.js
import { describe, it, expect } from 'vitest';
import { env } from '@/env.js';
import StripeService from '../stripe-service';

describe('StripeService', () => {
  it('should initialize with environment variables', () => {
    const service = new StripeService();
    expect(service.publishableKey).toBe(env.VITE_STRIPE_PUBLISHABLE_KEY);
  });
});
```

### Integration Tests

Test that services initialize correctly:

```bash
# Start dev server and verify no errors
npm run dev

# Check browser console for environment-related errors
# Navigate to key features and verify functionality
```

### Build Tests

Ensure production builds work:

```bash
# Build should succeed
npm run build

# Verify environment validation runs
# Check dist/ output for correct variable substitution
```

### Validation Tests

Test that validation catches missing variables:

```bash
# Temporarily remove a required variable from .env.local
# VITE_SUPABASE_URL=...  # Comment this out

# Start dev server - should fail with clear error
npm run dev

# Expected output:
# Environment validation failed:
# {
#   VITE_SUPABASE_URL: [ 'Required' ]
# }
```

## Troubleshooting

### Error: "Cannot find module '@/env.js'"

**Solution**: Verify Vite path alias configuration in `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Error: "Property does not exist on type 'env'"

**Solution**: Ensure the variable is defined in `src/env.js` schema:

```javascript
export const env = createEnv({
  client: {
    // Add your variable here
    VITE_YOUR_VARIABLE: z.string().optional(),
  },
  runtimeEnv: {
    // Map it to import.meta.env
    VITE_YOUR_VARIABLE: import.meta.env.VITE_YOUR_VARIABLE,
  },
});
```

### Error: "Environment validation failed"

**Solution**:
1. Check which variable is missing in the error message
2. Add it to `.env.local`
3. Restart the dev server

### Variable is `undefined` at runtime

**Checklist**:
- [ ] Variable is in `.env.local`
- [ ] Variable starts with `VITE_` for client-side access
- [ ] Variable is in `src/env.js` schema
- [ ] Variable is in `runtimeEnv` mapping
- [ ] Dev server was restarted after changes

### TypeScript errors after migration

**Solution**: Ensure `src/env.js` is imported before other code:

```javascript
// src/main.jsx or src/main.tsx
import './env.js'; // Import first
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
```

## Migration Checklist

Use this checklist to track your migration progress:

### Phase 1: Core Services
- [ ] `/src/lib/supabase.js`
- [ ] `/src/services/stripe-service.js`
- [ ] `/src/utils/encryption-config.js`
- [ ] `/src/services/encryption-service.js`

### Phase 2: Application Services
- [ ] `/src/services/monitoring-manager.js`
- [ ] `/src/services/sentry-service.js`
- [ ] `/src/services/google-analytics-service.js`
- [ ] `/src/services/ai-service.js`
- [ ] `/src/services/whatsapp-service.js`

### Phase 3: Components
- [ ] All React components using `import.meta.env`
- [ ] All utility files using `import.meta.env`
- [ ] All test files using `process.env`

### Phase 4: Verification
- [ ] No files contain `import.meta.env.VITE_`
- [ ] No files contain `process.env.` (except for Node.js scripts outside src/)
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully
- [ ] All tests pass
- [ ] Application functions correctly in browser

## Best Practices

1. **Migrate Incrementally**: Don't try to migrate all files at once
2. **Test After Each Migration**: Ensure each file works before moving to the next
3. **Start with Critical Services**: Migrate database and payment services first
4. **Keep Old Pattern Temporarily**: During migration, both patterns can coexist
5. **Update Tests**: Ensure tests work with the new env system
6. **Document Custom Variables**: Add comments to `src/env.js` for clarity

## Next Steps

After completing migration:

1. **Remove Fallback Logic**: Delete any manual environment validation
2. **Add New Variables Correctly**: Always add to `src/env.js` schema
3. **Update Documentation**: Ensure CONTRIBUTING.md reflects new pattern
4. **Train Team**: Share this guide with all developers
5. **Set Up Linting**: Add ESLint rule to prevent direct `import.meta.env` usage

## Additional Resources

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md) - Complete environment configuration
- [src/env.example.js](../src/env.example.js) - Usage examples
- [@t3-oss/env-core Documentation](https://env.t3.gg/docs/core) - Library documentation
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html) - Vite docs

## Support

For migration assistance:
- Review `src/env.example.js` for complete examples
- Check this guide for common patterns
- Contact the development team: dev@trvlsocial.com

Remember: The goal is type-safe, validated environment variables that catch errors at build time, not runtime!

/**
 * EXAMPLE: How to Use Type-Safe Environment Variables
 *
 * This file demonstrates the correct way to access environment variables
 * in the TRVL Social V3 application.
 *
 * DO NOT use this file directly in your code - it's for reference only.
 */

// ❌ INCORRECT - Direct access to import.meta.env (no type safety or validation)
// const apiUrl = import.meta.env.VITE_SUPABASE_URL;
// const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ CORRECT - Use the validated env object
import { env } from './env.js';

// Example 1: Accessing Supabase Configuration
export function initializeSupabase() {
  const supabaseConfig = {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  };

  return supabaseConfig;
}

// Example 2: Accessing Stripe Configuration
export function initializeStripe() {
  const stripeConfig = {
    publishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY,
  };

  return stripeConfig;
}

// Example 3: Using Feature Flags
export function isFeatureEnabled(featureName) {
  // Feature flags are stored as strings 'true' or 'false'
  switch (featureName) {
    case 'vendorForumV2':
      return env.VITE_FEATURE_VENDOR_FORUM_V2 === 'true';
    case 'groupVideoCalls':
      return env.VITE_FEATURE_GROUP_VIDEO_CALLS === 'true';
    case 'aiRecommendations':
      return env.VITE_FEATURE_AI_RECOMMENDATIONS === 'true';
    case 'beta':
      return env.VITE_FEATURE_BETA === 'true';
    default:
      return false;
  }
}

// Example 4: Conditional Logic Based on Environment
export function getApiUrl() {
  // Use the validated app URL
  return env.VITE_APP_URL;
}

// Example 5: Optional Environment Variables with Defaults
export function getAnalyticsConfig() {
  return {
    ga4MeasurementId: env.VITE_GA4_MEASUREMENT_ID || null,
    mixpanelToken: env.VITE_MIXPANEL_TOKEN || null,
    sentryDsn: env.VITE_SENTRY_DSN || null,
  };
}

// Example 6: Numeric Environment Variables
export function getPerformanceThresholds() {
  return {
    lcp: {
      warning: parseInt(env.VITE_LCP_WARNING_THRESHOLD || '2500'),
      critical: parseInt(env.VITE_LCP_CRITICAL_THRESHOLD || '4000'),
    },
    fid: {
      warning: parseInt(env.VITE_FID_WARNING_THRESHOLD || '100'),
      critical: parseInt(env.VITE_FID_CRITICAL_THRESHOLD || '300'),
    },
  };
}

// Example 7: Server-Side Only Variables (for API routes/functions)
// Note: These are NOT available in client-side code
// They're only accessible during build time or in server-side functions
export function getServerConfig() {
  // This would only work in a server-side context
  // In client code, these will be undefined
  return {
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY, // Only available server-side
    stripeSecretKey: env.STRIPE_SECRET_KEY,         // Only available server-side
  };
}

/**
 * MIGRATION GUIDE
 *
 * If you're updating existing code to use the new env system:
 *
 * 1. Find all instances of import.meta.env in your file
 * 2. Add the import at the top: import { env } from '@/env.js';
 * 3. Replace import.meta.env.VARIABLE_NAME with env.VARIABLE_NAME
 * 4. Test that your code still works
 *
 * Search pattern: import\.meta\.env\.
 * Replace with: env.
 *
 * Example before:
 *   const url = import.meta.env.VITE_SUPABASE_URL;
 *
 * Example after:
 *   import { env } from '@/env.js';
 *   const url = env.VITE_SUPABASE_URL;
 */

/**
 * BENEFITS OF THIS APPROACH
 *
 * 1. Type Safety: TypeScript/JSDoc can provide autocomplete
 * 2. Validation: Missing required variables cause build to fail
 * 3. Documentation: Schema in env.js documents all variables
 * 4. Refactoring: Easy to find all environment variable usage
 * 5. Testing: Can mock the env object in tests
 * 6. Security: Clear separation of client/server variables
 */

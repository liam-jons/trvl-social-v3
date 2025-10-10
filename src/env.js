/**
 * Environment Variable Validation and Type Safety
 *
 * This file provides build-time validation and type-safe access to environment variables.
 * All environment variables are validated using Zod schemas to ensure required values
 * are present before the application starts.
 *
 * Usage:
 *   import { env } from '@/env.js';
 *   console.log(env.VITE_SUPABASE_URL);
 *
 * Variables are organized into:
 * - client: Variables accessible in the browser (must start with VITE_)
 * - server: Variables only accessible in server-side code (no VITE_ prefix)
 */

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side Environment Variables
   * These are only accessible during build time and in server-side code
   */
  server: {
    // Supabase Service Role Key (SERVER-SIDE ONLY)
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // Stripe Secret Key (SERVER-SIDE ONLY)
    STRIPE_SECRET_KEY: z.string().min(1),

    // Stripe Webhook Secret
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // WhatsApp Webhook Secret
    WHATSAPP_WEBHOOK_SECRET: z.string().optional(),

    // Daily.co API Secret
    DAILY_API_SECRET: z.string().optional(),

    // AI Services (Server-side)
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    PERPLEXITY_API_KEY: z.string().optional(),

    // Email Service
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM_ADDRESS: z.string().email().optional(),
    EMAIL_FROM_NAME: z.string().optional(),

    // Deployment & CI/CD
    VERCEL_TOKEN: z.string().optional(),
    VERCEL_PROJECT_ID: z.string().optional(),
    VERCEL_ORG_ID: z.string().optional(),
    GITHUB_TOKEN: z.string().optional(),

    // Database
    DATABASE_URL: z.string().url().optional(),
    SHADOW_DATABASE_URL: z.string().url().optional(),

    // Security
    SESSION_SECRET: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
    RATE_LIMIT_WINDOW_MINUTES: z.string().optional(),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    CSP_DIRECTIVES: z.string().optional(),

    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'staging']).optional(),
  },

  /**
   * Client-side Environment Variables
   * These are embedded in the client bundle and accessible in the browser
   * ALL client variables MUST start with VITE_ prefix
   */
  client: {
    // Supabase Configuration (REQUIRED)
    // Note: VITE_SUPABASE_PUBLISHABLE_KEY is the anon/public key
    VITE_SUPABASE_PROJECT_ID: z.string().min(1),
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

    // Stripe Configuration (REQUIRED)
    VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    STRIPE_CONNECT_CLIENT_ID: z.string().optional(),

    // Application Configuration
    VITE_APP_URL: z.string().url().default('http://localhost:5173'),
    VITE_APP_NAME: z.string().default('TRVL Social'),
    VITE_APP_VERSION: z.string().default('3.0.0'),
    VITE_BUILD_NUMBER: z.string().optional(),

    // Maps and Location
    VITE_MAPBOX_ACCESS_TOKEN: z.string().min(1),

    // WhatsApp Integration
    VITE_WHATSAPP_API_BASE_URL: z.string().url().optional(),
    VITE_WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    VITE_WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    VITE_WHATSAPP_VERIFY_TOKEN: z.string().optional(),

    // Video Conferencing
    VITE_DAILY_API_KEY: z.string().optional(),

    // Analytics & Monitoring
    VITE_SENTRY_DSN: z.string().url().optional(),
    VITE_SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
    VITE_SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
    VITE_GA4_MEASUREMENT_ID: z.string().optional(),
    VITE_MIXPANEL_TOKEN: z.string().optional(),

    // Datadog RUM
    VITE_DATADOG_APPLICATION_ID: z.string().optional(),
    VITE_DATADOG_CLIENT_TOKEN: z.string().optional(),
    VITE_DATADOG_SITE: z.string().optional(),
    VITE_DATADOG_SERVICE: z.string().optional(),
    VITE_DATADOG_VERSION: z.string().optional(),

    // AI Services (Client-side)
    VITE_ANTHROPIC_API_KEY: z.string().optional(),
    VITE_OPENAI_API_KEY: z.string().optional(),

    // Feature Flags
    VITE_FEATURE_VENDOR_FORUM_V2: z.enum(['true', 'false']).optional(),
    VITE_FEATURE_GROUP_VIDEO_CALLS: z.enum(['true', 'false']).optional(),
    VITE_FEATURE_AI_RECOMMENDATIONS: z.enum(['true', 'false']).optional(),
    VITE_FEATURE_BETA: z.enum(['true', 'false']).optional(),

    // Performance Monitoring Thresholds
    VITE_LCP_WARNING_THRESHOLD: z.string().optional(),
    VITE_LCP_CRITICAL_THRESHOLD: z.string().optional(),
    VITE_FID_WARNING_THRESHOLD: z.string().optional(),
    VITE_FID_CRITICAL_THRESHOLD: z.string().optional(),
    VITE_CLS_WARNING_THRESHOLD: z.string().optional(),
    VITE_CLS_CRITICAL_THRESHOLD: z.string().optional(),
    VITE_RESPONSE_TIME_WARNING: z.string().optional(),
    VITE_RESPONSE_TIME_CRITICAL: z.string().optional(),
    VITE_ERROR_RATE_WARNING: z.string().optional(),
    VITE_ERROR_RATE_CRITICAL: z.string().optional(),
    VITE_CONVERSION_RATE_WARNING: z.string().optional(),
    VITE_CONVERSION_RATE_CRITICAL: z.string().optional(),
    VITE_BOUNCE_RATE_WARNING: z.string().optional(),
    VITE_BOUNCE_RATE_CRITICAL: z.string().optional(),

    // Notification Configuration
    VITE_SLACK_WEBHOOK_URL: z.string().url().optional(),
    VITE_ALERT_EMAIL: z.string().email().optional(),

    // Development Tools
    VITE_ENABLE_DEVTOOLS: z.enum(['true', 'false']).optional(),
    VITE_DEBUG_MODE: z.enum(['true', 'false']).optional(),
    VITE_VERBOSE_LOGGING: z.enum(['true', 'false']).optional(),
    VITE_DISABLE_ANALYTICS_IN_DEV: z.enum(['true', 'false']).optional(),
    VITE_USE_MOCK_API: z.enum(['true', 'false']).optional(),
  },

  /**
   * Runtime Environment
   * This tells the library where to read the actual environment variables from
   */
  runtimeEnv: {
    // Server variables
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    WHATSAPP_WEBHOOK_SECRET: process.env.WHATSAPP_WEBHOOK_SECRET,
    DAILY_API_SECRET: process.env.DAILY_API_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MINUTES: process.env.RATE_LIMIT_WINDOW_MINUTES,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
    CSP_DIRECTIVES: process.env.CSP_DIRECTIVES,
    NODE_ENV: process.env.NODE_ENV,

    // Client variables (from import.meta.env in Vite)
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    STRIPE_CONNECT_CLIENT_ID: import.meta.env.STRIPE_CONNECT_CLIENT_ID,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_BUILD_NUMBER: import.meta.env.VITE_BUILD_NUMBER,
    VITE_MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    VITE_WHATSAPP_API_BASE_URL: import.meta.env.VITE_WHATSAPP_API_BASE_URL,
    VITE_WHATSAPP_ACCESS_TOKEN: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
    VITE_WHATSAPP_PHONE_NUMBER_ID: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
    VITE_WHATSAPP_VERIFY_TOKEN: import.meta.env.VITE_WHATSAPP_VERIFY_TOKEN,
    VITE_DAILY_API_KEY: import.meta.env.VITE_DAILY_API_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    VITE_SENTRY_TRACES_SAMPLE_RATE: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
    VITE_GA4_MEASUREMENT_ID: import.meta.env.VITE_GA4_MEASUREMENT_ID,
    VITE_MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
    VITE_DATADOG_APPLICATION_ID: import.meta.env.VITE_DATADOG_APPLICATION_ID,
    VITE_DATADOG_CLIENT_TOKEN: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
    VITE_DATADOG_SITE: import.meta.env.VITE_DATADOG_SITE,
    VITE_DATADOG_SERVICE: import.meta.env.VITE_DATADOG_SERVICE,
    VITE_DATADOG_VERSION: import.meta.env.VITE_DATADOG_VERSION,
    VITE_ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY,
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    VITE_FEATURE_VENDOR_FORUM_V2: import.meta.env.VITE_FEATURE_VENDOR_FORUM_V2,
    VITE_FEATURE_GROUP_VIDEO_CALLS: import.meta.env.VITE_FEATURE_GROUP_VIDEO_CALLS,
    VITE_FEATURE_AI_RECOMMENDATIONS: import.meta.env.VITE_FEATURE_AI_RECOMMENDATIONS,
    VITE_FEATURE_BETA: import.meta.env.VITE_FEATURE_BETA,
    VITE_LCP_WARNING_THRESHOLD: import.meta.env.VITE_LCP_WARNING_THRESHOLD,
    VITE_LCP_CRITICAL_THRESHOLD: import.meta.env.VITE_LCP_CRITICAL_THRESHOLD,
    VITE_FID_WARNING_THRESHOLD: import.meta.env.VITE_FID_WARNING_THRESHOLD,
    VITE_FID_CRITICAL_THRESHOLD: import.meta.env.VITE_FID_CRITICAL_THRESHOLD,
    VITE_CLS_WARNING_THRESHOLD: import.meta.env.VITE_CLS_WARNING_THRESHOLD,
    VITE_CLS_CRITICAL_THRESHOLD: import.meta.env.VITE_CLS_CRITICAL_THRESHOLD,
    VITE_RESPONSE_TIME_WARNING: import.meta.env.VITE_RESPONSE_TIME_WARNING,
    VITE_RESPONSE_TIME_CRITICAL: import.meta.env.VITE_RESPONSE_TIME_CRITICAL,
    VITE_ERROR_RATE_WARNING: import.meta.env.VITE_ERROR_RATE_WARNING,
    VITE_ERROR_RATE_CRITICAL: import.meta.env.VITE_ERROR_RATE_CRITICAL,
    VITE_CONVERSION_RATE_WARNING: import.meta.env.VITE_CONVERSION_RATE_WARNING,
    VITE_CONVERSION_RATE_CRITICAL: import.meta.env.VITE_CONVERSION_RATE_CRITICAL,
    VITE_BOUNCE_RATE_WARNING: import.meta.env.VITE_BOUNCE_RATE_WARNING,
    VITE_BOUNCE_RATE_CRITICAL: import.meta.env.VITE_BOUNCE_RATE_CRITICAL,
    VITE_SLACK_WEBHOOK_URL: import.meta.env.VITE_SLACK_WEBHOOK_URL,
    VITE_ALERT_EMAIL: import.meta.env.VITE_ALERT_EMAIL,
    VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
    VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,
    VITE_VERBOSE_LOGGING: import.meta.env.VITE_VERBOSE_LOGGING,
    VITE_DISABLE_ANALYTICS_IN_DEV: import.meta.env.VITE_DISABLE_ANALYTICS_IN_DEV,
    VITE_USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API,
  },

  /**
   * Client Prefix
   * Tell the library what prefix to use for client-side variables
   */
  clientPrefix: 'VITE_',

  /**
   * Error Formatting
   * Custom error messages for validation failures
   * @param {Array} issues - Array of validation issues from @t3-oss/env-core
   */
  onValidationError: (issues) => {
    console.error('❌ Environment validation failed:');

    // Format issues for better readability
    const formatted = issues.reduce((acc, issue) => {
      const path = issue.path?.join('.') || 'unknown';
      if (!acc[path]) acc[path] = [];
      acc[path].push(issue.message);
      return acc;
    }, {});

    console.error('Validation errors by field:');
    console.error(formatted);

    throw new Error(
      'Invalid environment variables. Check the console for details.'
    );
  },

  /**
   * Skip validation in production if needed
   * Set to false to always validate (recommended)
   */
  skipValidation: false,
});

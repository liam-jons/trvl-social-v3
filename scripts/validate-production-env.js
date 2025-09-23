#!/usr/bin/env node

/**
 * Production Environment Validation Script
 *
 * This script validates that all required environment variables
 * are properly configured for production deployment.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load production environment variables
const prodEnvPath = join(projectRoot, '.env.production');
if (existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath });
}

console.log('🔍 Production Environment Validation');
console.log('====================================\n');

let hasErrors = false;
let hasWarnings = false;

/**
 * Validation helper functions
 */
function validateRequired(varName, description) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('placeholder')) {
    console.error(`❌ REQUIRED: ${varName} - ${description}`);
    hasErrors = true;
    return false;
  }
  console.log(`✅ ${varName} - configured`);
  return true;
}

function validateOptional(varName, description) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('placeholder')) {
    console.warn(`⚠️  OPTIONAL: ${varName} - ${description}`);
    hasWarnings = true;
    return false;
  }
  console.log(`✅ ${varName} - configured`);
  return true;
}

function validateUrl(varName, description) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('placeholder')) {
    console.error(`❌ REQUIRED: ${varName} - ${description}`);
    hasErrors = true;
    return false;
  }

  try {
    new URL(value);
    console.log(`✅ ${varName} - valid URL`);
    return true;
  } catch {
    console.error(`❌ INVALID URL: ${varName} - ${value}`);
    hasErrors = true;
    return false;
  }
}

function validateApiKey(varName, expectedPrefix, description) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('placeholder')) {
    console.error(`❌ REQUIRED: ${varName} - ${description}`);
    hasErrors = true;
    return false;
  }

  if (expectedPrefix && !value.startsWith(expectedPrefix)) {
    console.error(`❌ INVALID FORMAT: ${varName} - should start with ${expectedPrefix}`);
    hasErrors = true;
    return false;
  }

  console.log(`✅ ${varName} - configured`);
  return true;
}

/**
 * Validate core application settings
 */
console.log('📋 Core Application Settings');
console.log('----------------------------');
validateRequired('NODE_ENV', 'Node environment should be "production"');
validateUrl('VITE_APP_URL', 'Primary application URL');
validateRequired('VITE_APP_NAME', 'Application name');
validateRequired('ALLOWED_ORIGINS', 'CORS allowed origins');
console.log('');

/**
 * Validate Supabase configuration
 */
console.log('🗄️  Supabase Database');
console.log('--------------------');
validateUrl('VITE_SUPABASE_URL', 'Supabase project URL');
validateApiKey('VITE_SUPABASE_PUBLISHABLE_KEY', 'eyJ', 'Supabase publishable key');
validateRequired('VITE_SUPABASE_PROJECT_ID', 'Supabase project ID');
console.log('');

/**
 * Validate AI services
 */
console.log('🤖 AI Services');
console.log('---------------');
validateApiKey('ANTHROPIC_API_KEY', 'sk-ant-api03-', 'Anthropic API key');
validateApiKey('VITE_ANTHROPIC_API_KEY', 'sk-ant-api03-', 'Anthropic API key (client)');
validateOptional('PERPLEXITY_API_KEY', 'Perplexity AI API key');
validateOptional('OPENAI_API_KEY', 'OpenAI API key');
console.log('');

/**
 * Validate payment processing
 */
console.log('💳 Payment Processing');
console.log('--------------------');
validateApiKey('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_live_', 'Stripe publishable key (LIVE)');
validateApiKey('STRIPE_SECRET_KEY', 'sk_live_', 'Stripe secret key (LIVE)');
validateApiKey('STRIPE_WEBHOOK_SECRET', 'whsec_', 'Stripe webhook secret');
validateApiKey('STRIPE_CONNECT_CLIENT_ID', 'ca_', 'Stripe Connect client ID');
console.log('');

/**
 * Validate third-party services
 */
console.log('🌐 Third-Party Services');
console.log('----------------------');
validateApiKey('VITE_MAPBOX_ACCESS_TOKEN', 'pk.', 'Mapbox access token');
validateApiKey('RESEND_API_KEY', 're_', 'Resend email API key');
validateRequired('FROM_EMAIL', 'From email address');
console.log('');

/**
 * Validate monitoring and analytics
 */
console.log('📊 Monitoring & Analytics');
console.log('------------------------');
validateOptional('VITE_MIXPANEL_TOKEN', 'Mixpanel analytics token');
validateOptional('VITE_SENTRY_DSN', 'Sentry error tracking DSN');
validateOptional('VITE_DATADOG_APPLICATION_ID', 'Datadog application ID');
validateOptional('VITE_DATADOG_CLIENT_TOKEN', 'Datadog client token');
console.log('');

/**
 * Validate messaging services
 */
console.log('💬 Messaging Services');
console.log('--------------------');
validateOptional('VITE_WHATSAPP_ACCESS_TOKEN', 'WhatsApp Business API token');
validateOptional('VITE_WHATSAPP_PHONE_NUMBER_ID', 'WhatsApp phone number ID');
validateOptional('VITE_DAILY_API_KEY', 'Daily.co API key for video calls');
console.log('');

/**
 * Validate infrastructure settings
 */
console.log('🏗️  Infrastructure Settings');
console.log('---------------------------');
validateRequired('LOG_LEVEL', 'Logging level');
validateRequired('LOG_FORMAT', 'Log format');
validateRequired('RATE_LIMIT_WINDOW', 'Rate limiting window');
validateRequired('RATE_LIMIT_MAX', 'Rate limiting max requests');
validateRequired('CACHE_TTL', 'Cache TTL');
validateRequired('CDN_CACHE_TTL', 'CDN cache TTL');
console.log('');

/**
 * Validate security settings
 */
console.log('🔒 Security Settings');
console.log('-------------------');
validateRequired('SECURE_COOKIES', 'Secure cookies setting');
validateRequired('HTTPS_ONLY', 'HTTPS enforcement');
validateRequired('HSTS_MAX_AGE', 'HSTS max age');
console.log('');

/**
 * Validate company information
 */
console.log('🏢 Company Information');
console.log('---------------------');
validateRequired('VITE_COMPANY_NAME', 'Company name');
validateRequired('VITE_COMPANY_EMAIL', 'Company email');
validateRequired('VITE_COMPANY_PHONE', 'Company phone');
validateRequired('VITE_COMPANY_ADDRESS_1', 'Company address');
validateRequired('VITE_COMPANY_CITY', 'Company city');
console.log('');

/**
 * Final validation summary
 */
console.log('📋 Validation Summary');
console.log('====================');

if (hasErrors) {
  console.error('❌ VALIDATION FAILED: Please fix the errors above before deploying to production.');
  console.error('   Missing or invalid required environment variables detected.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  VALIDATION PASSED WITH WARNINGS: Some optional services are not configured.');
  console.warn('   Consider configuring optional services for enhanced functionality.');
  console.log('✅ All required environment variables are properly configured.');
  process.exit(0);
} else {
  console.log('✅ VALIDATION PASSED: All environment variables are properly configured.');
  console.log('🚀 Ready for production deployment!');
  process.exit(0);
}
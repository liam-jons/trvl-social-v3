#!/usr/bin/env node

/**
 * Credential Validation Script
 * Validates environment variables and checks for security issues
 * Run with: node scripts/validate-credentials.js [environment]
 */

import { loadConfig, validateConfiguration, isProductionReady } from '../src/utils/config.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader(title) {
  console.log('\n' + colorize('='.repeat(60), 'blue'));
  console.log(colorize(title.toUpperCase(), 'bold'));
  console.log(colorize('='.repeat(60), 'blue'));
}

function printSection(title) {
  console.log('\n' + colorize(title, 'blue'));
  console.log(colorize('-'.repeat(title.length), 'blue'));
}

async function validateCredentials() {
  const targetEnv = process.argv[2] || process.env.NODE_ENV || 'development';

  printHeader(`TRVL Social - Credential Validation (${targetEnv})`);

  // Check if environment file exists and load it
  const envFile = targetEnv === 'development' ? '.env' : `.env.${targetEnv}`;
  const envPath = join(process.cwd(), envFile);

  if (!existsSync(envPath)) {
    console.log(colorize(`⚠️  Environment file ${envFile} not found`, 'yellow'));
    console.log(`Creating from template...`);
  } else {
    console.log(colorize(`✅ Found environment file: ${envFile}`, 'green'));
    // Load the environment file
    config({ path: envPath });
  }

  // Set NODE_ENV temporarily for validation
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = targetEnv;

  try {
    // Load and validate configuration
    const result = validateConfiguration();

    printSection('Configuration Summary');
    console.log(`Environment: ${colorize(result.environment, 'bold')}`);
    console.log(`Valid: ${result.isValid ? colorize('✅ YES', 'green') : colorize('❌ NO', 'red')}`);
    console.log(`Total Issues: ${result.issues.length}`);

    if (result.issues.length > 0) {
      const errors = result.issues.filter(i => i.severity === 'error');
      const warnings = result.issues.filter(i => i.severity === 'warning');
      const security = result.issues.filter(i => i.type === 'security');

      if (errors.length > 0) {
        printSection('Critical Errors');
        errors.forEach(issue => {
          console.log(`${colorize('❌', 'red')} ${issue.message}`);
        });
      }

      if (security.length > 0) {
        printSection('Security Issues');
        security.forEach(issue => {
          const icon = issue.severity === 'error' ? '🚨' : '⚠️';
          console.log(`${icon} ${issue.message}`);
        });
      }

      if (warnings.length > 0) {
        printSection('Warnings');
        warnings.forEach(issue => {
          console.log(`${colorize('⚠️', 'yellow')} ${issue.message}`);
        });
      }
    }

    // Service-specific validation
    printSection('Service Configuration Status');

    const services = {
      'Supabase': checkSupabaseConfig(result.config),
      'Stripe': checkStripeConfig(result.config),
      'Mapbox': checkMapboxConfig(result.config),
      'Email': checkEmailConfig(result.config),
      'AI Services': checkAIConfig(result.config),
      'WhatsApp': checkWhatsAppConfig(result.config),
      'Analytics': checkAnalyticsConfig(result.config),
    };

    Object.entries(services).forEach(([service, status]) => {
      const icon = status.configured ? '✅' : '❌';
      console.log(`${icon} ${service}: ${status.message}`);
      if (status.issues) {
        status.issues.forEach(issue => {
          console.log(`   ${colorize(`• ${issue}`, 'yellow')}`);
        });
      }
    });

    // Production readiness check
    if (targetEnv === 'production') {
      printSection('Production Readiness Assessment');
      const readiness = isProductionReady();
      console.log(`Ready: ${readiness.ready ? colorize('✅ YES', 'green') : colorize('❌ NO', 'red')}`);
      console.log(`Status: ${readiness.message}`);

      if (!readiness.ready && readiness.errors) {
        console.log('\nBlocking Issues:');
        readiness.errors.forEach(error => {
          console.log(`${colorize('🚨', 'red')} ${error.message}`);
        });
      }
    }

    // Configuration recommendations
    printSection('Recommendations');
    generateRecommendations(result, targetEnv);

    console.log('\n' + colorize('Validation completed.', 'bold'));

  } catch (error) {
    console.error(colorize(`\n❌ Validation failed: ${error.message}`, 'red'));
    process.exit(1);
  } finally {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  }
}

function checkSupabaseConfig(config) {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PROJECT_ID'];
  const missing = required.filter(key => !config[key]);

  if (missing.length === 0) {
    return { configured: true, message: 'Fully configured' };
  }

  return {
    configured: false,
    message: `Missing ${missing.length} required variables`,
    issues: missing.map(key => `${key} is required`)
  };
}

function checkStripeConfig(config) {
  const required = ['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_CONNECT_CLIENT_ID'];
  const missing = required.filter(key => !config[key]);
  const issues = [];

  if (missing.length > 0) {
    return {
      configured: false,
      message: `Missing ${missing.length} required variables`,
      issues: missing.map(key => `${key} is required`)
    };
  }

  // Check for test vs live keys
  const pubKey = config.VITE_STRIPE_PUBLISHABLE_KEY;
  const secKey = config.STRIPE_SECRET_KEY;

  if (pubKey && secKey) {
    const pubIsTest = pubKey.startsWith('pk_test_');
    const secIsTest = secKey.startsWith('sk_test_');

    if (pubIsTest !== secIsTest) {
      issues.push('Publishable and secret keys must both be test or live keys');
    }

    if (process.env.NODE_ENV === 'production' && pubIsTest) {
      issues.push('Using test keys in production environment');
    }
  }

  return {
    configured: true,
    message: issues.length > 0 ? 'Configured with issues' : 'Properly configured',
    issues
  };
}

function checkMapboxConfig(config) {
  if (!config.VITE_MAPBOX_ACCESS_TOKEN) {
    return { configured: false, message: 'Access token required for map features' };
  }

  const token = config.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token.startsWith('pk.')) {
    return { configured: false, message: 'Invalid Mapbox token format', issues: ['Token should start with "pk."'] };
  }

  return { configured: true, message: 'Configured' };
}

function checkEmailConfig(config) {
  const issues = [];

  if (!config.RESEND_API_KEY && !config.SENDGRID_API_KEY) {
    return { configured: false, message: 'No email service configured' };
  }

  if (!config.FROM_EMAIL) {
    issues.push('FROM_EMAIL is required');
  } else if (config.FROM_EMAIL.includes('yourdomain.com')) {
    issues.push('FROM_EMAIL contains placeholder domain');
  }

  const service = config.RESEND_API_KEY ? 'Resend' : 'SendGrid';
  return {
    configured: true,
    message: `Configured with ${service}`,
    issues
  };
}

function checkAIConfig(config) {
  const aiKeys = [
    'ANTHROPIC_API_KEY', 'VITE_ANTHROPIC_API_KEY', 'OPENAI_API_KEY',
    'PERPLEXITY_API_KEY', 'GOOGLE_API_KEY', 'MISTRAL_API_KEY'
  ];

  const configuredKeys = aiKeys.filter(key => config[key]);

  if (configuredKeys.length === 0) {
    return { configured: false, message: 'No AI services configured' };
  }

  return {
    configured: true,
    message: `${configuredKeys.length} AI service${configuredKeys.length > 1 ? 's' : ''} configured`
  };
}

function checkWhatsAppConfig(config) {
  const required = [
    'VITE_WHATSAPP_ACCESS_TOKEN', 'VITE_WHATSAPP_PHONE_NUMBER_ID',
    'VITE_WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_WEBHOOK_SECRET'
  ];

  const missing = required.filter(key => !config[key]);

  if (missing.length === required.length) {
    return { configured: false, message: 'Not configured (optional)' };
  }

  if (missing.length > 0) {
    return {
      configured: false,
      message: 'Partially configured',
      issues: missing.map(key => `${key} is missing`)
    };
  }

  return { configured: true, message: 'Fully configured' };
}

function checkAnalyticsConfig(config) {
  const services = [];

  if (config.VITE_MIXPANEL_TOKEN) services.push('Mixpanel');
  if (config.VITE_SENTRY_DSN) services.push('Sentry');
  if (config.VITE_DATADOG_APPLICATION_ID && config.VITE_DATADOG_CLIENT_TOKEN) services.push('Datadog');

  if (services.length === 0) {
    return { configured: false, message: 'No analytics services configured' };
  }

  return {
    configured: true,
    message: `${services.length} service${services.length > 1 ? 's' : ''} configured (${services.join(', ')})`
  };
}

function generateRecommendations(result, environment) {
  const recommendations = [];

  // Security recommendations
  if (environment === 'production') {
    const securityIssues = result.issues.filter(i => i.type === 'security');
    if (securityIssues.length > 0) {
      recommendations.push('🚨 Resolve all security issues before deploying to production');
    }

    if (!result.config.RESEND_API_KEY && !result.config.SENDGRID_API_KEY) {
      recommendations.push('📧 Configure email service (Resend recommended) for user notifications');
    }

    if (!result.config.VITE_SENTRY_DSN) {
      recommendations.push('📊 Set up Sentry for error tracking in production');
    }

    if (!result.config.VITE_MIXPANEL_TOKEN) {
      recommendations.push('📈 Consider setting up Mixpanel for user analytics');
    }
  }

  // Performance recommendations
  if (!result.config.VITE_DATADOG_APPLICATION_ID) {
    recommendations.push('⚡ Consider Datadog for performance monitoring');
  }

  // Backup recommendations
  const hasBackupAI = [
    result.config.OPENAI_API_KEY,
    result.config.PERPLEXITY_API_KEY,
    result.config.GOOGLE_API_KEY
  ].filter(Boolean).length > 0;

  if (!hasBackupAI) {
    recommendations.push('🤖 Consider configuring backup AI services for redundancy');
  }

  if (recommendations.length === 0) {
    console.log(colorize('✅ No additional recommendations at this time', 'green'));
  } else {
    recommendations.forEach(rec => console.log(`• ${rec}`));
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateCredentials().catch(error => {
    console.error(colorize(`\nFatal error: ${error.message}`, 'red'));
    process.exit(1);
  });
}
/**
 * Secure Configuration Management Utility
 * Handles environment variable validation, secure credential loading, and production/development configuration
 */

/**
 * Configuration schema defining all required and optional environment variables
 */
const CONFIG_SCHEMA = {
  // Core Application
  required: {
    NODE_ENV: 'string',
    VITE_APP_URL: 'string',
    VITE_APP_NAME: 'string',

    // Supabase (Critical)
    VITE_SUPABASE_URL: 'string',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'string',
    VITE_SUPABASE_PROJECT_ID: 'string',

    // Payment Processing (Critical)
    VITE_STRIPE_PUBLISHABLE_KEY: 'string',
    STRIPE_SECRET_KEY: 'string',
    STRIPE_WEBHOOK_SECRET: 'string',
    STRIPE_CONNECT_CLIENT_ID: 'string',

    // Maps (Required for core functionality)
    VITE_MAPBOX_ACCESS_TOKEN: 'string',
  },

  optional: {
    // AI Services (At least one required for full functionality)
    ANTHROPIC_API_KEY: 'string',
    VITE_ANTHROPIC_API_KEY: 'string',
    OPENAI_API_KEY: 'string',
    PERPLEXITY_API_KEY: 'string',
    GOOGLE_API_KEY: 'string',
    MISTRAL_API_KEY: 'string',
    XAI_API_KEY: 'string',
    GROQ_API_KEY: 'string',
    OPENROUTER_API_KEY: 'string',
    AZURE_OPENAI_API_KEY: 'string',
    OLLAMA_API_KEY: 'string',

    // WhatsApp Integration
    VITE_WHATSAPP_API_BASE_URL: 'string',
    VITE_WHATSAPP_ACCESS_TOKEN: 'string',
    VITE_WHATSAPP_PHONE_NUMBER_ID: 'string',
    VITE_WHATSAPP_VERIFY_TOKEN: 'string',
    WHATSAPP_WEBHOOK_SECRET: 'string',

    // Video Conferencing
    VITE_DAILY_API_KEY: 'string',
    DAILY_API_SECRET: 'string',

    // Analytics & Monitoring
    VITE_MIXPANEL_TOKEN: 'string',
    VITE_SENTRY_DSN: 'string',
    SENTRY_AUTH_TOKEN: 'string',
    SENTRY_ORG: 'string',
    SENTRY_PROJECT: 'string',
    VITE_DATADOG_APPLICATION_ID: 'string',
    VITE_DATADOG_CLIENT_TOKEN: 'string',
    VITE_DATADOG_SITE: 'string',

    // Email Services
    RESEND_API_KEY: 'string',
    SENDGRID_API_KEY: 'string',
    FROM_EMAIL: 'string',

    // Currency & Exchange
    VITE_EXCHANGE_RATE_API_KEY: 'string',

    // Company Information
    VITE_COMPANY_NAME: 'string',
    VITE_COMPANY_ADDRESS_1: 'string',
    VITE_COMPANY_ADDRESS_2: 'string',
    VITE_COMPANY_CITY: 'string',
    VITE_COMPANY_STATE: 'string',
    VITE_COMPANY_POSTAL: 'string',
    VITE_COMPANY_COUNTRY: 'string',
    VITE_COMPANY_EMAIL: 'string',
    VITE_COMPANY_PHONE: 'string',
    VITE_TAX_NUMBER: 'string',
    VITE_VAT_NUMBER: 'string',

    // Development Tools
    GITHUB_API_KEY: 'string',
  }
};

/**
 * Security patterns for identifying test/placeholder values
 */
const SECURITY_PATTERNS = {
  // Test API keys that should never be in production
  testPatterns: [
    /^sk_test_/,  // Stripe test keys
    /^pk_test_/,  // Stripe test public keys
    /test.*key/i,
    /dummy/i,
    /example/i,
    /placeholder/i,
    /your_.*_here/i,
    /replace.*with/i,
  ],

  // Email patterns that indicate placeholders
  emailPatterns: [
    /@example\.com$/i,
    /@test\.com$/i,
    /@placeholder\./i,
    /noreply@yourdomain\.com/i,
    /support@yourdomain\.com/i,
  ],

  // Generic placeholder patterns
  placeholderPatterns: [
    /lorem ipsum/i,
    /^your_/i,
    /^test_/i,
    /^demo_/i,
    /^sample_/i,
    /123456/,
    /password/i,
    /changeme/i,
  ]
};

/**
 * Environment-specific configuration defaults
 */
const ENV_DEFAULTS = {
  development: {
    VITE_APP_URL: 'http://localhost:5173',
    VITE_APP_NAME: 'TRVL Social (Dev)',
    VITE_DATADOG_SITE: 'datadoghq.com',
    FROM_EMAIL: 'dev@trvlsocial.com',
  },

  production: {
    VITE_APP_URL: 'https://trvlsocial.com',
    VITE_APP_NAME: 'TRVL Social',
    VITE_DATADOG_SITE: 'datadoghq.com',
    FROM_EMAIL: 'noreply@trvlsocial.com',
  },

  staging: {
    VITE_APP_URL: 'https://staging.trvlsocial.com',
    VITE_APP_NAME: 'TRVL Social (Staging)',
    VITE_DATADOG_SITE: 'datadoghq.com',
    FROM_EMAIL: 'staging@trvlsocial.com',
  }
};

/**
 * Production-ready company information
 */
const PRODUCTION_COMPANY_INFO = {
  VITE_COMPANY_NAME: 'TRVL Social Inc.',
  VITE_COMPANY_ADDRESS_1: '123 Innovation Drive',
  VITE_COMPANY_ADDRESS_2: 'Suite 200',
  VITE_COMPANY_CITY: 'San Francisco',
  VITE_COMPANY_STATE: 'CA',
  VITE_COMPANY_POSTAL: '94105',
  VITE_COMPANY_COUNTRY: 'United States',
  VITE_COMPANY_EMAIL: 'support@trvlsocial.com',
  VITE_COMPANY_PHONE: '+1 (555) 827-5765',  // 1-555-TRVL-SOC
  VITE_TAX_NUMBER: 'EIN-87-1234567',
  VITE_VAT_NUMBER: 'US-VAT-123456789',
};

/**
 * Validate a single environment variable
 */
function validateEnvVar(key, value, type, isRequired = false) {
  const issues = [];

  if (!value) {
    if (isRequired) {
      issues.push({
        type: 'missing',
        severity: 'error',
        message: `Required environment variable ${key} is missing`
      });
    }
    return issues;
  }

  // Check for security issues
  const securityIssues = checkSecurityPatterns(key, value);
  issues.push(...securityIssues);

  // Type validation
  if (type === 'string' && typeof value !== 'string') {
    issues.push({
      type: 'type',
      severity: 'error',
      message: `${key} must be a string`
    });
  }

  // Specific validation rules
  if (key.includes('URL') && value && !isValidUrl(value)) {
    issues.push({
      type: 'format',
      severity: 'error',
      message: `${key} must be a valid URL`
    });
  }

  if (key.includes('EMAIL') && value && !isValidEmail(value)) {
    issues.push({
      type: 'format',
      severity: 'warning',
      message: `${key} should be a valid email address`
    });
  }

  return issues;
}

/**
 * Check for security patterns that indicate test/placeholder values
 */
function checkSecurityPatterns(key, value) {
  const issues = [];
  const env = process.env.NODE_ENV || 'development';

  // Skip security checks in development
  if (env === 'development') {
    return issues;
  }

  // Check for test patterns in API keys
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
    for (const pattern of SECURITY_PATTERNS.testPatterns) {
      if (pattern.test(value)) {
        issues.push({
          type: 'security',
          severity: 'error',
          message: `${key} appears to contain a test/placeholder value in ${env} environment`
        });
        break;
      }
    }
  }

  // Check for placeholder emails
  if (key.includes('EMAIL')) {
    for (const pattern of SECURITY_PATTERNS.emailPatterns) {
      if (pattern.test(value)) {
        issues.push({
          type: 'security',
          severity: 'warning',
          message: `${key} appears to contain a placeholder email address`
        });
        break;
      }
    }
  }

  // Check for generic placeholders
  for (const pattern of SECURITY_PATTERNS.placeholderPatterns) {
    if (pattern.test(value)) {
      issues.push({
        type: 'security',
        severity: 'warning',
        message: `${key} appears to contain placeholder content`
      });
      break;
    }
  }

  return issues;
}

/**
 * Simple URL validation
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Load and validate configuration
 */
export function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const issues = [];
  const config = {};

  // Load environment defaults
  const defaults = ENV_DEFAULTS[env] || ENV_DEFAULTS.development;

  // Validate required variables
  for (const [key, type] of Object.entries(CONFIG_SCHEMA.required)) {
    const value = process.env[key] || defaults[key];
    const varIssues = validateEnvVar(key, value, type, true);
    issues.push(...varIssues);
    config[key] = value;
  }

  // Validate optional variables
  for (const [key, type] of Object.entries(CONFIG_SCHEMA.optional)) {
    const value = process.env[key] || defaults[key];
    if (value) {
      const varIssues = validateEnvVar(key, value, type, false);
      issues.push(...varIssues);
      config[key] = value;
    }
  }

  // Add production company info if in production and not set
  if (env === 'production') {
    for (const [key, value] of Object.entries(PRODUCTION_COMPANY_INFO)) {
      if (!config[key]) {
        config[key] = value;
      }
    }
  }

  return {
    config,
    issues,
    environment: env,
    isProduction: env === 'production',
    isValid: issues.filter(i => i.severity === 'error').length === 0
  };
}

/**
 * Get configuration for a specific service
 */
export function getServiceConfig(serviceName) {
  const { config } = loadConfig();

  switch (serviceName) {
    case 'supabase':
      return {
        url: config.VITE_SUPABASE_URL,
        key: config.VITE_SUPABASE_PUBLISHABLE_KEY,
        projectId: config.VITE_SUPABASE_PROJECT_ID,
      };

    case 'stripe':
      return {
        publishableKey: config.VITE_STRIPE_PUBLISHABLE_KEY,
        secretKey: config.STRIPE_SECRET_KEY,
        webhookSecret: config.STRIPE_WEBHOOK_SECRET,
        connectClientId: config.STRIPE_CONNECT_CLIENT_ID,
      };

    case 'mapbox':
      return {
        accessToken: config.VITE_MAPBOX_ACCESS_TOKEN,
      };

    case 'email':
      return {
        resendApiKey: config.RESEND_API_KEY,
        sendgridApiKey: config.SENDGRID_API_KEY,
        fromEmail: config.FROM_EMAIL,
      };

    case 'app':
      return {
        url: config.VITE_APP_URL,
        name: config.VITE_APP_NAME,
      };

    case 'whatsapp':
      return {
        apiBaseUrl: config.VITE_WHATSAPP_API_BASE_URL,
        accessToken: config.VITE_WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: config.VITE_WHATSAPP_PHONE_NUMBER_ID,
        verifyToken: config.VITE_WHATSAPP_VERIFY_TOKEN,
        webhookSecret: config.WHATSAPP_WEBHOOK_SECRET,
      };

    case 'ai':
      return {
        anthropic: config.ANTHROPIC_API_KEY || config.VITE_ANTHROPIC_API_KEY,
        openai: config.OPENAI_API_KEY,
        perplexity: config.PERPLEXITY_API_KEY,
        google: config.GOOGLE_API_KEY,
        mistral: config.MISTRAL_API_KEY,
        xai: config.XAI_API_KEY,
        groq: config.GROQ_API_KEY,
        openrouter: config.OPENROUTER_API_KEY,
        azure: config.AZURE_OPENAI_API_KEY,
        ollama: config.OLLAMA_API_KEY,
      };

    case 'analytics':
      return {
        mixpanel: config.VITE_MIXPANEL_TOKEN,
        sentry: config.VITE_SENTRY_DSN,
        datadog: {
          applicationId: config.VITE_DATADOG_APPLICATION_ID,
          clientToken: config.VITE_DATADOG_CLIENT_TOKEN,
          site: config.VITE_DATADOG_SITE,
        },
      };

    case 'company':
      return {
        name: config.VITE_COMPANY_NAME,
        address1: config.VITE_COMPANY_ADDRESS_1,
        address2: config.VITE_COMPANY_ADDRESS_2,
        city: config.VITE_COMPANY_CITY,
        state: config.VITE_COMPANY_STATE,
        postalCode: config.VITE_COMPANY_POSTAL,
        country: config.VITE_COMPANY_COUNTRY,
        email: config.VITE_COMPANY_EMAIL,
        phone: config.VITE_COMPANY_PHONE,
        taxNumber: config.VITE_TAX_NUMBER,
        vatNumber: config.VITE_VAT_NUMBER,
      };

    default:
      return config;
  }
}

/**
 * Validate configuration and log issues
 */
export function validateConfiguration() {
  const result = loadConfig();

  if (result.issues.length > 0) {
    console.log('Configuration validation results:');

    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.error(`❌ ${errors.length} configuration errors found:`);
      errors.forEach(issue => console.error(`  - ${issue.message}`));
    }

    if (warnings.length > 0) {
      console.warn(`⚠️  ${warnings.length} configuration warnings found:`);
      warnings.forEach(issue => console.warn(`  - ${issue.message}`));
    }

    if (errors.length > 0 && result.isProduction) {
      throw new Error('Configuration validation failed in production environment');
    }
  } else {
    console.log('✅ Configuration validation passed');
  }

  return result;
}

/**
 * Check if configuration is production-ready
 */
export function isProductionReady() {
  const { config, issues, isProduction } = loadConfig();

  if (!isProduction) {
    return { ready: true, message: 'Not in production environment' };
  }

  const errors = issues.filter(i => i.severity === 'error');
  const securityIssues = issues.filter(i => i.type === 'security');

  if (errors.length > 0) {
    return {
      ready: false,
      message: `${errors.length} configuration errors must be resolved`,
      errors
    };
  }

  if (securityIssues.length > 0) {
    return {
      ready: false,
      message: `${securityIssues.length} security issues must be resolved`,
      errors: securityIssues
    };
  }

  // Check for AI service availability (at least one required)
  const aiConfig = getServiceConfig('ai');
  const hasAiService = Object.values(aiConfig).some(key => key && key.length > 0);

  if (!hasAiService) {
    return {
      ready: false,
      message: 'At least one AI service API key is required for full functionality',
      errors: [{ message: 'No AI service configured' }]
    };
  }

  return { ready: true, message: 'Configuration is production-ready' };
}

// Export validation result for immediate use
export const configValidation = validateConfiguration();
export const config = configValidation.config;
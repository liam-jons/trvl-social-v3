/**
 * Secure Credential Management Utility
 *
 * Provides secure handling of sensitive credentials and environment variables
 * for production deployments with encryption and validation.
 */

import crypto from 'crypto';

/**
 * Credential Manager class for secure credential handling
 */
export class CredentialManager {
  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
  }

  /**
   * Generate a secure encryption key for credentials
   */
  generateEncryptionKey() {
    return process.env.CREDENTIAL_ENCRYPTION_KEY || crypto.randomBytes(32);
  }

  /**
   * Encrypt sensitive credential data
   */
  encrypt(text) {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive credential data
   */
  decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt credential:', error.message);
      return encryptedText;
    }
  }

  /**
   * Validate API key format
   */
  validateApiKey(key, expectedPrefix, serviceName) {
    if (!key) {
      throw new Error(`${serviceName} API key is required`);
    }

    if (key.includes('your_') || key.includes('placeholder')) {
      throw new Error(`${serviceName} API key contains placeholder values`);
    }

    if (expectedPrefix && !key.startsWith(expectedPrefix)) {
      throw new Error(`${serviceName} API key must start with ${expectedPrefix}`);
    }

    return true;
  }

  /**
   * Sanitize credentials for logging (mask sensitive parts)
   */
  sanitizeForLogging(credential) {
    if (!credential || credential.length < 8) return '[MASKED]';

    const prefix = credential.substring(0, 4);
    const suffix = credential.substring(credential.length - 4);
    const middle = '*'.repeat(Math.max(0, credential.length - 8));

    return `${prefix}${middle}${suffix}`;
  }

  /**
   * Get secure environment variable with validation
   */
  getSecureEnv(varName, options = {}) {
    const {
      required = false,
      defaultValue = null,
      validatePrefix = null,
      encrypt = false,
      serviceName = varName
    } = options;

    let value = process.env[varName];

    if (!value && required) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }

    if (!value) {
      return defaultValue;
    }

    // Decrypt if necessary
    if (encrypt) {
      value = this.decrypt(value);
    }

    // Validate format if prefix specified
    if (validatePrefix) {
      this.validateApiKey(value, validatePrefix, serviceName);
    }

    return value;
  }

  /**
   * Validate all production credentials
   */
  validateProductionCredentials() {
    const errors = [];
    const warnings = [];

    try {
      // Core services
      this.getSecureEnv('ANTHROPIC_API_KEY', {
        required: true,
        validatePrefix: 'sk-ant-api03-',
        serviceName: 'Anthropic'
      });

      this.getSecureEnv('VITE_SUPABASE_URL', {
        required: true,
        serviceName: 'Supabase'
      });

      this.getSecureEnv('VITE_SUPABASE_PUBLISHABLE_KEY', {
        required: true,
        validatePrefix: 'eyJ',
        serviceName: 'Supabase'
      });

      // Payment processing
      this.getSecureEnv('STRIPE_SECRET_KEY', {
        required: true,
        validatePrefix: 'sk_live_',
        serviceName: 'Stripe'
      });

      this.getSecureEnv('VITE_STRIPE_PUBLISHABLE_KEY', {
        required: true,
        validatePrefix: 'pk_live_',
        serviceName: 'Stripe'
      });

      // Optional services
      const optionalServices = [
        { var: 'RESEND_API_KEY', prefix: 're_', name: 'Resend' },
        { var: 'VITE_MAPBOX_ACCESS_TOKEN', prefix: 'pk.', name: 'Mapbox' },
        { var: 'VITE_MIXPANEL_TOKEN', prefix: null, name: 'Mixpanel' },
        { var: 'VITE_SENTRY_DSN', prefix: 'https://', name: 'Sentry' }
      ];

      optionalServices.forEach(({ var: varName, prefix, name }) => {
        try {
          const value = this.getSecureEnv(varName, {
            required: false,
            validatePrefix: prefix,
            serviceName: name
          });

          if (!value) {
            warnings.push(`${name} (${varName}) is not configured`);
          }
        } catch (error) {
          warnings.push(`${name} configuration issue: ${error.message}`);
        }
      });

    } catch (error) {
      errors.push(error.message);
    }

    return { errors, warnings };
  }

  /**
   * Generate production environment checklist
   */
  generateDeploymentChecklist() {
    return {
      preDeployment: [
        'All required API keys are configured with production values',
        'Supabase production database is set up and migrated',
        'Stripe is configured with live keys (not test keys)',
        'Domain SSL certificates are valid and configured',
        'CDN is configured and tested',
        'Monitoring and alerting systems are active',
        'Backup systems are configured and tested',
        'Security headers and CORS are properly configured'
      ],
      postDeployment: [
        'Health checks are passing',
        'SSL certificate is valid and HTTPS is enforced',
        'Rate limiting is working correctly',
        'Monitoring dashboards show green status',
        'Error tracking is capturing and alerting properly',
        'Performance metrics are within acceptable ranges',
        'User authentication and payment flows work correctly',
        'All integrations (WhatsApp, video calls, etc.) are functional'
      ],
      ongoing: [
        'Monitor error rates and response times',
        'Review and rotate API keys regularly',
        'Keep dependencies updated',
        'Monitor security alerts and CVEs',
        'Review backup integrity regularly',
        'Monitor resource usage and scaling needs'
      ]
    };
  }
}

/**
 * Default instance for easy import
 */
export const credentialManager = new CredentialManager();

/**
 * Utility functions for common credential operations
 */
export const CredentialUtils = {
  /**
   * Check if running in production environment
   */
  isProduction() {
    return process.env.NODE_ENV === 'production';
  },

  /**
   * Get all production-required environment variables
   */
  getRequiredProductionVars() {
    return [
      'NODE_ENV',
      'VITE_APP_URL',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'ANTHROPIC_API_KEY',
      'VITE_ANTHROPIC_API_KEY',
      'STRIPE_SECRET_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RESEND_API_KEY',
      'FROM_EMAIL',
      'ALLOWED_ORIGINS'
    ];
  },

  /**
   * Validate production readiness
   */
  validateProductionReadiness() {
    if (!CredentialUtils.isProduction()) {
      throw new Error('NODE_ENV must be set to "production"');
    }

    const { errors, warnings } = credentialManager.validateProductionCredentials();

    if (errors.length > 0) {
      throw new Error(`Production validation failed:\n${errors.join('\n')}`);
    }

    return { warnings };
  },

  /**
   * Log sanitized environment information
   */
  logEnvironmentStatus() {
    const requiredVars = CredentialUtils.getRequiredProductionVars();
    const status = {};

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      status[varName] = value ?
        credentialManager.sanitizeForLogging(value) :
        '[NOT_SET]';
    });

    console.log('Production Environment Status:', status);
    return status;
  }
};
/**
 * Secure Credentials Management Service
 *
 * This service manages secure retrieval of API keys and sensitive credentials
 * using Supabase Vault for production environments.
 *
 * SECURITY FEATURES:
 * - Production credentials stored in Supabase Vault
 * - Development fallback to environment variables
 * - Credential caching with TTL
 * - Access logging and monitoring
 * - Automatic rotation support
 */

import { supabase } from '../lib/supabase.js';

class SecureCredentialsService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
    this.isProduction = import.meta.env.PROD;
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Get credential from secure storage or environment
   * @param {string} keyName - The credential key name
   * @param {string} envFallback - Environment variable fallback
   * @returns {Promise<string|null>} The credential value
   */
  async getCredential(keyName, envFallback = null) {
    try {
      // Check cache first
      const cached = this.cache.get(keyName);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.value;
      }

      let credential = null;

      // Production: Use Supabase Vault
      if (this.isProduction) {
        credential = await this.getFromVault(keyName);
      }

      // Development: Use environment variables
      if (!credential && this.isDevelopment && envFallback) {
        credential = import.meta.env[envFallback] || process.env[envFallback];
      }

      // Cache the result (only cache non-null values)
      if (credential) {
        this.cache.set(keyName, {
          value: credential,
          timestamp: Date.now()
        });
      }

      // Log access for monitoring
      await this.logAccess(keyName, !!credential);

      return credential;
    } catch (error) {
      console.error(`Failed to retrieve credential ${keyName}:`, error);
      await this.logError(keyName, error.message);
      return null;
    }
  }

  /**
   * Retrieve credential from Supabase Vault
   * @param {string} keyName - The vault key name
   * @returns {Promise<string|null>} The credential value
   */
  async getFromVault(keyName) {
    try {
      const { data, error } = await supabase.rpc('get_vault_secret', {
        secret_name: keyName
      });

      if (error) {
        throw new Error(`Vault access error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`Vault retrieval failed for ${keyName}:`, error);
      return null;
    }
  }

  /**
   * Store credential in Supabase Vault (admin only)
   * @param {string} keyName - The vault key name
   * @param {string} value - The credential value
   * @returns {Promise<boolean>} Success status
   */
  async storeCredential(keyName, value) {
    try {
      const { data, error } = await supabase.rpc('create_vault_secret', {
        secret_name: keyName,
        secret_value: value
      });

      if (error) {
        throw new Error(`Vault storage error: ${error.message}`);
      }

      // Clear cache for this key
      this.cache.delete(keyName);

      await this.logAccess(`store_${keyName}`, true);
      return true;
    } catch (error) {
      console.error(`Failed to store credential ${keyName}:`, error);
      await this.logError(`store_${keyName}`, error.message);
      return false;
    }
  }

  /**
   * Rotate credential (admin only)
   * @param {string} keyName - The credential key name
   * @param {string} newValue - The new credential value
   * @returns {Promise<boolean>} Success status
   */
  async rotateCredential(keyName, newValue) {
    try {
      // Store new credential
      const stored = await this.storeCredential(keyName, newValue);

      if (stored) {
        // Clear cache to force refresh
        this.cache.delete(keyName);
        await this.logAccess(`rotate_${keyName}`, true);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to rotate credential ${keyName}:`, error);
      await this.logError(`rotate_${keyName}`, error.message);
      return false;
    }
  }

  /**
   * Get all available API credentials for service initialization
   * @returns {Promise<Object>} Object containing all available credentials
   */
  async getAllCredentials() {
    const credentials = {};

    // Define all required credentials
    const credentialMap = {
      // AI Services
      anthropic_api_key: 'VITE_ANTHROPIC_API_KEY',
      openai_api_key: 'VITE_OPENAI_API_KEY',

      // Payment Processing
      stripe_publishable_key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      stripe_secret_key: 'STRIPE_SECRET_KEY',
      stripe_webhook_secret: 'STRIPE_WEBHOOK_SECRET',
      stripe_connect_client_id: 'STRIPE_CONNECT_CLIENT_ID',

      // Mapping Services
      mapbox_access_token: 'VITE_MAPBOX_ACCESS_TOKEN',

      // Messaging Services
      whatsapp_access_token: 'VITE_WHATSAPP_ACCESS_TOKEN',
      whatsapp_phone_number_id: 'VITE_WHATSAPP_PHONE_NUMBER_ID',
      whatsapp_verify_token: 'VITE_WHATSAPP_VERIFY_TOKEN',
      whatsapp_webhook_secret: 'WHATSAPP_WEBHOOK_SECRET',

      // Video Services
      daily_api_key: 'VITE_DAILY_API_KEY',
      daily_api_secret: 'DAILY_API_SECRET',

      // Email Services
      resend_api_key: 'RESEND_API_KEY',

      // Analytics & Monitoring
      mixpanel_token: 'VITE_MIXPANEL_TOKEN',
      sentry_dsn: 'VITE_SENTRY_DSN',
      sentry_auth_token: 'SENTRY_AUTH_TOKEN',
      datadog_application_id: 'VITE_DATADOG_APPLICATION_ID',
      datadog_client_token: 'VITE_DATADOG_CLIENT_TOKEN',

      // Currency Services
      exchange_rate_api_key: 'VITE_EXCHANGE_RATE_API_KEY'
    };

    // Retrieve all credentials
    for (const [vaultKey, envKey] of Object.entries(credentialMap)) {
      credentials[vaultKey] = await this.getCredential(vaultKey, envKey);
    }

    return credentials;
  }

  /**
   * Validate credential format and accessibility
   * @param {string} keyName - The credential key name
   * @param {string} value - The credential value to validate
   * @returns {boolean} Validation status
   */
  validateCredential(keyName, value) {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Format validation patterns
    const patterns = {
      anthropic_api_key: /^sk-ant-api03-[a-zA-Z0-9_-]+$/,
      openai_api_key: /^sk-(proj-)?[a-zA-Z0-9_-]+$/,
      stripe_publishable_key: /^pk_(test_|live_)[a-zA-Z0-9]+$/,
      stripe_secret_key: /^sk_(test_|live_)[a-zA-Z0-9]+$/,
      stripe_webhook_secret: /^whsec_[a-zA-Z0-9]+$/,
      mapbox_access_token: /^pk\.[a-zA-Z0-9_-]+$/,
      resend_api_key: /^re_[a-zA-Z0-9_-]+$/
    };

    const pattern = patterns[keyName];
    return pattern ? pattern.test(value) : true;
  }

  /**
   * Log credential access for monitoring
   * @param {string} keyName - The credential key accessed
   * @param {boolean} success - Whether access was successful
   */
  async logAccess(keyName, success) {
    try {
      await supabase.from('credential_access_logs').insert({
        credential_key: keyName,
        access_timestamp: new Date().toISOString(),
        success,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        environment: this.isProduction ? 'production' : 'development'
      });
    } catch (error) {
      // Silent fail for logging - don't break credential access
      console.warn('Failed to log credential access:', error);
    }
  }

  /**
   * Log credential errors for monitoring
   * @param {string} keyName - The credential key that failed
   * @param {string} errorMessage - The error message
   */
  async logError(keyName, errorMessage) {
    try {
      await supabase.from('credential_errors').insert({
        credential_key: keyName,
        error_message: errorMessage,
        error_timestamp: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
        environment: this.isProduction ? 'production' : 'development'
      });
    } catch (error) {
      // Silent fail for logging
      console.warn('Failed to log credential error:', error);
    }
  }

  /**
   * Clear credential cache (for testing/rotation)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get credential status report
   * @returns {Promise<Object>} Status report of all credentials
   */
  async getCredentialStatus() {
    const credentials = await this.getAllCredentials();
    const status = {};

    for (const [key, value] of Object.entries(credentials)) {
      status[key] = {
        configured: !!value,
        valid: value ? this.validateCredential(key, value) : false,
        isPlaceholder: value ? value.includes('your_') || value.includes('placeholder') : false
      };
    }

    return status;
  }
}

// Create and export singleton instance
export const credentialsService = new SecureCredentialsService();

// Export individual credential getters for convenience
export const getAnthropicKey = () => credentialsService.getCredential('anthropic_api_key', 'VITE_ANTHROPIC_API_KEY');
export const getStripeKeys = async () => ({
  publishable: await credentialsService.getCredential('stripe_publishable_key', 'VITE_STRIPE_PUBLISHABLE_KEY'),
  secret: await credentialsService.getCredential('stripe_secret_key', 'STRIPE_SECRET_KEY'),
  webhook: await credentialsService.getCredential('stripe_webhook_secret', 'STRIPE_WEBHOOK_SECRET'),
  connectClientId: await credentialsService.getCredential('stripe_connect_client_id', 'STRIPE_CONNECT_CLIENT_ID')
});
export const getMapboxToken = () => credentialsService.getCredential('mapbox_access_token', 'VITE_MAPBOX_ACCESS_TOKEN');
export const getWhatsAppKeys = async () => ({
  accessToken: await credentialsService.getCredential('whatsapp_access_token', 'VITE_WHATSAPP_ACCESS_TOKEN'),
  phoneNumberId: await credentialsService.getCredential('whatsapp_phone_number_id', 'VITE_WHATSAPP_PHONE_NUMBER_ID'),
  verifyToken: await credentialsService.getCredential('whatsapp_verify_token', 'VITE_WHATSAPP_VERIFY_TOKEN'),
  webhookSecret: await credentialsService.getCredential('whatsapp_webhook_secret', 'WHATSAPP_WEBHOOK_SECRET')
});
export const getDailyKeys = async () => ({
  apiKey: await credentialsService.getCredential('daily_api_key', 'VITE_DAILY_API_KEY'),
  apiSecret: await credentialsService.getCredential('daily_api_secret', 'DAILY_API_SECRET')
});

export default credentialsService;
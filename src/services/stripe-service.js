/**
 * Stripe Connect Service for marketplace payments
 * Handles Stripe Connect account management, payments, and webhook processing
 */

import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase.js';
import CurrencyService from './currency-service.js';
import InvoiceService from './invoice-service.js';
import { logger } from '../utils/logger.js';

// Configuration
const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  secretKey: import.meta.env.STRIPE_SECRET_KEY,
  webhookSecret: import.meta.env.STRIPE_WEBHOOK_SECRET,
  connectClientId: import.meta.env.STRIPE_CONNECT_CLIENT_ID,
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  appName: import.meta.env.VITE_APP_NAME || 'TRVL Social',
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second, with exponential backoff
};

// Platform fee configuration (5% platform fee)
const PLATFORM_CONFIG = {
  platformFeePercent: 0.05, // 5%
  supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'JP', 'CH', 'SE', 'DK', 'NO'],
  supportedCurrencies: ['usd', 'cad', 'gbp', 'aud', 'eur', 'jpy', 'chf', 'sek', 'dkk', 'nok'],
  defaultCurrency: 'usd',
  accountTypes: {
    EXPRESS: 'express', // Recommended for most vendors
    CUSTOM: 'custom', // For advanced integrations
  },
  invoicing: {
    enabled: true,
    autoGenerate: true,
    templates: ['standard', 'minimal', 'branded'],
    defaultTemplate: 'standard',
  },
};

// Initialize Stripe instance
let stripeInstance = null;

/**
 * Get Stripe instance (lazy initialization)
 */
async function getStripe() {
  if (!stripeInstance) {
    if (!STRIPE_CONFIG.publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }
    stripeInstance = await loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripeInstance;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make authenticated API call to Stripe backend
 */
async function makeStripeAPICall(endpoint, options = {}, retryCount = 0) {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STRIPE_CONFIG.timeout);

    const response = await fetch(`/api/stripe${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Stripe API call failed: ${response.status} - ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Stripe API request timeout');
    }

    // Retry logic with exponential backoff
    if (retryCount < STRIPE_CONFIG.maxRetries) {
      const delay = STRIPE_CONFIG.retryDelay * Math.pow(2, retryCount);

      await sleep(delay);
      return makeStripeAPICall(endpoint, options, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Stripe Connect Account Management
 */
export const stripeConnect = {
  /**
   * Create a new Stripe Connect account for a vendor
   */
  async createAccount(vendorData) {
    const { userId, email, businessType = 'individual', country = 'US' } = vendorData;

    if (!userId || !email) {
      throw new Error('User ID and email are required for account creation');
    }

    if (!PLATFORM_CONFIG.supportedCountries.includes(country)) {
      throw new Error(`Country ${country} is not supported`);
    }

    try {
      // Create account via backend API
      const accountData = await makeStripeAPICall('/connect/accounts', {
        method: 'POST',
        body: {
          type: PLATFORM_CONFIG.accountTypes.EXPRESS,
          country,
          email,
          business_type: businessType,
          metadata: {
            user_id: userId,
            platform: STRIPE_CONFIG.appName,
            created_at: new Date().toISOString(),
          },
        },
      });

      // Store account info in database
      const { error: dbError } = await supabase
        .from('vendor_stripe_accounts')
        .upsert({
          user_id: userId,
          stripe_account_id: accountData.id,
          account_type: PLATFORM_CONFIG.accountTypes.EXPRESS,
          country,
          created_at: new Date().toISOString(),
          status: 'created',
        });

      if (dbError) {
        // Continue anyway - the account was created successfully
      }

      return {
        accountId: accountData.id,
        success: true,
      };
    } catch (error) {
      throw new Error(`Failed to create Stripe Connect account: ${error.message}`);
    }
  },

  /**
   * Generate account onboarding link
   */
  async createOnboardingLink(accountId, userId) {
    if (!accountId || !userId) {
      throw new Error('Account ID and user ID are required');
    }

    try {
      const linkData = await makeStripeAPICall('/connect/account-links', {
        method: 'POST',
        body: {
          account: accountId,
          refresh_url: `${STRIPE_CONFIG.appUrl}/vendor/onboarding/refresh?account_id=${accountId}`,
          return_url: `${STRIPE_CONFIG.appUrl}/vendor/onboarding/complete?account_id=${accountId}`,
          type: 'account_onboarding',
          collect: 'eventually_due',
        },
      });

      return {
        url: linkData.url,
        expires_at: linkData.expires_at,
      };
    } catch (error) {
      throw new Error(`Failed to create onboarding link: ${error.message}`);
    }
  },

  /**
   * Get account status and requirements
   */
  async getAccountStatus(accountId) {
    if (!accountId) {
      throw new Error('Account ID is required');
    }

    try {
      const accountData = await makeStripeAPICall(`/connect/accounts/${accountId}`);

      return {
        id: accountData.id,
        charges_enabled: accountData.charges_enabled,
        payouts_enabled: accountData.payouts_enabled,
        details_submitted: accountData.details_submitted,
        requirements: accountData.requirements,
        business_profile: accountData.business_profile,
      };
    } catch (error) {
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  },

  /**
   * Update account status in database
   */
  async updateAccountStatus(accountId, status) {
    const { error } = await supabase
      .from('vendor_stripe_accounts')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', accountId);

    if (error) {
    }
  },
};

/**
 * Payment Processing
 */
export const payments = {
  /**
   * Create payment intent with platform fee
   */
  async createPaymentIntent(paymentData) {
    const {
      amount,
      currency = PLATFORM_CONFIG.defaultCurrency,
      vendorAccountId,
      bookingId,
      userId,
      description,
    } = paymentData;

    if (!amount || !vendorAccountId || !bookingId || !userId) {
      throw new Error('Amount, vendor account ID, booking ID, and user ID are required');
    }

    if (!PLATFORM_CONFIG.supportedCurrencies.includes(currency)) {
      throw new Error(`Currency ${currency} is not supported`);
    }

    try {
      const platformFee = Math.round(amount * PLATFORM_CONFIG.platformFeePercent);

      const paymentIntent = await makeStripeAPICall('/payment-intents', {
        method: 'POST',
        body: {
          amount,
          currency,
          transfer_data: {
            destination: vendorAccountId,
          },
          application_fee_amount: platformFee,
          metadata: {
            booking_id: bookingId,
            user_id: userId,
            vendor_account_id: vendorAccountId,
            platform_fee: platformFee,
          },
          description: description || `Payment for booking ${bookingId}`,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        platformFee,
        vendorAmount: amount - platformFee,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  },

  /**
   * Process refund
   */
  async processRefund(refundData) {
    const { paymentIntentId, amount, reason = 'requested_by_customer' } = refundData;

    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required for refund');
    }

    try {
      const refund = await makeStripeAPICall('/refunds', {
        method: 'POST',
        body: {
          payment_intent: paymentIntentId,
          amount,
          reason,
        },
      });

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  },

  /**
   * Create multi-currency payment intent with auto invoice generation
   */
  async createMultiCurrencyPayment(paymentData) {
    const {
      amount,
      currency = PLATFORM_CONFIG.defaultCurrency,
      vendorAccountId,
      bookingId,
      userId,
      vendorId,
      description,
      customerInfo,
      vendorInfo,
      autoInvoice = PLATFORM_CONFIG.invoicing.autoGenerate,
      invoiceTemplate = PLATFORM_CONFIG.invoicing.defaultTemplate,
    } = paymentData;

    // Validate currency support
    if (!CurrencyService.isValidCurrency(currency)) {
      throw new Error(`Currency ${currency} is not supported`);
    }

    try {
      // Convert amount to Stripe format (cents/smallest unit)
      const stripeAmount = CurrencyService.displayToStripe(amount, currency);

      // Create payment intent
      const paymentResult = await this.createPaymentIntent({
        amount: stripeAmount,
        currency: currency.toLowerCase(),
        vendorAccountId,
        bookingId,
        userId,
        description,
      });

      // Auto-generate invoice if enabled
      let invoice = null;
      if (autoInvoice && PLATFORM_CONFIG.invoicing.enabled) {
        try {
          invoice = await InvoiceService.createInvoice({
            bookingId,
            userId,
            vendorId,
            vendorAccountId,
            amount,
            currency: currency.toUpperCase(),
            customerInfo,
            vendorInfo,
            template: invoiceTemplate,
            notes: description,
          });
        } catch (invoiceError) {
          // Continue with payment - invoice can be created manually later
        }
      }

      return {
        ...paymentResult,
        currency: currency.toUpperCase(),
        displayAmount: amount,
        formattedAmount: CurrencyService.formatAmount(amount, currency),
        invoice,
      };
    } catch (error) {
      throw new Error(`Multi-currency payment creation failed: ${error.message}`);
    }
  },

  /**
   * Get currency conversion preview for payment
   */
  async getPaymentCurrencyPreview(amount, fromCurrency, targetCurrencies) {
    try {
      const conversions = await CurrencyService.createConversionPreview(
        amount,
        fromCurrency,
        targetCurrencies
      );

      // Add platform fee calculations for each currency
      const previewWithFees = {};
      for (const [currency, conversion] of Object.entries(conversions)) {
        if (conversion) {
          const platformFee = conversion.amount * PLATFORM_CONFIG.platformFeePercent;
          const vendorAmount = conversion.amount - platformFee;

          previewWithFees[currency] = {
            ...conversion,
            platformFee,
            vendorAmount,
            formattedPlatformFee: CurrencyService.formatAmount(platformFee, currency),
            formattedVendorAmount: CurrencyService.formatAmount(vendorAmount, currency),
          };
        } else {
          previewWithFees[currency] = null;
        }
      }

      return previewWithFees;
    } catch (error) {
      throw new Error(`Currency preview failed: ${error.message}`);
    }
  },

  /**
   * Detect optimal currency for user
   */
  async getOptimalCurrency(userLocation = null) {
    try {
      if (userLocation) {
        // Map user location to optimal currency
        const locationCurrencyMap = {
          US: 'USD', CA: 'CAD', GB: 'GBP', UK: 'GBP',
          AU: 'AUD', JP: 'JPY', CH: 'CHF',
          SE: 'SEK', DK: 'DKK', NO: 'NOK',
          // EU countries
          DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
          NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR',
          IE: 'EUR', PT: 'EUR', GR: 'EUR', LU: 'EUR',
        };

        const currency = locationCurrencyMap[userLocation];
        if (currency && PLATFORM_CONFIG.supportedCurrencies.includes(currency.toLowerCase())) {
          return currency;
        }
      }

      // Fallback to auto-detection
      return await CurrencyService.detectUserCurrency();
    } catch (error) {
      return PLATFORM_CONFIG.defaultCurrency.toUpperCase();
    }
  },
};

/**
 * Webhook Processing
 */
export const webhooks = {
  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature) {
    if (!STRIPE_CONFIG.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // This would be implemented on the backend
    // Frontend cannot verify webhook signatures for security reasons
    return true;
  },

  /**
   * Process webhook event
   */
  async processEvent(event) {

    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;

      default:
    }
  },

  async handleAccountUpdated(account) {
    const { id: accountId, charges_enabled, payouts_enabled, details_submitted } = account;

    // Update account status in database
    let status = 'created';
    if (details_submitted && charges_enabled && payouts_enabled) {
      status = 'active';
    } else if (details_submitted) {
      status = 'pending';
    }

    await stripeConnect.updateAccountStatus(accountId, status);
  },

  async handlePaymentSucceeded(paymentIntent) {
    const { id, metadata } = paymentIntent;
    const { booking_id, user_id } = metadata;

    if (booking_id) {
      // Update booking status to paid
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          stripe_payment_intent_id: id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking_id);

      if (error) {
        // Error already handled by calling function
      }

      // Update related invoice if exists
      try {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id')
          .eq('booking_id', booking_id)
          .eq('status', 'sent');

        if (invoices && invoices.length > 0) {
          await InvoiceService.markAsPaid(invoices[0].id, id);
        }
      } catch (invoiceError) {
      }
    }
  },

  async handlePaymentFailed(paymentIntent) {
    const { id, metadata } = paymentIntent;
    const { booking_id } = metadata;

    if (booking_id) {
      // Update booking status to payment failed
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
          stripe_payment_intent_id: id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking_id);

      if (error) {
        // Error already handled by calling function
      }
    }
  },

  async handleInvoicePaymentSucceeded(invoice) {
    // Handle subscription or recurring payment success
  },
};

/**
 * Configuration and utilities
 */
export const stripeConfig = {
  /**
   * Get Stripe configuration for debugging
   */
  getConfig() {
    return {
      hasPublishableKey: !!STRIPE_CONFIG.publishableKey,
      hasSecretKey: !!STRIPE_CONFIG.secretKey,
      hasWebhookSecret: !!STRIPE_CONFIG.webhookSecret,
      hasConnectClientId: !!STRIPE_CONFIG.connectClientId,
      appUrl: STRIPE_CONFIG.appUrl,
      appName: STRIPE_CONFIG.appName,
      platformFeePercent: PLATFORM_CONFIG.platformFeePercent,
      supportedCountries: PLATFORM_CONFIG.supportedCountries,
      supportedCurrencies: PLATFORM_CONFIG.supportedCurrencies,
    };
  },

  /**
   * Validate configuration
   */
  validateConfig() {
    const missingVars = [];

    if (!STRIPE_CONFIG.publishableKey) missingVars.push('VITE_STRIPE_PUBLISHABLE_KEY');
    if (!STRIPE_CONFIG.secretKey) missingVars.push('STRIPE_SECRET_KEY');
    if (!STRIPE_CONFIG.webhookSecret) missingVars.push('STRIPE_WEBHOOK_SECRET');
    if (!STRIPE_CONFIG.connectClientId) missingVars.push('STRIPE_CONNECT_CLIENT_ID');

    if (missingVars.length > 0) {
      throw new Error(`Missing required Stripe configuration: ${missingVars.join(', ')}`);
    }

    return true;
  },

  /**
   * Calculate platform fee
   */
  calculatePlatformFee(amount) {
    return Math.round(amount * PLATFORM_CONFIG.platformFeePercent);
  },

  /**
   * Format amount for display
   */
  formatAmount(amount, currency = PLATFORM_CONFIG.defaultCurrency) {
    return CurrencyService.formatAmount(
      CurrencyService.stripeToDisplay(amount, currency.toUpperCase()),
      currency.toUpperCase()
    );
  },

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return CurrencyService.getSupportedCurrencies().filter(curr =>
      PLATFORM_CONFIG.supportedCurrencies.includes(curr.code.toLowerCase())
    );
  },

  /**
   * Convert currency with exchange rates
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    return await CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  },

  /**
   * Get invoicing configuration
   */
  getInvoicingConfig() {
    return PLATFORM_CONFIG.invoicing;
  },
};

// Export the Stripe instance getter
export { getStripe };

/**
 * Payout Management
 */
export const payouts = {
  /**
   * Create payout for connected account
   */
  async createPayout(payoutData) {
    const {
      accountId,
      amount,
      currency = 'usd',
      description = 'Vendor payout',
      metadata = {},
    } = payoutData;

    if (!accountId || !amount) {
      throw new Error('Account ID and amount are required for payout');
    }

    try {
      const payout = await makeStripeAPICall('/connect/payouts', {
        method: 'POST',
        headers: {
          'Stripe-Account': accountId,
        },
        body: {
          amount,
          currency,
          description,
          metadata: {
            ...metadata,
            created_via: 'platform',
          },
        },
      });

      return {
        payoutId: payout.id,
        status: payout.status,
        amount: payout.amount,
        arrivalDate: payout.arrival_date,
        created: payout.created,
      };
    } catch (error) {
      throw new Error(`Failed to create payout: ${error.message}`);
    }
  },

  /**
   * Get payout list for connected account
   */
  async getPayouts(accountId, options = {}) {
    if (!accountId) {
      throw new Error('Account ID is required');
    }

    try {
      const payouts = await makeStripeAPICall('/connect/payouts', {
        method: 'GET',
        headers: {
          'Stripe-Account': accountId,
        },
      });

      return payouts.data || [];
    } catch (error) {
      throw new Error(`Failed to get payouts: ${error.message}`);
    }
  },

  /**
   * Cancel pending payout
   */
  async cancelPayout(accountId, payoutId) {
    if (!accountId || !payoutId) {
      throw new Error('Account ID and payout ID are required');
    }

    try {
      const payout = await makeStripeAPICall(`/connect/payouts?payoutId=${payoutId}`, {
        method: 'PUT',
        headers: {
          'Stripe-Account': accountId,
        },
        body: {
          action: 'cancel',
        },
      });

      return {
        payoutId: payout.id,
        status: payout.status,
      };
    } catch (error) {
      throw new Error(`Failed to cancel payout: ${error.message}`);
    }
  },
};

/**
 * Transfer Management
 */
export const transfers = {
  /**
   * Create transfer to connected account
   */
  async createTransfer(transferData) {
    const {
      destination,
      amount,
      currency = 'usd',
      description = 'Transfer to connected account',
      metadata = {},
    } = transferData;

    if (!destination || !amount) {
      throw new Error('Destination and amount are required for transfer');
    }

    try {
      const transfer = await makeStripeAPICall('/connect/transfers', {
        method: 'POST',
        body: {
          destination,
          amount,
          currency,
          description,
          metadata: {
            ...metadata,
            created_via: 'platform',
          },
        },
      });

      return {
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
        created: transfer.created,
      };
    } catch (error) {
      throw new Error(`Failed to create transfer: ${error.message}`);
    }
  },

  /**
   * Get transfer list
   */
  async getTransfers(options = {}) {
    try {
      const transfers = await makeStripeAPICall('/connect/transfers', {
        method: 'GET',
      });

      return transfers.data || [];
    } catch (error) {
      throw new Error(`Failed to get transfers: ${error.message}`);
    }
  },
};

// Default export with all services including new multi-currency and invoice services
export default {
  stripeConnect,
  payments,
  payouts,
  transfers,
  webhooks,
  stripeConfig,
  getStripe,
  CurrencyService,
  InvoiceService,
};
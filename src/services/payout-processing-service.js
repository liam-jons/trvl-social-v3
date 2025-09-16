/**
 * Payout Processing Service
 * Handles actual payout processing with Stripe Connect transfers
 */

import { supabase } from '../lib/supabase.js';

// Configuration
const PAYOUT_CONFIG = {
  defaultCurrency: 'usd',
  maxBatchSize: 100,
  retryAttempts: 3,
  retryDelayMs: 5000,
  holdPeriodDays: 7,
  minimumPayoutAmount: 1000, // $10.00 in cents
  maximumPayoutAmount: 100000000, // $1,000,000 in cents
  supportedCurrencies: ['usd', 'eur', 'gbp', 'aud', 'cad'],
};

class PayoutProcessingService {
  constructor() {
    this.processingLocks = new Set();
    this.retryQueue = new Map();
  }

  /**
   * Process vendor payout with Stripe Connect transfer
   */
  async processVendorPayout(payoutData) {
    const {
      vendorStripeAccountId,
      amount,
      currency = PAYOUT_CONFIG.defaultCurrency,
      description = 'Vendor payout',
      metadata = {},
    } = payoutData;

    // Validate inputs
    if (!vendorStripeAccountId || !amount) {
      throw new Error('Vendor Stripe account ID and amount are required');
    }

    if (amount < PAYOUT_CONFIG.minimumPayoutAmount) {
      throw new Error(`Payout amount must be at least ${PAYOUT_CONFIG.minimumPayoutAmount} cents`);
    }

    if (amount > PAYOUT_CONFIG.maximumPayoutAmount) {
      throw new Error(`Payout amount cannot exceed ${PAYOUT_CONFIG.maximumPayoutAmount} cents`);
    }

    // Check for concurrent processing
    const lockKey = `payout_${vendorStripeAccountId}`;
    if (this.processingLocks.has(lockKey)) {
      throw new Error('Payout already in progress for this vendor');
    }

    this.processingLocks.add(lockKey);

    try {
      // Get vendor account details
      const vendorAccount = await this.getVendorAccount(vendorStripeAccountId);
      if (!vendorAccount) {
        throw new Error('Vendor account not found');
      }

      // Validate account can receive payouts
      await this.validatePayoutEligibility(vendorAccount);

      // Calculate platform fees and net amount
      const payoutCalculation = await this.calculatePayoutAmount(vendorStripeAccountId, amount);

      // Get pending payments for this payout
      const pendingPayments = await this.getPendingPayments(vendorStripeAccountId, amount);

      // Create payout record
      const payoutRecord = await this.createPayoutRecord({
        vendorAccount,
        amount: payoutCalculation.netAmount,
        platformFee: payoutCalculation.platformFee,
        currency,
        description,
        metadata,
        pendingPayments,
      });

      // Process Stripe transfer
      const stripeResult = await this.processStripeTransfer({
        vendorAccount,
        payoutRecord,
        amount: payoutCalculation.netAmount,
        currency,
        description,
        metadata: {
          ...metadata,
          payout_id: payoutRecord.id,
          platform_fee: payoutCalculation.platformFee,
        },
      });

      // Update payout record with Stripe details
      await this.updatePayoutRecord(payoutRecord.id, {
        stripe_payout_id: stripeResult.id,
        status: stripeResult.status,
        arrival_date: stripeResult.arrival_date,
        created_at_stripe: new Date(stripeResult.created * 1000),
      });

      // Mark payments as paid out
      await this.markPaymentsAsPaidOut(pendingPayments.map(p => p.id), payoutRecord.id);

      console.log(`Successfully processed payout for vendor ${vendorAccount.stripe_account_id}: ${payoutCalculation.netAmount} cents`);

      return {
        success: true,
        payoutId: payoutRecord.id,
        stripePayoutId: stripeResult.id,
        amount: payoutCalculation.netAmount,
        platformFee: payoutCalculation.platformFee,
        status: stripeResult.status,
        arrivalDate: stripeResult.arrival_date,
      };

    } catch (error) {
      console.error('Payout processing failed:', error);

      // Log failure for retry/analysis
      await this.logPayoutFailure(vendorStripeAccountId, error, payoutData);

      return {
        success: false,
        error: error.message,
        shouldRetry: this.shouldRetryPayout(error),
      };

    } finally {
      this.processingLocks.delete(lockKey);
    }
  }

  /**
   * Get vendor account details
   */
  async getVendorAccount(vendorStripeAccountId) {
    const { data, error } = await supabase
      .from('vendor_stripe_accounts')
      .select('*')
      .eq('id', vendorStripeAccountId)
      .single();

    if (error) {
      throw new Error(`Failed to get vendor account: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate that vendor account can receive payouts
   */
  async validatePayoutEligibility(vendorAccount) {
    if (vendorAccount.status !== 'active') {
      throw new Error(`Vendor account status is ${vendorAccount.status}, payouts disabled`);
    }

    if (!vendorAccount.payouts_enabled) {
      throw new Error('Payouts not enabled for vendor account');
    }

    // Check for any holds
    const { data: holds, error } = await supabase
      .from('payout_holds')
      .select('*')
      .eq('vendor_stripe_account_id', vendorAccount.id)
      .eq('status', 'active');

    if (error) {
      console.warn('Could not check payout holds:', error);
    }

    if (holds && holds.length > 0) {
      const activeHold = holds[0];
      throw new Error(`Payouts on hold: ${activeHold.reason || 'Manual hold'}`);
    }

    return true;
  }

  /**
   * Calculate payout amount after platform fees
   */
  async calculatePayoutAmount(vendorStripeAccountId, grossAmount) {
    try {
      // Get platform fee rate for this vendor
      const { data: account, error } = await supabase
        .from('vendor_stripe_accounts')
        .select('platform_fee_percent')
        .eq('id', vendorStripeAccountId)
        .single();

      if (error) throw error;

      const feePercent = account.platform_fee_percent || 5.0;
      const platformFee = Math.round(grossAmount * (feePercent / 100));
      const netAmount = grossAmount - platformFee;

      return {
        grossAmount,
        platformFee,
        netAmount,
        feePercent,
      };
    } catch (error) {
      console.error('Failed to calculate payout amount:', error);
      throw error;
    }
  }

  /**
   * Get pending payments for payout
   */
  async getPendingPayments(vendorStripeAccountId, maxAmount) {
    const { data, error } = await supabase
      .from('booking_payments')
      .select(`
        id,
        booking_id,
        amount,
        net_amount,
        platform_fee_amount,
        currency,
        stripe_charge_id,
        created_at
      `)
      .eq('vendor_stripe_account_id', vendorStripeAccountId)
      .eq('status', 'completed')
      .in('payout_status', ['pending', 'eligible'])
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get pending payments: ${error.message}`);
    }

    // Select payments up to the payout amount
    let totalAmount = 0;
    const selectedPayments = [];

    for (const payment of data) {
      if (totalAmount + payment.net_amount <= maxAmount) {
        selectedPayments.push(payment);
        totalAmount += payment.net_amount;
      } else {
        break;
      }
    }

    return selectedPayments;
  }

  /**
   * Create payout record in database
   */
  async createPayoutRecord(payoutData) {
    const {
      vendorAccount,
      amount,
      platformFee,
      currency,
      description,
      metadata,
      pendingPayments,
    } = payoutData;

    const payoutRecord = {
      vendor_stripe_account_id: vendorAccount.id,
      amount,
      currency,
      status: 'processing',
      payout_type: 'standard',
      platform_fee_amount: platformFee,
      booking_count: pendingPayments.length,
      period_start: pendingPayments.length > 0 ? pendingPayments[0].created_at : new Date(),
      period_end: pendingPayments.length > 0 ? pendingPayments[pendingPayments.length - 1].created_at : new Date(),
      metadata: {
        description,
        ...metadata,
        payment_ids: pendingPayments.map(p => p.id),
      },
    };

    const { data, error } = await supabase
      .from('vendor_payouts')
      .insert(payoutRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payout record: ${error.message}`);
    }

    // Create line items for this payout
    const lineItems = pendingPayments.map(payment => ({
      payout_id: data.id,
      booking_id: payment.booking_id,
      payment_id: payment.id,
      gross_amount: payment.amount,
      platform_fee_amount: payment.platform_fee_amount,
      net_amount: payment.net_amount,
      currency: payment.currency,
      stripe_charge_id: payment.stripe_charge_id,
    }));

    if (lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('payout_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        console.error('Failed to create payout line items:', lineItemsError);
      }
    }

    return data;
  }

  /**
   * Process Stripe Connect transfer
   */
  async processStripeTransfer(transferData) {
    const { vendorAccount, payoutRecord, amount, currency, description, metadata } = transferData;

    try {
      // Make API call to backend Stripe service
      const response = await fetch('/api/stripe/connect/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: vendorAccount.stripe_account_id,
          amount,
          currency,
          description,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stripe transfer failed: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const transferResult = await response.json();

      // Also create Stripe payout for the transfer
      const payoutResponse = await fetch('/api/stripe/connect/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Account': vendorAccount.stripe_account_id,
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          metadata: {
            ...metadata,
            transfer_id: transferResult.id,
          },
        }),
      });

      if (!payoutResponse.ok) {
        const errorData = await payoutResponse.json().catch(() => ({}));
        throw new Error(`Stripe payout failed: ${payoutResponse.status} - ${errorData.error || payoutResponse.statusText}`);
      }

      const payoutResult = await payoutResponse.json();

      return {
        id: payoutResult.id,
        status: payoutResult.status,
        arrival_date: payoutResult.arrival_date,
        created: payoutResult.created,
        transfer_id: transferResult.id,
      };

    } catch (error) {
      console.error('Stripe transfer failed:', error);
      throw error;
    }
  }

  /**
   * Update payout record with Stripe results
   */
  async updatePayoutRecord(payoutId, updates) {
    const { error } = await supabase
      .from('vendor_payouts')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', payoutId);

    if (error) {
      console.error('Failed to update payout record:', error);
    }
  }

  /**
   * Mark payments as paid out
   */
  async markPaymentsAsPaidOut(paymentIds, payoutId) {
    const { error } = await supabase
      .from('booking_payments')
      .update({
        payout_status: 'paid_out',
        payout_id: payoutId,
        payout_date: new Date(),
      })
      .in('id', paymentIds);

    if (error) {
      console.error('Failed to mark payments as paid out:', error);
    }
  }

  /**
   * Log payout failure for analysis
   */
  async logPayoutFailure(vendorStripeAccountId, error, payoutData) {
    try {
      await supabase
        .from('payout_failures')
        .insert({
          vendor_stripe_account_id: vendorStripeAccountId,
          error_message: error.message,
          error_details: JSON.stringify({
            error: error.stack,
            payoutData,
            timestamp: new Date().toISOString(),
          }),
          requires_manual_review: true,
        });
    } catch (logError) {
      console.error('Failed to log payout failure:', logError);
    }
  }

  /**
   * Determine if payout should be retried
   */
  shouldRetryPayout(error) {
    const retryableErrors = [
      'network_error',
      'rate_limit',
      'temporary_failure',
      'insufficient_funds',
    ];

    return retryableErrors.some(retryable =>
      error.message.toLowerCase().includes(retryable.toLowerCase())
    );
  }

  /**
   * Process batch payouts for multiple vendors
   */
  async processBatchPayouts(vendorPayouts) {
    const results = [];
    const batchSize = Math.min(vendorPayouts.length, PAYOUT_CONFIG.maxBatchSize);

    console.log(`Processing batch of ${batchSize} payouts`);

    for (let i = 0; i < vendorPayouts.length; i += batchSize) {
      const batch = vendorPayouts.slice(i, i + batchSize);
      const batchPromises = batch.map(payout => this.processVendorPayout(payout));

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Batch processing error:', error);
      }

      // Add delay between batches to avoid rate limits
      if (i + batchSize < vendorPayouts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Batch processing complete: ${successful} successful, ${failed} failed`);

    return {
      totalProcessed: results.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get payout history for a vendor
   */
  async getPayoutHistory(vendorStripeAccountId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      status = null,
      startDate = null,
      endDate = null,
    } = options;

    let query = supabase
      .from('vendor_payouts')
      .select(`
        *,
        payout_line_items (
          id,
          booking_id,
          gross_amount,
          platform_fee_amount,
          net_amount,
          currency
        )
      `)
      .eq('vendor_stripe_account_id', vendorStripeAccountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get payout history: ${error.message}`);
    }

    return data;
  }

  /**
   * Get payout statistics for a vendor
   */
  async getPayoutStatistics(vendorStripeAccountId) {
    try {
      // Get basic stats
      const { data: stats, error } = await supabase
        .from('vendor_payouts')
        .select('amount, platform_fee_amount, status, created_at')
        .eq('vendor_stripe_account_id', vendorStripeAccountId);

      if (error) throw error;

      const totalPayouts = stats.length;
      const totalAmount = stats.reduce((sum, p) => sum + p.amount, 0);
      const totalFees = stats.reduce((sum, p) => sum + (p.platform_fee_amount || 0), 0);

      const statusBreakdown = stats.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      // Get pending amount
      const { data: pending, error: pendingError } = await supabase
        .from('booking_payments')
        .select('net_amount')
        .eq('vendor_stripe_account_id', vendorStripeAccountId)
        .eq('status', 'completed')
        .in('payout_status', ['pending', 'eligible']);

      const pendingAmount = pending ? pending.reduce((sum, p) => sum + p.net_amount, 0) : 0;

      return {
        totalPayouts,
        totalAmount,
        totalFees,
        pendingAmount,
        statusBreakdown,
        averagePayoutAmount: totalPayouts > 0 ? Math.round(totalAmount / totalPayouts) : 0,
      };

    } catch (error) {
      console.error('Failed to get payout statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const payoutProcessingService = new PayoutProcessingService();

export { payoutProcessingService, PAYOUT_CONFIG };
export default payoutProcessingService;
/**
 * Payment Reconciliation Service
 * Handles comprehensive payment reconciliation, transaction matching, and discrepancy detection
 */

import { supabase } from '../lib/supabase.js';

// Configuration for reconciliation logic
const RECONCILIATION_CONFIG = {
  matchingToleranceAmount: 50, // cents - allow small differences due to processing fees
  matchingTimeWindowHours: 72, // match transactions within this time window
  autoReconcileThreshold: 1000, // cents - auto-reconcile below this amount
  discrepancyTypes: {
    MISSING_STRIPE_RECORD: 'missing_stripe_record',
    MISSING_DATABASE_RECORD: 'missing_database_record',
    AMOUNT_MISMATCH: 'amount_mismatch',
    STATUS_MISMATCH: 'status_mismatch',
    DUPLICATE_PAYMENT: 'duplicate_payment',
    ORPHANED_PAYOUT: 'orphaned_payout',
    TIMING_DISCREPANCY: 'timing_discrepancy',
  },
  reconciliationStatuses: {
    MATCHED: 'matched',
    PENDING: 'pending',
    DISCREPANCY: 'discrepancy',
    MANUAL_REVIEW: 'manual_review',
    RESOLVED: 'resolved',
  },
};

class PaymentReconciliationService {
  constructor() {
    this.reconciliationCache = new Map();
    this.lastFullReconciliation = null;
  }

  /**
   * Perform comprehensive payment reconciliation
   */
  async performFullReconciliation(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      vendorAccountId = null,
      forceRefresh = false,
    } = options;

    try {
      console.log('Starting full payment reconciliation...');

      // Get all payment data from multiple sources
      const [
        databasePayments,
        stripePayments,
        payouts,
        refunds,
      ] = await Promise.all([
        this.getDatabasePayments(startDate, endDate, vendorAccountId),
        this.getStripePayments(startDate, endDate, vendorAccountId),
        this.getPayoutData(startDate, endDate, vendorAccountId),
        this.getRefundData(startDate, endDate, vendorAccountId),
      ]);

      // Create transaction matching engine
      const matchingResults = await this.performTransactionMatching({
        databasePayments,
        stripePayments,
        payouts,
        refunds,
      });

      // Detect discrepancies
      const discrepancies = await this.detectDiscrepancies(matchingResults);

      // Calculate reconciliation summary
      const summary = this.calculateReconciliationSummary({
        matchingResults,
        discrepancies,
        databasePayments,
        stripePayments,
      });

      // Store reconciliation results
      const reconciliationRecord = await this.storeReconciliationResults({
        startDate,
        endDate,
        vendorAccountId,
        matchingResults,
        discrepancies,
        summary,
      });

      this.lastFullReconciliation = new Date();

      return {
        success: true,
        reconciliationId: reconciliationRecord.id,
        summary,
        discrepancies,
        matchingResults,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Full reconciliation failed:', error);
      throw new Error(`Reconciliation failed: ${error.message}`);
    }
  }

  /**
   * Get payment data from database
   */
  async getDatabasePayments(startDate, endDate, vendorAccountId = null) {
    let query = supabase
      .from('booking_payments')
      .select(`
        id,
        booking_id,
        stripe_payment_intent_id,
        stripe_charge_id,
        amount,
        net_amount,
        platform_fee_amount,
        currency,
        status,
        payout_status,
        payout_id,
        created_at,
        updated_at,
        metadata,
        bookings (
          id,
          adventure_title,
          vendor_user_id
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (vendorAccountId) {
      query = query.eq('vendor_stripe_account_id', vendorAccountId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get database payments: ${error.message}`);

    return data || [];
  }

  /**
   * Get payment data from Stripe (via backend API)
   */
  async getStripePayments(startDate, endDate, vendorAccountId = null) {
    try {
      const params = new URLSearchParams({
        created_gte: Math.floor(startDate.getTime() / 1000),
        created_lte: Math.floor(endDate.getTime() / 1000),
        limit: 100,
      });

      if (vendorAccountId) {
        params.append('account', vendorAccountId);
      }

      const response = await fetch(`/api/stripe/payments?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Stripe API call failed: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];

    } catch (error) {
      console.error('Failed to get Stripe payments:', error);
      throw error;
    }
  }

  /**
   * Get payout data
   */
  async getPayoutData(startDate, endDate, vendorAccountId = null) {
    let query = supabase
      .from('vendor_payouts')
      .select(`
        id,
        vendor_stripe_account_id,
        stripe_payout_id,
        amount,
        currency,
        status,
        created_at,
        arrival_date,
        payout_line_items (
          id,
          payment_id,
          gross_amount,
          net_amount,
          platform_fee_amount
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (vendorAccountId) {
      query = query.eq('vendor_stripe_account_id', vendorAccountId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get payout data: ${error.message}`);

    return data || [];
  }

  /**
   * Get refund data
   */
  async getRefundData(startDate, endDate, vendorAccountId = null) {
    let query = supabase
      .from('payment_refunds')
      .select(`
        id,
        payment_id,
        stripe_refund_id,
        amount,
        currency,
        status,
        reason,
        created_at,
        booking_payments (
          vendor_stripe_account_id
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get refund data: ${error.message}`);

    // Filter by vendor if specified
    if (vendorAccountId && data) {
      return data.filter(refund =>
        refund.booking_payments?.vendor_stripe_account_id === vendorAccountId
      );
    }

    return data || [];
  }

  /**
   * Perform transaction matching between different data sources
   */
  async performTransactionMatching(data) {
    const { databasePayments, stripePayments, payouts, refunds } = data;
    const matchingResults = {
      matched: [],
      unmatched: [],
      partialMatches: [],
    };

    // Create lookup maps for efficient matching
    const stripePaymentMap = new Map(
      stripePayments.map(payment => [payment.id, payment])
    );
    const payoutMap = new Map();
    payouts.forEach(payout => {
      payout.payout_line_items?.forEach(item => {
        payoutMap.set(item.payment_id, { ...payout, lineItem: item });
      });
    });

    // Match database payments with Stripe records
    for (const dbPayment of databasePayments) {
      const stripePayment = stripePaymentMap.get(dbPayment.stripe_payment_intent_id) ||
                           stripePaymentMap.get(dbPayment.stripe_charge_id);

      const payoutInfo = payoutMap.get(dbPayment.id);

      const match = {
        databasePayment: dbPayment,
        stripePayment,
        payoutInfo,
        matchScore: this.calculateMatchScore(dbPayment, stripePayment, payoutInfo),
        discrepancies: [],
        status: RECONCILIATION_CONFIG.reconciliationStatuses.PENDING,
      };

      // Validate match quality
      if (stripePayment) {
        match.discrepancies = this.validatePaymentMatch(dbPayment, stripePayment);

        if (match.discrepancies.length === 0) {
          match.status = RECONCILIATION_CONFIG.reconciliationStatuses.MATCHED;
          matchingResults.matched.push(match);
        } else if (match.matchScore > 0.8) {
          match.status = RECONCILIATION_CONFIG.reconciliationStatuses.DISCREPANCY;
          matchingResults.partialMatches.push(match);
        } else {
          match.status = RECONCILIATION_CONFIG.reconciliationStatuses.MANUAL_REVIEW;
          matchingResults.unmatched.push(match);
        }
      } else {
        match.discrepancies.push({
          type: RECONCILIATION_CONFIG.discrepancyTypes.MISSING_STRIPE_RECORD,
          description: 'No matching Stripe payment found',
          severity: 'high',
        });
        matchingResults.unmatched.push(match);
      }
    }

    // Find orphaned Stripe payments (exist in Stripe but not in database)
    for (const stripePayment of stripePayments) {
      const foundInDb = databasePayments.find(dbPayment =>
        dbPayment.stripe_payment_intent_id === stripePayment.id ||
        dbPayment.stripe_charge_id === stripePayment.id
      );

      if (!foundInDb) {
        matchingResults.unmatched.push({
          databasePayment: null,
          stripePayment,
          payoutInfo: null,
          matchScore: 0,
          discrepancies: [{
            type: RECONCILIATION_CONFIG.discrepancyTypes.MISSING_DATABASE_RECORD,
            description: 'Stripe payment not found in database',
            severity: 'high',
          }],
          status: RECONCILIATION_CONFIG.reconciliationStatuses.MANUAL_REVIEW,
        });
      }
    }

    return matchingResults;
  }

  /**
   * Calculate match score between database and Stripe payment
   */
  calculateMatchScore(dbPayment, stripePayment, payoutInfo) {
    if (!stripePayment) return 0;

    let score = 0;
    let totalChecks = 0;

    // Amount matching (most important)
    totalChecks += 3;
    const amountDiff = Math.abs(dbPayment.amount - stripePayment.amount);
    if (amountDiff === 0) {
      score += 3;
    } else if (amountDiff <= RECONCILIATION_CONFIG.matchingToleranceAmount) {
      score += 2;
    } else if (amountDiff <= RECONCILIATION_CONFIG.matchingToleranceAmount * 2) {
      score += 1;
    }

    // Currency matching
    totalChecks += 1;
    if (dbPayment.currency === stripePayment.currency) {
      score += 1;
    }

    // Status matching
    totalChecks += 1;
    const statusMatch = this.mapStripeStatusToDb(stripePayment.status) === dbPayment.status;
    if (statusMatch) {
      score += 1;
    }

    // Timing check (within reasonable window)
    totalChecks += 1;
    const dbTime = new Date(dbPayment.created_at).getTime();
    const stripeTime = new Date(stripePayment.created * 1000).getTime();
    const timeDiff = Math.abs(dbTime - stripeTime);
    const timeWindow = RECONCILIATION_CONFIG.matchingTimeWindowHours * 60 * 60 * 1000;

    if (timeDiff <= timeWindow) {
      score += 1;
    }

    return score / totalChecks;
  }

  /**
   * Validate payment match and identify discrepancies
   */
  validatePaymentMatch(dbPayment, stripePayment) {
    const discrepancies = [];

    // Amount validation
    const amountDiff = Math.abs(dbPayment.amount - stripePayment.amount);
    if (amountDiff > RECONCILIATION_CONFIG.matchingToleranceAmount) {
      discrepancies.push({
        type: RECONCILIATION_CONFIG.discrepancyTypes.AMOUNT_MISMATCH,
        description: `Amount difference: DB ${dbPayment.amount} vs Stripe ${stripePayment.amount}`,
        severity: amountDiff > 1000 ? 'high' : 'medium',
        dbValue: dbPayment.amount,
        stripeValue: stripePayment.amount,
        difference: amountDiff,
      });
    }

    // Status validation
    const expectedDbStatus = this.mapStripeStatusToDb(stripePayment.status);
    if (dbPayment.status !== expectedDbStatus) {
      discrepancies.push({
        type: RECONCILIATION_CONFIG.discrepancyTypes.STATUS_MISMATCH,
        description: `Status mismatch: DB ${dbPayment.status} vs expected ${expectedDbStatus}`,
        severity: 'medium',
        dbValue: dbPayment.status,
        expectedValue: expectedDbStatus,
      });
    }

    // Currency validation
    if (dbPayment.currency !== stripePayment.currency) {
      discrepancies.push({
        type: RECONCILIATION_CONFIG.discrepancyTypes.AMOUNT_MISMATCH,
        description: `Currency mismatch: DB ${dbPayment.currency} vs Stripe ${stripePayment.currency}`,
        severity: 'high',
        dbValue: dbPayment.currency,
        stripeValue: stripePayment.currency,
      });
    }

    // Timing validation
    const dbTime = new Date(dbPayment.created_at).getTime();
    const stripeTime = new Date(stripePayment.created * 1000).getTime();
    const timeDiff = Math.abs(dbTime - stripeTime);
    const timeWindow = RECONCILIATION_CONFIG.matchingTimeWindowHours * 60 * 60 * 1000;

    if (timeDiff > timeWindow) {
      discrepancies.push({
        type: RECONCILIATION_CONFIG.discrepancyTypes.TIMING_DISCREPANCY,
        description: `Time difference exceeds window: ${Math.round(timeDiff / (60 * 60 * 1000))} hours`,
        severity: 'low',
        dbValue: dbPayment.created_at,
        stripeValue: new Date(stripePayment.created * 1000).toISOString(),
        timeDifferenceHours: Math.round(timeDiff / (60 * 60 * 1000)),
      });
    }

    return discrepancies;
  }

  /**
   * Map Stripe payment status to database status
   */
  mapStripeStatusToDb(stripeStatus) {
    const statusMap = {
      'succeeded': 'completed',
      'pending': 'pending',
      'requires_payment_method': 'failed',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'pending',
      'canceled': 'cancelled',
    };

    return statusMap[stripeStatus] || 'unknown';
  }

  /**
   * Detect various types of discrepancies
   */
  async detectDiscrepancies(matchingResults) {
    const discrepancies = [];

    // High-value discrepancies
    matchingResults.partialMatches.forEach(match => {
      match.discrepancies.forEach(discrepancy => {
        if (discrepancy.severity === 'high' ||
            (discrepancy.type === RECONCILIATION_CONFIG.discrepancyTypes.AMOUNT_MISMATCH &&
             discrepancy.difference > 1000)) {
          discrepancies.push({
            ...discrepancy,
            matchId: match.databasePayment?.id || match.stripePayment?.id,
            priority: 'high',
            autoResolvable: false,
          });
        }
      });
    });

    // Duplicate payments detection
    const paymentAmounts = new Map();
    matchingResults.matched.concat(matchingResults.partialMatches).forEach(match => {
      if (match.databasePayment) {
        const key = `${match.databasePayment.amount}_${match.databasePayment.booking_id}`;
        if (paymentAmounts.has(key)) {
          discrepancies.push({
            type: RECONCILIATION_CONFIG.discrepancyTypes.DUPLICATE_PAYMENT,
            description: `Potential duplicate payment for booking ${match.databasePayment.booking_id}`,
            severity: 'high',
            matchId: match.databasePayment.id,
            duplicateId: paymentAmounts.get(key),
            priority: 'high',
            autoResolvable: false,
          });
        } else {
          paymentAmounts.set(key, match.databasePayment.id);
        }
      }
    });

    // Orphaned payouts (payouts without corresponding payments)
    // This would be detected during payout reconciliation

    return discrepancies;
  }

  /**
   * Calculate reconciliation summary
   */
  calculateReconciliationSummary(data) {
    const { matchingResults, discrepancies, databasePayments, stripePayments } = data;

    const totalDbPayments = databasePayments.length;
    const totalStripePayments = stripePayments.length;
    const matchedCount = matchingResults.matched.length;
    const partialMatchCount = matchingResults.partialMatches.length;
    const unmatchedCount = matchingResults.unmatched.length;

    const totalDbAmount = databasePayments.reduce((sum, p) => sum + p.amount, 0);
    const totalStripeAmount = stripePayments.reduce((sum, p) => sum + p.amount, 0);
    const matchedDbAmount = matchingResults.matched.reduce((sum, m) =>
      sum + (m.databasePayment?.amount || 0), 0);

    const highSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'high').length;
    const mediumSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'medium').length;
    const lowSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'low').length;

    return {
      reconciliationRate: totalDbPayments > 0 ? (matchedCount / totalDbPayments) * 100 : 0,
      totalTransactions: {
        database: totalDbPayments,
        stripe: totalStripePayments,
      },
      matchingResults: {
        matched: matchedCount,
        partialMatches: partialMatchCount,
        unmatched: unmatchedCount,
      },
      amountReconciliation: {
        databaseTotal: totalDbAmount,
        stripeTotal: totalStripeAmount,
        matchedAmount: matchedDbAmount,
        variance: totalDbAmount - totalStripeAmount,
        variancePercentage: totalStripeAmount > 0 ?
          ((totalDbAmount - totalStripeAmount) / totalStripeAmount) * 100 : 0,
      },
      discrepancySummary: {
        total: discrepancies.length,
        high: highSeverityDiscrepancies,
        medium: mediumSeverityDiscrepancies,
        low: lowSeverityDiscrepancies,
      },
      healthScore: this.calculateHealthScore({
        reconciliationRate: (matchedCount / totalDbPayments) * 100,
        discrepancyCount: discrepancies.length,
        totalTransactions: totalDbPayments,
      }),
    };
  }

  /**
   * Calculate overall reconciliation health score
   */
  calculateHealthScore({ reconciliationRate, discrepancyCount, totalTransactions }) {
    let score = 100;

    // Deduct points for low reconciliation rate
    if (reconciliationRate < 95) {
      score -= (95 - reconciliationRate) * 2;
    }

    // Deduct points for discrepancies
    const discrepancyRate = totalTransactions > 0 ? (discrepancyCount / totalTransactions) * 100 : 0;
    if (discrepancyRate > 1) {
      score -= (discrepancyRate - 1) * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Store reconciliation results in database
   */
  async storeReconciliationResults(data) {
    const { startDate, endDate, vendorAccountId, matchingResults, discrepancies, summary } = data;

    try {
      // Create main reconciliation record
      const { data: reconciliationRecord, error } = await supabase
        .from('payment_reconciliations')
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          vendor_account_id: vendorAccountId,
          total_transactions: summary.totalTransactions.database,
          matched_transactions: summary.matchingResults.matched,
          unmatched_transactions: summary.matchingResults.unmatched,
          discrepancy_count: summary.discrepancySummary.total,
          reconciliation_rate: summary.reconciliationRate,
          health_score: summary.healthScore,
          amount_variance: summary.amountReconciliation.variance,
          status: 'completed',
          metadata: {
            summary,
            processing_time: new Date(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Store individual discrepancies
      if (discrepancies.length > 0) {
        const discrepancyRecords = discrepancies.map(discrepancy => ({
          reconciliation_id: reconciliationRecord.id,
          transaction_id: discrepancy.matchId,
          discrepancy_type: discrepancy.type,
          description: discrepancy.description,
          severity: discrepancy.severity,
          auto_resolvable: discrepancy.autoResolvable || false,
          details: {
            ...discrepancy,
            matchId: undefined, // Remove to avoid duplication
          },
        }));

        const { error: discrepancyError } = await supabase
          .from('payment_discrepancies')
          .insert(discrepancyRecords);

        if (discrepancyError) {
          console.error('Failed to store discrepancies:', discrepancyError);
        }
      }

      return reconciliationRecord;

    } catch (error) {
      console.error('Failed to store reconciliation results:', error);
      throw error;
    }
  }

  /**
   * Get reconciliation history
   */
  async getReconciliationHistory(options = {}) {
    const {
      limit = 50,
      offset = 0,
      vendorAccountId = null,
      startDate = null,
      endDate = null,
    } = options;

    let query = supabase
      .from('payment_reconciliations')
      .select(`
        *,
        payment_discrepancies (
          id,
          discrepancy_type,
          severity,
          description,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (vendorAccountId) {
      query = query.eq('vendor_account_id', vendorAccountId);
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  /**
   * Resolve discrepancy
   */
  async resolveDiscrepancy(discrepancyId, resolution) {
    const { action, notes, resolvedBy } = resolution;

    const { error } = await supabase
      .from('payment_discrepancies')
      .update({
        status: 'resolved',
        resolution_action: action,
        resolution_notes: notes,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', discrepancyId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Auto-resolve simple discrepancies
   */
  async autoResolveDiscrepancies(reconciliationId) {
    const { data: discrepancies, error } = await supabase
      .from('payment_discrepancies')
      .select('*')
      .eq('reconciliation_id', reconciliationId)
      .eq('auto_resolvable', true)
      .eq('status', 'pending');

    if (error) throw error;

    const resolved = [];
    for (const discrepancy of discrepancies) {
      try {
        await this.resolveDiscrepancy(discrepancy.id, {
          action: 'auto_resolved',
          notes: 'Automatically resolved based on tolerance rules',
          resolvedBy: 'system',
        });
        resolved.push(discrepancy.id);
      } catch (error) {
        console.error(`Failed to auto-resolve discrepancy ${discrepancy.id}:`, error);
      }
    }

    return { resolvedCount: resolved.length, resolvedIds: resolved };
  }

  /**
   * Generate reconciliation report
   */
  async generateReconciliationReport(reconciliationId, format = 'json') {
    const { data: reconciliation, error } = await supabase
      .from('payment_reconciliations')
      .select(`
        *,
        payment_discrepancies (*)
      `)
      .eq('id', reconciliationId)
      .single();

    if (error) throw error;

    const report = {
      reconciliation,
      generatedAt: new Date().toISOString(),
      format,
    };

    if (format === 'csv') {
      // Generate CSV format for accounting systems
      return this.generateCSVReport(report);
    }

    return report;
  }

  /**
   * Generate CSV report for accounting systems
   */
  generateCSVReport(report) {
    const { reconciliation } = report;

    const headers = [
      'Date',
      'Total Transactions',
      'Matched',
      'Unmatched',
      'Discrepancies',
      'Reconciliation Rate',
      'Health Score',
      'Amount Variance',
      'Status',
    ];

    const row = [
      new Date(reconciliation.created_at).toLocaleDateString(),
      reconciliation.total_transactions,
      reconciliation.matched_transactions,
      reconciliation.unmatched_transactions,
      reconciliation.discrepancy_count,
      `${reconciliation.reconciliation_rate.toFixed(2)}%`,
      reconciliation.health_score,
      reconciliation.amount_variance / 100, // Convert to dollars
      reconciliation.status,
    ];

    return {
      csv: [headers.join(','), row.join(',')].join('\n'),
      filename: `reconciliation-${reconciliation.id}-${new Date().toISOString().split('T')[0]}.csv`,
    };
  }
}

// Create and export singleton instance
const paymentReconciliationService = new PaymentReconciliationService();

export { paymentReconciliationService, RECONCILIATION_CONFIG };
export default paymentReconciliationService;
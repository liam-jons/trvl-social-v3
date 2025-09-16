/**
 * Payment Audit Service
 * Handles creation and management of payment audit trail entries
 */

import { supabase } from '../lib/supabase.js';

class PaymentAuditService {
  constructor() {
    this.pendingEntries = new Map();
    this.batchInterval = 5000; // 5 seconds
    this.maxBatchSize = 50;
    this.setupBatchProcessing();
  }

  /**
   * Setup batch processing for audit entries
   */
  setupBatchProcessing() {
    setInterval(() => {
      this.processPendingEntries();
    }, this.batchInterval);
  }

  /**
   * Log payment action to audit trail
   */
  async logPaymentAction(actionData) {
    const {
      paymentId,
      action,
      performedBy,
      previousValues = {},
      newValues = {},
      metadata = {},
      ipAddress = null,
      userAgent = null,
    } = actionData;

    if (!paymentId || !action || !performedBy) {
      throw new Error('Payment ID, action, and performedBy are required for audit logging');
    }

    const auditEntry = {
      payment_id: paymentId,
      action,
      previous_values: previousValues,
      new_values: newValues,
      performed_by: performedBy,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'payment_audit_service',
      },
      created_at: new Date().toISOString(),
    };

    try {
      // For critical actions, log immediately
      if (this.isCriticalAction(action)) {
        return await this.insertAuditEntry(auditEntry);
      }

      // For non-critical actions, batch for performance
      const entryId = `${paymentId}_${Date.now()}`;
      this.pendingEntries.set(entryId, auditEntry);

      // If batch is full, process immediately
      if (this.pendingEntries.size >= this.maxBatchSize) {
        await this.processPendingEntries();
      }

      return { success: true, entryId };

    } catch (error) {
      console.error('Failed to log payment action:', error);
      throw error;
    }
  }

  /**
   * Check if action is critical and should be logged immediately
   */
  isCriticalAction(action) {
    const criticalActions = [
      'payment_refunded',
      'payment_failed',
      'discrepancy_detected',
      'security_violation',
      'fraud_detected',
      'payout_processed',
      'account_suspended',
    ];

    return criticalActions.includes(action);
  }

  /**
   * Insert single audit entry
   */
  async insertAuditEntry(entry) {
    const { error } = await supabase
      .from('payment_audit_trail')
      .insert(entry);

    if (error) {
      console.error('Failed to insert audit entry:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Process pending audit entries in batch
   */
  async processPendingEntries() {
    if (this.pendingEntries.size === 0) return;

    const entries = Array.from(this.pendingEntries.values());
    this.pendingEntries.clear();

    try {
      const { error } = await supabase
        .from('payment_audit_trail')
        .insert(entries);

      if (error) {
        console.error('Failed to batch insert audit entries:', error);
        // Re-queue entries for retry
        entries.forEach((entry, index) => {
          this.pendingEntries.set(`retry_${Date.now()}_${index}`, entry);
        });
      } else {
        console.log(`Successfully logged ${entries.length} audit entries`);
      }

    } catch (error) {
      console.error('Batch audit logging failed:', error);
      // Re-queue entries for retry
      entries.forEach((entry, index) => {
        this.pendingEntries.set(`retry_${Date.now()}_${index}`, entry);
      });
    }
  }

  /**
   * Log payment creation
   */
  async logPaymentCreated(paymentData, performedBy, request = {}) {
    return this.logPaymentAction({
      paymentId: paymentData.id,
      action: 'payment_created',
      performedBy,
      newValues: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
      },
      metadata: {
        booking_id: paymentData.booking_id,
        vendor_account_id: paymentData.vendor_stripe_account_id,
      },
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });
  }

  /**
   * Log payment status change
   */
  async logPaymentStatusChange(paymentId, oldStatus, newStatus, performedBy, request = {}) {
    return this.logPaymentAction({
      paymentId,
      action: 'status_changed',
      performedBy,
      previousValues: { status: oldStatus },
      newValues: { status: newStatus },
      metadata: {
        status_transition: `${oldStatus} -> ${newStatus}`,
      },
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });
  }

  /**
   * Log payment refund
   */
  async logPaymentRefund(paymentId, refundData, performedBy, request = {}) {
    return this.logPaymentAction({
      paymentId,
      action: 'payment_refunded',
      performedBy,
      newValues: {
        refund_amount: refundData.amount,
        refund_reason: refundData.reason,
        stripe_refund_id: refundData.stripe_refund_id,
      },
      metadata: {
        refund_id: refundData.id,
        partial_refund: refundData.partial,
      },
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });
  }

  /**
   * Log reconciliation match
   */
  async logReconciliationMatch(paymentId, matchData, performedBy = 'system') {
    return this.logPaymentAction({
      paymentId,
      action: 'reconciliation_matched',
      performedBy,
      newValues: {
        match_score: matchData.matchScore,
        reconciliation_status: 'matched',
      },
      metadata: {
        reconciliation_id: matchData.reconciliationId,
        stripe_payment_id: matchData.stripePaymentId,
        match_type: matchData.matchType,
      },
    });
  }

  /**
   * Log discrepancy detection
   */
  async logDiscrepancyDetected(paymentId, discrepancyData, performedBy = 'system') {
    return this.logPaymentAction({
      paymentId,
      action: 'discrepancy_detected',
      performedBy,
      newValues: {
        discrepancy_type: discrepancyData.type,
        discrepancy_severity: discrepancyData.severity,
      },
      metadata: {
        discrepancy_id: discrepancyData.id,
        description: discrepancyData.description,
        auto_resolvable: discrepancyData.autoResolvable,
      },
    });
  }

  /**
   * Log discrepancy resolution
   */
  async logDiscrepancyResolved(paymentId, resolutionData, performedBy, request = {}) {
    return this.logPaymentAction({
      paymentId,
      action: 'discrepancy_resolved',
      performedBy,
      previousValues: {
        discrepancy_status: 'pending',
      },
      newValues: {
        discrepancy_status: 'resolved',
        resolution_action: resolutionData.action,
      },
      metadata: {
        discrepancy_id: resolutionData.discrepancyId,
        resolution_notes: resolutionData.notes,
      },
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });
  }

  /**
   * Log payout processing
   */
  async logPayoutProcessed(paymentIds, payoutData, performedBy = 'system') {
    const promises = paymentIds.map(paymentId =>
      this.logPaymentAction({
        paymentId,
        action: 'payout_processed',
        performedBy,
        newValues: {
          payout_status: 'paid_out',
          payout_id: payoutData.id,
          payout_amount: payoutData.amount,
        },
        metadata: {
          payout_id: payoutData.id,
          stripe_payout_id: payoutData.stripe_payout_id,
          arrival_date: payoutData.arrival_date,
        },
      })
    );

    return Promise.all(promises);
  }

  /**
   * Log payment amount change
   */
  async logPaymentAmountChange(paymentId, oldAmount, newAmount, reason, performedBy, request = {}) {
    return this.logPaymentAction({
      paymentId,
      action: 'payment_updated',
      performedBy,
      previousValues: { amount: oldAmount },
      newValues: { amount: newAmount },
      metadata: {
        change_reason: reason,
        amount_difference: newAmount - oldAmount,
      },
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(paymentId, violationType, details, request = {}) {
    return this.logPaymentAction({
      paymentId,
      action: 'security_violation',
      performedBy: 'system',
      metadata: {
        violation_type: violationType,
        details,
        requires_review: true,
      },
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });
  }

  /**
   * Get audit trail for payment
   */
  async getPaymentAuditTrail(paymentId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      action = null,
      startDate = null,
      endDate = null,
    } = options;

    let query = supabase
      .from('payment_audit_trail')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get payment audit trail: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get audit summary for payment
   */
  async getPaymentAuditSummary(paymentId) {
    try {
      const { data, error } = await supabase
        .from('payment_audit_trail')
        .select('action, performed_by, created_at')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const actions = data || [];
      const actionCounts = actions.reduce((acc, entry) => {
        acc[entry.action] = (acc[entry.action] || 0) + 1;
        return acc;
      }, {});

      const performers = [...new Set(actions.map(entry => entry.performed_by))];
      const lastActivity = actions.length > 0 ? actions[0].created_at : null;

      return {
        totalEntries: actions.length,
        actionCounts,
        performers,
        lastActivity,
        recentActions: actions.slice(0, 5),
      };

    } catch (error) {
      console.error('Failed to get payment audit summary:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for multiple payments
   */
  async getBulkAuditTrail(paymentIds, options = {}) {
    const {
      limit = 100,
      action = null,
      startDate = null,
      endDate = null,
    } = options;

    let query = supabase
      .from('payment_audit_trail')
      .select('*')
      .in('payment_id', paymentIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get bulk audit trail: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search audit trail
   */
  async searchAuditTrail(searchParams) {
    const {
      query: searchQuery,
      action,
      performedBy,
      startDate,
      endDate,
      paymentIds = [],
      limit = 100,
    } = searchParams;

    let query = supabase
      .from('payment_audit_trail')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (paymentIds.length > 0) {
      query = query.in('payment_id', paymentIds);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (performedBy) {
      query = query.eq('performed_by', performedBy);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (searchQuery) {
      // This would require full-text search setup in Supabase
      // For now, filter on client side
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search audit trail: ${error.message}`);
    }

    let results = data || [];

    // Client-side search filtering if query provided
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(entry =>
        entry.action.toLowerCase().includes(lowerQuery) ||
        entry.performed_by.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(entry.metadata).toLowerCase().includes(lowerQuery)
      );
    }

    return results;
  }

  /**
   * Cleanup old audit entries (for maintenance)
   */
  async cleanupOldEntries(retentionDays = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const { error } = await supabase
        .from('payment_audit_trail')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`Cleaned up audit entries older than ${retentionDays} days`);
      return { success: true };

    } catch (error) {
      console.error('Failed to cleanup old audit entries:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const paymentAuditService = new PaymentAuditService();

export { paymentAuditService };
export default paymentAuditService;
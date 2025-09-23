/**
 * Payment Refund Service - Handle automatic refunds for failed collections
 * Integrates with Stripe for processing refunds and manages refund workflows
 */
import { supabase } from '../lib/supabase.js';
import { payments } from './stripe-service.js';
import { groupPaymentManager, getSplitPaymentConfig } from './split-payment-service.js';
import { notificationService } from './notification-service.js';
// Refund configuration
const REFUND_CONFIG = {
  reasons: {
    INSUFFICIENT_PAYMENTS: 'insufficient_group_payments',
    BOOKING_CANCELLED: 'booking_cancelled',
    VENDOR_REQUEST: 'vendor_requested',
    CUSTOMER_REQUEST: 'requested_by_customer',
    FRAUD: 'fraudulent',
    DUPLICATE: 'duplicate',
  },
  policies: {
    autoRefundThreshold: 0.8, // Auto refund if less than 80% collected
    refundProcessingDays: 3, // Max days to process refunds
    partialRefundMinimum: 0.5, // Minimum threshold for partial refunds
    cancellationFeePercent: 0.0, // Platform cancellation fee (0% by default)
  },
  notifications: {
    refundInitiated: true,
    refundCompleted: true,
    refundFailed: true,
  },
};
/**
 * Automatic refund management
 */
export const automaticRefundManager = {
  /**
   * Process automatic refunds for failed group payments
   */
  async processAutomaticRefunds() {
    try {
      // Find split payments that need refund processing
      const candidatePayments = await this.findRefundCandidates();
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      };
      for (const payment of candidatePayments) {
        try {
          const refundResult = await this.processPaymentRefund(payment);
          results.processed++;
          if (refundResult.success) {
            results.successful++;
          } else {
            results.failed++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            paymentId: payment.id,
            error: error.message,
          });
        }
      }
      return results;
    } catch (error) {
      throw error;
    }
  },
  /**
   * Find split payments that are candidates for automatic refunding
   */
  async findRefundCandidates() {
    try {
      const config = getSplitPaymentConfig();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.refundProcessingDays);
      // Find payments that are past deadline and haven't met minimum threshold
      const { data: payments, error } = await supabase
        .from('split_payments')
        .select(`
          *,
          individual_payments (*)
        `)
        .in('status', ['pending', 'partially_paid'])
        .lt('payment_deadline', new Date().toISOString())
        .gt('created_at', cutoffDate.toISOString()); // Don't process very old payments
      if (error) throw error;
      // Filter payments that don't meet minimum threshold
      const candidates = payments.filter(payment => {
        const stats = groupPaymentManager.calculatePaymentStats(payment.individual_payments);
        return !stats.meetsMinimumThreshold;
      });
      return candidates;
    } catch (error) {
      throw new Error(`Failed to find refund candidates: ${error.message}`);
    }
  },
  /**
   * Process refund for a specific split payment
   */
  async processPaymentRefund(splitPayment) {
    try {
      // Get current payment statistics
      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);
      // Determine refund strategy
      const refundStrategy = this.determineRefundStrategy(stats, splitPayment);
      if (refundStrategy.action === 'no_action') {
        return { success: true, action: 'no_action', reason: refundStrategy.reason };
      }
      // Update split payment status first
      await supabase
        .from('split_payments')
        .update({
          status: 'processing_refunds',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);
      // Process refunds for paid participants
      const refundResults = await this.processIndividualRefunds(
        splitPayment,
        refundStrategy
      );
      // Update final status based on refund results
      const finalStatus = refundResults.allSuccessful
        ? 'cancelled_refunded'
        : 'cancelled_partial_refund';
      await supabase
        .from('split_payments')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);
      // Update booking status if applicable
      await this.updateBookingStatus(splitPayment.booking_id, finalStatus);
      // Send notifications
      await this.sendRefundNotifications(splitPayment, refundResults);
      return {
        success: true,
        action: refundStrategy.action,
        refundResults,
        finalStatus,
      };
    } catch (error) {
      // Mark as failed
      await supabase
        .from('split_payments')
        .update({
          status: 'refund_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);
      throw new Error(`Failed to process refund for payment ${splitPayment.id}: ${error.message}`);
    }
  },
  /**
   * Determine the appropriate refund strategy
   */
  determineRefundStrategy(stats, splitPayment) {
    const config = getSplitPaymentConfig();
    // If no payments have been made, no refunds needed
    if (stats.totalPaid === 0) {
      return {
        action: 'cancel_only',
        reason: 'no_payments_to_refund',
      };
    }
    // If minimum threshold is met, shouldn't refund (this shouldn't happen in auto processing)
    if (stats.meetsMinimumThreshold) {
      return {
        action: 'no_action',
        reason: 'minimum_threshold_met',
      };
    }
    // Determine refund amount based on policy
    let refundType = 'full';
    let refundAmount = stats.totalPaid;
    // Apply cancellation fee if configured
    if (REFUND_CONFIG.policies.cancellationFeePercent > 0) {
      const cancellationFee = Math.round(
        stats.totalPaid * REFUND_CONFIG.policies.cancellationFeePercent
      );
      refundAmount = stats.totalPaid - cancellationFee;
      refundType = 'partial_with_fee';
    }
    return {
      action: 'refund',
      refundType,
      refundAmount,
      originalAmount: stats.totalPaid,
      reason: REFUND_CONFIG.reasons.INSUFFICIENT_PAYMENTS,
    };
  },
  /**
   * Process refunds for individual participants
   */
  async processIndividualRefunds(splitPayment, refundStrategy) {
    const results = {
      attempted: 0,
      successful: 0,
      failed: 0,
      refundDetails: [],
      allSuccessful: false,
    };
    // Get all paid individual payments
    const paidPayments = splitPayment.individual_payments.filter(
      p => p.status === 'paid' && p.stripe_payment_intent_id
    );
    results.attempted = paidPayments.length;
    for (const individualPayment of paidPayments) {
      try {
        const refundResult = await this.processIndividualRefund(
          individualPayment,
          refundStrategy,
          splitPayment.id
        );
        if (refundResult.success) {
          results.successful++;
        } else {
          results.failed++;
        }
        results.refundDetails.push({
          individualPaymentId: individualPayment.id,
          userId: individualPayment.user_id,
          originalAmount: individualPayment.amount_paid || individualPayment.amount_due,
          refundAmount: refundResult.refundAmount,
          success: refundResult.success,
          stripeRefundId: refundResult.stripeRefundId,
          error: refundResult.error,
        });
      } catch (error) {
        results.failed++;
        results.refundDetails.push({
          individualPaymentId: individualPayment.id,
          userId: individualPayment.user_id,
          originalAmount: individualPayment.amount_paid || individualPayment.amount_due,
          refundAmount: 0,
          success: false,
          error: error.message,
        });
      }
    }
    results.allSuccessful = results.successful === results.attempted && results.failed === 0;
    return results;
  },
  /**
   * Process refund for an individual payment
   */
  async processIndividualRefund(individualPayment, refundStrategy, splitPaymentId) {
    try {
      const originalAmount = individualPayment.amount_paid || individualPayment.amount_due;
      // Calculate refund amount based on strategy
      let refundAmount = originalAmount;
      if (refundStrategy.refundType === 'partial_with_fee') {
        const feeAmount = Math.round(originalAmount * REFUND_CONFIG.policies.cancellationFeePercent);
        refundAmount = originalAmount - feeAmount;
      }
      // Process Stripe refund
      const stripeRefund = await payments.processRefund({
        paymentIntentId: individualPayment.stripe_payment_intent_id,
        amount: refundAmount,
        reason: refundStrategy.reason,
      });
      // Create refund record
      const { data: refundRecord, error: refundError } = await supabase
        .from('payment_refunds')
        .insert({
          individual_payment_id: individualPayment.id,
          split_payment_id: splitPaymentId,
          stripe_refund_id: stripeRefund.refundId,
          refund_amount: refundAmount,
          refund_reason: refundStrategy.reason,
          status: stripeRefund.status,
          processed_at: new Date().toISOString(),
          metadata: {
            originalAmount,
            refundStrategy: refundStrategy.refundType,
            automaticRefund: true,
          },
        })
        .select()
        .single();
      if (refundError) {
      }
      // Update individual payment status
      await supabase
        .from('individual_payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', individualPayment.id);
      return {
        success: true,
        refundAmount,
        stripeRefundId: stripeRefund.refundId,
        refundRecordId: refundRecord?.id,
      };
    } catch (error) {
      // Create failed refund record
      try {
        await supabase
          .from('payment_refunds')
          .insert({
            individual_payment_id: individualPayment.id,
            split_payment_id: splitPaymentId,
            stripe_refund_id: null,
            refund_amount: 0,
            refund_reason: refundStrategy.reason,
            status: 'failed',
            metadata: {
              error: error.message,
              automaticRefund: true,
            },
          });
      } catch (recordError) {
      }
      return {
        success: false,
        refundAmount: 0,
        error: error.message,
      };
    }
  },
  /**
   * Update booking status based on refund results
   */
  async updateBookingStatus(bookingId, refundStatus) {
    try {
      let bookingStatus = 'cancelled';
      let paymentStatus = 'refunded';
      if (refundStatus === 'cancelled_partial_refund') {
        paymentStatus = 'partially_refunded';
      }
      await supabase
        .from('bookings')
        .update({
          status: bookingStatus,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
    } catch (error) {
    }
  },
  /**
   * Send refund notifications to participants
   */
  async sendRefundNotifications(splitPayment, refundResults) {
    try {
      // Notify organizer
      await this.notifyOrganizer(splitPayment, refundResults);
      // Notify participants
      for (const refundDetail of refundResults.refundDetails) {
        await this.notifyParticipant(refundDetail, splitPayment);
      }
    } catch (error) {
    }
  },
  /**
   * Notify organizer about refund processing
   */
  async notifyOrganizer(splitPayment, refundResults) {
    try {
      const notification = {
        userId: splitPayment.organizer_id,
        type: 'refund_processed',
        title: 'Group Payment Refunds Processed',
        message: `Refunds have been processed for your group payment. ${refundResults.successful} of ${refundResults.attempted} refunds were successful.`,
        data: {
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          successfulRefunds: refundResults.successful,
          totalRefunds: refundResults.attempted,
          refundReason: 'insufficient_group_payments',
        },
        channels: ['push', 'email'],
        priority: 'high',
      };
      await notificationService.sendNotification(notification);
    } catch (error) {
    }
  },
  /**
   * Notify participant about their refund
   */
  async notifyParticipant(refundDetail, splitPayment) {
    try {
      if (!refundDetail.success) {
        return; // Don't notify about failed refunds automatically
      }
      const notification = {
        userId: refundDetail.userId,
        type: 'refund_issued',
        title: 'Refund Processed',
        message: `Your refund of $${(refundDetail.refundAmount / 100).toFixed(2)} has been processed. It should appear in your account within 5-10 business days.`,
        data: {
          refundAmount: refundDetail.refundAmount,
          originalAmount: refundDetail.originalAmount,
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          stripeRefundId: refundDetail.stripeRefundId,
        },
        channels: ['push', 'email'],
        priority: 'normal',
      };
      await notificationService.sendNotification(notification);
    } catch (error) {
    }
  },
};
/**
 * Manual refund management for organizers
 */
export const manualRefundManager = {
  /**
   * Process manual refund request from organizer
   */
  async processManualRefund(refundRequest) {
    const {
      splitPaymentId,
      organizerId,
      reason = REFUND_CONFIG.reasons.CUSTOMER_REQUEST,
      refundType = 'full', // 'full', 'partial', 'custom'
      customAmounts = null, // For custom refund amounts
    } = refundRequest;
    try {
      // Verify organizer permissions
      const { data: splitPayment, error: paymentError } = await supabase
        .from('split_payments')
        .select('*, individual_payments (*)')
        .eq('id', splitPaymentId)
        .eq('organizer_id', organizerId)
        .single();
      if (paymentError || !splitPayment) {
        throw new Error('Split payment not found or access denied');
      }
      // Check if refunds can be processed
      if (!['completed', 'partially_paid', 'pending'].includes(splitPayment.status)) {
        throw new Error('Refunds cannot be processed for payments in this status');
      }
      // Create refund strategy
      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);
      const refundStrategy = this.createManualRefundStrategy(
        stats,
        reason,
        refundType,
        customAmounts
      );
      // Process refunds
      const refundResults = await automaticRefundManager.processIndividualRefunds(
        splitPayment,
        refundStrategy
      );
      // Update split payment status
      const finalStatus = refundResults.allSuccessful
        ? 'cancelled_refunded'
        : 'cancelled_partial_refund';
      await supabase
        .from('split_payments')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPaymentId);
      // Update booking status
      await automaticRefundManager.updateBookingStatus(
        splitPayment.booking_id,
        finalStatus
      );
      // Send notifications
      await automaticRefundManager.sendRefundNotifications(splitPayment, refundResults);
      return {
        success: true,
        refundResults,
        finalStatus,
      };
    } catch (error) {
      throw new Error(`Manual refund failed: ${error.message}`);
    }
  },
  /**
   * Create manual refund strategy
   */
  createManualRefundStrategy(stats, reason, refundType, customAmounts) {
    let refundAmount = stats.totalPaid;
    if (refundType === 'partial') {
      // Apply standard cancellation fee
      const fee = Math.round(stats.totalPaid * REFUND_CONFIG.policies.cancellationFeePercent);
      refundAmount = stats.totalPaid - fee;
    } else if (refundType === 'custom' && customAmounts) {
      // Use custom amounts (this would need more complex logic)
      refundAmount = Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0);
    }
    return {
      action: 'refund',
      refundType,
      refundAmount,
      originalAmount: stats.totalPaid,
      reason,
    };
  },
  /**
   * Get refund options for a split payment
   */
  async getRefundOptions(splitPaymentId, organizerId) {
    try {
      const { data: splitPayment, error } = await supabase
        .from('split_payments')
        .select('*, individual_payments (*)')
        .eq('id', splitPaymentId)
        .eq('organizer_id', organizerId)
        .single();
      if (error) throw error;
      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);
      const paidPayments = splitPayment.individual_payments.filter(p => p.status === 'paid');
      return {
        canRefund: paidPayments.length > 0,
        totalPaid: stats.totalPaid,
        paidParticipants: paidPayments.length,
        refundOptions: [
          {
            type: 'full',
            amount: stats.totalPaid,
            description: 'Full refund to all participants',
          },
          {
            type: 'partial',
            amount: stats.totalPaid - Math.round(stats.totalPaid * REFUND_CONFIG.policies.cancellationFeePercent),
            description: `Refund minus ${(REFUND_CONFIG.policies.cancellationFeePercent * 100)}% cancellation fee`,
          },
        ],
        participantRefunds: paidPayments.map(payment => ({
          participantId: payment.user_id,
          participantName: payment.metadata?.participantName,
          paidAmount: payment.amount_paid || payment.amount_due,
          refundableAmount: payment.amount_paid || payment.amount_due,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get refund options: ${error.message}`);
    }
  },
};
/**
 * Refund monitoring and reporting
 */
export const refundMonitoring = {
  /**
   * Get refund statistics for a time period
   */
  async getRefundStats(organizerId, startDate, endDate) {
    try {
      const { data: refunds, error } = await supabase
        .from('payment_refunds')
        .select(`
          *,
          split_payments!inner (organizer_id),
          individual_payments (amount_due)
        `)
        .eq('split_payments.organizer_id', organizerId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      if (error) throw error;
      const stats = {
        totalRefunds: refunds.length,
        totalRefundAmount: refunds.reduce((sum, refund) => sum + refund.refund_amount, 0),
        successfulRefunds: refunds.filter(r => r.status === 'succeeded').length,
        failedRefunds: refunds.filter(r => r.status === 'failed').length,
        pendingRefunds: refunds.filter(r => r.status === 'processing').length,
        refundsByReason: {},
      };
      // Group by reason
      refunds.forEach(refund => {
        const reason = refund.refund_reason || 'unknown';
        stats.refundsByReason[reason] = (stats.refundsByReason[reason] || 0) + 1;
      });
      return stats;
    } catch (error) {
      throw new Error(`Failed to get refund stats: ${error.message}`);
    }
  },
  /**
   * Get pending refunds that need attention
   */
  async getPendingRefunds(organizerId) {
    try {
      const { data: refunds, error } = await supabase
        .from('payment_refunds')
        .select(`
          *,
          split_payments!inner (organizer_id, description),
          individual_payments (user_id, metadata)
        `)
        .eq('split_payments.organizer_id', organizerId)
        .in('status', ['processing', 'failed'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return refunds;
    } catch (error) {
      throw new Error(`Failed to get pending refunds: ${error.message}`);
    }
  },
};
/**
 * Dispute management for chargebacks and payment disputes
 */
export const disputeManager = {
  /**
   * Process dispute webhook from Stripe
   */
  async processDisputeWebhook(disputeData) {
    try {
      const {
        id: stripeDisputeId,
        amount,
        currency,
        reason,
        status,
        evidence_due_by,
        charge,
        metadata = {},
      } = disputeData;
      // Get payment intent from charge to find related booking
      const { data: existingDispute } = await supabase
        .from('payment_disputes')
        .select('id')
        .eq('stripe_dispute_id', stripeDisputeId)
        .single();
      if (existingDispute) {
        // Update existing dispute
        return await this.updateDispute(existingDispute.id, {
          status,
          amount,
          evidence_due_by,
          updated_at: new Date().toISOString(),
        });
      }
      // Create new dispute record
      const { data: dispute, error } = await supabase
        .from('payment_disputes')
        .insert({
          stripe_dispute_id: stripeDisputeId,
          stripe_charge_id: charge,
          amount,
          currency,
          reason,
          status,
          evidence_due_by,
          customer_message: disputeData.evidence?.customer_communication || null,
          booking_id: metadata.booking_id || null,
          user_id: metadata.user_id || null,
          created_at: new Date().toISOString(),
          metadata: {
            network_reason_code: disputeData.network_reason_code,
            is_charge_refundable: disputeData.is_charge_refundable,
          },
        })
        .select()
        .single();
      if (error) throw error;
      // Send urgent notification to admin
      await this.notifyAdminOfDispute(dispute);
      return dispute;
    } catch (error) {
      throw new Error(`Failed to process dispute webhook: ${error.message}`);
    }
  },
  /**
   * Update dispute status
   */
  async updateDispute(disputeId, updates) {
    try {
      const { data: dispute, error } = await supabase
        .from('payment_disputes')
        .update(updates)
        .eq('id', disputeId)
        .select()
        .single();
      if (error) throw error;
      // Handle status changes
      if (updates.status) {
        await this.handleDisputeStatusChange(dispute, updates.status);
      }
      return dispute;
    } catch (error) {
      throw new Error(`Failed to update dispute: ${error.message}`);
    }
  },
  /**
   * Handle dispute status changes
   */
  async handleDisputeStatusChange(dispute, newStatus) {
    try {
      // Notify relevant parties based on status
      switch (newStatus) {
        case 'won':
          await this.notifyDisputeWon(dispute);
          break;
        case 'lost':
          await this.notifyDisputeLost(dispute);
          break;
        case 'warning_closed':
          await this.notifyDisputeWarningClosed(dispute);
          break;
      }
      // Update booking status if applicable
      if (dispute.booking_id && ['lost', 'charge_refunded'].includes(newStatus)) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'disputed_lost',
            updated_at: new Date().toISOString(),
          })
          .eq('id', dispute.booking_id);
      }
    } catch (error) {
    }
  },
  /**
   * Get dispute evidence requirements
   */
  getEvidenceRequirements(reason) {
    const requirements = {
      duplicate: [
        'receipt',
        'customer_communication',
        'duplicate_charge_documentation',
      ],
      fraudulent: [
        'receipt',
        'shipping_documentation',
        'customer_signature',
        'customer_communication',
        'uncategorized_file',
      ],
      subscription_canceled: [
        'cancellation_policy',
        'customer_communication',
        'uncategorized_file',
      ],
      product_unacceptable: [
        'receipt',
        'product_description',
        'shipping_documentation',
        'customer_communication',
      ],
      product_not_received: [
        'receipt',
        'shipping_documentation',
        'customer_communication',
        'service_documentation',
      ],
      unrecognized: [
        'receipt',
        'customer_communication',
        'billing_agreement',
      ],
      credit_not_processed: [
        'receipt',
        'refund_policy',
        'customer_communication',
      ],
      general: [
        'receipt',
        'customer_communication',
        'uncategorized_file',
      ],
    };
    return requirements[reason] || requirements.general;
  },
  /**
   * Send admin notification for new dispute
   */
  async notifyAdminOfDispute(dispute) {
    try {
      // Get admin users
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');
      if (!admins?.length) return;
      // Create urgent notifications
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'payment_dispute',
        title: 'Urgent: New Payment Dispute',
        message: `A new payment dispute has been received for ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}. Reason: ${dispute.reason}`,
        data: {
          dispute_id: dispute.id,
          stripe_dispute_id: dispute.stripe_dispute_id,
          amount: dispute.amount,
          reason: dispute.reason,
          evidence_due_by: dispute.evidence_due_by,
        },
        channels: ['push', 'email'],
        priority: 'urgent',
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(notifications);
    } catch (error) {
    }
  },
  /**
   * Notify dispute won
   */
  async notifyDisputeWon(dispute) {
    // Implementation for won dispute notifications
  },
  /**
   * Notify dispute lost
   */
  async notifyDisputeLost(dispute) {
    // Implementation for lost dispute notifications
  },
  /**
   * Notify dispute warning closed
   */
  async notifyDisputeWarningClosed(dispute) {
    // Implementation for warning closed notifications
  },
};
/**
 * Refund policy enforcement engine
 */
export const refundPolicyEngine = {
  /**
   * Evaluate refund eligibility based on booking and timing
   */
  async evaluateRefundEligibility(bookingId, requestedAt = new Date()) {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (
            id,
            start_date,
            cancellation_policy,
            vendor_id,
            vendors (refund_policy)
          )
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      const adventure = booking.adventures;
      const policy = adventure.vendors?.refund_policy || adventure.cancellation_policy || {};
      // Calculate time until adventure starts
      const adventureStart = new Date(adventure.start_date);
      const hoursUntilStart = (adventureStart - requestedAt) / (1000 * 60 * 60);
      // Default policy rules
      const defaultPolicy = {
        fullRefundHours: 48, // Full refund if cancelled 48+ hours before
        partialRefundHours: 24, // 50% refund if cancelled 24-48 hours before
        noRefundHours: 0, // No refund if cancelled less than 24 hours before
        emergencyRefundAllowed: true,
        weatherRefundAllowed: true,
      };
      const effectivePolicy = { ...defaultPolicy, ...policy };
      let eligibility = {
        eligible: false,
        refundType: 'none',
        refundPercentage: 0,
        reason: '',
        policyApplied: effectivePolicy,
      };
      // Check booking status
      if (!['confirmed', 'paid'].includes(booking.status)) {
        eligibility.reason = 'Booking is not in a refundable state';
        return eligibility;
      }
      // Apply time-based policy
      if (hoursUntilStart >= effectivePolicy.fullRefundHours) {
        eligibility = {
          eligible: true,
          refundType: 'full',
          refundPercentage: 100,
          reason: `Full refund available - cancelled ${Math.floor(hoursUntilStart)} hours before start`,
          policyApplied: effectivePolicy,
        };
      } else if (hoursUntilStart >= effectivePolicy.partialRefundHours) {
        eligibility = {
          eligible: true,
          refundType: 'partial',
          refundPercentage: 50,
          reason: `Partial refund available - cancelled ${Math.floor(hoursUntilStart)} hours before start`,
          policyApplied: effectivePolicy,
        };
      } else {
        eligibility = {
          eligible: false,
          refundType: 'none',
          refundPercentage: 0,
          reason: `No refund available - cancelled ${Math.floor(hoursUntilStart)} hours before start`,
          policyApplied: effectivePolicy,
        };
      }
      return eligibility;
    } catch (error) {
      throw new Error(`Failed to evaluate refund eligibility: ${error.message}`);
    }
  },
  /**
   * Check if special circumstances apply
   */
  evaluateSpecialCircumstances(reason, evidence = {}) {
    const specialRules = {
      emergency: {
        eligible: true,
        refundPercentage: 100,
        requiresEvidence: true,
        evidenceTypes: ['medical_certificate', 'emergency_documentation'],
      },
      weather: {
        eligible: true,
        refundPercentage: 100,
        requiresEvidence: false,
        autoApprove: true,
      },
      vendor_cancellation: {
        eligible: true,
        refundPercentage: 100,
        requiresEvidence: false,
        autoApprove: true,
      },
      quality_issues: {
        eligible: true,
        refundPercentage: 100,
        requiresEvidence: true,
        evidenceTypes: ['photos', 'witness_statements'],
      },
    };
    return specialRules[reason] || null;
  },
  /**
   * Calculate final refund amount based on policies
   */
  calculateRefundAmount(originalAmount, eligibility, fees = {}) {
    if (!eligibility.eligible) {
      return {
        refundAmount: 0,
        platformFee: 0,
        processingFee: 0,
        netRefund: 0,
      };
    }
    const baseRefund = Math.round(originalAmount * (eligibility.refundPercentage / 100));
    // Calculate fees
    const platformFee = fees.platformFee || 0;
    const processingFee = fees.processingFee || Math.round(baseRefund * 0.029); // 2.9% processing fee
    const netRefund = Math.max(0, baseRefund - platformFee - processingFee);
    return {
      refundAmount: baseRefund,
      platformFee,
      processingFee,
      netRefund,
      breakdown: {
        originalAmount,
        refundPercentage: eligibility.refundPercentage,
        baseRefund,
        fees: platformFee + processingFee,
        finalRefund: netRefund,
      },
    };
  },
};
// Export configuration
export const getRefundConfig = () => REFUND_CONFIG;
// Main export
export default {
  automaticRefundManager,
  manualRefundManager,
  refundMonitoring,
  disputeManager,
  refundPolicyEngine,
  getRefundConfig,
};
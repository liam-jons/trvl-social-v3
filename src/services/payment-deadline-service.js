/**
 * Payment Deadline Enforcement Service
 * Automated system for enforcing payment deadlines and taking appropriate actions
 */
import { supabase } from '../lib/supabase.js';
import { groupPaymentManager, getSplitPaymentConfig } from './split-payment-service.js';
import { automaticRefundManager } from './payment-refund-service.js';
import { paymentCollectionWorkflow } from './payment-collection-service.js';
import { notificationService } from './notification-service.js';
// Deadline enforcement configuration
const DEADLINE_CONFIG = {
  enforcement: {
    gracePeridMinutes: 60, // 1 hour grace period after deadline
    escalationIntervals: [30, 60, 120], // Minutes after grace period for escalations
    finalActionDelayHours: 24, // Hours to wait before final action (refunds/cancellation)
  },
  actions: {
    SEND_OVERDUE_NOTICE: 'send_overdue_notice',
    ESCALATE_TO_ORGANIZER: 'escalate_to_organizer',
    INITIATE_REFUND_PROCESS: 'initiate_refund_process',
    CANCEL_BOOKING: 'cancel_booking',
  },
  thresholds: {
    minimumForContinuation: 0.8, // 80% payment required to continue
    partialAcceptanceThreshold: 0.6, // 60% minimum to consider partial acceptance
  },
};
/**
 * Deadline enforcement engine
 */
export const deadlineEnforcement = {
  /**
   * Main enforcement process - runs periodically
   */
  async enforcePaymentDeadlines() {
    try {
      // Find overdue payments
      const overduePayments = await this.findOverduePayments();
      const results = {
        processed: 0,
        actions: {
          notices: 0,
          escalations: 0,
          refunds: 0,
          cancellations: 0,
        },
        errors: [],
      };
      // Process each overdue payment
      for (const payment of overduePayments) {
        try {
          const actionResult = await this.processOverduePayment(payment);
          results.processed++;
          // Update action counts
          switch (actionResult.action) {
            case DEADLINE_CONFIG.actions.SEND_OVERDUE_NOTICE:
              results.actions.notices++;
              break;
            case DEADLINE_CONFIG.actions.ESCALATE_TO_ORGANIZER:
              results.actions.escalations++;
              break;
            case DEADLINE_CONFIG.actions.INITIATE_REFUND_PROCESS:
              results.actions.refunds++;
              break;
            case DEADLINE_CONFIG.actions.CANCEL_BOOKING:
              results.actions.cancellations++;
              break;
          }
        } catch (error) {
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
   * Find payments that are overdue and need action
   */
  async findOverduePayments() {
    try {
      const now = new Date();
      const graceDeadline = new Date(now.getTime() - DEADLINE_CONFIG.enforcement.gracePeridMinutes * 60 * 1000);
      const { data: payments, error } = await supabase
        .from('split_payments')
        .select(`
          *,
          individual_payments (*),
          bookings (title, status)
        `)
        .in('status', ['pending', 'partially_paid'])
        .lt('payment_deadline', graceDeadline.toISOString())
        .order('payment_deadline', { ascending: true });
      if (error) throw error;
      return payments.filter(payment => {
        // Don't process if already in refund process
        return !payment.status.includes('refund') && !payment.status.includes('cancelled');
      });
    } catch (error) {
      throw new Error(`Failed to find overdue payments: ${error.message}`);
    }
  },
  /**
   * Process a single overdue payment
   */
  async processOverduePayment(splitPayment) {
    try {
      const now = new Date();
      const deadline = new Date(splitPayment.payment_deadline);
      const overdueMinutes = Math.floor((now - deadline) / (1000 * 60));
      // Calculate payment statistics
      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);
      // Determine appropriate action based on overdue time and payment status
      const action = this.determineEnforcementAction(overdueMinutes, stats, splitPayment);
      // Execute the determined action
      const result = await this.executeEnforcementAction(action, splitPayment, stats);
      // Log the action taken
      await this.logEnforcementAction(splitPayment.id, action, result);
      return {
        action: action.type,
        result,
        overdueMinutes,
        paymentStats: stats,
      };
    } catch (error) {
      throw new Error(`Failed to process overdue payment: ${error.message}`);
    }
  },
  /**
   * Determine what action to take based on overdue time and payment status
   */
  determineEnforcementAction(overdueMinutes, stats, splitPayment) {
    const config = DEADLINE_CONFIG;
    const graceMinutes = config.enforcement.gracePeridMinutes;
    const escalationIntervals = config.enforcement.escalationIntervals;
    const finalActionDelayMinutes = config.enforcement.finalActionDelayHours * 60;
    // Calculate time since grace period ended
    const postGraceMinutes = Math.max(0, overdueMinutes - graceMinutes);
    // Check if we're in final action window
    const isInFinalActionWindow = overdueMinutes >= finalActionDelayMinutes;
    // Determine action based on completion percentage and time
    if (stats.meetsMinimumThreshold) {
      // If minimum threshold is met, proceed with booking
      return {
        type: 'proceed_partial',
        reason: 'minimum_threshold_met',
        completionRate: stats.completionPercentage,
      };
    }
    if (isInFinalActionWindow) {
      // Time for final action - refund or cancel
      if (stats.totalPaid > 0) {
        return {
          type: config.actions.INITIATE_REFUND_PROCESS,
          reason: 'insufficient_payments_after_deadline',
          completionRate: stats.completionPercentage,
        };
      } else {
        return {
          type: config.actions.CANCEL_BOOKING,
          reason: 'no_payments_received',
          completionRate: 0,
        };
      }
    }
    // Check escalation intervals
    for (let i = escalationIntervals.length - 1; i >= 0; i--) {
      const intervalMinutes = escalationIntervals[i];
      if (postGraceMinutes >= intervalMinutes) {
        if (i === escalationIntervals.length - 1) {
          // Final escalation - notify organizer
          return {
            type: config.actions.ESCALATE_TO_ORGANIZER,
            reason: 'final_escalation',
            escalationLevel: i + 1,
            completionRate: stats.completionPercentage,
          };
        } else {
          // Send overdue notice
          return {
            type: config.actions.SEND_OVERDUE_NOTICE,
            reason: 'payment_overdue',
            escalationLevel: i + 1,
            completionRate: stats.completionPercentage,
          };
        }
      }
    }
    // First overdue notice
    return {
      type: config.actions.SEND_OVERDUE_NOTICE,
      reason: 'initial_overdue_notice',
      escalationLevel: 0,
      completionRate: stats.completionPercentage,
    };
  },
  /**
   * Execute the determined enforcement action
   */
  async executeEnforcementAction(action, splitPayment, stats) {
    switch (action.type) {
      case DEADLINE_CONFIG.actions.SEND_OVERDUE_NOTICE:
        return await this.sendOverdueNotice(splitPayment, stats, action);
      case DEADLINE_CONFIG.actions.ESCALATE_TO_ORGANIZER:
        return await this.escalateToOrganizer(splitPayment, stats, action);
      case DEADLINE_CONFIG.actions.INITIATE_REFUND_PROCESS:
        return await this.initiateRefundProcess(splitPayment, stats, action);
      case DEADLINE_CONFIG.actions.CANCEL_BOOKING:
        return await this.cancelBooking(splitPayment, action);
      case 'proceed_partial':
        return await this.proceedWithPartialPayment(splitPayment, stats, action);
      default:
        throw new Error(`Unknown enforcement action: ${action.type}`);
    }
  },
  /**
   * Send overdue payment notices to pending participants
   */
  async sendOverdueNotice(splitPayment, stats, action) {
    try {
      const pendingPayments = splitPayment.individual_payments.filter(p => p.status === 'pending');
      const notificationPromises = pendingPayments.map(payment =>
        this.sendOverdueNotificationToParticipant(payment, splitPayment, action)
      );
      await Promise.all(notificationPromises);
      return {
        success: true,
        notificationsSent: pendingPayments.length,
        escalationLevel: action.escalationLevel,
      };
    } catch (error) {
      throw new Error(`Failed to send overdue notices: ${error.message}`);
    }
  },
  /**
   * Escalate to organizer - notify them of the situation
   */
  async escalateToOrganizer(splitPayment, stats, action) {
    try {
      const notification = {
        userId: splitPayment.organizer_id,
        type: 'payment_deadline_escalation',
        title: 'Group Payment Deadline Passed',
        message: `Your group payment is ${stats.completionPercentage.toFixed(1)}% complete. ${stats.pendingCount} participants still need to pay. Action required.`,
        data: {
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          completionRate: stats.completionPercentage,
          pendingParticipants: stats.pendingCount,
          escalationLevel: action.escalationLevel,
          deadline: splitPayment.payment_deadline,
          nextAction: 'Automatic refunds will be processed in 24 hours if minimum threshold is not met',
        },
        channels: ['push', 'email'],
        priority: 'high',
      };
      await notificationService.sendNotification(notification);
      // Also send summary to all pending participants
      await this.sendFinalNoticeToParticipants(splitPayment, stats);
      return {
        success: true,
        organizerNotified: true,
        participantsNotified: stats.pendingCount,
      };
    } catch (error) {
      throw new Error(`Failed to escalate to organizer: ${error.message}`);
    }
  },
  /**
   * Initiate automatic refund process
   */
  async initiateRefundProcess(splitPayment, stats, action) {
    try {
      // Use the automatic refund manager
      const refundResult = await automaticRefundManager.processPaymentRefund(splitPayment);
      return {
        success: true,
        refundProcessed: true,
        refundsIssued: refundResult.refundResults.successful,
        totalRefundAmount: refundResult.refundResults.refundDetails.reduce(
          (sum, detail) => sum + detail.refundAmount,
          0
        ),
      };
    } catch (error) {
      throw new Error(`Failed to initiate refund process: ${error.message}`);
    }
  },
  /**
   * Cancel booking (when no payments received)
   */
  async cancelBooking(splitPayment, action) {
    try {
      // Update split payment status
      await supabase
        .from('split_payments')
        .update({
          status: 'cancelled_no_payments',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.booking_id);
      // Notify organizer
      await this.notifyBookingCancellation(splitPayment, 'no_payments');
      return {
        success: true,
        bookingCancelled: true,
        reason: action.reason,
      };
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  },
  /**
   * Proceed with partial payment (when minimum threshold met)
   */
  async proceedWithPartialPayment(splitPayment, stats, action) {
    try {
      // Update split payment status
      await supabase
        .from('split_payments')
        .update({
          status: 'completed_partial',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);
      // Update booking status to confirmed
      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.booking_id);
      // Notify organizer of success
      const notification = {
        userId: splitPayment.organizer_id,
        type: 'payment_threshold_met',
        title: 'Group Payment Threshold Met - Booking Confirmed',
        message: `Your booking is confirmed with ${stats.completionPercentage.toFixed(1)}% of payments collected. Outstanding payments will be handled separately.`,
        data: {
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          completionRate: stats.completionPercentage,
          confirmedAmount: stats.totalPaid,
          outstandingAmount: stats.remainingAmount,
        },
        channels: ['push', 'email'],
        priority: 'normal',
      };
      await notificationService.sendNotification(notification);
      // Cancel remaining payment reminders
      const pendingPayments = splitPayment.individual_payments.filter(p => p.status === 'pending');
      for (const payment of pendingPayments) {
        await paymentCollectionWorkflow.cancelAllReminders(
          payment.id,
          'booking_confirmed_partial'
        );
      }
      return {
        success: true,
        bookingConfirmed: true,
        completionRate: stats.completionPercentage,
        cancelledReminders: pendingPayments.length,
      };
    } catch (error) {
      throw new Error(`Failed to proceed with partial payment: ${error.message}`);
    }
  },
  /**
   * Send overdue notification to individual participant
   */
  async sendOverdueNotificationToParticipant(individualPayment, splitPayment, action) {
    try {
      const urgencyLevel = action.escalationLevel >= 2 ? 'CRITICAL' : 'URGENT';
      const timeframe = action.escalationLevel >= 2 ? '24 hours' : 'soon';
      const notification = {
        userId: individualPayment.user_id,
        type: 'payment_overdue',
        title: `${urgencyLevel}: Payment Overdue`,
        message: `Your payment of $${(individualPayment.amount_due / 100).toFixed(2)} is overdue. ${
          action.escalationLevel >= 2
            ? `The booking may be cancelled and refunds processed within ${timeframe} if payment is not received.`
            : `Please pay ${timeframe} to avoid cancellation.`
        }`,
        data: {
          individualPaymentId: individualPayment.id,
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          amountDue: individualPayment.amount_due,
          deadline: splitPayment.payment_deadline,
          escalationLevel: action.escalationLevel,
          urgency: urgencyLevel,
        },
        channels: action.escalationLevel >= 2 ? ['push', 'email', 'sms'] : ['push', 'email'],
        priority: 'high',
      };
      await notificationService.sendNotification(notification);
      // Update reminder count
      await supabase
        .from('individual_payments')
        .update({
          reminder_count: (individualPayment.reminder_count || 0) + 1,
          last_reminder_sent: new Date().toISOString(),
        })
        .eq('id', individualPayment.id);
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Send final notice to all pending participants
   */
  async sendFinalNoticeToParticipants(splitPayment, stats) {
    const pendingPayments = splitPayment.individual_payments.filter(p => p.status === 'pending');
    const finalNoticePromises = pendingPayments.map(payment => {
      return notificationService.sendNotification({
        userId: payment.user_id,
        type: 'payment_final_notice',
        title: 'FINAL NOTICE: Payment Required',
        message: `This is your final notice. Your payment of $${(payment.amount_due / 100).toFixed(2)} is required within 24 hours or the booking will be cancelled and refunds processed.`,
        data: {
          individualPaymentId: payment.id,
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          amountDue: payment.amount_due,
          deadline: splitPayment.payment_deadline,
          isFinalNotice: true,
        },
        channels: ['push', 'email', 'sms'],
        priority: 'critical',
      });
    });
    await Promise.allSettled(finalNoticePromises);
  },
  /**
   * Notify organizer of booking cancellation
   */
  async notifyBookingCancellation(splitPayment, reason) {
    const notification = {
      userId: splitPayment.organizer_id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled - Insufficient Payments',
      message: `Your group booking has been cancelled due to ${reason === 'no_payments' ? 'no payments received' : 'insufficient payments collected'}.`,
      data: {
        splitPaymentId: splitPayment.id,
        bookingId: splitPayment.booking_id,
        cancellationReason: reason,
        deadline: splitPayment.payment_deadline,
      },
      channels: ['push', 'email'],
      priority: 'high',
    };
    await notificationService.sendNotification(notification);
  },
  /**
   * Log enforcement action for audit trail
   */
  async logEnforcementAction(splitPaymentId, action, result) {
    try {
      const logEntry = {
        split_payment_id: splitPaymentId,
        action_type: action.type,
        action_reason: action.reason,
        escalation_level: action.escalationLevel || 0,
        completion_rate: action.completionRate || 0,
        result_data: result,
        processed_at: new Date().toISOString(),
      };
      // Insert into enforcement log (you might need to create this table)
      await supabase
        .from('payment_enforcement_log')
        .insert(logEntry);
    } catch (error) {
      // Don't throw here as this is just logging
    }
  },
};
/**
 * Deadline monitoring and reporting
 */
export const deadlineMonitoring = {
  /**
   * Get upcoming deadlines that need attention
   */
  async getUpcomingDeadlines(organizerId, hoursAhead = 48) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() + hoursAhead);
      const { data: payments, error } = await supabase
        .from('split_payments')
        .select(`
          *,
          individual_payments (*),
          bookings (title)
        `)
        .eq('organizer_id', organizerId)
        .in('status', ['pending', 'partially_paid'])
        .lte('payment_deadline', cutoffTime.toISOString())
        .order('payment_deadline', { ascending: true });
      if (error) throw error;
      return payments.map(payment => {
        const stats = groupPaymentManager.calculatePaymentStats(payment.individual_payments);
        const hoursUntilDeadline = Math.max(0,
          Math.floor((new Date(payment.payment_deadline) - new Date()) / (1000 * 60 * 60))
        );
        return {
          ...payment,
          stats,
          hoursUntilDeadline,
          riskLevel: this.calculateRiskLevel(stats, hoursUntilDeadline),
        };
      });
    } catch (error) {
      throw new Error(`Failed to get upcoming deadlines: ${error.message}`);
    }
  },
  /**
   * Calculate risk level for a payment
   */
  calculateRiskLevel(stats, hoursUntilDeadline) {
    if (hoursUntilDeadline <= 0) {
      return stats.meetsMinimumThreshold ? 'medium' : 'critical';
    }
    if (hoursUntilDeadline <= 6) {
      return stats.completionPercentage < 50 ? 'high' : 'medium';
    }
    if (hoursUntilDeadline <= 24) {
      return stats.completionPercentage < 25 ? 'medium' : 'low';
    }
    return 'low';
  },
  /**
   * Get enforcement statistics
   */
  async getEnforcementStats(organizerId, startDate, endDate) {
    try {
      // This would query the enforcement log table
      // For now, we'll return a placeholder
      return {
        totalEnforcements: 0,
        refundsProcessed: 0,
        bookingsCancelled: 0,
        notificationsSent: 0,
        averageResolutionTime: 0,
      };
    } catch (error) {
      throw new Error(`Failed to get enforcement stats: ${error.message}`);
    }
  },
};
// Export configuration
export const getDeadlineConfig = () => DEADLINE_CONFIG;
// Main export
export default {
  deadlineEnforcement,
  deadlineMonitoring,
  getDeadlineConfig,
};
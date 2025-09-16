/**
 * Split Payment Service - Handle group payment splitting and collection
 * Integrates with Stripe Connect for marketplace payments
 */

import { supabase } from '../lib/supabase.js';
import { payments, stripeConfig } from './stripe-service.js';
import sentryService from './sentry-service.js';

// Payment splitting configuration
const SPLIT_PAYMENT_CONFIG = {
  maxGroupSize: 20,
  minPaymentDeadlineHours: 24, // Minimum 24 hours to pay
  maxPaymentDeadlineHours: 168, // Maximum 7 days to pay
  reminderSchedule: [72, 24, 2], // Hours before deadline to send reminders
  minimumPaymentThreshold: 0.8, // 80% of total must be collected to proceed
  refundProcessingDays: 3, // Days to process refunds after failed collection
  feeHandling: {
    platformFee: 'organizer', // 'organizer', 'split', or 'participants'
    stripeFeesPerParticipant: 0.30, // Base Stripe fee per transaction
    stripePercentage: 0.029, // 2.9% Stripe percentage fee
  },
};

/**
 * Payment splitting algorithms
 */
export const paymentSplitting = {
  /**
   * Calculate equal split for group payments
   */
  calculateEqualSplit(totalAmount, participantCount, includeOrganizer = true) {
    if (participantCount <= 0) {
      throw new Error('Participant count must be greater than 0');
    }

    const actualParticipants = includeOrganizer ? participantCount : participantCount + 1;
    const baseAmount = Math.floor(totalAmount / actualParticipants);
    const remainder = totalAmount % actualParticipants;

    // Distribute remainder among first few participants
    const splits = new Array(actualParticipants).fill(baseAmount);
    for (let i = 0; i < remainder; i++) {
      splits[i] += 1;
    }

    return {
      splits,
      baseAmount,
      remainder,
      totalVerification: splits.reduce((sum, amount) => sum + amount, 0),
    };
  },

  /**
   * Calculate custom split based on participant preferences
   */
  calculateCustomSplit(totalAmount, customAmounts) {
    const totalCustom = customAmounts.reduce((sum, amount) => sum + amount, 0);

    if (totalCustom !== totalAmount) {
      throw new Error(`Custom amounts (${totalCustom}) don't match total (${totalAmount})`);
    }

    return {
      splits: customAmounts,
      totalVerification: totalCustom,
      isCustom: true,
    };
  },

  /**
   * Calculate split with fees consideration
   */
  calculateSplitWithFees(baseAmount, participantCount, feeHandling = 'split') {
    const stripeFeesPerPerson = SPLIT_PAYMENT_CONFIG.feeHandling.stripeFeesPerParticipant * 100; // Convert to cents
    const stripePercentageFee = Math.round(baseAmount * SPLIT_PAYMENT_CONFIG.feeHandling.stripePercentage);
    const totalStripeFeesPerPerson = stripeFeesPerPerson + stripePercentageFee;

    let adjustedAmount = baseAmount;
    let totalFees = 0;

    switch (feeHandling) {
      case 'participants':
        adjustedAmount = baseAmount + totalStripeFeesPerPerson;
        totalFees = totalStripeFeesPerPerson * participantCount;
        break;

      case 'split':
        const totalFeesSplit = totalStripeFeesPerPerson * participantCount;
        adjustedAmount = baseAmount + Math.ceil(totalFeesSplit / participantCount);
        totalFees = totalFeesSplit;
        break;

      case 'organizer':
      default:
        // Organizer absorbs fees
        adjustedAmount = baseAmount;
        totalFees = totalStripeFeesPerPerson * participantCount;
        break;
    }

    return {
      originalAmount: baseAmount,
      adjustedAmount,
      feesPerPerson: totalStripeFeesPerPerson,
      totalFees,
      feeHandling,
    };
  },

  /**
   * Validate split configuration
   */
  validateSplitConfiguration(totalAmount, participants) {
    if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    if (participants.length === 0) {
      throw new Error('At least one participant is required');
    }

    if (participants.length > SPLIT_PAYMENT_CONFIG.maxGroupSize) {
      throw new Error(`Group size exceeds maximum of ${SPLIT_PAYMENT_CONFIG.maxGroupSize}`);
    }

    // Check for duplicate participants
    const uniqueParticipants = new Set(participants.map(p => p.userId || p.id));
    if (uniqueParticipants.size !== participants.length) {
      throw new Error('Duplicate participants detected');
    }

    return true;
  },
};

/**
 * Group payment management
 */
export const groupPaymentManager = {
  /**
   * Create a new split payment group
   */
  async createSplitPayment(paymentData) {
    const {
      bookingId,
      organizerId,
      totalAmount,
      currency = 'usd',
      participants,
      splitType = 'equal',
      customSplits = null,
      paymentDeadline,
      vendorAccountId,
      description,
      metadata = {},
    } = paymentData;

    // Validate configuration
    paymentSplitting.validateSplitConfiguration(totalAmount, participants);

    // Calculate splits
    let splitCalculation;
    if (splitType === 'equal') {
      splitCalculation = paymentSplitting.calculateEqualSplit(totalAmount, participants.length);
    } else if (splitType === 'custom' && customSplits) {
      splitCalculation = paymentSplitting.calculateCustomSplit(totalAmount, customSplits);
    } else {
      throw new Error('Invalid split type or missing custom splits');
    }

    try {
      // Create split payment record
      const { data: splitPayment, error: splitError } = await supabase
        .from('split_payments')
        .insert({
          booking_id: bookingId,
          organizer_id: organizerId,
          vendor_account_id: vendorAccountId,
          total_amount: totalAmount,
          currency,
          split_type: splitType,
          participant_count: participants.length,
          payment_deadline: paymentDeadline,
          description,
          status: 'pending',
          metadata: {
            ...metadata,
            splitCalculation,
          },
        })
        .select()
        .single();

      if (splitError) throw splitError;

      // Create individual payment records for each participant
      const paymentRecords = participants.map((participant, index) => ({
        split_payment_id: splitPayment.id,
        user_id: participant.userId || participant.id,
        amount_due: splitCalculation.splits[index],
        status: 'pending',
        payment_deadline: paymentDeadline,
        reminder_count: 0,
        metadata: {
          participantName: participant.name,
          participantEmail: participant.email,
        },
      }));

      const { data: individualPayments, error: paymentsError } = await supabase
        .from('individual_payments')
        .insert(paymentRecords)
        .select();

      if (paymentsError) throw paymentsError;

      return {
        splitPaymentId: splitPayment.id,
        splitPayment,
        individualPayments,
        splitCalculation,
      };
    } catch (error) {
      throw new Error(`Failed to create split payment: ${error.message}`);
    }
  },

  /**
   * Get split payment details with participant status
   */
  async getSplitPaymentDetails(splitPaymentId) {
    try {
      const { data: splitPayment, error: splitError } = await supabase
        .from('split_payments')
        .select('*')
        .eq('id', splitPaymentId)
        .single();

      if (splitError) throw splitError;

      const { data: individualPayments, error: paymentsError } = await supabase
        .from('individual_payments')
        .select('*')
        .eq('split_payment_id', splitPaymentId)
        .order('created_at');

      if (paymentsError) throw paymentsError;

      // Calculate payment statistics
      const stats = this.calculatePaymentStats(individualPayments);

      return {
        splitPayment,
        individualPayments,
        stats,
      };
    } catch (error) {
      throw new Error(`Failed to get split payment details: ${error.message}`);
    }
  },

  /**
   * Calculate payment statistics
   */
  calculatePaymentStats(individualPayments) {
    const totalDue = individualPayments.reduce((sum, payment) => sum + payment.amount_due, 0);
    const paidPayments = individualPayments.filter(p => p.status === 'paid');
    const totalPaid = paidPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
    const pendingCount = individualPayments.filter(p => p.status === 'pending').length;
    const paidCount = paidPayments.length;
    const failedCount = individualPayments.filter(p => p.status === 'failed').length;

    return {
      totalDue,
      totalPaid,
      remainingAmount: totalDue - totalPaid,
      participantCount: individualPayments.length,
      paidCount,
      pendingCount,
      failedCount,
      completionPercentage: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
      meetsMinimumThreshold: (totalPaid / totalDue) >= SPLIT_PAYMENT_CONFIG.minimumPaymentThreshold,
    };
  },

  /**
   * Process individual payment
   */
  async processIndividualPayment(individualPaymentId, userId) {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('individual_payments')
        .select('*, split_payments(*)')
        .eq('id', individualPaymentId)
        .single();

      if (paymentError) throw paymentError;

      if (payment.user_id !== userId) {
        throw new Error('Unauthorized: User cannot pay for another user\'s portion');
      }

      if (payment.status === 'paid') {
        throw new Error('Payment has already been processed');
      }

      // Check if payment deadline has passed
      if (new Date() > new Date(payment.payment_deadline)) {
        throw new Error('Payment deadline has passed');
      }

      // Create Stripe payment intent
      const paymentIntent = await payments.createPaymentIntent({
        amount: payment.amount_due,
        currency: payment.split_payments.currency,
        vendorAccountId: payment.split_payments.vendor_account_id,
        bookingId: payment.split_payments.booking_id,
        userId: payment.user_id,
        description: `Split payment for ${payment.split_payments.description}`,
      });

      // Update payment record with Stripe payment intent
      const { error: updateError } = await supabase
        .from('individual_payments')
        .update({
          stripe_payment_intent_id: paymentIntent.paymentIntentId,
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', individualPaymentId);

      if (updateError) throw updateError;

      return {
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret,
        amount: payment.amount_due,
        currency: payment.split_payments.currency,
      };
    } catch (error) {
      throw new Error(`Failed to process individual payment: ${error.message}`);
    }
  },

  /**
   * Update payment status after Stripe confirmation
   */
  async updatePaymentStatus(individualPaymentId, status, stripePaymentIntentId = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
        if (stripePaymentIntentId) {
          updateData.stripe_payment_intent_id = stripePaymentIntentId;
        }
      }

      const { error } = await supabase
        .from('individual_payments')
        .update(updateData)
        .eq('id', individualPaymentId);

      if (error) throw error;

      // Check if all payments are complete
      await this.checkSplitPaymentCompletion(individualPaymentId);

      return true;
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  },

  /**
   * Check if split payment is complete and update booking status
   */
  async checkSplitPaymentCompletion(individualPaymentId) {
    try {
      // Get the split payment ID
      const { data: payment, error: paymentError } = await supabase
        .from('individual_payments')
        .select('split_payment_id')
        .eq('id', individualPaymentId)
        .single();

      if (paymentError) throw paymentError;

      // Get all payments for this split
      const details = await this.getSplitPaymentDetails(payment.split_payment_id);
      const { splitPayment, stats } = details;

      // Update split payment status based on completion
      let newStatus = splitPayment.status;
      if (stats.completionPercentage === 100) {
        newStatus = 'completed';
      } else if (stats.paidCount > 0) {
        newStatus = 'partially_paid';
      }

      if (newStatus !== splitPayment.status) {
        const { error: updateError } = await supabase
          .from('split_payments')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.split_payment_id);

        if (updateError) throw updateError;
      }

      // If payment is complete, update booking status
      if (newStatus === 'completed') {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', splitPayment.booking_id);

        if (bookingError) {
          sentryService.captureException(bookingError, {
            tags: { service: 'split-payment', operation: 'updateBookingStatus' }
          });
        }
      }

      return { status: newStatus, stats };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'checkCompletion' }
      });
      throw error;
    }
  },
};

/**
 * Payment deadline and reminder management
 */
export const paymentDeadlineManager = {
  /**
   * Send payment reminders
   */
  async sendPaymentReminders() {
    try {
      const now = new Date();
      const reminderThresholds = SPLIT_PAYMENT_CONFIG.reminderSchedule.map(hours => {
        const threshold = new Date(now);
        threshold.setHours(threshold.getHours() + hours);
        return threshold;
      });

      for (const threshold of reminderThresholds) {
        // Find payments that need reminders at this threshold
        const { data: paymentsToRemind, error } = await supabase
          .from('individual_payments')
          .select('*, split_payments(*)')
          .eq('status', 'pending')
          .lte('payment_deadline', threshold.toISOString())
          .lt('reminder_count', SPLIT_PAYMENT_CONFIG.reminderSchedule.length);

        if (error) {
          sentryService.captureException(error, {
            tags: { service: 'split-payment', operation: 'findPaymentsForReminders' }
          });
          continue;
        }

        for (const payment of paymentsToRemind) {
          await this.sendIndividualReminder(payment);
        }
      }
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'sendPaymentReminders' }
      });
    }
  },

  /**
   * Send individual payment reminder
   */
  async sendIndividualReminder(payment) {
    try {
      // Update reminder count
      const { error: updateError } = await supabase
        .from('individual_payments')
        .update({
          reminder_count: (payment.reminder_count || 0) + 1,
          last_reminder_sent: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        sentryService.captureException(updateError, {
          tags: { service: 'split-payment', operation: 'updateReminderCount' }
        });
      }

      // Here you would integrate with your notification system
      // For now, we'll just log the reminder
      // Payment reminder sent successfully

      return true;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'sendIndividualReminder' }
      });
      return false;
    }
  },

  /**
   * Process payment deadline enforcement
   */
  async enforcePaymentDeadlines() {
    try {
      const now = new Date();

      // Find expired payments
      const { data: expiredPayments, error } = await supabase
        .from('split_payments')
        .select('*, individual_payments(*)')
        .eq('status', 'pending')
        .lt('payment_deadline', now.toISOString());

      if (error) {
        sentryService.captureException(error, {
          tags: { service: 'split-payment', operation: 'findExpiredPayments' }
        });
        return;
      }

      for (const splitPayment of expiredPayments) {
        await this.handleExpiredSplitPayment(splitPayment);
      }
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'enforcePaymentDeadlines' }
      });
    }
  },

  /**
   * Handle expired split payment
   */
  async handleExpiredSplitPayment(splitPayment) {
    try {
      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);

      if (stats.meetsMinimumThreshold) {
        // Sufficient payments collected - proceed with booking
        await this.proceedWithPartialPayment(splitPayment, stats);
      } else {
        // Insufficient payments - cancel and refund
        await this.cancelAndRefundSplitPayment(splitPayment, stats);
      }
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'handleExpiredPayment' }
      });
    }
  },

  /**
   * Proceed with booking despite some missing payments
   */
  async proceedWithPartialPayment(splitPayment, stats) {
    try {
      // Update split payment status
      const { error: updateError } = await supabase
        .from('split_payments')
        .update({
          status: 'completed_partial',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);

      if (updateError) throw updateError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.booking_id);

      if (bookingError) throw bookingError;

      // Split payment proceeded with partial payment
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'proceedWithPartialPayment' }
      });
    }
  },

  /**
   * Cancel split payment and process refunds
   */
  async cancelAndRefundSplitPayment(splitPayment, stats) {
    try {
      // Update split payment status
      const { error: updateError } = await supabase
        .from('split_payments')
        .update({
          status: 'cancelled_insufficient',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);

      if (updateError) throw updateError;

      // Process refunds for paid participants
      const paidPayments = splitPayment.individual_payments.filter(p => p.status === 'paid');
      for (const payment of paidPayments) {
        if (payment.stripe_payment_intent_id) {
          try {
            await payments.processRefund({
              paymentIntentId: payment.stripe_payment_intent_id,
              reason: 'requested_by_customer',
            });

            // Update payment status
            await supabase
              .from('individual_payments')
              .update({
                status: 'refunded',
                refunded_at: new Date().toISOString(),
              })
              .eq('id', payment.id);

          } catch (refundError) {
            sentryService.captureException(refundError, {
              tags: { service: 'split-payment', operation: 'refundPayment', paymentId: payment.id }
            });
          }
        }
      }

      // Cancel booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'cancelled',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.booking_id);

      if (bookingError) throw bookingError;

      // Split payment cancelled due to insufficient payments
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'split-payment', operation: 'cancelAndRefund' }
      });
    }
  },
};

// Configuration getter
export const getSplitPaymentConfig = () => SPLIT_PAYMENT_CONFIG;

// Main export
export default {
  paymentSplitting,
  groupPaymentManager,
  paymentDeadlineManager,
  getSplitPaymentConfig,
};
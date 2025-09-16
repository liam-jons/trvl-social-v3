/**
 * Payment Collection Service - Handle group payment workflows and reminders
 * Integrates with split payment service and notification system
 */

import { supabase } from '../lib/supabase.js';
import { groupPaymentManager, paymentDeadlineManager, getSplitPaymentConfig } from './split-payment-service.js';
import { notificationService } from './notification-service.js';

// Payment collection configuration
const COLLECTION_CONFIG = {
  reminderTypes: {
    INITIAL: 'initial_request',
    REMINDER_72H: 'reminder_72h',
    REMINDER_24H: 'reminder_24h',
    REMINDER_2H: 'reminder_2h',
    FINAL_NOTICE: 'final_notice',
    OVERDUE: 'overdue_notice',
  },
  templates: {
    subject: {
      [this?.INITIAL]: 'Payment Required: Your Share for {bookingTitle}',
      [this?.REMINDER_72H]: 'Reminder: Payment Due in 3 Days - {bookingTitle}',
      [this?.REMINDER_24H]: 'Urgent: Payment Due Tomorrow - {bookingTitle}',
      [this?.REMINDER_2H]: 'Final Hours: Payment Due Soon - {bookingTitle}',
      [this?.FINAL_NOTICE]: 'Final Notice: Payment Overdue - {bookingTitle}',
      [this?.OVERDUE]: 'Payment Overdue - Action Required - {bookingTitle}',
    },
  },
  escalationRules: {
    maxReminders: 6,
    escalateToOrganizerAfter: 3,
    autoRefundAfterDays: 7,
  },
};

// Fix the template references
COLLECTION_CONFIG.templates.subject = {
  [COLLECTION_CONFIG.reminderTypes.INITIAL]: 'Payment Required: Your Share for {bookingTitle}',
  [COLLECTION_CONFIG.reminderTypes.REMINDER_72H]: 'Reminder: Payment Due in 3 Days - {bookingTitle}',
  [COLLECTION_CONFIG.reminderTypes.REMINDER_24H]: 'Urgent: Payment Due Tomorrow - {bookingTitle}',
  [COLLECTION_CONFIG.reminderTypes.REMINDER_2H]: 'Final Hours: Payment Due Soon - {bookingTitle}',
  [COLLECTION_CONFIG.reminderTypes.FINAL_NOTICE]: 'Final Notice: Payment Overdue - {bookingTitle}',
  [COLLECTION_CONFIG.reminderTypes.OVERDUE]: 'Payment Overdue - Action Required - {bookingTitle}',
};

/**
 * Payment collection workflow management
 */
export const paymentCollectionWorkflow = {
  /**
   * Initialize payment collection for a new split payment
   */
  async initializeCollection(splitPaymentId) {
    try {
      const details = await groupPaymentManager.getSplitPaymentDetails(splitPaymentId);
      const { splitPayment, individualPayments } = details;

      // Create initial payment requests for all participants
      const reminderPromises = individualPayments.map(payment =>
        this.schedulePaymentReminders(payment.id, payment.payment_deadline)
      );

      await Promise.all(reminderPromises);

      // Send initial payment request notifications
      const notificationPromises = individualPayments.map(payment =>
        this.sendPaymentRequest(payment, splitPayment)
      );

      await Promise.all(notificationPromises);

      // Update split payment status to indicate collection has started
      const { error } = await supabase
        .from('split_payments')
        .update({
          status: 'collection_started',
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPaymentId);

      if (error) throw error;

      return {
        success: true,
        participantsNotified: individualPayments.length,
        remindersScheduled: individualPayments.length,
      };
    } catch (error) {
      throw new Error(`Failed to initialize payment collection: ${error.message}`);
    }
  },

  /**
   * Schedule payment reminders for an individual payment
   */
  async schedulePaymentReminders(individualPaymentId, paymentDeadline) {
    try {
      const config = getSplitPaymentConfig();
      const deadlineDate = new Date(paymentDeadline);
      const now = new Date();

      const reminders = [];

      // Schedule reminders based on configuration
      for (const hoursBeforeDeadline of config.reminderSchedule) {
        const reminderTime = new Date(deadlineDate);
        reminderTime.setHours(reminderTime.getHours() - hoursBeforeDeadline);

        // Only schedule future reminders
        if (reminderTime > now) {
          const reminderType = this.getReminderType(hoursBeforeDeadline);

          reminders.push({
            individual_payment_id: individualPaymentId,
            reminder_type: reminderType,
            scheduled_for: reminderTime.toISOString(),
            status: 'scheduled',
          });
        }
      }

      // Add final notice and overdue reminders
      const finalNoticeTime = new Date(deadlineDate);
      finalNoticeTime.setHours(finalNoticeTime.getHours() + 2);
      if (finalNoticeTime > now) {
        reminders.push({
          individual_payment_id: individualPaymentId,
          reminder_type: COLLECTION_CONFIG.reminderTypes.FINAL_NOTICE,
          scheduled_for: finalNoticeTime.toISOString(),
          status: 'scheduled',
        });
      }

      const overdueTime = new Date(deadlineDate);
      overdueTime.setDate(overdueTime.getDate() + 1);
      if (overdueTime > now) {
        reminders.push({
          individual_payment_id: individualPaymentId,
          reminder_type: COLLECTION_CONFIG.reminderTypes.OVERDUE,
          scheduled_for: overdueTime.toISOString(),
          status: 'scheduled',
        });
      }

      if (reminders.length > 0) {
        const { error } = await supabase
          .from('payment_reminders')
          .insert(reminders);

        if (error) throw error;
      }

      return reminders.length;
    } catch (error) {
      throw new Error(`Failed to schedule payment reminders: ${error.message}`);
    }
  },

  /**
   * Get reminder type based on hours before deadline
   */
  getReminderType(hoursBeforeDeadline) {
    if (hoursBeforeDeadline >= 72) return COLLECTION_CONFIG.reminderTypes.REMINDER_72H;
    if (hoursBeforeDeadline >= 24) return COLLECTION_CONFIG.reminderTypes.REMINDER_24H;
    if (hoursBeforeDeadline >= 2) return COLLECTION_CONFIG.reminderTypes.REMINDER_2H;
    return COLLECTION_CONFIG.reminderTypes.FINAL_NOTICE;
  },

  /**
   * Send initial payment request to participant
   */
  async sendPaymentRequest(individualPayment, splitPayment) {
    try {
      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', individualPayment.user_id)
        .single();

      if (userError) {
        console.warn(`Could not fetch user data for ${individualPayment.user_id}:`, userError);
      }

      // Get booking details for context
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('title, description, start_date')
        .eq('id', splitPayment.booking_id)
        .single();

      if (bookingError) {
        console.warn(`Could not fetch booking data for ${splitPayment.booking_id}:`, bookingError);
      }

      // Create payment request notification
      const notification = {
        userId: individualPayment.user_id,
        type: 'payment_request',
        title: 'Payment Required',
        message: `Your payment of $${(individualPayment.amount_due / 100).toFixed(2)} is required for ${bookingData?.title || 'your booking'}`,
        data: {
          individualPaymentId: individualPayment.id,
          splitPaymentId: splitPayment.id,
          bookingId: splitPayment.booking_id,
          amountDue: individualPayment.amount_due,
          currency: splitPayment.currency,
          deadline: individualPayment.payment_deadline,
          organizerId: splitPayment.organizer_id,
        },
        channels: ['push', 'email'],
      };

      // Send notification
      await notificationService.sendNotification(notification);

      // Log the request
      console.log(`Payment request sent to user ${individualPayment.user_id} for $${(individualPayment.amount_due / 100).toFixed(2)}`);

      return true;
    } catch (error) {
      console.error('Failed to send payment request:', error);
      return false;
    }
  },

  /**
   * Process scheduled reminders
   */
  async processScheduledReminders() {
    try {
      const now = new Date();

      // Find reminders that are due to be sent
      const { data: dueReminders, error } = await supabase
        .from('payment_reminders')
        .select(`
          *,
          individual_payments (
            *,
            split_payments (*)
          )
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_for', now.toISOString())
        .order('scheduled_for');

      if (error) throw error;

      console.log(`Processing ${dueReminders.length} scheduled reminders`);

      // Process each reminder
      const results = await Promise.allSettled(
        dueReminders.map(reminder => this.sendScheduledReminder(reminder))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      return {
        processed: results.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Failed to process scheduled reminders:', error);
      throw error;
    }
  },

  /**
   * Send a scheduled reminder
   */
  async sendScheduledReminder(reminder) {
    try {
      const { individual_payments: payment } = reminder;

      // Skip if payment is already completed
      if (payment.status === 'paid' || payment.status === 'refunded') {
        await this.cancelReminder(reminder.id, 'payment_completed');
        return { skipped: true, reason: 'payment_completed' };
      }

      // Get booking details for personalization
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('title, description')
        .eq('id', payment.split_payments.booking_id)
        .single();

      // Get user details
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, full_name, notification_preferences')
        .eq('id', payment.user_id)
        .single();

      // Create reminder notification
      const notification = {
        userId: payment.user_id,
        type: 'payment_reminder',
        title: this.getSubjectTemplate(reminder.reminder_type, bookingData?.title),
        message: this.getMessageTemplate(reminder.reminder_type, payment, bookingData),
        data: {
          individualPaymentId: payment.id,
          splitPaymentId: payment.split_payment_id,
          bookingId: payment.split_payments.booking_id,
          amountDue: payment.amount_due,
          currency: payment.split_payments.currency,
          deadline: payment.payment_deadline,
          reminderType: reminder.reminder_type,
        },
        channels: this.getNotificationChannels(reminder.reminder_type, userData?.notification_preferences),
        priority: this.getReminderPriority(reminder.reminder_type),
      };

      // Send the reminder
      await notificationService.sendNotification(notification);

      // Mark reminder as sent
      await supabase
        .from('payment_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', reminder.id);

      // Update reminder count on individual payment
      await supabase
        .from('individual_payments')
        .update({
          reminder_count: (payment.reminder_count || 0) + 1,
          last_reminder_sent: new Date().toISOString(),
        })
        .eq('id', payment.id);

      console.log(`Sent ${reminder.reminder_type} reminder to user ${payment.user_id}`);

      return { sent: true, reminderType: reminder.reminder_type };
    } catch (error) {
      // Mark reminder as failed
      await supabase
        .from('payment_reminders')
        .update({
          status: 'failed',
          metadata: { error: error.message },
        })
        .eq('id', reminder.id);

      console.error(`Failed to send reminder ${reminder.id}:`, error);
      throw error;
    }
  },

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId, reason = 'manual_cancellation') {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          status: 'cancelled',
          metadata: { cancellation_reason: reason },
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
      return false;
    }
  },

  /**
   * Get subject template for reminder type
   */
  getSubjectTemplate(reminderType, bookingTitle = 'Your Booking') {
    return COLLECTION_CONFIG.templates.subject[reminderType]?.replace(
      '{bookingTitle}',
      bookingTitle
    ) || `Payment Reminder - ${bookingTitle}`;
  },

  /**
   * Get message template for reminder
   */
  getMessageTemplate(reminderType, payment, bookingData) {
    const amount = `$${(payment.amount_due / 100).toFixed(2)}`;
    const deadline = new Date(payment.payment_deadline).toLocaleDateString();
    const bookingTitle = bookingData?.title || 'your booking';

    const templates = {
      [COLLECTION_CONFIG.reminderTypes.INITIAL]:
        `Hi! You have a payment of ${amount} due for ${bookingTitle} by ${deadline}. Please complete your payment to secure your spot.`,

      [COLLECTION_CONFIG.reminderTypes.REMINDER_72H]:
        `Friendly reminder: Your payment of ${amount} for ${bookingTitle} is due in 3 days (${deadline}). Please pay soon to avoid any issues.`,

      [COLLECTION_CONFIG.reminderTypes.REMINDER_24H]:
        `Urgent: Your payment of ${amount} for ${bookingTitle} is due tomorrow (${deadline}). Please complete your payment to avoid cancellation.`,

      [COLLECTION_CONFIG.reminderTypes.REMINDER_2H]:
        `Final hours! Your payment of ${amount} for ${bookingTitle} is due in less than 2 hours (${deadline}). Pay now to secure your booking.`,

      [COLLECTION_CONFIG.reminderTypes.FINAL_NOTICE]:
        `FINAL NOTICE: Your payment of ${amount} for ${bookingTitle} is now overdue. Please pay immediately to avoid cancellation and potential refunds to other participants.`,

      [COLLECTION_CONFIG.reminderTypes.OVERDUE]:
        `OVERDUE: Your payment of ${amount} for ${bookingTitle} is past due as of ${deadline}. Immediate payment required or the booking may be cancelled.`,
    };

    return templates[reminderType] || `Payment reminder: ${amount} due for ${bookingTitle}`;
  },

  /**
   * Get notification channels based on reminder type and user preferences
   */
  getNotificationChannels(reminderType, userPreferences = {}) {
    const urgentTypes = [
      COLLECTION_CONFIG.reminderTypes.REMINDER_2H,
      COLLECTION_CONFIG.reminderTypes.FINAL_NOTICE,
      COLLECTION_CONFIG.reminderTypes.OVERDUE,
    ];

    const baseChannels = ['push'];

    if (urgentTypes.includes(reminderType)) {
      baseChannels.push('email');
      if (userPreferences.sms_enabled) {
        baseChannels.push('sms');
      }
    }

    return baseChannels;
  },

  /**
   * Get reminder priority
   */
  getReminderPriority(reminderType) {
    const urgentTypes = [
      COLLECTION_CONFIG.reminderTypes.REMINDER_2H,
      COLLECTION_CONFIG.reminderTypes.FINAL_NOTICE,
      COLLECTION_CONFIG.reminderTypes.OVERDUE,
    ];

    return urgentTypes.includes(reminderType) ? 'high' : 'normal';
  },

  /**
   * Cancel all reminders for a payment
   */
  async cancelAllReminders(individualPaymentId, reason = 'payment_completed') {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          status: 'cancelled',
          metadata: { cancellation_reason: reason },
          updated_at: new Date().toISOString(),
        })
        .eq('individual_payment_id', individualPaymentId)
        .eq('status', 'scheduled');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to cancel all reminders:', error);
      return false;
    }
  },

  /**
   * Get collection statistics
   */
  async getCollectionStats(splitPaymentId) {
    try {
      const { data: reminders, error: remindersError } = await supabase
        .from('payment_reminders')
        .select(`
          reminder_type,
          status,
          individual_payments (user_id, status)
        `)
        .eq('individual_payments.split_payment_id', splitPaymentId);

      if (remindersError) throw remindersError;

      const stats = {
        totalReminders: reminders.length,
        sentReminders: reminders.filter(r => r.status === 'sent').length,
        scheduledReminders: reminders.filter(r => r.status === 'scheduled').length,
        failedReminders: reminders.filter(r => r.status === 'failed').length,
        remindersByType: {},
      };

      // Group by reminder type
      for (const reminder of reminders) {
        if (!stats.remindersByType[reminder.reminder_type]) {
          stats.remindersByType[reminder.reminder_type] = {
            total: 0,
            sent: 0,
            scheduled: 0,
            failed: 0,
          };
        }
        stats.remindersByType[reminder.reminder_type].total++;
        stats.remindersByType[reminder.reminder_type][reminder.status]++;
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get collection stats: ${error.message}`);
    }
  },
};

/**
 * Payment collection automation
 */
export const collectionAutomation = {
  /**
   * Run automated collection processes
   */
  async runAutomatedCollection() {
    console.log('Starting automated payment collection process...');

    try {
      // Process scheduled reminders
      const reminderResults = await paymentCollectionWorkflow.processScheduledReminders();
      console.log(`Reminder results:`, reminderResults);

      // Enforce payment deadlines
      await paymentDeadlineManager.enforcePaymentDeadlines();

      return {
        reminders: reminderResults,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Automated collection process failed:', error);
      throw error;
    }
  },

  /**
   * Schedule automated collection job (to be called by cron/scheduler)
   */
  async scheduleCollectionJob() {
    // This would integrate with your job scheduler (e.g., node-cron, Bull Queue, etc.)
    console.log('Collection job scheduled to run every 15 minutes');
    return true;
  },
};

// Export configuration getter
export const getCollectionConfig = () => COLLECTION_CONFIG;

// Main export
export default {
  paymentCollectionWorkflow,
  collectionAutomation,
  getCollectionConfig,
};
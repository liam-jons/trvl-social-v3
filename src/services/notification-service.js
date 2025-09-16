import { supabase } from '../lib/supabase';
import whatsAppService from './whatsapp-service';
import sentryService from './sentry-service.js';
import { logger } from '../utils/logger.js';

/**
 * Notification Service
 * Handles push notifications, email fallbacks, and notification management
 */
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.fcmToken = null;
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    if (!this.isSupported) {
      return false;
    }

    try {
      // Request permission if not already granted
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }

      if (this.permission === 'granted') {
        // Register service worker for push notifications
        await this.registerServiceWorker();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'initialize' }
      });
      return false;
    }
  }

  /**
   * Register service worker for background notifications
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/notification-sw.js');
      return registration;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'registerServiceWorker' }
      });
      throw error;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'requestPermission' }
      });
      return 'denied';
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return null;
    }

    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      vibrate: [200, 100, 200],
      tag: 'trvl-notification',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);

      // Auto-close after 5 seconds if not requiring interaction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'showNotification' }
      });
      return null;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId, notification) {
    try {
      // Get user notification preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('push_notifications, email_notifications, whatsapp_notifications')
        .eq('user_id', userId)
        .single();

      // Get user profile for phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', userId)
        .single();

      const results = [];

      // Send push notification if enabled
      if (preferences?.push_notifications !== false) {
        const pushResult = await this.sendPushNotification(userId, notification);
        results.push({ type: 'push', success: pushResult.success, error: pushResult.error });
      }

      // Send WhatsApp notification if enabled and phone number available
      if (preferences?.whatsapp_notifications !== false && profile?.phone_number) {
        const whatsappResult = await this.sendWhatsAppNotification(profile.phone_number, notification);
        results.push({ type: 'whatsapp', success: whatsappResult.success, error: whatsappResult.error });
      }

      // Send email notification as fallback or if other methods failed
      if (preferences?.email_notifications !== false) {
        const emailResult = await this.sendEmailNotification(userId, notification);
        results.push({ type: 'email', success: emailResult.success, error: emailResult.error });
      }

      // Store notification in database
      await this.storeNotification(userId, notification, results);

      return { success: true, results };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'sendNotification' }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendPushNotification(userId, notification) {
    try {
      // For now, show local notification
      // In production, this would send to FCM or push service
      const localNotification = await this.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        data: notification.data,
        actions: notification.actions || []
      });

      return { success: !!localNotification };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'sendPushNotification' }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsAppNotification(phoneNumber, notification) {
    try {
      let result;

      // Use appropriate WhatsApp method based on notification type
      switch (notification.type) {
        case 'booking_confirmed':
          result = await whatsAppService.sendBookingConfirmation(phoneNumber, notification.data);
          break;
        case 'trip_reminder':
          result = await whatsAppService.sendTripReminder(phoneNumber, notification.data);
          break;
        case 'vendor_offer':
          result = await whatsAppService.sendVendorOffer(phoneNumber, notification.data);
          break;
        default:
          // For other types, send as text message
          const message = `${notification.title}\n\n${notification.body}`;
          result = await whatsAppService.sendTextMessage(phoneNumber, message);
      }

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'sendWhatsAppNotification' }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, notification) {
    try {
      // Get user email from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get user email from auth
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user?.user?.email) {
        throw new Error('User email not found');
      }

      // For now, just log the email notification
      // In production, integrate with email service (SendGrid, etc.)

      return { success: true };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'sendEmailNotification' }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Store notification in database for in-app display
   */
  async storeNotification(userId, notification, deliveryResults) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data,
          delivery_results: deliveryResults,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'storeNotification' }
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'markAsRead' }
      });
      return false;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'getUserNotifications' }
      });
      return { data: null, error };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'getUnreadCount' }
      });
      return 0;
    }
  }

  /**
   * Clear all notifications for user
   */
  async clearAllNotifications(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'clearAllNotifications' }
      });
      return false;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, preferences) {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          push_notifications: preferences.pushNotifications,
          email_notifications: preferences.emailNotifications,
          whatsapp_notifications: preferences.whatsappNotifications,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'updatePreferences' }
      });
      return false;
    }
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(notification) {
    try {
      // Store scheduled notification in database
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert({
          title: notification.title,
          message: notification.message,
          scheduled_time: notification.scheduledTime,
          type: notification.type,
          data: notification.data,
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, you would use a job queue or cron job
      // For now, we'll use setTimeout for demonstration
      const scheduledTime = new Date(notification.scheduledTime);
      const delay = scheduledTime.getTime() - Date.now();

      if (delay > 0) {
        setTimeout(() => {
          this.showNotification(notification.title, {
            body: notification.message,
            icon: '/icons/stream.png',
            tag: 'stream-reminder',
            data: notification.data
          });
        }, delay);
      }

      return { success: true, notificationId: data.id };
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'notification', operation: 'scheduleNotification' }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification templates for different types
   */
  createNotificationTemplate(type, data) {
    const templates = {
      vendor_offer: {
        title: '🎯 New Adventure Offer!',
        body: `${data.vendorName} has a perfect ${data.adventureType} for you!`,
        icon: '/icons/offer.png',
        type: 'vendor_offer',
        data: {
          offerId: data.offerId,
          vendorId: data.vendorId,
          adventureId: data.adventureId,
          url: `/offers/${data.offerId}`
        },
        actions: [
          { action: 'view', title: 'View Offer' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      },
      booking_confirmed: {
        title: '✅ Booking Confirmed!',
        body: `Your ${data.adventureName} booking is confirmed for ${data.date}`,
        icon: '/icons/booking.png',
        type: 'booking_confirmed',
        data: {
          bookingId: data.bookingId,
          url: `/bookings/${data.bookingId}`
        }
      },
      group_invitation: {
        title: '👥 Group Invitation',
        body: `${data.inviterName} invited you to join their ${data.adventureName} group`,
        icon: '/icons/group.png',
        type: 'group_invitation',
        data: {
          groupId: data.groupId,
          inviterId: data.inviterId,
          url: `/groups/${data.groupId}`
        },
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        ]
      },
      trip_request_match: {
        title: '🎯 Perfect Match Found!',
        body: `We found adventures that match your ${data.destination} trip request`,
        icon: '/icons/match.png',
        type: 'trip_request_match',
        data: {
          requestId: data.requestId,
          matchCount: data.matchCount,
          url: `/trips/requests/${data.requestId}/matches`
        }
      },
      stream_reminder: {
        title: '📺 Stream Starting Soon!',
        body: `"${data.streamTitle}" starts in ${data.minutesUntil} minutes`,
        icon: '/icons/stream.png',
        type: 'stream_reminder',
        data: {
          streamId: data.streamId,
          url: `/streams/${data.streamId}`
        },
        actions: [
          { action: 'watch', title: 'Watch Now' },
          { action: 'remind_later', title: 'Remind Me' }
        ]
      },
      stream_live: {
        title: '🔴 Stream Now Live!',
        body: `"${data.streamTitle}" by ${data.streamerName} is now streaming`,
        icon: '/icons/live.png',
        type: 'stream_live',
        data: {
          streamId: data.streamId,
          url: `/streams/${data.streamId}`
        },
        actions: [
          { action: 'watch', title: 'Join Stream' }
        ]
      },
      payment_success: {
        title: '💳 Payment Successful!',
        body: `Your payment has been processed successfully`,
        icon: '/icons/payment-success.png',
        type: 'payment_success',
        data: {
          bookingId: data.bookingId,
          amount: data.amount,
          currency: data.currency,
          paymentIntentId: data.paymentIntentId,
          url: `/bookings/${data.bookingId}`
        }
      },
      payment_failed: {
        title: '❌ Payment Failed',
        body: `Your payment could not be processed. Please try again.`,
        icon: '/icons/payment-failed.png',
        type: 'payment_failed',
        data: {
          bookingId: data.bookingId,
          paymentIntentId: data.paymentIntentId,
          error: data.error,
          url: `/bookings/${data.bookingId}/retry-payment`
        },
        actions: [
          { action: 'retry', title: 'Retry Payment' },
          { action: 'contact', title: 'Contact Support' }
        ]
      },
      refund_processed: {
        title: '💰 Refund Processed',
        body: `Your ${data.isPartial ? 'partial ' : ''}refund has been processed`,
        icon: '/icons/refund.png',
        type: 'refund_processed',
        data: {
          bookingId: data.bookingId,
          refundAmount: data.refundAmount,
          currency: data.currency,
          reason: data.reason,
          isPartial: data.isPartial,
          url: `/bookings/${data.bookingId}`
        }
      },
      dispute_created: {
        title: '⚠️ Payment Dispute',
        body: `A payment dispute has been filed for booking ${data.bookingId}`,
        icon: '/icons/dispute.png',
        type: 'dispute_created',
        data: {
          bookingId: data.bookingId,
          disputeId: data.disputeId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
          status: data.status,
          evidenceDueBy: data.evidenceDueBy,
          url: `/vendor/disputes/${data.disputeId}`
        },
        actions: [
          { action: 'respond', title: 'Respond to Dispute' },
          { action: 'view_details', title: 'View Details' }
        ]
      },
      webhook_failure: {
        title: '🚨 System Alert',
        body: `Critical webhook failure detected for ${data.eventType}`,
        icon: '/icons/alert.png',
        type: 'webhook_failure',
        data: {
          eventId: data.eventId,
          eventType: data.eventType,
          errorMessage: data.errorMessage,
          attemptCount: data.attemptCount,
          timestamp: data.timestamp
        }
      }
    };

    return templates[type] || {
      title: 'Notification',
      body: 'You have a new notification',
      type: 'general',
      data: data || {}
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
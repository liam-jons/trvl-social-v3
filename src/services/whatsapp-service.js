/**
 * WhatsApp Business API Service
 * Handles WhatsApp message sending, group management, and webhook processing
 */
import { logger } from '../utils/logger.js';
class WhatsAppService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = import.meta.env.VITE_WHATSAPP_VERIFY_TOKEN;
  }

  /**
   * Initialize WhatsApp service and validate configuration
   */
  async initialize() {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        logger.warn('WhatsApp Business API credentials not configured');
        return false;
      }

      // Verify the phone number is available
      const isValid = await this.validatePhoneNumber();
      if (!isValid) {
        logger.error('WhatsApp phone number validation failed');
        return false;
      }

      // console.log('WhatsApp Business API service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing WhatsApp service:', error);
      return false;
    }
  }

  /**
   * Validate WhatsApp Business phone number
   */
  async validatePhoneNumber() {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.display_phone_number ? true : false;
      }

      return false;
    } catch (error) {
      logger.error('Error validating phone number:', error);
      return false;
    }
  }

  /**
   * Send a text message to a WhatsApp number
   */
  async sendTextMessage(to, message, options = {}) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: options.previewUrl || false,
          body: message
        }
      };

      const response = await this.makeRequest(
        `/${this.phoneNumberId}/messages`,
        'POST',
        payload
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp text message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(to, templateName, language = 'en', parameters = []) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: language
          },
          components: parameters.length > 0 ? [
            {
              type: "body",
              parameters: parameters.map(param => ({
                type: "text",
                text: param
              }))
            }
          ] : []
        }
      };

      const response = await this.makeRequest(
        `/${this.phoneNumberId}/messages`,
        'POST',
        payload
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a WhatsApp group (Note: Direct group creation via API is limited)
   * This method prepares group invitation links and manages member lists
   */
  async createGroup(groupData) {
    try {
      const { name, description, members, adminPhoneNumber } = groupData;

      // For now, we'll create a structured group invitation flow
      // Since WhatsApp API doesn't directly support group creation,
      // we'll use invitation templates and manage member lists

      const groupInfo = {
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        members: members || [],
        admin: adminPhoneNumber,
        created_at: new Date().toISOString(),
        invitation_link: null, // Will be set when group is manually created
        status: 'pending_creation'
      };

      // Send group creation notification to admin
      if (adminPhoneNumber) {
        const message = `🎯 Travel Group Setup\n\n` +
          `Group: ${name}\n` +
          `Description: ${description}\n` +
          `Members to invite: ${members.length}\n\n` +
          `Please create the WhatsApp group and share the invitation link through the app.`;

        await this.sendTextMessage(adminPhoneNumber, message);
      }

      return {
        success: true,
        groupInfo,
        message: 'Group creation flow initiated'
      };
    } catch (error) {
      console.error('Error creating WhatsApp group:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send group invitation messages to members
   */
  async inviteToGroup(groupInfo, members) {
    try {
      const invitationResults = [];

      for (const member of members) {
        const message = `🎉 You're invited to join: ${groupInfo.name}\n\n` +
          `${groupInfo.description}\n\n` +
          `${groupInfo.invitation_link ?
            `Join here: ${groupInfo.invitation_link}` :
            'The group admin will send you the invitation link soon.'
          }`;

        const result = await this.sendTextMessage(member.phone, message);
        invitationResults.push({
          phone: member.phone,
          name: member.name,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        invitationResults,
        totalInvited: invitationResults.filter(r => r.success).length,
        totalFailed: invitationResults.filter(r => !r.success).length
      };
    } catch (error) {
      console.error('Error sending group invitations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send booking confirmation message
   */
  async sendBookingConfirmation(to, bookingData) {
    const message = `✅ Booking Confirmed!\n\n` +
      `Adventure: ${bookingData.adventureName}\n` +
      `Date: ${bookingData.date}\n` +
      `Location: ${bookingData.location}\n` +
      `Group Size: ${bookingData.groupSize}\n\n` +
      `Booking ID: ${bookingData.bookingId}\n\n` +
      `We'll keep you updated on your WhatsApp! 🎯`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Send trip reminder message
   */
  async sendTripReminder(to, tripData) {
    const message = `⏰ Trip Reminder\n\n` +
      `Your ${tripData.adventureName} adventure is ${tripData.timeUntil}!\n\n` +
      `📍 Meeting Point: ${tripData.meetingPoint}\n` +
      `🕐 Time: ${tripData.time}\n\n` +
      `Don't forget: ${tripData.reminders.join(', ')}\n\n` +
      `Have an amazing adventure! 🌟`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Send vendor offer notification
   */
  async sendVendorOffer(to, offerData) {
    const message = `🎯 New Adventure Offer!\n\n` +
      `${offerData.vendorName} has a perfect ${offerData.adventureType} for you!\n\n` +
      `📍 Location: ${offerData.location}\n` +
      `💰 Price: ${offerData.price}\n` +
      `📅 Available: ${offerData.availability}\n\n` +
      `View details in the TRVL app to book now! 🚀`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Handle incoming webhook messages
   */
  async processWebhookMessage(webhookData) {
    try {
      const { entry } = webhookData;

      if (!entry || !Array.isArray(entry)) {
        return { success: false, error: 'Invalid webhook data' };
      }

      const processedMessages = [];

      for (const entryItem of entry) {
        const changes = entryItem.changes || [];

        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value?.messages || [];
            const contacts = change.value?.contacts || [];

            for (const message of messages) {
              const processedMessage = await this.processIncomingMessage(
                message,
                contacts.find(c => c.wa_id === message.from)
              );
              processedMessages.push(processedMessage);
            }
          }
        }
      }

      return {
        success: true,
        processedMessages,
        totalProcessed: processedMessages.length
      };
    } catch (error) {
      console.error('Error processing webhook message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process individual incoming message
   */
  async processIncomingMessage(message, contact) {
    try {
      const messageData = {
        id: message.id,
        from: message.from,
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        type: message.type,
        contact: contact ? {
          name: contact.profile?.name,
          wa_id: contact.wa_id
        } : null
      };

      // Extract message content based on type
      switch (message.type) {
        case 'text':
          messageData.text = message.text?.body;
          break;
        case 'image':
          messageData.media = {
            id: message.image?.id,
            mime_type: message.image?.mime_type,
            caption: message.image?.caption
          };
          break;
        case 'document':
          messageData.media = {
            id: message.document?.id,
            filename: message.document?.filename,
            mime_type: message.document?.mime_type,
            caption: message.document?.caption
          };
          break;
        default:
          messageData.unsupported = true;
      }

      // Here you would typically:
      // 1. Store the message in your database
      // 2. Trigger any automated responses
      // 3. Forward to customer service if needed
      // 4. Send to real-time notification system

      return {
        success: true,
        messageData,
        actions: await this.determineMessageActions(messageData)
      };
    } catch (error) {
      console.error('Error processing incoming message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine actions to take based on incoming message
   */
  async determineMessageActions(messageData) {
    const actions = [];

    if (messageData.type === 'text' && messageData.text) {
      const text = messageData.text.toLowerCase();

      // Auto-responses for common queries
      if (text.includes('booking') || text.includes('reservation')) {
        actions.push({
          type: 'auto_response',
          message: 'Thanks for your message! Our team will help you with your booking shortly. You can also check your booking status in the TRVL app.'
        });
      } else if (text.includes('cancel')) {
        actions.push({
          type: 'auto_response',
          message: 'For cancellations, please visit the TRVL app or contact our support team. We\'ll process your request promptly.'
        });
      } else if (text.includes('help') || text.includes('support')) {
        actions.push({
          type: 'auto_response',
          message: 'We\'re here to help! 🎯\n\n📱 Use the TRVL app for bookings and trip management\n💬 Chat with our support team\n🔗 Visit our help center\n\nWhat can we assist you with today?'
        });
      } else {
        // Forward to customer service
        actions.push({
          type: 'forward_to_support',
          priority: 'normal'
        });
      }
    } else {
      // Non-text messages forward to support
      actions.push({
        type: 'forward_to_support',
        priority: 'normal'
      });
    }

    return actions;
  }

  /**
   * Execute determined actions for incoming messages
   */
  async executeMessageActions(messageData, actions) {
    const results = [];

    for (const action of actions) {
      switch (action.type) {
        case 'auto_response':
          const response = await this.sendTextMessage(messageData.from, action.message);
          results.push({
            type: 'auto_response',
            success: response.success,
            messageId: response.messageId
          });
          break;

        case 'forward_to_support':
          // This would integrate with your customer service system
          results.push({
            type: 'forward_to_support',
            success: true,
            supportTicketId: `ticket_${Date.now()}`
          });
          break;
      }
    }

    return results;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      };

      const response = await this.makeRequest(
        `/${this.phoneNumberId}/messages`,
        'POST',
        payload
      );

      return { success: true, response };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get media file from WhatsApp
   */
  async getMedia(mediaId) {
    try {
      const response = await this.makeRequest(`/${mediaId}`, 'GET');
      return {
        success: true,
        mediaUrl: response.url,
        mimeType: response.mime_type,
        fileSize: response.file_size
      };
    } catch (error) {
      console.error('Error getting media:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make authenticated request to WhatsApp API
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `WhatsApp API error: ${response.status} ${response.statusText} - ${
          errorData.error?.message || 'Unknown error'
        }`
      );
    }

    return response.json();
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload, signature, secret) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Get webhook verification token
   */
  getVerifyToken() {
    return this.verifyToken;
  }
}

// Create singleton instance
const whatsAppService = new WhatsAppService();

export default whatsAppService;
/**
 * Email Service with Resend Integration
 * Handles all email sending functionality with templates, validation, and monitoring
 */

import { Resend } from 'resend';
import { getServiceConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

// Email service configuration
class EmailService {
  constructor() {
    this.resend = null;
    this.isInitialized = false;
    this.config = getServiceConfig('email');
    this.companyConfig = getServiceConfig('company');
    this.appConfig = getServiceConfig('app');

    // Email templates
    this.templates = {
      welcome: 'welcome-email',
      resetPassword: 'reset-password',
      emailVerification: 'email-verification',
      bookingConfirmation: 'booking-confirmation',
      bookingReminder: 'booking-reminder',
      paymentSuccess: 'payment-success',
      refundProcessed: 'refund-processed',
      vendorInvite: 'vendor-invite',
      invoiceDelivery: 'invoice-delivery',
      newsletterSignup: 'newsletter-signup',
      supportTicket: 'support-ticket',
      generalNotification: 'general-notification'
    };

    // Rate limiting configuration
    this.rateLimits = {
      perMinute: 100,
      perHour: 1000,
      perDay: 10000
    };

    this.sentEmails = new Map(); // Track sent emails for rate limiting
  }

  /**
   * Initialize the email service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Check for Resend API key
      if (!this.config.resendApiKey) {
        logger.warn('Resend API key not configured - email service disabled');
        return false;
      }

      // Initialize Resend client
      this.resend = new Resend(this.config.resendApiKey);

      // Verify API key and domain configuration
      const isValid = await this.validateConfiguration();

      if (isValid) {
        this.isInitialized = true;
        logger.info('Email service initialized successfully with Resend');
        return true;
      } else {
        logger.error('Email service configuration validation failed');
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      return false;
    }
  }

  /**
   * Validate email service configuration
   */
  async validateConfiguration() {
    try {
      // Test API key validity by attempting to get domains
      const domains = await this.resend.domains.list();

      if (domains.error) {
        logger.error('Resend API key validation failed:', domains.error);
        return false;
      }

      logger.info(`Email service validated - ${domains.data?.length || 0} domains configured`);
      return true;
    } catch (error) {
      logger.error('Email configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplatedEmail(templateId, to, data = {}, options = {}) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Email service not available');
      }
    }

    // Validate email address
    if (!this.isValidEmail(to)) {
      throw new Error(`Invalid email address: ${to}`);
    }

    // Check rate limits
    if (!this.checkRateLimit(to)) {
      throw new Error(`Rate limit exceeded for ${to}`);
    }

    // Get template configuration
    const template = this.getTemplate(templateId, data);

    // Prepare email payload
    const emailPayload = {
      from: options.from || this.config.fromEmail || 'noreply@trvlsocial.com',
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-Entity-ID': options.entityId || 'general',
        'X-Template-ID': templateId,
        'X-Source': 'trvl-social-app'
      },
      tags: [
        { name: 'template', value: templateId },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    };

    // Add reply-to if specified
    if (options.replyTo) {
      emailPayload.reply_to = [options.replyTo];
    }

    // Add attachments if specified
    if (options.attachments && options.attachments.length > 0) {
      emailPayload.attachments = options.attachments;
    }

    try {
      const result = await this.resend.emails.send(emailPayload);

      if (result.error) {
        logger.error('Email sending failed:', result.error);
        throw new Error(`Email sending failed: ${result.error.message}`);
      }

      // Track sent email for rate limiting
      this.trackSentEmail(to);

      logger.info(`Email sent successfully - ID: ${result.data?.id}, Template: ${templateId}, To: ${to}`);

      return {
        success: true,
        messageId: result.data?.id,
        template: templateId,
        recipient: to
      };

    } catch (error) {
      logger.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send a custom email (without template)
   */
  async sendEmail({ to, subject, html, text, from, replyTo, attachments, tags = [] }) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Email service not available');
      }
    }

    // Validate email address
    if (!this.isValidEmail(to)) {
      throw new Error(`Invalid email address: ${to}`);
    }

    // Check rate limits
    if (!this.checkRateLimit(to)) {
      throw new Error(`Rate limit exceeded for ${to}`);
    }

    const emailPayload = {
      from: from || this.config.fromEmail || 'noreply@trvlsocial.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      headers: {
        'X-Source': 'trvl-social-app'
      },
      tags: [
        { name: 'type', value: 'custom' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
        ...tags
      ]
    };

    if (replyTo) {
      emailPayload.reply_to = [replyTo];
    }

    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    try {
      const result = await this.resend.emails.send(emailPayload);

      if (result.error) {
        logger.error('Custom email sending failed:', result.error);
        throw new Error(`Email sending failed: ${result.error.message}`);
      }

      // Track sent email for rate limiting
      const recipient = Array.isArray(to) ? to[0] : to;
      this.trackSentEmail(recipient);

      logger.info(`Custom email sent successfully - ID: ${result.data?.id}, To: ${recipient}`);

      return {
        success: true,
        messageId: result.data?.id,
        recipient
      };

    } catch (error) {
      logger.error('Custom email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get email template with data substitution
   */
  getTemplate(templateId, data = {}) {
    const templates = {
      welcome: {
        subject: `Welcome to ${this.companyConfig.name || 'TRVL Social'}!`,
        html: this.getWelcomeEmailHTML(data),
        text: this.getWelcomeEmailText(data)
      },

      resetPassword: {
        subject: 'Reset your password',
        html: this.getResetPasswordHTML(data),
        text: this.getResetPasswordText(data)
      },

      emailVerification: {
        subject: 'Verify your email address',
        html: this.getEmailVerificationHTML(data),
        text: this.getEmailVerificationText(data)
      },

      bookingConfirmation: {
        subject: `Booking Confirmed - ${data.adventureName || 'Your Adventure'}`,
        html: this.getBookingConfirmationHTML(data),
        text: this.getBookingConfirmationText(data)
      },

      invoiceDelivery: {
        subject: `Invoice ${data.invoiceNumber || ''} - ${this.companyConfig.name || 'TRVL Social'}`,
        html: this.getInvoiceDeliveryHTML(data),
        text: this.getInvoiceDeliveryText(data)
      },

      generalNotification: {
        subject: data.subject || 'Notification from TRVL Social',
        html: this.getGeneralNotificationHTML(data),
        text: this.getGeneralNotificationText(data)
      }
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error(`Email template '${templateId}' not found`);
    }

    return template;
  }

  /**
   * Welcome Email Templates
   */
  getWelcomeEmailHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TRVL Social</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin-bottom: 10px;">Welcome to TRVL Social!</h1>
            <p style="font-size: 18px; color: #666;">Connect, travel, and explore with like-minded adventurers</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Hi ${data.firstName || 'Fellow Traveler'},</h2>
            <p>Welcome to TRVL Social! We're excited to have you join our community of passionate travelers and adventure seekers.</p>

            <h3 style="color: #1e40af;">What's Next?</h3>
            <ul style="margin-left: 20px;">
              <li>Complete your profile to connect with like-minded travelers</li>
              <li>Take our personality quiz to find your perfect travel matches</li>
              <li>Browse amazing adventures created by our verified vendors</li>
              <li>Join groups and start planning your next adventure</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.appConfig?.url || 'https://trvlsocial.com'}/profile"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Your Profile
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>Need help? Contact us at <a href="mailto:${this.companyConfig.email}" style="color: #3b82f6;">${this.companyConfig.email}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  getWelcomeEmailText(data) {
    return `
Welcome to TRVL Social!

Hi ${data.firstName || 'Fellow Traveler'},

Welcome to TRVL Social! We're excited to have you join our community of passionate travelers and adventure seekers.

What's Next?
- Complete your profile to connect with like-minded travelers
- Take our personality quiz to find your perfect travel matches
- Browse amazing adventures created by our verified vendors
- Join groups and start planning your next adventure

Get started: ${this.appConfig?.url || 'https://trvlsocial.com'}/profile

Need help? Contact us at ${this.companyConfig.email}

© ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.
    `.trim();
  }

  /**
   * General Notification Templates
   */
  getGeneralNotificationHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject || 'Notification'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6;">${data.title || 'Notification'}</h1>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            ${data.content || data.message || '<p>You have a new notification from TRVL Social.</p>'}
          </div>

          ${data.actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${data.actionText || 'View Details'}
            </a>
          </div>
          ` : ''}

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>Need help? Contact us at <a href="mailto:${this.companyConfig.email}" style="color: #3b82f6;">${this.companyConfig.email}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  getGeneralNotificationText(data) {
    return `
${data.title || 'Notification'}

${data.content || data.message || 'You have a new notification from TRVL Social.'}

${data.actionUrl ? `View Details: ${data.actionUrl}` : ''}

Need help? Contact us at ${this.companyConfig.email}

© ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.
    `.trim();
  }

  // Additional template methods
  getResetPasswordHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6;">Reset Your Password</h1>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>We received a request to reset your password for your TRVL Social account.</p>
            <p>Click the button below to create a new password:</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>&copy; ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  getResetPasswordText(data) {
    return `
Reset Your Password

We received a request to reset your password for your TRVL Social account.

Click this link to create a new password:
${data.resetUrl}

Security Notice: This link will expire in 1 hour. If you didn't request this reset, please ignore this email.

© ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.
    `.trim();
  }

  getEmailVerificationHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6;">Verify Your Email Address</h1>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>Thanks for signing up for TRVL Social! Please verify your email address to complete your registration.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}"
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>&copy; ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  getEmailVerificationText(data) {
    return `
Verify Your Email Address

Thanks for signing up for TRVL Social! Please verify your email address to complete your registration.

Click this link to verify: ${data.verificationUrl}

© ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.
    `.trim();
  }

  getBookingConfirmationHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981;">🎉 Booking Confirmed!</h1>
            <p style="font-size: 18px; color: #666;">${data.adventureName}</p>
          </div>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h2 style="color: #166534; margin-top: 0;">Booking Details</h2>
            <p><strong>Adventure:</strong> ${data.adventureName}</p>
            <p><strong>Date:</strong> ${data.adventureDate}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Participants:</strong> ${data.participants || 1}</p>
            <p><strong>Total Amount:</strong> ${data.currency || '$'}${data.amount}</p>
            <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af;">What's Next?</h3>
            <ul>
              <li>You'll receive a reminder email 24 hours before your adventure</li>
              <li>Check your booking details in the TRVL Social app</li>
              <li>Contact your guide if you have any questions</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.bookingUrl || this.appConfig?.url + '/bookings'}"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Booking
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>Need help? Contact us at <a href="mailto:${this.companyConfig.email}" style="color: #3b82f6;">${this.companyConfig.email}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  getBookingConfirmationText(data) {
    return `
🎉 Booking Confirmed!

${data.adventureName}

Booking Details:
- Adventure: ${data.adventureName}
- Date: ${data.adventureDate}
- Location: ${data.location}
- Participants: ${data.participants || 1}
- Total Amount: ${data.currency || '$'}${data.amount}
- Booking Reference: ${data.bookingReference}

What's Next?
- You'll receive a reminder email 24 hours before your adventure
- Check your booking details in the TRVL Social app
- Contact your guide if you have any questions

View your booking: ${data.bookingUrl || this.appConfig?.url + '/bookings'}

Need help? Contact us at ${this.companyConfig.email}

© ${new Date().getFullYear()} ${this.companyConfig.name || 'TRVL Social'}. All rights reserved.
    `.trim();
  }

  getInvoiceDeliveryHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${data.invoiceNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6;">Invoice ${data.invoiceNumber}</h1>
            <p style="font-size: 16px; color: #666;">from ${data.companyName}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Hi ${data.customerName},</h2>
            <p>Please find attached your invoice for recent services. Here are the details:</p>

            <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
              <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${data.currency} ${data.amount}</p>
              ${data.dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
            </div>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Payment Information:</strong> Please review the attached invoice for payment instructions and terms.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>Questions? Contact us at <a href="mailto:${data.supportEmail}" style="color: #3b82f6;">${data.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  getInvoiceDeliveryText(data) {
    return `
Invoice ${data.invoiceNumber}
From ${data.companyName}

Hi ${data.customerName},

Please find attached your invoice for recent services. Here are the details:

Invoice Number: ${data.invoiceNumber}
Amount Due: ${data.currency} ${data.amount}
${data.dueDate ? `Due Date: ${data.dueDate}` : ''}

Payment Information: Please review the attached invoice for payment instructions and terms.

If you have any questions about this invoice, please don't hesitate to contact us.

Questions? Contact us at ${data.supportEmail}

© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.
    `.trim();
  }

  /**
   * Utility methods
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  checkRateLimit(email) {
    const now = Date.now();
    const emailKey = email.toLowerCase();

    if (!this.sentEmails.has(emailKey)) {
      this.sentEmails.set(emailKey, []);
    }

    const emailHistory = this.sentEmails.get(emailKey);

    // Remove entries older than 1 hour
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentEmails = emailHistory.filter(timestamp => timestamp > oneHourAgo);
    this.sentEmails.set(emailKey, recentEmails);

    // Check rate limits
    const oneMinuteAgo = now - (60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const emailsInLastMinute = recentEmails.filter(timestamp => timestamp > oneMinuteAgo).length;
    const emailsInLastHour = recentEmails.length;
    const emailsInLastDay = emailHistory.filter(timestamp => timestamp > oneDayAgo).length;

    return emailsInLastMinute < this.rateLimits.perMinute &&
           emailsInLastHour < this.rateLimits.perHour &&
           emailsInLastDay < this.rateLimits.perDay;
  }

  trackSentEmail(email) {
    const emailKey = email.toLowerCase();
    if (!this.sentEmails.has(emailKey)) {
      this.sentEmails.set(emailKey, []);
    }
    this.sentEmails.get(emailKey).push(Date.now());
  }

  /**
   * Get email delivery status
   */
  async getEmailStatus(messageId) {
    if (!this.isInitialized || !this.resend) {
      throw new Error('Email service not initialized');
    }

    try {
      const result = await this.resend.emails.get(messageId);
      return result;
    } catch (error) {
      logger.error('Failed to get email status:', error);
      throw new Error(`Failed to get email status: ${error.message}`);
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      const testResult = await this.sendEmail({
        to: this.config.fromEmail || 'test@trvlsocial.com',
        subject: 'Email Service Test',
        html: '<p>This is a test email to verify the email service configuration.</p>',
        text: 'This is a test email to verify the email service configuration.',
        tags: [{ name: 'type', value: 'test' }]
      });

      return {
        success: true,
        message: 'Test email sent successfully',
        messageId: testResult.messageId
      };
    } catch (error) {
      return {
        success: false,
        message: `Test email failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
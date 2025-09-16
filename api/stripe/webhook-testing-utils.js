/**
 * Stripe Webhook Testing Utilities
 * Development tools for testing webhook processing locally
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Mock webhook event generator for testing
 */
class WebhookTestUtils {
  static generateMockEvent(eventType, objectData = {}) {
    const baseEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      type: eventType,
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
    };

    // Generate appropriate mock data based on event type
    switch (eventType) {
      case 'payment_intent.succeeded':
        baseEvent.data = {
          object: {
            id: `pi_${Math.random().toString(36).substr(2, 24)}`,
            object: 'payment_intent',
            amount: 5000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              booking_id: 'test-booking-123',
              user_id: 'test-user-456',
              ...objectData.metadata,
            },
            ...objectData,
          },
        };
        break;

      case 'payment_intent.payment_failed':
        baseEvent.data = {
          object: {
            id: `pi_${Math.random().toString(36).substr(2, 24)}`,
            object: 'payment_intent',
            amount: 5000,
            currency: 'usd',
            status: 'failed',
            last_payment_error: {
              message: 'Your card was declined.',
              type: 'card_error',
              code: 'card_declined',
            },
            metadata: {
              booking_id: 'test-booking-123',
              user_id: 'test-user-456',
              ...objectData.metadata,
            },
            ...objectData,
          },
        };
        break;

      case 'account.updated':
        baseEvent.data = {
          object: {
            id: `acct_${Math.random().toString(36).substr(2, 16)}`,
            object: 'account',
            charges_enabled: true,
            payouts_enabled: true,
            details_submitted: true,
            business_profile: {
              name: 'Test Business',
              support_email: 'support@testbusiness.com',
            },
            requirements: {
              currently_due: [],
              eventually_due: [],
              past_due: [],
            },
            ...objectData,
          },
        };
        break;

      case 'charge.refunded':
        baseEvent.data = {
          object: {
            id: `ch_${Math.random().toString(36).substr(2, 24)}`,
            object: 'charge',
            payment_intent: `pi_${Math.random().toString(36).substr(2, 24)}`,
            amount: 5000,
            currency: 'usd',
            refunded: true,
            refunds: {
              data: [{
                id: `re_${Math.random().toString(36).substr(2, 24)}`,
                object: 'refund',
                amount: 5000,
                reason: 'requested_by_customer',
                status: 'succeeded',
                created: Math.floor(Date.now() / 1000),
              }],
            },
            ...objectData,
          },
        };
        break;

      case 'charge.dispute.created':
        baseEvent.data = {
          object: {
            id: `dp_${Math.random().toString(36).substr(2, 24)}`,
            object: 'dispute',
            charge: `ch_${Math.random().toString(36).substr(2, 24)}`,
            amount: 5000,
            currency: 'usd',
            reason: 'fraudulent',
            status: 'warning_needs_response',
            evidence_due_by: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
            created: Math.floor(Date.now() / 1000),
            ...objectData,
          },
        };
        break;

      default:
        baseEvent.data = { object: objectData };
    }

    return baseEvent;
  }

  /**
   * Send mock webhook to local endpoint
   */
  static async sendMockWebhook(eventType, objectData = {}, endpoint = 'http://localhost:3000/api/stripe/webhooks') {
    const mockEvent = this.generateMockEvent(eventType, objectData);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'mock-signature-for-testing',
        },
        body: JSON.stringify(mockEvent),
      });

      const result = await response.json();

      console.log(`Mock webhook ${eventType} sent:`, {
        status: response.status,
        result,
        eventId: mockEvent.id,
      });

      return { success: response.ok, status: response.status, result, eventId: mockEvent.id };
    } catch (error) {
      console.error('Failed to send mock webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Replay a real webhook event from database
   */
  static async replayWebhookEvent(eventId, endpoint = 'http://localhost:3000/api/stripe/webhooks') {
    try {
      // Fetch the event from database
      const { data: webhookEvent, error } = await supabase
        .from('stripe_webhook_events')
        .select('event_data')
        .eq('stripe_event_id', eventId)
        .single();

      if (error || !webhookEvent) {
        throw new Error(`Webhook event ${eventId} not found in database`);
      }

      // Reset processing status for replay
      await supabase
        .from('stripe_webhook_events')
        .update({
          processed: false,
          processing_attempts: 0,
          last_processing_error: null,
          processed_at: null,
        })
        .eq('stripe_event_id', eventId);

      // Send the event to webhook endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'replay-signature-for-testing',
        },
        body: JSON.stringify(webhookEvent.event_data),
      });

      const result = await response.json();

      console.log(`Webhook event ${eventId} replayed:`, {
        status: response.status,
        result,
      });

      return { success: response.ok, status: response.status, result };
    } catch (error) {
      console.error('Failed to replay webhook event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List recent webhook events from database
   */
  static async listRecentWebhooks(limit = 10) {
    try {
      const { data: events, error } = await supabase
        .from('stripe_webhook_events')
        .select('stripe_event_id, event_type, processed, processing_attempts, created_at, last_processing_error')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      console.table(events);
      return events;
    } catch (error) {
      console.error('Failed to list webhook events:', error);
      return [];
    }
  }

  /**
   * Get webhook processing statistics
   */
  static async getWebhookStats(hours = 24) {
    try {
      const cutoffDate = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();

      const { data: stats, error } = await supabase
        .from('stripe_webhook_events')
        .select('event_type, processed, processing_attempts')
        .gte('created_at', cutoffDate);

      if (error) {
        throw error;
      }

      const summary = stats.reduce((acc, event) => {
        const type = event.event_type;
        if (!acc[type]) {
          acc[type] = { total: 0, processed: 0, failed: 0, retried: 0 };
        }

        acc[type].total++;
        if (event.processed) {
          acc[type].processed++;
        } else {
          acc[type].failed++;
        }
        if (event.processing_attempts > 1) {
          acc[type].retried++;
        }

        return acc;
      }, {});

      console.log(`Webhook statistics for last ${hours} hours:`, summary);
      return summary;
    } catch (error) {
      console.error('Failed to get webhook stats:', error);
      return {};
    }
  }

  /**
   * Test webhook signature verification
   */
  static testSignatureVerification() {
    const testPayload = JSON.stringify({ test: 'event' });
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      console.warn('STRIPE_WEBHOOK_SECRET not configured');
      return false;
    }

    try {
      // Create a proper signature
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = timestamp + '.' + testPayload;
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      const header = `t=${timestamp},v1=${signature}`;

      // Verify signature
      const event = stripe.webhooks.constructEvent(testPayload, header, secret);

      console.log('Signature verification test: PASSED');
      return true;
    } catch (error) {
      console.error('Signature verification test: FAILED -', error.message);
      return false;
    }
  }
}

// CLI interface for testing
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'mock':
      const eventType = args[0] || 'payment_intent.succeeded';
      WebhookTestUtils.sendMockWebhook(eventType)
        .then(result => console.log('Mock webhook result:', result))
        .catch(console.error);
      break;

    case 'replay':
      const eventId = args[0];
      if (!eventId) {
        console.error('Usage: node webhook-testing-utils.js replay <event_id>');
        process.exit(1);
      }
      WebhookTestUtils.replayWebhookEvent(eventId)
        .then(result => console.log('Replay result:', result))
        .catch(console.error);
      break;

    case 'list':
      const limit = parseInt(args[0]) || 10;
      WebhookTestUtils.listRecentWebhooks(limit)
        .catch(console.error);
      break;

    case 'stats':
      const hours = parseInt(args[0]) || 24;
      WebhookTestUtils.getWebhookStats(hours)
        .catch(console.error);
      break;

    case 'test-signature':
      WebhookTestUtils.testSignatureVerification();
      break;

    default:
      console.log(`
Stripe Webhook Testing Utilities

Usage:
  node webhook-testing-utils.js mock [event_type]           - Send mock webhook
  node webhook-testing-utils.js replay <event_id>          - Replay webhook from DB
  node webhook-testing-utils.js list [limit]               - List recent webhooks
  node webhook-testing-utils.js stats [hours]              - Get webhook statistics
  node webhook-testing-utils.js test-signature             - Test signature verification

Examples:
  node webhook-testing-utils.js mock payment_intent.succeeded
  node webhook-testing-utils.js replay evt_1234567890
  node webhook-testing-utils.js list 20
  node webhook-testing-utils.js stats 48
      `);
  }
}

module.exports = WebhookTestUtils;
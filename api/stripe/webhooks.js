/**
 * Stripe Webhooks API
 * Serverless function to handle Stripe webhook events
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Import monitoring and notification services
const datadogService = require('../../src/services/datadog-service.js').default;
const sentryService = require('../../src/services/sentry-service.js').default;
const notificationService = require('../../src/services/notification-service.js').default;

// Initialize Supabase client with service role for full access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enhanced webhook configuration
const WEBHOOK_CONFIG = {
  maxRetries: 5,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 300000, // 5 minutes
  exponentialBase: 2,
  alertOnMaxRetriesReached: true,
  trackMetrics: true,
};

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.VITE_APP_URL || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
};

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('Webhook secret not configured - skipping verification');
    return JSON.parse(payload);
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Calculate exponential backoff delay
function calculateRetryDelay(attemptNumber) {
  const delay = WEBHOOK_CONFIG.baseRetryDelay * Math.pow(WEBHOOK_CONFIG.exponentialBase, attemptNumber);
  return Math.min(delay, WEBHOOK_CONFIG.maxRetryDelay);
}

// Log webhook metrics (would integrate with monitoring service)
async function logWebhookMetrics(eventType, status, processingTimeMs = null, error = null) {
  if (!WEBHOOK_CONFIG.trackMetrics) return;

  try {
    // Log to console for now - in production would send to DataDog/Sentry
    const logData = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      status, // 'success', 'failed', 'retrying'
      processing_time_ms: processingTimeMs,
      error_message: error?.message,
      error_type: error?.constructor?.name,
    };

    console.log('[WEBHOOK_METRICS]', JSON.stringify(logData));

    // Integrate with DataDog monitoring services
    if (datadogService && datadogService.addCustomMetric) {
      datadogService.addCustomMetric('stripe.webhook.processed', 1, {
        event_type: eventType,
        status: status,
        processing_time: processingTimeMs
      });

      if (processingTimeMs) {
        datadogService.addCustomMetric('stripe.webhook.processing_time', processingTimeMs, {
          event_type: eventType,
          status: status
        });
      }
    }

    // Integrate with Sentry monitoring
    if (sentryService && sentryService.addBreadcrumb) {
      sentryService.addBreadcrumb({
        category: 'webhook',
        message: `Stripe webhook ${eventType} ${status}`,
        level: status === 'failed' ? 'error' : 'info',
        data: {
          event_type: eventType,
          status: status,
          processing_time_ms: processingTimeMs,
          error_message: error?.message
        }
      });

      // Capture error if webhook processing failed
      if (error && sentryService.captureException) {
        sentryService.captureException(error, {
          tags: {
            error_type: 'webhook_processing',
            event_type: eventType
          },
          extra: {
            event_data: logData,
            processing_time: processingTimeMs
          }
        });
      }
    }

  } catch (logError) {
    console.error('Error logging webhook metrics:', logError);
  }
}

// Send webhook failure alert
async function sendWebhookAlert(eventId, eventType, error, attemptCount) {
  if (!WEBHOOK_CONFIG.alertOnMaxRetriesReached) return;

  try {
    console.error(`[WEBHOOK_ALERT] Max retries reached for event ${eventId}:`, {
      eventType,
      error: error.message,
      attemptCount,
      timestamp: new Date().toISOString(),
    });

    // Integrate with notification service for critical webhook failures
    if (notificationService && notificationService.sendNotification) {
      // Send alert to admin users about webhook failure
      const alertNotification = notificationService.createNotificationTemplate('webhook_failure', {
        eventId,
        eventType,
        errorMessage: error.message,
        attemptCount,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you would get admin user IDs from a config or database
      // For now, we'll log the alert that should be sent
      console.warn('[ADMIN_ALERT] Critical webhook failure notification should be sent:', alertNotification);
    }

    // Also send to Sentry for immediate alerting
    if (sentryService && sentryService.captureException) {
      sentryService.captureException(error, {
        tags: {
          error_type: 'webhook_max_retries',
          event_type: eventType,
          severity: 'high'
        },
        extra: {
          event_id: eventId,
          attempt_count: attemptCount,
          timestamp: new Date().toISOString()
        },
        level: 'error'
      });
    }

  } catch (alertError) {
    console.error('Error sending webhook alert:', alertError);
  }
}

// Store webhook event for deduplication and tracking
async function storeWebhookEvent(event) {
  try {
    const { error } = await supabase
      .from('stripe_webhook_events')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event,
        processed: false,
      }, {
        onConflict: 'stripe_event_id'
      });

    if (error && !error.message.includes('duplicate key')) {
      console.error('Failed to store webhook event:', error);
      await logWebhookMetrics(event.type, 'storage_failed', null, error);
    }
  } catch (error) {
    console.error('Error storing webhook event:', error);
    await logWebhookMetrics(event.type, 'storage_error', null, error);
  }
}

// Mark webhook event as processed
async function markEventProcessed(eventId, error = null) {
  try {
    await supabase
      .from('stripe_webhook_events')
      .update({
        processed: !error,
        processed_at: new Date().toISOString(),
        last_processing_error: error ? error.message : null,
        processing_attempts: supabase.raw('processing_attempts + 1'),
      })
      .eq('stripe_event_id', eventId);
  } catch (dbError) {
    console.error('Error updating webhook event status:', dbError);
  }
}

// Handle account updated event
async function handleAccountUpdated(account) {
  console.log('Handling account.updated for account:', account.id);

  try {
    const { charges_enabled, payouts_enabled, details_submitted, requirements } = account;

    // Determine account status
    let status = 'created';
    if (details_submitted && charges_enabled && payouts_enabled) {
      status = 'active';
    } else if (details_submitted) {
      status = 'pending';
    } else if (requirements && requirements.disabled_reason) {
      status = 'rejected';
    }

    // Update account in database
    const { error } = await supabase
      .from('vendor_stripe_accounts')
      .update({
        status,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        requirements_past_due: requirements?.past_due || [],
        requirements_currently_due: requirements?.currently_due || [],
        requirements_eventually_due: requirements?.eventually_due || [],
        business_name: account.business_profile?.name,
        business_url: account.business_profile?.url,
        support_email: account.business_profile?.support_email,
        support_phone: account.business_profile?.support_phone,
        last_updated_from_stripe: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id);

    if (error) {
      console.error('Failed to update account in database:', error);
    }

    // Update onboarding completion timestamp
    if (status === 'active') {
      await supabase
        .from('vendor_stripe_accounts')
        .update({
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', account.id)
        .is('onboarding_completed_at', null);
    }

  } catch (error) {
    console.error('Error handling account.updated:', error);
    throw error;
  }
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Handling payment_intent.succeeded:', paymentIntent.id);

  try {
    const { id, metadata } = paymentIntent;
    const { booking_id } = metadata;

    if (booking_id) {
      // Update booking payment status
      const { error: paymentError } = await supabase
        .from('booking_payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', id);

      if (paymentError) {
        console.error('Failed to update payment status:', paymentError);
      }

      // Update booking status if all payments are complete
      const { data: payments } = await supabase
        .from('booking_payments')
        .select('status')
        .eq('booking_id', booking_id);

      const allPaid = payments?.every(p => p.status === 'completed');

      if (allPaid) {
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', booking_id);
      }
    }

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

// Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Handling payment_intent.payment_failed:', paymentIntent.id);

  try {
    const { id, metadata, last_payment_error } = paymentIntent;
    const { booking_id } = metadata;

    if (booking_id) {
      // Update booking payment status
      const { error: paymentError } = await supabase
        .from('booking_payments')
        .update({
          status: 'failed',
          failure_reason: last_payment_error?.message || 'Payment failed',
        })
        .eq('stripe_payment_intent_id', id);

      if (paymentError) {
        console.error('Failed to update payment status:', paymentError);
      }
    }

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

// Handle payout events
async function handlePayoutEvent(payout, eventType) {
  console.log(`Handling ${eventType}:`, payout.id);

  try {
    const {
      id: stripe_payout_id,
      amount,
      currency,
      status,
      destination,
      created,
      arrival_date,
      failure_code,
      failure_message,
      type
    } = payout;

    // Find the vendor account
    const { data: vendorAccount } = await supabase
      .from('vendor_stripe_accounts')
      .select('id')
      .eq('stripe_account_id', destination)
      .single();

    if (!vendorAccount) {
      console.error('Vendor account not found for payout:', destination);
      return;
    }

    // Upsert payout record
    await supabase
      .from('vendor_payouts')
      .upsert({
        vendor_stripe_account_id: vendorAccount.id,
        stripe_payout_id,
        amount,
        currency,
        status,
        payout_type: type,
        created_at_stripe: new Date(created * 1000).toISOString(),
        arrival_date: arrival_date ? new Date(arrival_date * 1000).toISOString().split('T')[0] : null,
        failure_code,
        failure_message,
      }, {
        onConflict: 'stripe_payout_id'
      });

    // Update vendor account's first payout timestamp if this is their first successful payout
    if (status === 'paid') {
      await supabase
        .from('vendor_stripe_accounts')
        .update({
          first_payout_at: new Date().toISOString(),
        })
        .eq('id', vendorAccount.id)
        .is('first_payout_at', null);
    }

  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    throw error;
  }
}

// Handle charge refunded events
async function handleChargeRefunded(charge) {
  console.log('Handling charge.refunded:', charge.id);

  try {
    const { payment_intent: paymentIntentId, refunds } = charge;
    const latestRefund = refunds.data[0]; // Most recent refund

    if (paymentIntentId && latestRefund) {
      // Find the booking payment
      const { data: payment } = await supabase
        .from('booking_payments')
        .select('booking_id, amount')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (payment) {
        const isPartialRefund = latestRefund.amount < payment.amount;

        // Update payment status
        await supabase
          .from('booking_payments')
          .update({
            status: isPartialRefund ? 'partially_refunded' : 'refunded',
            refunded_amount: supabase.raw('COALESCE(refunded_amount, 0) + ?', [latestRefund.amount]),
            refund_reason: latestRefund.reason,
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        // Update booking status if fully refunded
        if (!isPartialRefund) {
          await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: 'payment_refunded',
            })
            .eq('id', payment.booking_id);
        }

        // Send refund notification to user
        if (notificationService && notificationService.sendNotification) {
          // Get user ID from booking
          const { data: booking } = await supabase
            .from('bookings')
            .select('user_id')
            .eq('id', payment.booking_id)
            .single();

          if (booking) {
            const refundNotification = notificationService.createNotificationTemplate('refund_processed', {
              bookingId: payment.booking_id,
              refundAmount: latestRefund.amount,
              currency: latestRefund.currency,
              reason: latestRefund.reason,
              isPartial: isPartialRefund
            });

            await notificationService.sendNotification(booking.user_id, refundNotification);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error handling charge.refunded:', error);
    throw error;
  }
}

// Handle dispute events
async function handleDisputeEvent(dispute, eventType) {
  console.log(`Handling ${eventType}:`, dispute.id);

  try {
    const {
      id: dispute_id,
      charge: chargeId,
      amount,
      currency,
      reason,
      status,
      evidence,
      evidence_due_by,
      created,
    } = dispute;

    // Find the charge and payment intent
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = charge.payment_intent;

    if (paymentIntentId) {
      // Find the booking payment
      const { data: payment } = await supabase
        .from('booking_payments')
        .select('booking_id, vendor_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (payment) {
        // Store dispute information
        await supabase
          .from('booking_disputes')
          .upsert({
            id: dispute_id,
            booking_id: payment.booking_id,
            stripe_charge_id: chargeId,
            amount,
            currency,
            reason,
            status,
            evidence_due_by: evidence_due_by ? new Date(evidence_due_by * 1000).toISOString() : null,
            created_at: new Date(created * 1000).toISOString(),
          }, {
            onConflict: 'id'
          });

        // Update payment status
        await supabase
          .from('booking_payments')
          .update({
            status: 'disputed',
            dispute_status: status,
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        // Send dispute notification to vendor
        if (notificationService && notificationService.sendNotification && payment.vendor_id) {
          const disputeNotification = notificationService.createNotificationTemplate('dispute_created', {
            bookingId: payment.booking_id,
            disputeId: dispute_id,
            amount: amount,
            currency: currency,
            reason: reason,
            status: status,
            evidenceDueBy: evidence_due_by ? new Date(evidence_due_by * 1000).toISOString() : null
          });

          await notificationService.sendNotification(payment.vendor_id, disputeNotification);
        }
      }
    }

  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    throw error;
  }
}

// Send real-time notification for payment events
async function sendPaymentNotification(eventType, paymentData) {
  try {
    // Integrate with notification service for real-time payment updates
    console.log(`[PAYMENT_NOTIFICATION] ${eventType}:`, paymentData);

    if (notificationService && notificationService.sendNotification && paymentData.userId) {
      let notificationTemplate;

      switch (eventType) {
        case 'payment_intent.succeeded':
          notificationTemplate = notificationService.createNotificationTemplate('payment_success', {
            bookingId: paymentData.bookingId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentIntentId: paymentData.paymentIntentId
          });
          break;

        case 'payment_intent.payment_failed':
          notificationTemplate = notificationService.createNotificationTemplate('payment_failed', {
            bookingId: paymentData.bookingId,
            paymentIntentId: paymentData.paymentIntentId,
            error: paymentData.error
          });
          break;

        default:
          notificationTemplate = {
            title: 'Payment Update',
            body: `Payment ${eventType.split('.')[1]} for your booking`,
            type: 'payment_update',
            data: paymentData
          };
      }

      await notificationService.sendNotification(paymentData.userId, notificationTemplate);
    }

  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
}

// Process webhook event based on type
async function processEvent(event) {
  console.log('Processing webhook event:', event.type, event.id);
  const startTime = Date.now();

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        await sendPaymentNotification(event.type, {
          paymentIntentId: event.data.object.id,
          bookingId: event.data.object.metadata?.booking_id,
          userId: event.data.object.metadata?.user_id,
          amount: event.data.object.amount,
          currency: event.data.object.currency,
        });
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        await sendPaymentNotification(event.type, {
          paymentIntentId: event.data.object.id,
          bookingId: event.data.object.metadata?.booking_id,
          userId: event.data.object.metadata?.user_id,
          error: event.data.object.last_payment_error?.message,
        });
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed':
      case 'charge.dispute.funds_withdrawn':
      case 'charge.dispute.funds_reinstated':
        await handleDisputeEvent(event.data.object, event.type);
        break;

      case 'payout.created':
      case 'payout.updated':
      case 'payout.paid':
      case 'payout.failed':
        await handlePayoutEvent(event.data.object, event.type);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        // Handle subscription/invoice payments if needed in the future
        console.log('Invoice event received:', event.type);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    // Log successful processing
    const processingTime = Date.now() - startTime;
    await logWebhookMetrics(event.type, 'success', processingTime);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logWebhookMetrics(event.type, 'failed', processingTime, error);
    throw error;
  }
}

// Main webhook handler
async function handleWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature and construct event
    const event = verifyWebhookSignature(payload, signature);

    // Store event for tracking and deduplication
    await storeWebhookEvent(event);

    // Check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('processed, processing_attempts')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent?.processed) {
      console.log('Event already processed:', event.id);
      return res.status(200).json({ received: true, message: 'Event already processed' });
    }

    if (existingEvent?.processing_attempts >= WEBHOOK_CONFIG.maxRetries) {
      console.log('Event max processing attempts reached:', event.id);
      return res.status(200).json({ received: true, message: 'Max attempts reached' });
    }

    // Process the event
    try {
      await processEvent(event);
      await markEventProcessed(event.id);

      res.status(200).json({ received: true, processed: true });
    } catch (processingError) {
      await markEventProcessed(event.id, processingError);
      throw processingError;
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: error.message || 'Webhook processing failed'
    });
  }
}

// Main handler function
module.exports = async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests for webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await handleWebhook(req, res);
};
/**
 * Confirm Payment API - Process payments with saved payment methods
 * POST /api/stripe/confirm-payment - Confirm payment with saved method
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { corsMiddleware } = require('../../src/utils/cors-config.js');

export default async function handler(req, res) {
  // Apply secure CORS headers - handles OPTIONS requests automatically
  const corsHandler = corsMiddleware(true); // Use secure headers for payment endpoints
  const corsResult = corsHandler(req, res, () => {});

  // If CORS middleware handled the request (OPTIONS), return early
  if (corsResult === true) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({
        error: 'Payment intent ID and payment method ID are required',
      });
    }

    // Confirm the payment intent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/payment/complete`,
    });

    // Check the payment status
    if (paymentIntent.status === 'succeeded') {
      return res.status(200).json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        requiresAction: false,
      });
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure or other authentication required
      return res.status(200).json({
        success: false,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
        requiresAction: true,
        nextAction: paymentIntent.next_action,
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      // Payment method failed, needs new method
      return res.status(400).json({
        error: 'Payment method failed. Please try a different payment method.',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
        requiresNewPaymentMethod: true,
      });
    } else {
      // Other status (processing, requires_confirmation, etc.)
      return res.status(400).json({
        error: 'Payment could not be completed at this time.',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: error.message,
        code: error.code,
        decline_code: error.decline_code,
      });
    } else if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid request parameters.',
        message: error.message,
      });
    } else if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        error: 'Payment service temporarily unavailable.',
      });
    } else if (error.type === 'StripeConnectionError') {
      return res.status(500).json({
        error: 'Network error. Please check your connection.',
      });
    } else if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        error: 'Authentication failed.',
      });
    } else {
      return res.status(500).json({
        error: 'An unexpected error occurred.',
        message: error.message,
      });
    }
  }
}
/**
 * Stripe Payments API Endpoint
 * Handles fetching payment data from Stripe for reconciliation purposes
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration
const STRIPE_CONFIG = {
  maxLimit: 100,
  defaultLimit: 50,
  timeout: 30000, // 30 seconds
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Account');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      created_gte,
      created_lte,
      limit = STRIPE_CONFIG.defaultLimit,
      starting_after,
      ending_before,
      account,
    } = req.query;

    // Validate parameters
    const requestLimit = Math.min(parseInt(limit) || STRIPE_CONFIG.defaultLimit, STRIPE_CONFIG.maxLimit);

    const params = {
      limit: requestLimit,
      expand: ['data.charges', 'data.latest_charge'],
    };

    // Add date filters
    if (created_gte) {
      params.created = { gte: parseInt(created_gte) };
    }
    if (created_lte) {
      params.created = { ...params.created, lte: parseInt(created_lte) };
    }

    // Add pagination
    if (starting_after) {
      params.starting_after = starting_after;
    }
    if (ending_before) {
      params.ending_before = ending_before;
    }

    let stripeData;

    // Handle connected account or platform account
    if (account) {
      // Fetch payments for connected account
      stripeData = await stripe.paymentIntents.list(params, {
        stripeAccount: account,
        timeout: STRIPE_CONFIG.timeout,
      });
    } else {
      // Fetch payments for platform account
      stripeData = await stripe.paymentIntents.list(params, {
        timeout: STRIPE_CONFIG.timeout,
      });
    }

    // Transform data for reconciliation
    const transformedData = stripeData.data.map(paymentIntent => ({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
      charges: paymentIntent.charges?.data?.map(charge => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        created: charge.created,
        paid: charge.paid,
        refunded: charge.refunded,
        amount_refunded: charge.amount_refunded,
        application_fee_amount: charge.application_fee_amount,
        transfer_data: charge.transfer_data,
        balance_transaction: charge.balance_transaction,
      })) || [],
      latest_charge: paymentIntent.latest_charge ? {
        id: paymentIntent.latest_charge.id,
        amount: paymentIntent.latest_charge.amount,
        status: paymentIntent.latest_charge.status,
        created: paymentIntent.latest_charge.created,
        balance_transaction: paymentIntent.latest_charge.balance_transaction,
      } : null,
      transfer_data: paymentIntent.transfer_data,
      application_fee_amount: paymentIntent.application_fee_amount,
      client_secret: undefined, // Don't expose client secrets
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
      has_more: stripeData.has_more,
      total_count: stripeData.data.length,
      account: account || 'platform',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Stripe payments API error:', error);

    // Handle different types of Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        error: 'Card error',
        message: error.message,
        code: error.code,
      });
    }

    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests to Stripe API',
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: error.message,
      });
    }

    if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        success: false,
        error: 'Stripe API error',
        message: 'An error occurred with Stripe API',
      });
    }

    if (error.type === 'StripeConnectionError') {
      return res.status(500).json({
        success: false,
        error: 'Connection error',
        message: 'Network error connecting to Stripe',
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        message: 'Invalid Stripe API key',
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    });
  }
}
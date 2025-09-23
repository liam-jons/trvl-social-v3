/**
 * Stripe Connect Payouts API Endpoint
 * Handles creating and managing payouts for connected accounts
 */

import Stripe from 'stripe';
import { corsMiddleware } from '../../../src/utils/cors-config.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration
const PAYOUT_CONFIG = {
  maxAmount: 100000000, // $1,000,000 in cents
  minAmount: 100, // $1.00 in cents
  supportedCurrencies: ['usd', 'eur', 'gbp', 'aud', 'cad'],
  timeout: 30000, // 30 seconds
};

export default async function handler(req, res) {
  // Apply secure CORS headers - handles OPTIONS requests automatically
  const corsHandler = corsMiddleware(true); // Use secure headers for payment endpoints
  const corsResult = corsHandler(req, res, () => {});

  // If CORS middleware handled the request (OPTIONS), return early
  if (corsResult === true) return;

  try {
    if (req.method === 'POST') {
      return await handleCreatePayout(req, res);
    } else if (req.method === 'GET') {
      return await handleListPayouts(req, res);
    } else if (req.method === 'PUT') {
      return await handleUpdatePayout(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stripe payouts API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Create a new payout
 */
async function handleCreatePayout(req, res) {
  const {
    amount,
    currency = 'usd',
    description = 'Vendor payout',
    metadata = {},
    method = 'standard',
  } = req.body;

  const stripeAccount = req.headers['stripe-account'];

  // Validate required fields
  if (!amount || !stripeAccount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Amount and Stripe-Account header are required',
    });
  }

  // Validate amount
  const payoutAmount = parseInt(amount);
  if (isNaN(payoutAmount) || payoutAmount < PAYOUT_CONFIG.minAmount || payoutAmount > PAYOUT_CONFIG.maxAmount) {
    return res.status(400).json({
      success: false,
      error: 'Invalid amount',
      message: `Amount must be between ${PAYOUT_CONFIG.minAmount} and ${PAYOUT_CONFIG.maxAmount} cents`,
    });
  }

  // Validate currency
  if (!PAYOUT_CONFIG.supportedCurrencies.includes(currency.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid currency',
      message: `Currency must be one of: ${PAYOUT_CONFIG.supportedCurrencies.join(', ')}`,
    });
  }

  try {
    // Create the payout
    const payout = await stripe.payouts.create({
      amount: payoutAmount,
      currency: currency.toLowerCase(),
      description,
      method,
      metadata: {
        ...metadata,
        created_via: 'reconciliation_api',
        timestamp: new Date().toISOString(),
      },
    }, {
      stripeAccount,
      timeout: PAYOUT_CONFIG.timeout,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        description: payout.description,
        status: payout.status,
        type: payout.type,
        method: payout.method,
        created: payout.created,
        arrival_date: payout.arrival_date,
        livemode: payout.livemode,
        metadata: payout.metadata,
        automatic: payout.automatic,
        balance_transaction: payout.balance_transaction,
        destination: payout.destination,
        failure_code: payout.failure_code,
        failure_message: payout.failure_message,
        reconciliation_status: payout.reconciliation_status,
      },
    });

  } catch (error) {
    console.error('Payout creation failed:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: error.message,
        code: error.code,
      });
    }

    if (error.code === 'insufficient_funds') {
      return res.status(400).json({
        success: false,
        error: 'Insufficient funds',
        message: 'Not enough funds available for payout',
      });
    }

    if (error.code === 'account_invalid') {
      return res.status(400).json({
        success: false,
        error: 'Invalid account',
        message: 'The account is invalid or cannot receive payouts',
      });
    }

    if (error.code === 'payout_method_not_available') {
      return res.status(400).json({
        success: false,
        error: 'Payout method not available',
        message: 'The selected payout method is not available for this account',
      });
    }

    throw error; // Re-throw to be caught by outer try-catch
  }
}

/**
 * List payouts for connected account
 */
async function handleListPayouts(req, res) {
  const {
    limit = 50,
    created_gte,
    created_lte,
    status,
    starting_after,
    ending_before,
  } = req.query;

  const stripeAccount = req.headers['stripe-account'];

  if (!stripeAccount) {
    return res.status(400).json({
      success: false,
      error: 'Missing Stripe-Account header',
      message: 'Stripe-Account header is required to list payouts',
    });
  }

  const params = {
    limit: Math.min(parseInt(limit) || 50, 100),
    expand: ['data.destination'],
  };

  // Add date filters
  if (created_gte || created_lte) {
    params.created = {};
    if (created_gte) params.created.gte = parseInt(created_gte);
    if (created_lte) params.created.lte = parseInt(created_lte);
  }

  // Add status filter
  if (status) {
    params.status = status;
  }

  // Add pagination
  if (starting_after) params.starting_after = starting_after;
  if (ending_before) params.ending_before = ending_before;

  try {
    const payouts = await stripe.payouts.list(params, {
      stripeAccount,
      timeout: PAYOUT_CONFIG.timeout,
    });

    const transformedData = payouts.data.map(payout => ({
      id: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      description: payout.description,
      status: payout.status,
      type: payout.type,
      method: payout.method,
      created: payout.created,
      arrival_date: payout.arrival_date,
      livemode: payout.livemode,
      metadata: payout.metadata,
      automatic: payout.automatic,
      balance_transaction: payout.balance_transaction,
      destination: payout.destination ? {
        id: payout.destination.id,
        object: payout.destination.object,
        last4: payout.destination.last4,
        bank_name: payout.destination.bank_name,
        routing_number: payout.destination.routing_number,
      } : null,
      failure_code: payout.failure_code,
      failure_message: payout.failure_message,
      reconciliation_status: payout.reconciliation_status,
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
      has_more: payouts.has_more,
      total_count: payouts.data.length,
      account: stripeAccount,
    });

  } catch (error) {
    console.error('Payout list failed:', error);
    throw error; // Re-throw to be caught by outer try-catch
  }
}

/**
 * Update/cancel a payout
 */
async function handleUpdatePayout(req, res) {
  const { payoutId } = req.query;
  const { action, metadata } = req.body;
  const stripeAccount = req.headers['stripe-account'];

  if (!payoutId || !stripeAccount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters',
      message: 'Payout ID and Stripe-Account header are required',
    });
  }

  try {
    let payout;

    if (action === 'cancel') {
      // Cancel the payout
      payout = await stripe.payouts.cancel(payoutId, {}, {
        stripeAccount,
        timeout: PAYOUT_CONFIG.timeout,
      });
    } else {
      // Update metadata only
      payout = await stripe.payouts.update(payoutId, {
        metadata: metadata || {},
      }, {
        stripeAccount,
        timeout: PAYOUT_CONFIG.timeout,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        metadata: payout.metadata,
        failure_code: payout.failure_code,
        failure_message: payout.failure_message,
        reconciliation_status: payout.reconciliation_status,
      },
    });

  } catch (error) {
    console.error('Payout update failed:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: error.message,
        code: error.code,
      });
    }

    if (error.code === 'payout_already_paid') {
      return res.status(400).json({
        success: false,
        error: 'Payout already paid',
        message: 'This payout has already been paid and cannot be modified',
      });
    }

    throw error; // Re-throw to be caught by outer try-catch
  }
}
/**
 * Stripe Connect Payouts API
 * Handles payout operations for vendor accounts
 */

import Stripe from 'stripe';
import { supabase } from '../../../src/lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Account');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        return await createPayout(req, res);
      case 'GET':
        return await getPayouts(req, res);
      case 'PUT':
        return await updatePayout(req, res);
      default:
        res.setHeader('Allow', ['POST', 'GET', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payout API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Create a new payout
 */
async function createPayout(req, res) {
  try {
    const {
      amount,
      currency = 'usd',
      description = 'Vendor payout',
      metadata = {},
    } = req.body;

    const stripeAccount = req.headers['stripe-account'];

    if (!stripeAccount) {
      return res.status(400).json({
        error: 'Missing Stripe-Account header',
      });
    }

    if (!amount || amount < 100) {
      return res.status(400).json({
        error: 'Amount must be at least $1.00 (100 cents)',
      });
    }

    // Validate the Stripe account exists and is active
    const account = await stripe.accounts.retrieve(stripeAccount);

    if (!account.payouts_enabled) {
      return res.status(400).json({
        error: 'Payouts not enabled for this account',
      });
    }

    // Create the payout
    const payout = await stripe.payouts.create(
      {
        amount,
        currency,
        description,
        metadata: {
          ...metadata,
          created_via: 'api',
          timestamp: new Date().toISOString(),
        },
      },
      {
        stripeAccount: stripeAccount,
      }
    );

    return res.status(200).json({
      id: payout.id,
      status: payout.status,
      amount: payout.amount,
      currency: payout.currency,
      arrival_date: payout.arrival_date,
      created: payout.created,
      description: payout.description,
      metadata: payout.metadata,
    });

  } catch (error) {
    console.error('Create payout error:', error);

    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: 'Payout failed',
        message: error.message,
        code: error.code,
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Payout creation failed',
      message: error.message,
    });
  }
}

/**
 * Get payouts for an account
 */
async function getPayouts(req, res) {
  try {
    const {
      limit = 10,
      starting_after,
      ending_before,
      created,
      arrival_date,
      status,
    } = req.query;

    const stripeAccount = req.headers['stripe-account'];

    if (!stripeAccount) {
      return res.status(400).json({
        error: 'Missing Stripe-Account header',
      });
    }

    const params = {
      limit: Math.min(parseInt(limit), 100),
    };

    if (starting_after) params.starting_after = starting_after;
    if (ending_before) params.ending_before = ending_before;
    if (created) params.created = created;
    if (arrival_date) params.arrival_date = arrival_date;
    if (status) params.status = status;

    const payouts = await stripe.payouts.list(params, {
      stripeAccount: stripeAccount,
    });

    return res.status(200).json({
      object: 'list',
      data: payouts.data.map(payout => ({
        id: payout.id,
        status: payout.status,
        amount: payout.amount,
        currency: payout.currency,
        arrival_date: payout.arrival_date,
        created: payout.created,
        description: payout.description,
        destination: payout.destination,
        failure_code: payout.failure_code,
        failure_message: payout.failure_message,
        metadata: payout.metadata,
      })),
      has_more: payouts.has_more,
    });

  } catch (error) {
    console.error('Get payouts error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve payouts',
      message: error.message,
    });
  }
}

/**
 * Update payout (mainly for cancellation)
 */
async function updatePayout(req, res) {
  try {
    const { payoutId } = req.query;
    const { action, metadata } = req.body;

    const stripeAccount = req.headers['stripe-account'];

    if (!stripeAccount) {
      return res.status(400).json({
        error: 'Missing Stripe-Account header',
      });
    }

    if (!payoutId) {
      return res.status(400).json({
        error: 'Payout ID is required',
      });
    }

    let result;

    if (action === 'cancel') {
      // Cancel the payout (only works for pending payouts)
      result = await stripe.payouts.cancel(payoutId, {
        stripeAccount: stripeAccount,
      });
    } else {
      return res.status(400).json({
        error: 'Invalid action. Only "cancel" is supported.',
      });
    }

    return res.status(200).json({
      id: result.id,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      arrival_date: result.arrival_date,
      created: result.created,
      description: result.description,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error('Update payout error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Payout update failed',
      message: error.message,
    });
  }
}
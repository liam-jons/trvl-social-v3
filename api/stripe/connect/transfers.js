/**
 * Stripe Connect Transfers API
 * Handles transfer operations for marketplace payments
 */

import Stripe from 'stripe';
import { corsMiddleware } from '../../src/utils/cors-config.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Apply secure CORS headers - handles OPTIONS requests automatically
  const corsHandler = corsMiddleware(true); // Use secure headers for payment endpoints
  const corsResult = corsHandler(req, res, () => {});

  // If CORS middleware handled the request (OPTIONS), return early
  if (corsResult === true) return;

  try {
    switch (req.method) {
      case 'POST':
        return await createTransfer(req, res);
      case 'GET':
        return await getTransfers(req, res);
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transfer API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Create a new transfer to connected account
 */
async function createTransfer(req, res) {
  try {
    const {
      destination,
      amount,
      currency = 'usd',
      description = 'Transfer to connected account',
      metadata = {},
    } = req.body;

    if (!destination || !amount) {
      return res.status(400).json({
        error: 'Destination account and amount are required',
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        error: 'Amount must be at least $1.00 (100 cents)',
      });
    }

    // Validate the destination account exists and can receive transfers
    try {
      const account = await stripe.accounts.retrieve(destination);

      if (!account.charges_enabled) {
        return res.status(400).json({
          error: 'Destination account cannot receive transfers',
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid destination account',
      });
    }

    // Create the transfer
    const transfer = await stripe.transfers.create({
      destination,
      amount,
      currency,
      description,
      metadata: {
        ...metadata,
        created_via: 'api',
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      id: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      destination: transfer.destination,
      created: transfer.created,
      description: transfer.description,
      metadata: transfer.metadata,
      reversed: transfer.reversed,
      reversals: transfer.reversals,
    });

  } catch (error) {
    console.error('Create transfer error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message,
      });
    }

    if (error.code === 'insufficient_funds') {
      return res.status(400).json({
        error: 'Insufficient funds',
        message: 'Not enough funds available for this transfer',
      });
    }

    return res.status(500).json({
      error: 'Transfer creation failed',
      message: error.message,
    });
  }
}

/**
 * Get transfers
 */
async function getTransfers(req, res) {
  try {
    const {
      limit = 10,
      starting_after,
      ending_before,
      created,
      destination,
    } = req.query;

    const params = {
      limit: Math.min(parseInt(limit), 100),
    };

    if (starting_after) params.starting_after = starting_after;
    if (ending_before) params.ending_before = ending_before;
    if (created) params.created = created;
    if (destination) params.destination = destination;

    const transfers = await stripe.transfers.list(params);

    return res.status(200).json({
      object: 'list',
      data: transfers.data.map(transfer => ({
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        created: transfer.created,
        description: transfer.description,
        metadata: transfer.metadata,
        reversed: transfer.reversed,
        reversals: transfer.reversals,
      })),
      has_more: transfers.has_more,
    });

  } catch (error) {
    console.error('Get transfers error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve transfers',
      message: error.message,
    });
  }
}
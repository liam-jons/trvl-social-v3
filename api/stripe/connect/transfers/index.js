/**
 * Stripe Connect Transfers API Endpoint
 * Handles creating and managing transfers for reconciliation
 */

import Stripe from 'stripe';
import { corsMiddleware } from '../../../../../src/utils/cors-config.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration
const TRANSFER_CONFIG = {
  maxAmount: 100000000, // $1,000,000 in cents
  minAmount: 50, // $0.50 in cents
  supportedCurrencies: ['usd', 'eur', 'gbp', 'aud', 'cad'],
  timeout: 30000, // 30 seconds
};

export default async function handler(req, res) {
  // Apply secure CORS middleware
  const corsHandler = corsMiddleware(true); // Enable security headers

  // Handle CORS middleware first
  return new Promise((resolve) => {
    corsHandler(req, res, async () => {
      try {
        await handleRequest(req, res);
        resolve();
      } catch (error) {
        console.error('Request handler error:', error);
        resolve();
      }
    });
  });
}

async function handleRequest(req, res) {
  try {
    if (req.method === 'POST') {
      return await handleCreateTransfer(req, res);
    } else if (req.method === 'GET') {
      return await handleListTransfers(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stripe transfers API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Create a new transfer
 */
async function handleCreateTransfer(req, res) {
  const {
    destination,
    amount,
    currency = 'usd',
    description = 'Transfer to connected account',
    metadata = {},
  } = req.body;

  // Validate required fields
  if (!destination || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Destination and amount are required',
    });
  }

  // Validate amount
  const transferAmount = parseInt(amount);
  if (isNaN(transferAmount) || transferAmount < TRANSFER_CONFIG.minAmount || transferAmount > TRANSFER_CONFIG.maxAmount) {
    return res.status(400).json({
      success: false,
      error: 'Invalid amount',
      message: `Amount must be between ${TRANSFER_CONFIG.minAmount} and ${TRANSFER_CONFIG.maxAmount} cents`,
    });
  }

  // Validate currency
  if (!TRANSFER_CONFIG.supportedCurrencies.includes(currency.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid currency',
      message: `Currency must be one of: ${TRANSFER_CONFIG.supportedCurrencies.join(', ')}`,
    });
  }

  try {
    // Create the transfer
    const transfer = await stripe.transfers.create({
      destination,
      amount: transferAmount,
      currency: currency.toLowerCase(),
      description,
      metadata: {
        ...metadata,
        created_via: 'reconciliation_api',
        timestamp: new Date().toISOString(),
      },
    }, {
      timeout: TRANSFER_CONFIG.timeout,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        description: transfer.description,
        created: transfer.created,
        livemode: transfer.livemode,
        metadata: transfer.metadata,
        reversed: transfer.reversed,
        source_transaction: transfer.source_transaction,
        destination_payment: transfer.destination_payment,
      },
    });

  } catch (error) {
    console.error('Transfer creation failed:', error);

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
        message: 'Not enough funds available for transfer',
      });
    }

    if (error.code === 'account_invalid') {
      return res.status(400).json({
        success: false,
        error: 'Invalid account',
        message: 'The destination account is invalid or cannot receive transfers',
      });
    }

    throw error; // Re-throw to be caught by outer try-catch
  }
}

/**
 * List transfers
 */
async function handleListTransfers(req, res) {
  const {
    limit = 50,
    created_gte,
    created_lte,
    destination,
    starting_after,
    ending_before,
  } = req.query;

  const params = {
    limit: Math.min(parseInt(limit) || 50, 100),
    expand: ['data.destination_payment', 'data.source_transaction'],
  };

  // Add date filters
  if (created_gte || created_lte) {
    params.created = {};
    if (created_gte) params.created.gte = parseInt(created_gte);
    if (created_lte) params.created.lte = parseInt(created_lte);
  }

  // Add destination filter
  if (destination) {
    params.destination = destination;
  }

  // Add pagination
  if (starting_after) params.starting_after = starting_after;
  if (ending_before) params.ending_before = ending_before;

  try {
    const transfers = await stripe.transfers.list(params, {
      timeout: TRANSFER_CONFIG.timeout,
    });

    const transformedData = transfers.data.map(transfer => ({
      id: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      destination: transfer.destination,
      description: transfer.description,
      created: transfer.created,
      livemode: transfer.livemode,
      metadata: transfer.metadata,
      reversed: transfer.reversed,
      amount_reversed: transfer.amount_reversed,
      balance_transaction: transfer.balance_transaction,
      destination_payment: transfer.destination_payment ? {
        id: transfer.destination_payment.id,
        amount: transfer.destination_payment.amount,
        status: transfer.destination_payment.status,
      } : null,
      source_transaction: transfer.source_transaction,
      reversals: transfer.reversals?.total_count || 0,
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
      has_more: transfers.has_more,
      total_count: transfers.data.length,
    });

  } catch (error) {
    console.error('Transfer list failed:', error);
    throw error; // Re-throw to be caught by outer try-catch
  }
}
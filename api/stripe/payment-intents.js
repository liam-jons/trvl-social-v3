/**
 * Stripe Payment Intents API
 * Serverless function to handle payment intent creation and management
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.VITE_APP_URL || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Default platform fee percentage
const DEFAULT_PLATFORM_FEE_PERCENT = 0.05; // 5%

// Get authenticated user from request
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return user;
}

// Calculate platform fee
async function calculatePlatformFee(amount, vendorAccountId) {
  let feePercent = DEFAULT_PLATFORM_FEE_PERCENT;

  if (vendorAccountId) {
    // Get custom fee rate from database
    const { data: account } = await supabase
      .from('vendor_stripe_accounts')
      .select('platform_fee_percent')
      .eq('stripe_account_id', vendorAccountId)
      .single();

    if (account && account.platform_fee_percent) {
      feePercent = account.platform_fee_percent / 100; // Convert from percentage to decimal
    }
  }

  return Math.round(amount * feePercent);
}

// Create payment intent
async function createPaymentIntent(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const {
      amount,
      currency = 'usd',
      transfer_data,
      application_fee_amount,
      metadata = {},
      description,
      payment_method_types = ['card'],
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!transfer_data || !transfer_data.destination) {
      return res.status(400).json({ error: 'Transfer destination is required' });
    }

    // Calculate platform fee if not provided
    let platformFee = application_fee_amount;
    if (!platformFee) {
      platformFee = await calculatePlatformFee(amount, transfer_data.destination);
    }

    // Verify the destination account exists and is owned by a user in our system
    const { data: vendorAccount } = await supabase
      .from('vendor_stripe_accounts')
      .select('user_id, status')
      .eq('stripe_account_id', transfer_data.destination)
      .single();

    if (!vendorAccount) {
      return res.status(400).json({ error: 'Invalid vendor account' });
    }

    if (vendorAccount.status !== 'active') {
      return res.status(400).json({ error: 'Vendor account is not active' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types,
      transfer_data: {
        destination: transfer_data.destination,
      },
      application_fee_amount: platformFee,
      metadata: {
        user_id: user.id,
        vendor_user_id: vendorAccount.user_id,
        platform_fee: platformFee,
        ...metadata,
      },
      description: description || `Payment from ${user.email}`,
    });

    // Store payment record in database
    if (metadata.booking_id) {
      const { error: paymentError } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: metadata.booking_id,
          user_id: user.id,
          amount: amount,
          currency: currency,
          status: 'pending',
          payment_method: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          vendor_stripe_account_id: vendorAccount.id,
          metadata: {
            platform_fee: platformFee,
            vendor_amount: amount - platformFee,
          },
        });

      if (paymentError) {
        console.error('Failed to store payment record:', paymentError);
        // Continue anyway - the payment intent was created successfully
      }
    }

    res.status(201).json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      platform_fee: platformFee,
      vendor_amount: amount - platformFee,
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment intent'
    });
  }
}

// Get payment intent
async function getPaymentIntent(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const { paymentIntentId } = req.query;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify user has access to this payment intent
    if (paymentIntent.metadata.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      charges: paymentIntent.charges,
      metadata: paymentIntent.metadata,
    });

  } catch (error) {
    console.error('Get payment intent error:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve payment intent'
    });
  }
}

// Update payment intent
async function updatePaymentIntent(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const { paymentIntentId } = req.query;
    const updates = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Get existing payment intent to verify ownership
    const existingPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (existingPaymentIntent.metadata.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update payment intent
    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, updates);

    res.json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });

  } catch (error) {
    console.error('Update payment intent error:', error);
    res.status(500).json({
      error: error.message || 'Failed to update payment intent'
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

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }

    switch (req.method) {
      case 'POST':
        await createPaymentIntent(req, res);
        break;
      case 'GET':
        await getPaymentIntent(req, res);
        break;
      case 'PUT':
        await updatePaymentIntent(req, res);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
};
/**
 * Stripe Connect Accounts API
 * Serverless function to handle Stripe Connect account operations
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

// Validate environment variables
function validateEnvironment() {
  const required = ['STRIPE_SECRET_KEY', 'VITE_SUPABASE_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

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

// Create Stripe Connect account
async function createAccount(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const { type = 'express', country = 'US', email, business_type = 'individual' } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create Stripe account
    const account = await stripe.accounts.create({
      type,
      country,
      email,
      business_type,
      metadata: {
        user_id: user.id,
        platform: process.env.VITE_APP_NAME || 'TRVL Social',
        created_at: new Date().toISOString(),
      },
    });

    // Store account in database
    const { data: dbAccount, error: dbError } = await supabase
      .from('vendor_stripe_accounts')
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        account_type: type,
        country,
        status: 'created',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway - the Stripe account was created successfully
    }

    res.status(201).json({
      id: account.id,
      type: account.type,
      country: account.country,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create Stripe account'
    });
  }
}

// Get account details
async function getAccount(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Verify user owns this account
    const { data: dbAccount } = await supabase
      .from('vendor_stripe_accounts')
      .select('*')
      .eq('stripe_account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (!dbAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get account from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      id: account.id,
      type: account.type,
      country: account.country,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      business_profile: account.business_profile,
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve account'
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
    validateEnvironment();

    switch (req.method) {
      case 'POST':
        await createAccount(req, res);
        break;
      case 'GET':
        await getAccount(req, res);
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
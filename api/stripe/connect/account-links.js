/**
 * Stripe Connect Account Links API
 * Serverless function to create onboarding and dashboard links
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

// Create account link
async function createAccountLink(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const {
      account,
      refresh_url,
      return_url,
      type = 'account_onboarding',
      collect = 'eventually_due'
    } = req.body;

    if (!account || !refresh_url || !return_url) {
      return res.status(400).json({
        error: 'Account ID, refresh URL, and return URL are required'
      });
    }

    // Verify user owns this account
    const { data: dbAccount } = await supabase
      .from('vendor_stripe_accounts')
      .select('*')
      .eq('stripe_account_id', account)
      .eq('user_id', user.id)
      .single();

    if (!dbAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account,
      refresh_url,
      return_url,
      type,
      collect,
    });

    res.json({
      object: accountLink.object,
      url: accountLink.url,
      expires_at: accountLink.expires_at,
      created: accountLink.created,
    });

  } catch (error) {
    console.error('Create account link error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create account link'
    });
  }
}

// Create login link (for returning to Stripe dashboard)
async function createLoginLink(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const { account } = req.body;

    if (!account) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Verify user owns this account
    const { data: dbAccount } = await supabase
      .from('vendor_stripe_accounts')
      .select('*')
      .eq('stripe_account_id', account)
      .eq('user_id', user.id)
      .single();

    if (!dbAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(account);

    res.json({
      object: loginLink.object,
      url: loginLink.url,
      created: loginLink.created,
    });

  } catch (error) {
    console.error('Create login link error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create login link'
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
        const { type } = req.body;
        if (type === 'login') {
          await createLoginLink(req, res);
        } else {
          await createAccountLink(req, res);
        }
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
/**
 * Payment Methods API - Manage customer payment methods
 * GET /api/stripe/payment-methods?customer=cus_xxx - List payment methods
 * DELETE /api/stripe/payment-methods/[id] - Delete payment method
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleListPaymentMethods(req, res);
    } else if (req.method === 'DELETE') {
      return await handleDeletePaymentMethod(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment methods API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * List customer payment methods
 */
async function handleListPaymentMethods(req, res) {
  const { customer } = req.query;

  if (!customer) {
    return res.status(400).json({
      error: 'Customer ID is required',
    });
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer,
      type: 'card',
    });

    return res.status(200).json({
      success: true,
      paymentMethods: paymentMethods.data,
    });
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return res.status(400).json({
      error: 'Failed to list payment methods',
      message: error.message,
    });
  }
}

/**
 * Delete payment method
 */
async function handleDeletePaymentMethod(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: 'Payment method ID is required',
    });
  }

  try {
    const paymentMethod = await stripe.paymentMethods.detach(id);

    return res.status(200).json({
      success: true,
      paymentMethod,
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(400).json({
      error: 'Failed to delete payment method',
      message: error.message,
    });
  }
}
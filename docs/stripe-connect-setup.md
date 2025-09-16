# Stripe Connect Setup Guide

This document outlines the complete Stripe Connect implementation for TRVL Social's marketplace payment system.

## Overview

The Stripe Connect integration enables:
- Vendor onboarding with Express accounts
- Split payments with 5% platform fee
- Automated vendor payouts
- Comprehensive webhook handling
- PCI-compliant payment processing

## Architecture

```
Frontend (React)
├── Stripe.js Integration
├── Payment UI Components
├── Vendor Onboarding Flow
└── Stripe Service Layer

Backend (Serverless)
├── Account Management API
├── Payment Intent API
├── Webhook Processing
└── Database Integration

Database (Supabase)
├── vendor_stripe_accounts
├── booking_payments
├── vendor_payouts
└── stripe_webhook_events
```

## Setup Instructions

### 1. Stripe Dashboard Setup

1. Create a Stripe account at https://dashboard.stripe.com
2. Enable Stripe Connect in your dashboard
3. Configure your platform settings:
   - Platform name: "TRVL Social"
   - Platform URL: Your app URL
   - Support email: Your support email
4. Set up webhook endpoints (see Webhook Configuration section)

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CONNECT_CLIENT_ID_HERE

# Platform Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="TRVL Social"

# Supabase (for backend functions)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Migration

Run the Stripe Connect migration:

```bash
# Apply the migration to create necessary tables
supabase db push
```

This creates:
- `vendor_stripe_accounts` - Vendor account management
- `vendor_payouts` - Payout tracking
- `payout_line_items` - Individual transaction tracking
- `stripe_webhook_events` - Event deduplication

### 4. API Deployment

Deploy the serverless functions:

```bash
# Install API dependencies
cd api && npm install

# Deploy with Vercel
vercel --prod

# Or deploy with your preferred platform
```

### 5. Webhook Configuration

In your Stripe dashboard:

1. Go to Webhooks section
2. Add endpoint: `https://your-domain.com/api/stripe/webhooks`
3. Select events to listen for:
   - `account.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payout.created`
   - `payout.paid`
   - `payout.failed`

## File Structure

### Frontend Components

```
src/
├── services/
│   └── stripe-service.js              # Main Stripe service
├── components/
│   └── stripe/
│       └── StripeConnectOnboarding.jsx # Vendor onboarding UI
└── utils/
    └── stripe-config-test.js          # Configuration testing
```

### Backend API

```
api/
├── stripe/
│   ├── connect/
│   │   ├── accounts.js                # Account management
│   │   └── account-links.js           # Onboarding links
│   ├── payment-intents.js             # Payment processing
│   └── webhooks.js                    # Event handling
└── package.json                       # Dependencies
```

### Database Schema

```
supabase/migrations/
└── 20240914_008_create_stripe_connect_tables.sql
```

## Usage Examples

### 1. Vendor Onboarding

```jsx
import StripeConnectOnboarding from '../components/stripe/StripeConnectOnboarding';

function VendorSetupPage() {
  return (
    <div>
      <h1>Become a Vendor</h1>
      <StripeConnectOnboarding />
    </div>
  );
}
```

### 2. Create Payment Intent

```javascript
import { payments } from '../services/stripe-service';

async function processPayment(bookingData) {
  try {
    const paymentIntent = await payments.createPaymentIntent({
      amount: 10000, // $100.00 in cents
      currency: 'usd',
      vendorAccountId: 'acct_vendor_account_id',
      bookingId: 'booking_uuid',
      userId: 'user_uuid',
      description: 'Adventure booking payment'
    });

    // Use paymentIntent.clientSecret with Stripe Elements
    return paymentIntent;
  } catch (error) {
    console.error('Payment creation failed:', error);
  }
}
```

### 3. Configuration Testing

```javascript
import { runConfigurationTest } from '../utils/stripe-config-test';

// Test Stripe configuration
const results = await runConfigurationTest();
console.log('Configuration status:', results.overall);
```

## Payment Flow

1. **User initiates booking** → Adventure selection and booking details
2. **Payment intent creation** → Backend creates payment intent with platform fee
3. **Payment collection** → Frontend collects payment with Stripe Elements
4. **Payment processing** → Stripe processes payment and triggers webhooks
5. **Booking confirmation** → System confirms booking and notifies parties
6. **Vendor payout** → Stripe automatically pays out vendor (minus platform fee)

## Platform Fees

- **Default**: 5% platform fee
- **Calculation**: Automatic calculation in payment intent creation
- **Vendor receives**: 95% of total payment
- **Platform receives**: 5% platform fee

### Fee Calculation Example

```
Booking Total: $100.00
Platform Fee: $5.00 (5%)
Vendor Payout: $95.00
```

## Webhook Events

The system handles these webhook events:

- `account.updated` → Update vendor account status
- `payment_intent.succeeded` → Confirm booking payment
- `payment_intent.payment_failed` → Handle payment failures
- `payout.paid` → Track successful vendor payouts
- `payout.failed` → Handle payout failures

## Error Handling

### Frontend Errors
- Invalid configuration → Display setup instructions
- Payment failures → Show user-friendly error messages
- Network issues → Retry mechanisms with exponential backoff

### Backend Errors
- Webhook failures → Retry logic with event deduplication
- Account creation issues → Detailed error logging
- Payment processing → Comprehensive error tracking

## Security Considerations

1. **API Keys**: Never expose secret keys in frontend code
2. **Webhook Signatures**: Always verify webhook signatures
3. **User Authentication**: Verify user ownership of accounts
4. **Data Validation**: Validate all inputs on backend
5. **Error Messages**: Don't expose sensitive information

## Testing

### Development Testing

```javascript
// Test configuration
import { runConfigurationTest } from './utils/stripe-config-test';
await runConfigurationTest();

// Test fee calculations
import { testPlatformFeeCalculation } from './utils/stripe-config-test';
testPlatformFeeCalculation();
```

### Stripe Test Mode

- Use test API keys for development
- Test webhook events with Stripe CLI
- Use test card numbers for payment testing

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0000 0000 3220
```

## Monitoring

### Key Metrics
- Account creation success rate
- Payment success rate
- Payout completion rate
- Webhook processing success

### Logging
- All API calls logged with correlation IDs
- Webhook events stored for debugging
- Payment failures tracked with detailed context

## Troubleshooting

### Common Issues

1. **"Stripe key not configured"**
   - Check environment variables
   - Verify `.env` file is properly loaded

2. **Webhook signature verification failed**
   - Ensure webhook secret matches dashboard
   - Check request body handling in deployment

3. **Account creation failed**
   - Verify supported country/currency
   - Check required business information

### Debug Commands

```bash
# Check environment variables
npm run test:config

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# View logs
vercel logs
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] API functions deployed
- [ ] Webhooks configured in Stripe dashboard
- [ ] Test payments working
- [ ] Error monitoring set up
- [ ] Documentation reviewed

## Support

For issues with the Stripe Connect integration:

1. Check the troubleshooting section
2. Review Stripe dashboard for errors
3. Check application logs
4. Consult Stripe documentation: https://stripe.com/docs/connect

## Next Steps

After completing Task 10.1, the following subtasks can be implemented:

- **Task 10.2**: Vendor onboarding flow UI
- **Task 10.3**: Payment UI components with Stripe Elements
- **Task 10.4**: Split payment logic for group bookings
- **Task 10.5**: Enhanced webhook handlers

The foundation is now ready for full marketplace payment processing.
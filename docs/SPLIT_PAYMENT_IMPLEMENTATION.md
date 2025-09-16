# Split Payment System Implementation

## Overview

The Split Payment System allows groups to divide booking costs among multiple participants, with each person paying their individual share through secure payment links. This system integrates with the existing Stripe Connect setup and provides comprehensive payment tracking and deadline management.

## Architecture

### Core Components

1. **SplitPaymentContainer** - Main orchestration component
2. **ParticipantManager** - Manages group members and invitations
3. **SplitCalculator** - Handles payment calculations and fee distribution
4. **PaymentTracker** - Real-time payment status monitoring
5. **PaymentLinkGenerator** - Creates secure payment links for participants
6. **PaymentDeadlineManager** - Deadline enforcement and reminder system

### Services

1. **split-payment-service.js** - Core business logic
2. **payment-collection-service.js** - Workflow and reminder management
3. **stripe-service.js** - Payment processing integration

### Database Schema

- **split_payments** - Master payment split records
- **individual_payments** - Individual participant payment tracking
- **payment_tokens** - Secure tokens for payment links
- **payment_reminders** - Automated reminder management
- **payment_refunds** - Refund transaction tracking

## Usage Examples

### Basic Group Payment Split

```jsx
import SplitPaymentContainer from './components/booking/SplitPaymentContainer';

<SplitPaymentContainer
  bookingId="booking-123"
  totalAmount={89900} // $899.00 in cents
  currency="usd"
  vendorAccountId="acct_vendor_123"
  bookingDescription="Weekend Hiking Adventure"
  onPaymentComplete={(data) => console.log('Payment completed:', data)}
  onError={(error) => console.error('Payment error:', error)}
/>
```

### Integration with Booking Flow

```jsx
import BookingPaymentIntegration from './components/booking/BookingPaymentIntegration';

<BookingPaymentIntegration
  booking={{
    id: 'booking-123',
    title: 'Adventure Booking',
    totalAmount: 89900,
    currency: 'usd',
    vendorAccountId: 'acct_vendor_123'
  }}
  onPaymentComplete={handlePaymentComplete}
  onError={handlePaymentError}
/>
```

### Payment Processing Page

```jsx
import PaymentPage from './components/booking/PaymentPage';

// This component handles /pay/:token routes
<PaymentPage />
```

## Key Features

### 1. Flexible Split Options

- **Equal Split**: Automatically divide total among participants
- **Custom Amounts**: Set specific amounts for each participant
- **Remainder Handling**: Fair distribution of penny remainders

### 2. Fee Management

- **Organizer Absorption**: Organizer pays all processing fees
- **Participant Fees**: Each participant pays their own fees
- **Split Fees**: Fees distributed equally among all participants

### 3. Payment Tracking

- Real-time payment status updates
- Progress visualization
- Participant payment history
- Automatic status synchronization

### 4. Secure Payment Links

- Unique, time-limited tokens for each participant
- No account required for participants
- QR code generation for easy sharing
- Email and SMS distribution

### 5. Deadline Management

- Configurable payment deadlines
- Automated reminder scheduling
- Threshold-based enforcement
- Partial payment acceptance

### 6. Refund Handling

- Automatic refunds for failed collections
- Partial refund support
- Stripe integration for refund processing
- Audit trail for all refund transactions

## Configuration

### Split Payment Configuration

```javascript
const SPLIT_PAYMENT_CONFIG = {
  maxGroupSize: 20,
  minPaymentDeadlineHours: 24,
  maxPaymentDeadlineHours: 168,
  reminderSchedule: [72, 24, 2], // Hours before deadline
  minimumPaymentThreshold: 0.8, // 80% required to proceed
  refundProcessingDays: 3
};
```

### Fee Handling Options

```javascript
const feeOptions = {
  organizer: 'Organizer pays all fees',
  split: 'Fees split among all participants',
  participants: 'Each participant pays their own fees'
};
```

## API Integration

### Creating a Split Payment

```javascript
import { groupPaymentManager } from './services/split-payment-service';

const splitPayment = await groupPaymentManager.createSplitPayment({
  bookingId: 'booking-123',
  organizerId: 'user-123',
  totalAmount: 89900,
  participants: [
    { id: 'user-456', name: 'John Doe', email: 'john@example.com' },
    { id: null, name: 'Jane Smith', email: 'jane@example.com' } // Guest user
  ],
  splitType: 'equal',
  paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  vendorAccountId: 'acct_vendor_123',
  description: 'Group Adventure Booking'
});
```

### Processing Individual Payments

```javascript
const paymentResult = await groupPaymentManager.processIndividualPayment(
  'individual-payment-id',
  'user-id'
);

// Returns Stripe PaymentIntent for client-side completion
console.log(paymentResult.clientSecret);
```

### Tracking Payment Progress

```javascript
const details = await groupPaymentManager.getSplitPaymentDetails('split-payment-id');

console.log(`Progress: ${details.stats.completionPercentage}%`);
console.log(`Paid: ${details.stats.paidCount}/${details.stats.participantCount}`);
console.log(`Amount collected: $${details.stats.totalPaid / 100}`);
```

## Security Considerations

### 1. Payment Token Security

- Tokens are cryptographically secure and time-limited
- Each token is single-use and payment-specific
- Automatic expiration and cleanup

### 2. User Authorization

- Row-level security (RLS) policies
- Organizers can only manage their own split payments
- Participants can only access their own payment details

### 3. Stripe Integration

- PCI DSS compliance through Stripe
- Secure payment processing
- Automatic fraud detection

## Testing

### Unit Tests

```bash
npm test split-payment-service.test.js
```

### Integration Tests

The test suite covers:
- Split calculation algorithms
- Payment workflow management
- Deadline enforcement
- Error handling
- Edge cases (single participant, large groups, small amounts)

### Demo Components

- **GroupBookingPaymentDemo** - Interactive demo
- **BookingPaymentIntegration** - Full workflow example

## Performance Optimizations

### 1. Database Indexing

- Optimized queries for payment status lookup
- Efficient participant filtering
- Deadline-based reminder queries

### 2. Real-time Updates

- Supabase real-time subscriptions
- Automatic UI synchronization
- Minimal database calls

### 3. Caching Strategy

- Payment link caching
- Split calculation memoization
- Participant data optimization

## Monitoring and Analytics

### 1. Payment Metrics

- Split payment completion rates
- Average payment times
- Participant engagement metrics

### 2. Error Tracking

- Failed payment attempts
- Deadline enforcement actions
- Refund processing

### 3. Performance Monitoring

- Payment processing times
- Database query performance
- API response times

## Deployment

### 1. Database Migrations

```bash
# Apply split payment tables
supabase migration apply 20250915_010_create_split_payment_tables.sql
supabase migration apply 20250915_011_add_payment_tokens_table.sql
```

### 2. Environment Variables

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Webhook Configuration

Set up Stripe webhooks for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

## Troubleshooting

### Common Issues

1. **Payment link expired**: Regenerate tokens with extended expiration
2. **Insufficient threshold**: Adjust minimum payment threshold
3. **Stripe integration errors**: Verify API keys and webhook configuration
4. **Database connection issues**: Check Supabase configuration

### Error Handling

The system includes comprehensive error handling for:
- Network connectivity issues
- Payment processing failures
- Database constraint violations
- User authorization errors

## Future Enhancements

### Planned Features

1. **Multi-currency support**: Handle international payments
2. **Installment payments**: Allow payment plans for large amounts
3. **Smart reminders**: ML-based optimal reminder timing
4. **Social sharing**: Enhanced sharing options and social features
5. **Mobile optimizations**: Native mobile app integration

### Scalability Considerations

1. **Background job processing**: Move reminder sending to background jobs
2. **Database sharding**: Partition large payment datasets
3. **API rate limiting**: Implement smart rate limiting
4. **CDN integration**: Optimize payment page loading

## Support

For implementation questions or issues:
1. Check the test suite for usage examples
2. Review the demo components for integration patterns
3. Consult the service documentation for API details
4. Monitor application logs for debugging information
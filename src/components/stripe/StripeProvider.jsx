/**
 * StripeProvider Component
 * Wraps components with Stripe Elements provider
 */

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../../services/stripe-service.js';

const StripeProvider = ({
  children,
  clientSecret,
  appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: 'rgba(0, 0, 0, 0.8)',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
    },
  },
  options = {}
}) => {
  const stripeOptions = {
    clientSecret,
    appearance,
    ...options,
  };

  return (
    <Elements stripe={getStripe()} options={stripeOptions}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
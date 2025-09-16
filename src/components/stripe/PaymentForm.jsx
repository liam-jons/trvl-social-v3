/**
 * PaymentForm Component - Secure payment collection using Stripe Elements
 * Supports card payments, 3D Secure, and digital wallets
 */

import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
  PaymentElement,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import GlassInput from '../ui/GlassInput.jsx';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Card Element styling to match glass morphism theme
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#9ca3af',
      },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

const PaymentForm = ({
  clientSecret,
  amount,
  currency = 'usd',
  onSuccess,
  onError,
  onProcessing,
  requireBillingDetails = true,
  showSaveCard = true,
  customerId = null,
  mode = 'payment', // 'payment' or 'setup' for saving cards
  appearance = 'night', // Stripe appearance theme
}) => {
  const stripe = useStripe();
  const elements = useElements();

  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  // Billing details state
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  // Initialize Payment Request (for Apple Pay, Google Pay)
  useEffect(() => {
    if (!stripe || !amount) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: {
        label: 'Total',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Payment Request is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    // Handle Payment Request events
    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      onProcessing?.(true);

      try {
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: ev.paymentMethod.id,
          },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          handleError(confirmError.message);
        } else {
          ev.complete('success');
          setPaymentSucceeded(true);
          onSuccess?.({
            paymentMethod: ev.paymentMethod,
            paymentIntent: { status: 'succeeded' }
          });
        }
      } catch (error) {
        ev.complete('fail');
        handleError(error.message);
      } finally {
        setIsProcessing(false);
        onProcessing?.(false);
      }
    });

    return () => pr.abort();
  }, [stripe, amount, currency, clientSecret]);

  const handleError = (message) => {
    setErrorMessage(message);
    onError?.(message);
  };

  const handleBillingDetailChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBillingDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateBillingDetails = () => {
    if (!requireBillingDetails) return true;

    const required = ['name', 'email'];
    const missing = required.filter(field => !billingDetails[field]?.trim());

    if (missing.length > 0) {
      handleError(`Please fill in required fields: ${missing.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      handleError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!validateBillingDetails()) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    onProcessing?.(true);

    try {
      let result;

      if (mode === 'payment') {
        // Payment mode - process payment with Payment Element or Card Element
        const paymentElement = elements.getElement(PaymentElement);
        const cardElement = elements.getElement(CardElement);

        if (paymentElement) {
          // Using Payment Element (newer, recommended)
          result = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
            confirmParams: {
              payment_method_data: {
                billing_details: requireBillingDetails ? billingDetails : undefined,
              },
              setup_future_usage: saveCard ? 'off_session' : undefined,
            },
          });
        } else if (cardElement) {
          // Using Card Element (legacy)
          result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: requireBillingDetails ? billingDetails : undefined,
            },
            setup_future_usage: saveCard ? 'off_session' : undefined,
          });
        } else {
          throw new Error('No payment element found');
        }
      } else {
        // Setup mode - save card for future use
        const cardElement = elements.getElement(CardElement);
        result = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: requireBillingDetails ? billingDetails : undefined,
          },
        });
      }

      if (result.error) {
        // Payment failed
        handleError(result.error.message);
      } else {
        // Payment succeeded
        setPaymentSucceeded(true);
        onSuccess?.(result);
      }
    } catch (error) {
      handleError(error.message);
    } finally {
      setIsProcessing(false);
      onProcessing?.(false);
    }
  };

  if (paymentSucceeded) {
    return (
      <GlassCard className="p-6 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-300">
          Your payment has been processed successfully.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Digital Wallet Buttons */}
        {canMakePayment && paymentRequest && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">
                Pay with your digital wallet
              </p>
              <div className="max-w-xs mx-auto">
                <PaymentRequestButtonElement
                  options={{
                    paymentRequest,
                    style: {
                      paymentRequestButton: {
                        theme: 'dark',
                        height: '48px',
                        type: 'buy',
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-400">Or pay with card</span>
              </div>
            </div>
          </div>
        )}

        {/* Billing Details */}
        {requireBillingDetails && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Billing Details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GlassInput
                label="Full Name"
                required
                value={billingDetails.name}
                onChange={(e) => handleBillingDetailChange('name', e.target.value)}
                placeholder="John Doe"
              />
              <GlassInput
                label="Email"
                type="email"
                required
                value={billingDetails.email}
                onChange={(e) => handleBillingDetailChange('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <GlassInput
              label="Phone (Optional)"
              type="tel"
              value={billingDetails.phone}
              onChange={(e) => handleBillingDetailChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />

            <div className="space-y-4">
              <h4 className="text-md font-medium text-white">Address</h4>
              <GlassInput
                label="Address Line 1"
                value={billingDetails.address.line1}
                onChange={(e) => handleBillingDetailChange('address.line1', e.target.value)}
                placeholder="123 Main St"
              />
              <GlassInput
                label="Address Line 2 (Optional)"
                value={billingDetails.address.line2}
                onChange={(e) => handleBillingDetailChange('address.line2', e.target.value)}
                placeholder="Apt 4B"
              />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <GlassInput
                  label="City"
                  value={billingDetails.address.city}
                  onChange={(e) => handleBillingDetailChange('address.city', e.target.value)}
                  placeholder="New York"
                />
                <GlassInput
                  label="State"
                  value={billingDetails.address.state}
                  onChange={(e) => handleBillingDetailChange('address.state', e.target.value)}
                  placeholder="NY"
                />
                <GlassInput
                  label="ZIP Code"
                  value={billingDetails.address.postal_code}
                  onChange={(e) => handleBillingDetailChange('address.postal_code', e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Element Container */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">
            Payment Information
          </h3>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
            {mode === 'payment' && clientSecret ? (
              <PaymentElement
                options={{
                  appearance: {
                    theme: appearance,
                    variables: {
                      colorPrimary: '#3b82f6',
                      colorBackground: 'transparent',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              />
            ) : (
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            )}
          </div>
        </div>

        {/* Save Card Option */}
        {showSaveCard && customerId && mode === 'payment' && (
          <div className="flex items-center">
            <input
              id="save-card"
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="h-4 w-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="save-card" className="ml-2 text-sm text-gray-300">
              Save this card for future payments
            </label>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-red-200 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <GlassButton
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-3 text-lg font-medium"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
              Processing...
            </div>
          ) : (
            `${mode === 'payment' ? 'Pay' : 'Save Card'} ${amount ? `$${(amount).toFixed(2)}` : ''}`
          )}
        </GlassButton>
      </form>
    </GlassCard>
  );
};

export default PaymentForm;
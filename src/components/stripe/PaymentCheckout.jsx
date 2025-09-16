/**
 * PaymentCheckout Component
 * Complete payment checkout experience with method selection and new payment form
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { payments } from '../../services/stripe-service.js';
import StripeProvider from './StripeProvider.jsx';
import PaymentForm from './PaymentForm.jsx';
import PaymentMethodSelector from './PaymentMethodSelector.jsx';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import {
  CreditCardIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
const PaymentCheckout = ({
  amount,
  currency = 'usd',
  vendorAccountId,
  bookingId,
  description,
  onSuccess,
  onError,
  onCancel,
  showSavedMethods = true,
  requireBillingDetails = true,
}) => {
  const { user } = useAuth();
  // State management
  const [step, setStep] = useState('method-selection'); // method-selection, new-payment, processing, success
  const [clientSecret, setClientSecret] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  // Create payment intent when component mounts
  useEffect(() => {
    if (amount && vendorAccountId && bookingId && user) {
      createPaymentIntent();
    }
  }, [amount, vendorAccountId, bookingId, user]);
  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);
      const paymentData = await payments.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        vendorAccountId,
        bookingId,
        userId: user.id,
        description: description || `Payment for booking ${bookingId}`,
      });
      setClientSecret(paymentData.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError(error.message);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleMethodSelect = (methodId) => {
    setSelectedMethodId(methodId);
  };
  const handleAddNewMethod = () => {
    setStep('new-payment');
    setSelectedMethodId(null);
  };
  const handleBackToMethods = () => {
    setStep('method-selection');
    setError(null);
  };
  const handlePayWithSavedMethod = async () => {
    if (!selectedMethodId || !clientSecret) return;
    try {
      setLoading(true);
      setStep('processing');
      // Process payment with saved method
      const response = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split('_secret_')[0],
          paymentMethodId: selectedMethodId,
        }),
      });
      if (!response.ok) {
        throw new Error('Payment confirmation failed');
      }
      const result = await response.json();
      if (result.success) {
        setPaymentResult(result);
        setStep('success');
        onSuccess?.(result);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.message);
      setStep('method-selection');
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setStep('success');
    onSuccess?.(result);
  };
  const handlePaymentError = (error) => {
    setError(error);
    onError?.(error);
  };
  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };
  if (loading && !clientSecret) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-4"></div>
          <p className="text-gray-300">Setting up payment...</p>
        </div>
      </GlassCard>
    );
  }
  if (error && !clientSecret) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
          <div className="space-x-4">
            <GlassButton onClick={createPaymentIntent}>
              Try Again
            </GlassButton>
            <GlassButton onClick={onCancel} variant="outline">
              Cancel
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    );
  }
  if (step === 'success') {
    return (
      <GlassCard className="p-6 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-300 mb-4">
          Your payment of {formatAmount(amount, currency)} has been processed successfully.
        </p>
        <div className="text-sm text-gray-400">
          Transaction ID: {paymentResult?.paymentIntent?.id}
        </div>
      </GlassCard>
    );
  }
  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Payment Summary</h3>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatAmount(amount, currency)}
            </div>
            <div className="text-xs text-gray-400">
              Includes platform fee
            </div>
          </div>
        </div>
      </GlassCard>
      {/* Payment Method Selection */}
      {step === 'method-selection' && showSavedMethods && (
        <div className="space-y-4">
          <PaymentMethodSelector
            customerId={user?.stripeCustomerId}
            selectedMethodId={selectedMethodId}
            onMethodSelect={handleMethodSelect}
            onAddNewMethod={handleAddNewMethod}
            showAddButton={true}
          />
          {selectedMethodId && (
            <div className="flex space-x-4">
              <GlassButton
                onClick={handlePayWithSavedMethod}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ${formatAmount(amount, currency)}`
                )}
              </GlassButton>
              <GlassButton
                onClick={onCancel}
                variant="outline"
              >
                Cancel
              </GlassButton>
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
      {/* New Payment Form */}
      {(step === 'new-payment' || !showSavedMethods) && clientSecret && (
        <div className="space-y-4">
          {showSavedMethods && (
            <div className="flex items-center mb-4">
              <GlassButton
                onClick={handleBackToMethods}
                variant="outline"
                className="mr-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Saved Methods
              </GlassButton>
              <h3 className="text-lg font-semibold text-white">
                Add New Payment Method
              </h3>
            </div>
          )}
          <StripeProvider clientSecret={clientSecret}>
            <PaymentForm
              clientSecret={clientSecret}
              amount={amount}
              currency={currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onProcessing={setLoading}
              requireBillingDetails={requireBillingDetails}
              showSaveCard={true}
              customerId={user?.stripeCustomerId}
              mode="payment"
            />
          </StripeProvider>
          <div className="flex justify-center">
            <GlassButton
              onClick={onCancel}
              variant="outline"
            >
              Cancel Payment
            </GlassButton>
          </div>
        </div>
      )}
      {/* Processing State */}
      {step === 'processing' && (
        <GlassCard className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-4"></div>
          <p className="text-gray-300">Processing your payment...</p>
          <p className="text-sm text-gray-400 mt-2">
            Please don't close this window.
          </p>
        </GlassCard>
      )}
    </div>
  );
};
export default PaymentCheckout;
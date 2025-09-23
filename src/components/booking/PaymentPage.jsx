/**
 * PaymentPage - Handles individual payment processing from payment links
 * Processes secure payment tokens and integrates with Stripe for payment completion
 */
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { groupPaymentManager } from '../../services/split-payment-service';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabase';
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
  Users
} from 'lucide-react';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const PaymentForm = ({ paymentData, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    const cardElement = elements.getElement(CardElement);
    setProcessing(true);
    setError(null);
    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: paymentData.participantName,
              email: paymentData.participantEmail,
            },
          },
        }
      );
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      if (paymentIntent.status === 'succeeded') {
        // Update payment status in database
        await groupPaymentManager.updatePaymentStatus(
          paymentData.individualPaymentId,
          'paid',
          paymentIntent.id
        );
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setProcessing(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </p>
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${(paymentData.amount / 100).toFixed(2)}
          </>
        )}
      </Button>
      <div className="text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center">
          <Shield className="w-3 h-3 mr-1" />
          Secured by Stripe • Your payment information is encrypted
        </p>
      </div>
    </form>
  );
};
const PaymentPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [splitDetails, setSplitDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  useEffect(() => {
    loadPaymentData();
  }, [token]);
  const loadPaymentData = async () => {
    try {
      setLoading(true);
      // Verify payment token and get payment details
      const { data: tokenData, error: tokenError } = await supabase
        .from('payment_tokens')
        .select('individual_payment_id, expires_at')
        .eq('token', token)
        .single();
      if (tokenError || !tokenData) {
        throw new Error('Invalid or expired payment link');
      }
      // Check if token is expired
      if (new Date() > new Date(tokenData.expires_at)) {
        throw new Error('Payment link has expired');
      }
      // Get individual payment details
      const { data: payment, error: paymentError } = await supabase
        .from('individual_payments')
        .select('*, split_payments(*)')
        .eq('id', tokenData.individual_payment_id)
        .single();
      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }
      // Check if already paid
      if (payment.status === 'paid') {
        setPaymentCompleted(true);
        setPaymentData(payment);
        return;
      }
      // Check if deadline has passed
      if (new Date() > new Date(payment.payment_deadline)) {
        throw new Error('Payment deadline has passed');
      }
      // Process payment with Stripe (create payment intent)
      const result = await groupPaymentManager.processIndividualPayment(
        tokenData.individual_payment_id,
        payment.user_id || 'guest'
      );
      setPaymentData({
        ...result,
        individualPaymentId: tokenData.individual_payment_id,
        participantName: payment.metadata?.participantName || 'Guest',
        participantEmail: payment.metadata?.participantEmail,
        paymentDeadline: payment.payment_deadline,
      });
      setSplitDetails({
        description: payment.split_payments.description,
        totalAmount: payment.split_payments.total_amount,
        participantCount: payment.split_payments.participant_count,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentCompleted(true);
  };
  const handlePaymentError = (error) => {
  };
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Payment Unavailable</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }
  if (paymentCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Payment Completed!</h2>
          <p className="text-muted-foreground mb-4">
            Thank you for your payment. You'll receive a confirmation email shortly.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            You're paying for your share of the group booking
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Payment Summary</h3>
              {splitDetails && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{splitDetails.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {splitDetails.participantCount} participants
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Due: {formatDateTime(paymentData.paymentDeadline)}
                    </span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your share:</span>
                    <span className="text-lg font-bold">
                      ${(paymentData.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Total booking:</span>
                    <span>${(splitDetails.totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  Secure Payment
                </p>
                <p className="text-xs text-green-600">
                  Your payment is protected by Stripe's advanced security
                </p>
              </div>
            </Card>
          </div>
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-semibold">Payment Details</h3>
              </div>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  paymentData={paymentData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 mb-2">
                  What happens after payment?
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• You'll receive a payment confirmation email</li>
                  <li>• The organizer will be notified of your payment</li>
                  <li>• You'll get booking details once all payments are collected</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PaymentPage;
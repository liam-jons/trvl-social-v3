/**
 * Individual Payment Form Component
 * Allows participants to pay their share in a group payment
 */
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import PaymentForm from './PaymentForm.jsx';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { groupPaymentManager } from '../../services/split-payment-service.js';
const IndividualPaymentForm = ({
  individualPaymentId,
  userId,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    fetchPaymentData();
  }, [individualPaymentId]);
  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get individual payment details
      const { data: payment, error: paymentError } = await supabase
        .from('individual_payments')
        .select(`
          *,
          split_payments (
            *,
            bookings (title, description, start_date)
          )
        `)
        .eq('id', individualPaymentId)
        .single();
      if (paymentError) throw paymentError;
      if (payment.user_id !== userId) {
        throw new Error('Unauthorized: You can only pay for your own share');
      }
      if (payment.status === 'paid') {
        throw new Error('Payment has already been completed');
      }
      if (payment.status === 'refunded') {
        throw new Error('This payment has been refunded');
      }
      // Check if deadline has passed
      const now = new Date();
      const deadline = new Date(payment.payment_deadline);
      if (now > deadline) {
      }
      setPaymentData(payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const initializePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      // Create payment intent through the group payment manager
      const result = await groupPaymentManager.processIndividualPayment(
        individualPaymentId,
        userId
      );
      setPaymentIntent(result);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const handlePaymentSuccess = async (result) => {
    try {
      // Update payment status
      await groupPaymentManager.updatePaymentStatus(
        individualPaymentId,
        'paid',
        result.paymentIntent?.id
      );
      // Cancel any remaining reminders for this payment
      // This would be handled by the collection service
      onSuccess?.({
        individualPaymentId,
        paymentIntentId: result.paymentIntent?.id,
        amount: paymentData.amount_due,
      });
    } catch (error) {
      // Payment succeeded with Stripe but status update failed
      // The webhook should handle this, but we should notify the user
      onError?.('Payment processed successfully, but there was an issue updating the status. Please contact support if you see this payment as incomplete.');
    }
  };
  const handlePaymentError = (error) => {
    onError?.(error);
  };
  const formatAmount = (amountInCents) => {
    return `$${(amountInCents / 100).toFixed(2)}`;
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  const getTimeUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    if (timeDiff <= 0) return 'Overdue';
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };
  const isDeadlinePassed = (deadline) => {
    return new Date() > new Date(deadline);
  };
  const isDeadlineUrgent = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000; // Less than 24 hours
  };
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-white">Loading payment details...</span>
        </div>
      </GlassCard>
    );
  }
  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8 text-red-400">
          <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
          <span>{error}</span>
        </div>
        <div className="text-center mt-4">
          <GlassButton onClick={fetchPaymentData} className="text-sm">
            Try Again
          </GlassButton>
        </div>
      </GlassCard>
    );
  }
  const { split_payments: splitPayment } = paymentData;
  const booking = splitPayment.bookings;
  const deadlinePassed = isDeadlinePassed(paymentData.payment_deadline);
  const deadlineUrgent = isDeadlineUrgent(paymentData.payment_deadline);
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Payment Header */}
      <GlassCard className="p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-2" />
            Complete Your Payment
          </h1>
          <p className="text-gray-300">
            Your share of the group booking payment
          </p>
        </div>
        {/* Booking Information */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-white mb-3">
            {booking?.title || 'Group Booking'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Your Amount:</span>
              <div className="text-white font-semibold text-xl">
                {formatAmount(paymentData.amount_due)}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Booking Date:</span>
              <div className="text-white font-medium">
                {booking?.start_date ? formatDate(booking.start_date) : 'TBD'}
              </div>
            </div>
          </div>
          {booking?.description && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-gray-400 text-sm">Description:</span>
              <p className="text-white text-sm mt-1">{booking.description}</p>
            </div>
          )}
        </div>
        {/* Payment Deadline */}
        <div className={`rounded-lg border p-4 ${
          deadlinePassed
            ? 'border-red-500/30 bg-red-500/10'
            : deadlineUrgent
            ? 'border-yellow-500/30 bg-yellow-500/10'
            : 'border-blue-500/30 bg-blue-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className={`h-5 w-5 mr-2 ${
                deadlinePassed ? 'text-red-400' : deadlineUrgent ? 'text-yellow-400' : 'text-blue-400'
              }`} />
              <div>
                <span className="text-sm text-gray-400">Payment Deadline:</span>
                <div className={`font-medium ${
                  deadlinePassed ? 'text-red-400' : deadlineUrgent ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatDate(paymentData.payment_deadline)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${
                deadlinePassed ? 'text-red-400' : deadlineUrgent ? 'text-yellow-400' : 'text-blue-400'
              }`}>
                {getTimeUntilDeadline(paymentData.payment_deadline)}
              </div>
              {deadlinePassed && (
                <div className="text-xs text-red-300 mt-1">
                  Payment still accepted
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Warning Messages */}
        {deadlinePassed && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-medium">Payment Overdue</h4>
                <p className="text-red-200 text-sm mt-1">
                  Your payment deadline has passed. The booking may be cancelled if insufficient payments are collected.
                  Complete your payment now to secure your spot.
                </p>
              </div>
            </div>
          </div>
        )}
        {deadlineUrgent && !deadlinePassed && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start">
              <ClockIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-medium">Payment Deadline Approaching</h4>
                <p className="text-yellow-200 text-sm mt-1">
                  Your payment deadline is approaching. Complete your payment soon to avoid potential booking cancellation.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Group Status Information */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center mb-2">
            <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-400">Group Payment Status</span>
          </div>
          <p className="text-white text-sm">
            You are part of a group payment with {splitPayment.participant_count} participants.
            Your payment helps secure the booking for everyone.
          </p>
        </div>
      </GlassCard>
      {/* Payment Form */}
      {!paymentIntent ? (
        <GlassCard className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">
              Ready to Pay {formatAmount(paymentData.amount_due)}?
            </h3>
            <p className="text-gray-300 mb-6">
              Click below to proceed with your secure payment
            </p>
            <GlassButton
              onClick={initializePayment}
              disabled={isProcessing}
              className="px-8 py-3"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                  Preparing Payment...
                </div>
              ) : (
                <>
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        <PaymentForm
          clientSecret={paymentIntent.clientSecret}
          amount={paymentData.amount_due / 100} // Convert to dollars
          currency={splitPayment.currency}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          requireBillingDetails={true}
          showSaveCard={false}
          mode="payment"
        />
      )}
      {/* Information Card */}
      <GlassCard className="p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium text-sm">Payment Information</h4>
            <ul className="text-gray-300 text-xs mt-2 space-y-1">
              <li>• Your payment is processed securely through Stripe</li>
              <li>• You will receive a confirmation email after successful payment</li>
              <li>• Refunds will be processed if the group payment is cancelled</li>
              <li>• Contact support if you experience any issues</li>
            </ul>
          </div>
        </div>
      </GlassCard>
      {/* Cancel Option */}
      {onCancel && (
        <div className="text-center">
          <GlassButton
            onClick={onCancel}
            variant="secondary"
            className="text-sm"
          >
            Cancel
          </GlassButton>
        </div>
      )}
    </div>
  );
};
export default IndividualPaymentForm;
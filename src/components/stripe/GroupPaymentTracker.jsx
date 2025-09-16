/**
 * Group Payment Tracker Component
 * Shows payment status for all participants in a split payment
 */
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BellIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { groupPaymentManager } from '../../services/split-payment-service.js';
import { paymentCollectionWorkflow } from '../../services/payment-collection-service.js';
const GroupPaymentTracker = ({
  splitPaymentId,
  currentUserId,
  onPayNow,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Auto-refresh payment status
  useEffect(() => {
    let interval;
    const fetchPaymentData = async () => {
      try {
        setError(null);
        const data = await groupPaymentManager.getSplitPaymentDetails(splitPaymentId);
        setPaymentData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    fetchPaymentData();
    if (refreshInterval > 0) {
      interval = setInterval(fetchPaymentData, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [splitPaymentId, refreshInterval]);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await groupPaymentManager.getSplitPaymentDetails(splitPaymentId);
      setPaymentData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };
  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIconSolid className="h-6 w-6 text-green-500" />;
      case 'processing':
        return <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'refunded':
        return <ArrowPathIcon className="h-6 w-6 text-yellow-500" />;
      case 'pending':
      default:
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
    }
  };
  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid':
        return { text: 'Paid', color: 'text-green-400' };
      case 'processing':
        return { text: 'Processing', color: 'text-blue-400' };
      case 'failed':
        return { text: 'Failed', color: 'text-red-400' };
      case 'refunded':
        return { text: 'Refunded', color: 'text-yellow-400' };
      case 'pending':
      default:
        return { text: 'Pending', color: 'text-yellow-400' };
    }
  };
  const getSplitStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'partially_paid':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'cancelled_insufficient':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'completed_partial':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };
  const formatAmount = (amountInCents) => {
    return `$${(amountInCents / 100).toFixed(2)}`;
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  const isDeadlinePassed = (deadline) => {
    return new Date() > new Date(deadline);
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
  const handlePayNow = (individualPaymentId) => {
    onPayNow?.(individualPaymentId);
  };
  const sendReminder = async (individualPaymentId) => {
    try {
      // This would integrate with your reminder system
      console.log(`Sending reminder for payment ${individualPaymentId}`);
      // You could call a specific reminder endpoint here
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
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
          <span>Failed to load payment details: {error}</span>
        </div>
        <div className="text-center mt-4">
          <GlassButton onClick={handleRefresh} className="text-sm">
            Try Again
          </GlassButton>
        </div>
      </GlassCard>
    );
  }
  const { splitPayment, individualPayments, stats } = paymentData;
  const currentUserPayment = individualPayments.find(p => p.user_id === currentUserId);
  const isOrganizer = splitPayment.organizer_id === currentUserId;
  return (
    <div className="space-y-6">
      {/* Split Payment Overview */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-2" />
            Group Payment Status
          </h2>
          <GlassButton
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm px-3 py-2"
          >
            {refreshing ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowPathIcon className="h-4 w-4" />
            )}
          </GlassButton>
        </div>
        {/* Status Banner */}
        <div className={`rounded-lg border p-4 mb-6 ${getSplitStatusColor(splitPayment.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">
                {splitPayment.status === 'completed' && 'Payment Collection Complete'}
                {splitPayment.status === 'partially_paid' && 'Partial Payments Received'}
                {splitPayment.status === 'pending' && 'Waiting for Payments'}
                {splitPayment.status === 'cancelled_insufficient' && 'Payment Collection Cancelled'}
                {splitPayment.status === 'completed_partial' && 'Booking Confirmed with Partial Payment'}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                {stats.paidCount} of {stats.participantCount} participants have paid
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.round(stats.completionPercentage)}%
              </div>
              <div className="text-sm opacity-90">
                {formatAmount(stats.totalPaid)} / {formatAmount(stats.totalDue)}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 bg-black/20 rounded-full h-2">
            <div
              className="bg-current rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(stats.completionPercentage, 100)}%` }}
            />
          </div>
        </div>
        {/* Deadline Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center text-gray-300 mb-2">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Payment Deadline</span>
            </div>
            <div className="text-white font-medium">
              {formatDate(splitPayment.payment_deadline)}
            </div>
            <div className={`text-sm mt-1 ${
              isDeadlinePassed(splitPayment.payment_deadline) ? 'text-red-400' : 'text-gray-400'
            }`}>
              {getTimeUntilDeadline(splitPayment.payment_deadline)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center text-gray-300 mb-2">
              <UserIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Participants</span>
            </div>
            <div className="text-white font-medium">
              {stats.paidCount} / {stats.participantCount}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {stats.pendingCount} pending
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center text-gray-300 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Total Collected</span>
            </div>
            <div className="text-white font-medium">
              {formatAmount(stats.totalPaid)}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {formatAmount(stats.remainingAmount)} remaining
            </div>
          </div>
        </div>
        {/* Current User's Payment Status (if not organizer) */}
        {currentUserPayment && !isOrganizer && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Your Payment
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getPaymentStatusIcon(currentUserPayment.status)}
                <div className="ml-3">
                  <div className="text-white font-medium">
                    {formatAmount(currentUserPayment.amount_due)}
                  </div>
                  <div className={`text-sm ${getPaymentStatusText(currentUserPayment.status).color}`}>
                    {getPaymentStatusText(currentUserPayment.status).text}
                  </div>
                </div>
              </div>
              {currentUserPayment.status === 'pending' && (
                <GlassButton
                  onClick={() => handlePayNow(currentUserPayment.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Pay Now
                </GlassButton>
              )}
            </div>
          </div>
        )}
      </GlassCard>
      {/* Individual Payment Status */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Participant Status
        </h3>
        <div className="space-y-4">
          {individualPayments.map((payment) => {
            const statusInfo = getPaymentStatusText(payment.status);
            const isCurrentUser = payment.user_id === currentUserId;
            return (
              <div
                key={payment.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isCurrentUser
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {getPaymentStatusIcon(payment.status)}
                  <div>
                    <div className="flex items-center">
                      <span className="text-white font-medium">
                        {payment.metadata?.participantName || `User ${payment.user_id.slice(0, 8)}`}
                      </span>
                      {isCurrentUser && (
                        <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {payment.metadata?.participantEmail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {formatAmount(payment.amount_due)}
                    </div>
                    <div className={`text-sm ${statusInfo.color}`}>
                      {statusInfo.text}
                    </div>
                    {payment.paid_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Paid: {formatDate(payment.paid_at)}
                      </div>
                    )}
                  </div>
                  {/* Action buttons for organizer */}
                  {isOrganizer && payment.status === 'pending' && (
                    <GlassButton
                      onClick={() => sendReminder(payment.id)}
                      className="text-sm px-3 py-1"
                      variant="secondary"
                    >
                      <BellIcon className="h-4 w-4 mr-1" />
                      Remind
                    </GlassButton>
                  )}
                  {/* Pay button for current user */}
                  {isCurrentUser && payment.status === 'pending' && (
                    <GlassButton
                      onClick={() => handlePayNow(payment.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Pay Now
                    </GlassButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {individualPayments.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No participants found</p>
          </div>
        )}
      </GlassCard>
      {/* Additional Information */}
      {(stats.meetsMinimumThreshold || splitPayment.status === 'completed_partial') && (
        <GlassCard className="p-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-green-400 font-medium">Minimum Payment Threshold Met</h4>
              <p className="text-sm text-gray-300 mt-1">
                The booking will proceed even if all participants haven't paid.
                Outstanding payments may be handled separately.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
export default GroupPaymentTracker;
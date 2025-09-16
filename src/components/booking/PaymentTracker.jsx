/**
 * PaymentTracker - Component for tracking individual payment status
 * Shows payment progress, handles payment processing, and displays real-time updates
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { groupPaymentManager } from '../../services/split-payment-service';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  CreditCard,
  User,
  DollarSign,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const PaymentTracker = ({
  splitPaymentId,
  splitPaymentDetails,
  individualPayments = [],
  paymentStats,
  onPaymentUpdate,
  onPaymentComplete,
  disabled = false
}) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);

  // Real-time updates subscription
  useEffect(() => {
    if (!splitPaymentId) return;

    const subscription = supabase
      .channel(`split_payment_${splitPaymentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'individual_payments',
          filter: `split_payment_id=eq.${splitPaymentId}`,
        },
        (payload) => {
          console.log('Payment update received:', payload);
          onPaymentUpdate?.();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [splitPaymentId, onPaymentUpdate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onPaymentUpdate?.();
    } finally {
      setRefreshing(false);
    }
  };

  const handleProcessPayment = async (individualPaymentId) => {
    if (!user?.id) return;

    setProcessingPayment(individualPaymentId);
    try {
      const result = await groupPaymentManager.processIndividualPayment(
        individualPaymentId,
        user.id
      );

      // Create payment URL for Stripe Checkout or redirect
      const paymentUrl = `/payment?payment_intent=${result.paymentIntentId}&client_secret=${result.clientSecret}`;
      setPaymentUrl(paymentUrl);

      // Open payment in new tab/window
      window.open(paymentUrl, '_blank');

      onPaymentComplete?.(result);
    } catch (err) {
      console.error('Payment processing failed:', err);
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      paid: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: splitPaymentDetails?.currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserPayment = () => {
    return individualPayments.find(payment => payment.user_id === user?.id);
  };

  const userPayment = getUserPayment();
  const canPayOwn = userPayment && userPayment.status === 'pending' && !disabled;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium">Payment Progress</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {paymentStats && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Progress</span>
                <span>{paymentStats.completionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={paymentStats.completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{paymentStats.paidCount}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{paymentStats.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(paymentStats.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {formatCurrency(paymentStats.remainingAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>

            {/* Payment Threshold Check */}
            {paymentStats.completionPercentage < 100 && (
              <div className={`p-3 rounded-lg ${
                paymentStats.meetsMinimumThreshold
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {paymentStats.meetsMinimumThreshold ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <p className={`text-sm font-medium ${
                    paymentStats.meetsMinimumThreshold ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {paymentStats.meetsMinimumThreshold
                      ? 'Minimum payment threshold met (80%)'
                      : 'Below minimum payment threshold (80%)'}
                  </p>
                </div>
                {!paymentStats.meetsMinimumThreshold && (
                  <p className="text-xs text-amber-600 mt-1">
                    Need {formatCurrency((paymentStats.totalDue * 0.8) - paymentStats.totalPaid)} more to meet minimum threshold
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* User's Payment */}
      {userPayment && (
        <Card className="p-4 border-primary/50">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <User className="w-4 h-4 mr-2" />
            Your Payment
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Amount Due: {formatCurrency(userPayment.amount_due)}
              </p>
              <p className="text-xs text-muted-foreground">
                Deadline: {formatDateTime(userPayment.payment_deadline)}
              </p>
              {userPayment.paid_at && (
                <p className="text-xs text-green-600">
                  Paid: {formatDateTime(userPayment.paid_at)}
                </p>
              )}
            </div>
            <div className="text-right">
              {getStatusBadge(userPayment.status)}
              {canPayOwn && (
                <Button
                  className="mt-2 ml-2"
                  size="sm"
                  onClick={() => handleProcessPayment(userPayment.id)}
                  disabled={processingPayment === userPayment.id}
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  {processingPayment === userPayment.id ? 'Processing...' : 'Pay Now'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Individual Payments */}
      <Card className="p-4">
        <h4 className="text-md font-medium mb-4">Individual Payments</h4>

        <div className="space-y-3">
          {individualPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(payment.status)}
                <div>
                  <p className="text-sm font-medium">
                    {payment.metadata?.participantName || 'Unknown Participant'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.metadata?.participantEmail}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(payment.amount_due)}
                </p>
                {getStatusBadge(payment.status)}

                {payment.status === 'paid' && payment.paid_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(payment.paid_at)}
                  </p>
                )}

                {payment.reminder_count > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {payment.reminder_count} reminder(s) sent
                  </p>
                )}

                {payment.last_reminder_sent && (
                  <p className="text-xs text-muted-foreground">
                    Last reminder: {formatDateTime(payment.last_reminder_sent)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Summary */}
      <Card className="p-4 bg-muted/30">
        <h4 className="text-md font-medium mb-3">Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Split Payment ID</p>
            <p className="font-mono text-xs">{splitPaymentId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">
              {splitPaymentDetails?.status?.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment Deadline</p>
            <p className="font-medium">
              {formatDateTime(splitPaymentDetails?.payment_deadline)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {formatDateTime(splitPaymentDetails?.created_at)}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment URL Display */}
      {paymentUrl && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Payment Link Generated</p>
              <p className="text-xs text-blue-600">Complete your payment in the new tab</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(paymentUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Payment
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentTracker;
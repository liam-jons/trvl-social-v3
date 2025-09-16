/**
 * PaymentDeadlineManager - Component for managing payment deadlines and enforcement
 * Handles deadline updates, reminder scheduling, and deadline enforcement actions
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GlassInput } from '../ui/GlassInput';
import { paymentDeadlineManager, getSplitPaymentConfig } from '../../services/split-payment-service';
import { supabase } from '../../lib/supabase';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bell,
  Settings,
  RefreshCw,
  Shield,
  DollarSign,
  UserX
} from 'lucide-react';

const PaymentDeadlineManager = ({
  splitPaymentId,
  splitPaymentDetails,
  individualPayments = [],
  paymentStats,
  onDeadlineUpdate,
  disabled = false
}) => {
  const [newDeadline, setNewDeadline] = useState('');
  const [updatingDeadline, setUpdatingDeadline] = useState(false);
  const [enforcingDeadlines, setEnforcingDeadlines] = useState(false);
  const [reminderSettings, setReminderSettings] = useState(null);
  const [showEnforcementOptions, setShowEnforcementOptions] = useState(false);

  const config = getSplitPaymentConfig();

  useEffect(() => {
    if (splitPaymentDetails?.payment_deadline) {
      setNewDeadline(new Date(splitPaymentDetails.payment_deadline).toISOString().slice(0, 16));
    }
  }, [splitPaymentDetails]);

  useEffect(() => {
    loadReminderSettings();
  }, [splitPaymentId]);

  const loadReminderSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('split_payment_settings')
        .select('*')
        .eq('split_payment_id', splitPaymentId)
        .single();

      if (data && !error) {
        setReminderSettings(data);
      } else {
        // Set default reminder settings
        setReminderSettings({
          reminder_schedule: config.reminderSchedule,
          auto_enforcement: true,
          minimum_threshold: config.minimumPaymentThreshold,
        });
      }
    } catch (err) {
      console.error('Failed to load reminder settings:', err);
    }
  };

  const handleUpdateDeadline = async () => {
    if (!newDeadline) return;

    setUpdatingDeadline(true);
    try {
      // Update split payment deadline
      const { error: splitError } = await supabase
        .from('split_payments')
        .update({
          payment_deadline: newDeadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPaymentId);

      if (splitError) throw splitError;

      // Update individual payment deadlines
      const { error: individualError } = await supabase
        .from('individual_payments')
        .update({
          payment_deadline: newDeadline,
          updated_at: new Date().toISOString(),
        })
        .eq('split_payment_id', splitPaymentId);

      if (individualError) throw individualError;

      onDeadlineUpdate?.();

    } catch (err) {
      console.error('Failed to update deadline:', err);
    } finally {
      setUpdatingDeadline(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      await paymentDeadlineManager.sendPaymentReminders();
      onDeadlineUpdate?.();
    } catch (err) {
      console.error('Failed to send reminders:', err);
    }
  };

  const handleEnforceDeadlines = async () => {
    setEnforcingDeadlines(true);
    try {
      await paymentDeadlineManager.enforcePaymentDeadlines();
      onDeadlineUpdate?.();
    } catch (err) {
      console.error('Failed to enforce deadlines:', err);
    } finally {
      setEnforcingDeadlines(false);
    }
  };

  const handleProceedWithPartial = async () => {
    if (!window.confirm('Proceed with booking despite incomplete payments? This action cannot be undone.')) {
      return;
    }

    try {
      await paymentDeadlineManager.proceedWithPartialPayment(splitPaymentDetails, paymentStats);
      onDeadlineUpdate?.();
    } catch (err) {
      console.error('Failed to proceed with partial payment:', err);
    }
  };

  const handleCancelAndRefund = async () => {
    if (!window.confirm('Cancel the booking and refund all paid participants? This action cannot be undone.')) {
      return;
    }

    try {
      await paymentDeadlineManager.cancelAndRefundSplitPayment(splitPaymentDetails, paymentStats);
      onDeadlineUpdate?.();
    } catch (err) {
      console.error('Failed to cancel and refund:', err);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: splitPaymentDetails?.currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  const getTimeUntilDeadline = () => {
    if (!splitPaymentDetails?.payment_deadline) return null;

    const deadline = new Date(splitPaymentDetails.payment_deadline);
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) {
      return { expired: true, text: 'Deadline has passed' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      expired: false,
      text: days > 0 ? `${days} day(s) ${hours} hour(s) remaining` : `${hours} hour(s) remaining`,
      critical: diff < 24 * 60 * 60 * 1000, // Less than 24 hours
    };
  };

  const timeInfo = getTimeUntilDeadline();
  const isDeadlineCritical = timeInfo?.critical || timeInfo?.expired;
  const needsEnforcement = timeInfo?.expired && paymentStats?.completionPercentage < 100;

  return (
    <div className="space-y-6">
      {/* Deadline Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Payment Deadline
          </h4>
          {timeInfo && (
            <Badge variant={
              timeInfo.expired ? 'destructive' :
              timeInfo.critical ? 'secondary' : 'outline'
            }>
              {timeInfo.text}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* Current Deadline */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium">Current Deadline</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(splitPaymentDetails?.payment_deadline)}
              </p>
            </div>
            {isDeadlineCritical && (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>

          {/* Update Deadline */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Update Deadline</label>
            <div className="flex space-x-2">
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                disabled={disabled}
                min={new Date(Date.now() + config.minPaymentDeadlineHours * 60 * 60 * 1000).toISOString().slice(0, 16)}
                max={new Date(Date.now() + config.maxPaymentDeadlineHours * 60 * 60 * 1000).toISOString().slice(0, 16)}
                className="flex-1 p-2 border rounded-md bg-background"
              />
              <Button
                onClick={handleUpdateDeadline}
                disabled={!newDeadline || updatingDeadline || disabled}
                size="sm"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {updatingDeadline ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reminder Management */}
      <Card className="p-4">
        <h4 className="text-md font-medium mb-4 flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          Reminder Management
        </h4>

        <div className="space-y-4">
          {/* Reminder Schedule */}
          {reminderSettings && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Reminder Schedule</p>
              <p className="text-xs text-muted-foreground">
                Reminders sent {reminderSettings.reminder_schedule.join(', ')} hours before deadline
              </p>
            </div>
          )}

          {/* Individual Reminder Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Participant Reminder Status</p>
            {individualPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <p className="text-sm">{payment.metadata?.participantName}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.reminder_count || 0} reminder(s) sent
                  </p>
                </div>
                <div className="text-right">
                  {payment.status === 'paid' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {payment.last_reminder_sent ?
                        `Last: ${new Date(payment.last_reminder_sent).toLocaleDateString()}` :
                        'No reminders sent'
                      }
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Manual Reminder Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminders}
              disabled={disabled}
            >
              <Bell className="w-3 h-3 mr-1" />
              Send Reminders Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Deadline Enforcement */}
      {needsEnforcement && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium flex items-center text-amber-700">
              <Shield className="w-4 h-4 mr-2" />
              Deadline Enforcement Required
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnforcementOptions(!showEnforcementOptions)}
            >
              <Settings className="w-3 h-3 mr-1" />
              Options
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-amber-700">
              The payment deadline has passed. Choose how to proceed:
            </p>

            {/* Payment Status Summary */}
            <div className="bg-white p-3 rounded-lg border border-amber-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Completion Rate</p>
                  <p className="font-semibold">{paymentStats?.completionPercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Collected</p>
                  <p className="font-semibold">{formatCurrency(paymentStats?.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Participants Paid</p>
                  <p className="font-semibold">{paymentStats?.paidCount} / {paymentStats?.participantCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Threshold Met</p>
                  <p className={`font-semibold ${
                    paymentStats?.meetsMinimumThreshold ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {paymentStats?.meetsMinimumThreshold ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {showEnforcementOptions && (
              <div className="space-y-3">
                {paymentStats?.meetsMinimumThreshold ? (
                  <Button
                    onClick={handleProceedWithPartial}
                    disabled={disabled}
                    className="w-full"
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Proceed with Partial Payment (80%+ collected)
                  </Button>
                ) : (
                  <div className="text-sm text-amber-700 bg-white p-3 rounded border">
                    <p className="font-medium">Insufficient payments collected</p>
                    <p>Need at least 80% of total amount to proceed with booking.</p>
                  </div>
                )}

                <Button
                  variant="destructive"
                  onClick={handleCancelAndRefund}
                  disabled={disabled}
                  className="w-full"
                >
                  <UserX className="w-3 h-3 mr-1" />
                  Cancel Booking & Refund All Payments
                </Button>

                <div className="text-xs text-muted-foreground bg-white p-2 rounded border">
                  <p className="font-medium mb-1">Automatic Enforcement</p>
                  <p>If no action is taken within {config.refundProcessingDays} days, the system will automatically cancel and refund based on the minimum threshold.</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnforceDeadlines}
                disabled={enforcingDeadlines || disabled}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${enforcingDeadlines ? 'animate-spin' : ''}`} />
                Run Enforcement Check
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Configuration Info */}
      <Card className="p-4 bg-muted/30">
        <h4 className="text-md font-medium mb-3">Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Minimum Threshold</p>
            <p className="font-medium">{(config.minimumPaymentThreshold * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Refund Processing</p>
            <p className="font-medium">{config.refundProcessingDays} days</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reminder Schedule</p>
            <p className="font-medium">{config.reminderSchedule.join(', ')} hours before</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Group Size</p>
            <p className="font-medium">{config.maxGroupSize} participants</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentDeadlineManager;
/**
 * Vendor Payout Preferences Component
 * Allows vendors to configure their payout settings and preferences
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, Calendar, DollarSign, Settings, Save, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PAYOUT_SCHEDULES } from '../../services/payout-scheduler-service';
const PayoutPreferences = ({ vendorStripeAccountId, onUpdate }) => {
  const [preferences, setPreferences] = useState({
    schedule_interval: 'weekly',
    minimum_payout_amount: 2000, // $20.00 in cents
    auto_payout_enabled: true,
    hold_period_days: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState(null);
  useEffect(() => {
    loadPreferences();
    loadPayoutStatus();
  }, [vendorStripeAccountId]);
  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_stripe_accounts')
        .select(`
          payout_schedule_interval,
          minimum_payout_amount,
          payout_schedule_delay_days,
          payouts_enabled,
          status
        `)
        .eq('id', vendorStripeAccountId)
        .single();
      if (error) throw error;
      if (data) {
        setPreferences({
          schedule_interval: data.payout_schedule_interval || 'weekly',
          minimum_payout_amount: data.minimum_payout_amount || 2000,
          auto_payout_enabled: data.payouts_enabled,
          hold_period_days: data.payout_schedule_delay_days || 0,
        });
      }
    } catch (error) {
      setError('Failed to load payout preferences');
    } finally {
      setLoading(false);
    }
  };
  const loadPayoutStatus = async () => {
    try {
      // Get pending payout amount
      const { data: pendingPayments, error: paymentsError } = await supabase
        .from('booking_payments')
        .select('net_amount')
        .eq('vendor_stripe_account_id', vendorStripeAccountId)
        .eq('status', 'completed')
        .in('payout_status', ['pending', 'eligible']);
      if (paymentsError) throw paymentsError;
      const pendingAmount = pendingPayments?.reduce((sum, p) => sum + p.net_amount, 0) || 0;
      // Get last payout
      const { data: lastPayout, error: payoutError } = await supabase
        .from('vendor_payouts')
        .select('amount, created_at, status, arrival_date')
        .eq('vendor_stripe_account_id', vendorStripeAccountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setPayoutStatus({
        pendingAmount,
        lastPayout: payoutError ? null : lastPayout,
      });
    } catch (error) {
    }
  };
  const savePreferences = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('vendor_stripe_accounts')
        .update({
          payout_schedule_interval: preferences.schedule_interval,
          minimum_payout_amount: preferences.minimum_payout_amount,
          payout_schedule_delay_days: preferences.hold_period_days,
          payouts_enabled: preferences.auto_payout_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendorStripeAccountId);
      if (error) throw error;
      // Notify parent component
      if (onUpdate) {
        onUpdate(preferences);
      }
      // Show success message briefly
      setError('Preferences saved successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const getScheduleDescription = (interval) => {
    const schedule = PAYOUT_SCHEDULES[interval?.toUpperCase()];
    return schedule ? schedule.description : 'Unknown schedule';
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading payout preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payout Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Pending Amount</label>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(payoutStatus?.pendingAmount || 0)}
              </div>
              <p className="text-xs text-gray-500">
                Available for next payout
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Payout</label>
              <div className="text-lg font-semibold">
                {payoutStatus?.lastPayout ? (
                  <>
                    {formatAmount(payoutStatus.lastPayout.amount)}
                    <div className="text-sm text-gray-500">
                      {formatDate(payoutStatus.lastPayout.created_at)}
                    </div>
                    <Badge
                      variant={payoutStatus.lastPayout.status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {payoutStatus.lastPayout.status}
                    </Badge>
                  </>
                ) : (
                  <span className="text-gray-500">No payouts yet</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Payout Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Payout Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Automatic Payouts
              </label>
              <p className="text-xs text-gray-500">
                Enable scheduled automatic payouts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreferences(prev => ({
                ...prev,
                auto_payout_enabled: !prev.auto_payout_enabled
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.auto_payout_enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.auto_payout_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {preferences.auto_payout_enabled && (
            <>
              {/* Payout Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payout Schedule
                </label>
                <select
                  value={preferences.schedule_interval}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    schedule_interval: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getScheduleDescription(preferences.schedule_interval)}
                </p>
              </div>
              {/* Minimum Payout Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Minimum Payout Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    value={preferences.minimum_payout_amount / 100}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      minimum_payout_amount: Math.round(parseFloat(e.target.value || 0) * 100)
                    }))}
                    className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Payouts will only be processed when your pending balance reaches this amount
                </p>
              </div>
              {/* Hold Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Hold Period (Days)
                </label>
                <select
                  value={preferences.hold_period_days}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    hold_period_days: parseInt(e.target.value)
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">No hold</option>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Additional hold period before funds are released to your bank account
                </p>
              </div>
            </>
          )}
          {/* Error/Success Message */}
          {error && (
            <div className={`flex items-center p-3 rounded-md ${
              error.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Information Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Important Information</p>
              <ul className="space-y-1 text-xs">
                <li>• Payouts are processed automatically based on your schedule</li>
                <li>• Platform fees (5%) are deducted before payout</li>
                <li>• Bank transfers typically arrive within 1-2 business days</li>
                <li>• You can always request manual payouts from the dashboard</li>
                <li>• Changing preferences takes effect on the next payout cycle</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default PayoutPreferences;
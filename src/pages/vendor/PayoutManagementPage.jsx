/**
 * Vendor Payout Management Page
 * Complete payout management interface for vendors
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import PayoutDashboard from '../../components/vendor/PayoutDashboard';
import PayoutPreferences from '../../components/vendor/PayoutPreferences';
import VendorDashboardLayout from '../../components/vendor/VendorDashboardLayout';
import {
  DollarSign,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
const PayoutManagementPage = () => {
  const { user } = useAuth();
  const [vendorAccount, setVendorAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [holds, setHolds] = useState([]);
  useEffect(() => {
    if (user) {
      loadVendorAccount();
    }
  }, [user]);
  const loadVendorAccount = async () => {
    try {
      setLoading(true);
      // Get vendor Stripe account
      const { data: account, error: accountError } = await supabase
        .from('vendor_stripe_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (accountError) {
        return;
      }
      setVendorAccount(account);
      // Load payout status and holds
      await Promise.all([
        loadPayoutStatus(account.id),
        loadActiveHolds(account.id),
      ]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const loadPayoutStatus = async (vendorAccountId) => {
    try {
      // Get pending amount
      const { data: pendingPayments, error: paymentsError } = await supabase
        .from('booking_payments')
        .select('net_amount, created_at')
        .eq('vendor_stripe_account_id', vendorAccountId)
        .eq('status', 'completed')
        .in('payout_status', ['pending', 'eligible']);
      if (paymentsError) throw paymentsError;
      const pendingAmount = pendingPayments?.reduce((sum, p) => sum + p.net_amount, 0) || 0;
      // Get last payout
      const { data: lastPayout, error: payoutError } = await supabase
        .from('vendor_payouts')
        .select('amount, created_at, status, arrival_date')
        .eq('vendor_stripe_account_id', vendorAccountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      // Get next scheduled payout
      const { data: scheduledJob, error: jobError } = await supabase
        .from('payout_schedule_jobs')
        .select('next_execution, schedule_interval')
        .eq('vendor_stripe_account_id', vendorAccountId)
        .eq('status', 'scheduled')
        .single();
      setPayoutStatus({
        pendingAmount,
        pendingCount: pendingPayments?.length || 0,
        lastPayout: payoutError ? null : lastPayout,
        nextScheduled: jobError ? null : scheduledJob,
      });
    } catch (error) {
    }
  };
  const loadActiveHolds = async (vendorAccountId) => {
    try {
      const { data: activeHolds, error } = await supabase
        .from('payout_holds')
        .select('*')
        .eq('vendor_stripe_account_id', vendorAccountId)
        .eq('status', 'active')
        .order('placed_at', { ascending: false });
      if (error) throw error;
      setHolds(activeHolds || []);
    } catch (error) {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const getAccountStatusInfo = () => {
    if (!vendorAccount) return null;
    if (!vendorAccount.payouts_enabled) {
      return {
        status: 'setup_required',
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        message: 'Complete account setup to enable payouts',
      };
    }
    if (holds.length > 0) {
      return {
        status: 'on_hold',
        icon: Shield,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        message: `Payouts on hold: ${holds[0].reason}`,
      };
    }
    return {
      status: 'active',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      message: 'Payouts active and processing normally',
    };
  };
  if (loading) {
    return (
      <VendorDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading payout management...</span>
        </div>
      </VendorDashboardLayout>
    );
  }
  if (!vendorAccount) {
    return (
      <VendorDashboardLayout>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
            <p className="text-gray-600 mb-6">
              You need to complete your Stripe Connect setup before accessing payout management.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </VendorDashboardLayout>
    );
  }
  const statusInfo = getAccountStatusInfo();
  return (
    <VendorDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-600">Manage your earnings and payout preferences</p>
        </div>
        {/* Account Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className={`flex items-center justify-between p-4 rounded-lg ${statusInfo.bgColor}`}>
              <div className="flex items-center">
                <statusInfo.icon className={`h-6 w-6 ${statusInfo.color} mr-3`} />
                <div>
                  <p className="font-medium text-gray-900">Account Status</p>
                  <p className={`text-sm ${statusInfo.color}`}>{statusInfo.message}</p>
                </div>
              </div>
              <Badge
                variant={statusInfo.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {statusInfo.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
        {/* Quick Stats */}
        {payoutStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatAmount(payoutStatus.pendingAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payoutStatus.pendingCount} payment{payoutStatus.pendingCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Next Payout</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {payoutStatus.nextScheduled
                        ? formatDate(payoutStatus.nextScheduled.next_execution)
                        : 'Not scheduled'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {payoutStatus.nextScheduled?.schedule_interval || 'Manual'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Last Payout</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {payoutStatus.lastPayout
                        ? formatAmount(payoutStatus.lastPayout.amount)
                        : 'None yet'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {payoutStatus.lastPayout
                        ? formatDate(payoutStatus.lastPayout.created_at)
                        : 'No payouts processed'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-amber-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {holds.length > 0 ? 'On Hold' : 'Active'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {holds.length > 0 ? `${holds.length} active hold${holds.length > 1 ? 's' : ''}` : 'Processing normally'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Active Holds Warning */}
        {holds.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-amber-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">
                    Payout Hold Active
                  </h3>
                  {holds.map((hold) => (
                    <div key={hold.id} className="mb-2">
                      <p className="text-amber-700 font-medium">{hold.reason}</p>
                      <p className="text-sm text-amber-600">{hold.description}</p>
                      <p className="text-xs text-amber-600">
                        Placed on {formatDate(hold.placed_at)}
                        {hold.release_date && ` • Scheduled release: ${formatDate(hold.release_date)}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <PayoutDashboard vendorStripeAccountId={vendorAccount.id} />
          </TabsContent>
          <TabsContent value="preferences">
            <PayoutPreferences
              vendorStripeAccountId={vendorAccount.id}
              onUpdate={() => {
                // Refresh data when preferences are updated
                loadVendorAccount();
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </VendorDashboardLayout>
  );
};
export default PayoutManagementPage;
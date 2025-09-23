/**
 * Vendor Payout Dashboard Component
 * Comprehensive payout reporting and reconciliation interface
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { payoutProcessingService } from '../../services/payout-processing-service';
import PaymentReconciliationDashboard from './PaymentReconciliationDashboard';
import PaymentAuditTrail from './PaymentAuditTrail';
const PayoutDashboard = ({ vendorStripeAccountId }) => {
  const [statistics, setStatistics] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [filters, setFilters] = useState({
    period: '30',
    status: 'all',
  });
  useEffect(() => {
    loadDashboardData();
  }, [vendorStripeAccountId, filters]);
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStatistics(),
        loadPayoutHistory(),
        loadPendingPayments(),
      ]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const loadStatistics = async () => {
    try {
      const stats = await payoutProcessingService.getPayoutStatistics(vendorStripeAccountId);
      setStatistics(stats);
    } catch (error) {
    }
  };
  const loadPayoutHistory = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.period));
      const options = {
        limit: 100,
        startDate: startDate.toISOString(),
        status: filters.status === 'all' ? null : filters.status,
      };
      const history = await payoutProcessingService.getPayoutHistory(vendorStripeAccountId, options);
      setPayoutHistory(history);
    } catch (error) {
    }
  };
  const loadPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_payments')
        .select(`
          id,
          booking_id,
          amount,
          net_amount,
          platform_fee_amount,
          currency,
          created_at,
          bookings (
            id,
            adventure_title
          )
        `)
        .eq('vendor_stripe_account_id', vendorStripeAccountId)
        .eq('status', 'completed')
        .in('payout_status', ['pending', 'eligible'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
    }
  };
  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };
  const requestManualPayout = async () => {
    try {
      const result = await payoutProcessingService.processVendorPayout({
        vendorStripeAccountId,
        amount: statistics.pendingAmount,
        currency: 'usd',
        description: 'Manual payout request',
      });
      if (result.success) {
        alert('Payout request submitted successfully!');
        await refreshData();
      } else {
        alert(`Payout failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to request payout. Please try again.');
    }
  };
  const exportPayoutData = async (format = 'csv') => {
    try {
      const data = payoutHistory.map(payout => ({
        date: new Date(payout.created_at).toLocaleDateString(),
        amount: payout.amount / 100,
        platform_fee: (payout.platform_fee_amount || 0) / 100,
        net_amount: (payout.amount - (payout.platform_fee_amount || 0)) / 100,
        status: payout.status,
        arrival_date: payout.arrival_date || 'N/A',
        booking_count: payout.booking_count || 0,
      }));
      if (format === 'csv') {
        const csv = [
          Object.keys(data[0]).join(','),
          ...data.map(row => Object.values(row).join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to export data. Please try again.');
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
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusBadge = (status) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      in_transit: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading payout dashboard...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payout Dashboard</h2>
          <p className="text-gray-600">Track your payouts and earnings</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => exportPayoutData('csv')}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(statistics?.totalAmount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(statistics?.pendingAmount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics?.totalPayouts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowDownRight className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(statistics?.totalFees || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions */}
      {statistics?.pendingAmount > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pending Earnings</h3>
                <p className="text-gray-600">
                  You have {formatAmount(statistics.pendingAmount)} ready for payout
                </p>
              </div>
              <Button
                onClick={requestManualPayout}
                className="flex items-center"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="history">Payout History</TabsTrigger>
            <TabsTrigger value="pending">Pending Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payoutHistory.length > 0 ? (
                <div className="space-y-4">
                  {payoutHistory.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedPayout(payout)}
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(payout.status)}
                        <div>
                          <p className="font-semibold">{formatAmount(payout.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payout.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Fee: {formatAmount(payout.platform_fee_amount || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payout.booking_count} booking{payout.booking_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {getStatusBadge(payout.status)}
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payouts found for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length > 0 ? (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{formatAmount(payment.net_amount)}</p>
                        <p className="text-sm text-gray-600">
                          {payment.bookings?.adventure_title || `Booking ${payment.booking_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          Gross: {formatAmount(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fee: {formatAmount(payment.platform_fee_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Pending:</span>
                      <span>{formatAmount(pendingPayments.reduce((sum, p) => sum + p.net_amount, 0))}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending payments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {statistics?.statusBreakdown ? (
                  <div className="space-y-3">
                    {Object.entries(statistics.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <span className="ml-2 capitalize">{status}</span>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No payout data available</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Payout:</span>
                    <span className="font-semibold">
                      {formatAmount(statistics?.averagePayoutAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fees Paid:</span>
                    <span className="font-semibold">
                      {formatAmount(statistics?.totalFees || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Earnings:</span>
                    <span className="font-semibold text-green-600">
                      {formatAmount((statistics?.totalAmount || 0) - (statistics?.totalFees || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {/* Payout Detail Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Payout Details
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPayout(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-lg font-semibold">{formatAmount(selectedPayout.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedPayout.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p>{formatDate(selectedPayout.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Arrival Date</label>
                  <p>{selectedPayout.arrival_date || 'N/A'}</p>
                </div>
              </div>
              {selectedPayout.payout_line_items && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Included Bookings ({selectedPayout.payout_line_items.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedPayout.payout_line_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>Booking {item.booking_id}</span>
                        <span>{formatAmount(item.net_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default PayoutDashboard;
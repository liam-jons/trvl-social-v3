/**
 * Payment Audit Trail Component
 * Displays comprehensive audit trail for payment modifications and reconciliation actions
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Calendar,
  User,
  Edit,
  Eye,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Filter,
  Search,
  Download,
  ArrowRight,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
const PaymentAuditTrail = ({ paymentId, vendorStripeAccountId }) => {
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    dateRange: '30',
    performedBy: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  useEffect(() => {
    loadAuditTrail();
  }, [paymentId, vendorStripeAccountId, filters]);
  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payment_audit_trail')
        .select(`
          *,
          booking_payments (
            id,
            booking_id,
            amount,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      // Filter by specific payment or all payments for vendor
      if (paymentId) {
        query = query.eq('payment_id', paymentId);
      } else if (vendorStripeAccountId) {
        // Get all payments for this vendor first
        const { data: vendorPayments } = await supabase
          .from('booking_payments')
          .select('id')
          .eq('vendor_stripe_account_id', vendorStripeAccountId);
        if (vendorPayments && vendorPayments.length > 0) {
          const paymentIds = vendorPayments.map(p => p.id);
          query = query.in('payment_id', paymentIds);
        } else {
          setAuditEntries([]);
          setLoading(false);
          return;
        }
      }
      // Apply date filter
      if (filters.dateRange !== 'all') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));
        query = query.gte('created_at', startDate.toISOString());
      }
      // Apply action filter
      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }
      // Apply performed_by filter
      if (filters.performedBy !== 'all') {
        query = query.eq('performed_by', filters.performedBy);
      }
      const { data, error } = await query;
      if (error) throw error;
      setAuditEntries(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const exportAuditTrail = async (format = 'csv') => {
    try {
      const filteredEntries = filterAuditEntries(auditEntries);
      if (format === 'csv') {
        const headers = [
          'Timestamp',
          'Action',
          'Payment ID',
          'Performed By',
          'IP Address',
          'User Agent',
          'Previous Values',
          'New Values',
        ];
        const rows = filteredEntries.map(entry => [
          new Date(entry.created_at).toISOString(),
          entry.action,
          entry.payment_id,
          entry.performed_by,
          entry.ip_address || 'N/A',
          entry.user_agent || 'N/A',
          JSON.stringify(entry.previous_values || {}),
          JSON.stringify(entry.new_values || {}),
        ]);
        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to export audit trail. Please try again.');
    }
  };
  const filterAuditEntries = (entries) => {
    return entries.filter(entry => {
      const matchesSearch = !searchTerm ||
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.payment_id && entry.payment_id.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  };
  const getActionIcon = (action) => {
    switch (action) {
      case 'payment_created':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'payment_updated':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'payment_refunded':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reconciliation_matched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'discrepancy_detected':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'discrepancy_resolved':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'payout_processed':
        return <ArrowRight className="h-4 w-4 text-purple-500" />;
      case 'status_changed':
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  const getActionBadge = (action) => {
    const variants = {
      payment_created: 'default',
      payment_updated: 'secondary',
      payment_refunded: 'destructive',
      reconciliation_matched: 'default',
      discrepancy_detected: 'secondary',
      discrepancy_resolved: 'default',
      payout_processed: 'secondary',
      status_changed: 'outline',
    };
    return variants[action] || 'outline';
  };
  const getUserAgentInfo = (userAgent) => {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown', icon: Globe };
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    let device = 'Unknown';
    let icon = Globe;
    if (isDesktop) {
      device = 'Desktop';
      icon = Monitor;
    } else if (isTablet) {
      device = 'Tablet';
      icon = Smartphone;
    } else if (isMobile) {
      device = 'Mobile';
      icon = Smartphone;
    }
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    return { device, browser, icon };
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  const renderValueChange = (previous, current, key) => {
    if (previous === current) return null;
    const isAmount = key.includes('amount') || key === 'amount';
    const formatValue = isAmount ? formatAmount : (val) => String(val);
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-500">{key}:</span>
        {previous && (
          <>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
              {formatValue(previous)}
            </span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
          </>
        )}
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
          {formatValue(current)}
        </span>
      </div>
    );
  };
  const filteredEntries = filterAuditEntries(auditEntries);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading audit trail...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Audit Trail</h3>
          <p className="text-gray-600">
            {paymentId ? 'Activity for specific payment' : 'All payment activities'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={loadAuditTrail}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => exportAuditTrail('csv')}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audit entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Actions</option>
              <option value="payment_created">Payment Created</option>
              <option value="payment_updated">Payment Updated</option>
              <option value="payment_refunded">Payment Refunded</option>
              <option value="reconciliation_matched">Reconciliation Matched</option>
              <option value="discrepancy_detected">Discrepancy Detected</option>
              <option value="discrepancy_resolved">Discrepancy Resolved</option>
              <option value="payout_processed">Payout Processed</option>
              <option value="status_changed">Status Changed</option>
            </select>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </CardContent>
      </Card>
      {/* Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const userAgentInfo = getUserAgentInfo(entry.user_agent);
                const UserAgentIcon = userAgentInfo.icon;
                return (
                  <div
                    key={entry.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getActionBadge(entry.action)}>
                          {entry.action.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          by {entry.performed_by}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <UserAgentIcon className="h-3 w-3" />
                          <span>{userAgentInfo.device}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Payment ID: {entry.payment_id}
                        {entry.booking_payments && (
                          <span className="ml-2">
                            (Booking {entry.booking_payments.booking_id})
                          </span>
                        )}
                      </p>
                      {/* Show key changes */}
                      {entry.previous_values && entry.new_values && (
                        <div className="space-y-1 mb-2">
                          {Object.keys(entry.new_values).slice(0, 3).map((key) =>
                            renderValueChange(
                              entry.previous_values[key],
                              entry.new_values[key],
                              key
                            )
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(entry.created_at)}</span>
                        <div className="flex items-center space-x-2">
                          {entry.ip_address && (
                            <span>IP: {entry.ip_address}</span>
                          )}
                          <Eye className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit entries found</p>
              <p className="text-sm text-gray-500">
                {searchTerm || filters.action !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Payment activities will appear here as they occur'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Audit Entry Details
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntry(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <div className="mt-1">
                    <Badge variant={getActionBadge(selectedEntry.action)}>
                      {selectedEntry.action.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Performed By</label>
                  <p className="mt-1">{selectedEntry.performed_by}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="mt-1">{formatDate(selectedEntry.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment ID</label>
                  <p className="mt-1">{selectedEntry.payment_id}</p>
                </div>
              </div>
              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1">{selectedEntry.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 text-xs break-all">
                    {selectedEntry.user_agent || 'N/A'}
                  </p>
                </div>
              </div>
              {/* Value Changes */}
              {selectedEntry.previous_values && selectedEntry.new_values && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Changes</label>
                  <div className="space-y-2">
                    {Object.keys(selectedEntry.new_values).map((key) => (
                      <div key={key}>
                        {renderValueChange(
                          selectedEntry.previous_values[key],
                          selectedEntry.new_values[key],
                          key
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Metadata */}
              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Metadata</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default PaymentAuditTrail;
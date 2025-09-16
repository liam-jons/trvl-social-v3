/**
 * Payment Reconciliation Dashboard Component
 * Comprehensive payment reconciliation interface with transaction matching, discrepancy detection, and audit trails
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  Filter,
  Search,
  ArrowUpDown,
  FileText,
  Activity,
  Shield,
  AlertCircle,
  Settings,
  BarChart3,
  PieChart,
  Users,
  Zap,
} from 'lucide-react';
import { paymentReconciliationService } from '../../services/payment-reconciliation-service';

const PaymentReconciliationDashboard = ({ vendorStripeAccountId }) => {
  const [reconciliationData, setReconciliationData] = useState(null);
  const [reconciliationHistory, setReconciliationHistory] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    dateRange: '30',
    status: 'all',
    severity: 'all',
    type: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadDashboardData();
  }, [vendorStripeAccountId, filters]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLatestReconciliation(),
        loadReconciliationHistory(),
        loadActiveDiscrepancies(),
      ]);
    } catch (error) {
      console.error('Failed to load reconciliation dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestReconciliation = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));

      const result = await paymentReconciliationService.performFullReconciliation({
        startDate,
        endDate,
        vendorAccountId: vendorStripeAccountId,
      });

      setReconciliationData(result);
    } catch (error) {
      console.error('Failed to load latest reconciliation:', error);
    }
  };

  const loadReconciliationHistory = async () => {
    try {
      const history = await paymentReconciliationService.getReconciliationHistory({
        vendorAccountId: vendorStripeAccountId,
        limit: 20,
      });
      setReconciliationHistory(history);
    } catch (error) {
      console.error('Failed to load reconciliation history:', error);
    }
  };

  const loadActiveDiscrepancies = async () => {
    try {
      // This would load unresolved discrepancies
      // For now, use the discrepancies from the latest reconciliation
      if (reconciliationData?.discrepancies) {
        setDiscrepancies(reconciliationData.discrepancies);
      }
    } catch (error) {
      console.error('Failed to load active discrepancies:', error);
    }
  };

  const runFullReconciliation = async () => {
    setProcessing(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));

      const result = await paymentReconciliationService.performFullReconciliation({
        startDate,
        endDate,
        vendorAccountId: vendorStripeAccountId,
        forceRefresh: true,
      });

      setReconciliationData(result);
      await loadReconciliationHistory();

      // Auto-resolve simple discrepancies
      if (result.reconciliationId) {
        await paymentReconciliationService.autoResolveDiscrepancies(result.reconciliationId);
      }

    } catch (error) {
      console.error('Reconciliation failed:', error);
      alert('Reconciliation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const exportReconciliationReport = async (format = 'csv') => {
    try {
      if (!reconciliationData?.reconciliationId) {
        alert('No reconciliation data to export');
        return;
      }

      const report = await paymentReconciliationService.generateReconciliationReport(
        reconciliationData.reconciliationId,
        format
      );

      if (format === 'csv') {
        const blob = new Blob([report.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reconciliation-${reconciliationData.reconciliationId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const resolveDiscrepancy = async (discrepancyId, resolution) => {
    try {
      await paymentReconciliationService.resolveDiscrepancy(discrepancyId, resolution);
      await loadActiveDiscrepancies();
    } catch (error) {
      console.error('Failed to resolve discrepancy:', error);
      alert('Failed to resolve discrepancy. Please try again.');
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

  const getHealthScoreColor = (score) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score) => {
    if (score >= 95) return 'default';
    if (score >= 85) return 'secondary';
    return 'destructive';
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline',
    };
    return variants[severity] || 'outline';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filterDiscrepancies = (discrepancies) => {
    return discrepancies.filter(discrepancy => {
      const matchesSearch = !searchTerm ||
        discrepancy.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filters.severity === 'all' || discrepancy.severity === filters.severity;
      const matchesType = filters.type === 'all' || discrepancy.type === filters.type;

      return matchesSearch && matchesSeverity && matchesType;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading reconciliation dashboard...</span>
      </div>
    );
  }

  const summary = reconciliationData?.summary;
  const filteredDiscrepancies = filterDiscrepancies(discrepancies);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Reconciliation</h2>
          <p className="text-gray-600">
            Comprehensive payment tracking and reconciliation dashboard
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={runFullReconciliation}
            disabled={processing}
            className="flex items-center"
          >
            <Activity className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
            {processing ? 'Reconciling...' : 'Run Reconciliation'}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReconciliationReport('csv')}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthScoreColor(summary?.healthScore || 0)}`}>
                  {summary?.healthScore?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reconciliation Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.reconciliationRate?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Discrepancies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.discrepancySummary?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Amount Variance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(summary?.amountReconciliation?.variance || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="discrepancies">
              Discrepancies ({filteredDiscrepancies.length})
            </TabsTrigger>
            <TabsTrigger value="matching">Transaction Matching</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Reconciliation Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Database Transactions:</span>
                    <span className="font-semibold">{summary?.totalTransactions?.database || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stripe Transactions:</span>
                    <span className="font-semibold">{summary?.totalTransactions?.stripe || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matched:</span>
                    <span className="font-semibold text-green-600">
                      {summary?.matchingResults?.matched || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partial Matches:</span>
                    <span className="font-semibold text-yellow-600">
                      {summary?.matchingResults?.partialMatches || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unmatched:</span>
                    <span className="font-semibold text-red-600">
                      {summary?.matchingResults?.unmatched || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Amount Reconciliation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Database Total:</span>
                    <span className="font-semibold">
                      {formatAmount(summary?.amountReconciliation?.databaseTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stripe Total:</span>
                    <span className="font-semibold">
                      {formatAmount(summary?.amountReconciliation?.stripeTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matched Amount:</span>
                    <span className="font-semibold text-green-600">
                      {formatAmount(summary?.amountReconciliation?.matchedAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Variance:</span>
                    <span className={`font-semibold ${
                      (summary?.amountReconciliation?.variance || 0) === 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatAmount(summary?.amountReconciliation?.variance || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reconciliations</CardTitle>
            </CardHeader>
            <CardContent>
              {reconciliationHistory.length > 0 ? (
                <div className="space-y-4">
                  {reconciliationHistory.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {formatDate(record.created_at)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.total_transactions} transactions, {record.discrepancy_count} discrepancies
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={getHealthScoreBadge(record.health_score)}>
                          {record.health_score.toFixed(1)}%
                        </Badge>
                        <span className="text-sm font-medium">
                          {record.reconciliation_rate.toFixed(1)}% matched
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No reconciliation history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-6">
          {/* Discrepancy Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search discrepancies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Types</option>
                  <option value="amount_mismatch">Amount Mismatch</option>
                  <option value="status_mismatch">Status Mismatch</option>
                  <option value="missing_stripe_record">Missing Stripe</option>
                  <option value="missing_database_record">Missing Database</option>
                  <option value="duplicate_payment">Duplicate</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Discrepancies List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Discrepancies</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDiscrepancies.length > 0 ? (
                <div className="space-y-4">
                  {filteredDiscrepancies.map((discrepancy, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-4">
                        {getSeverityIcon(discrepancy.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="font-semibold">{discrepancy.type.replace(/_/g, ' ').toUpperCase()}</p>
                            <Badge variant={getSeverityBadge(discrepancy.severity)}>
                              {discrepancy.severity}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{discrepancy.description}</p>
                          {discrepancy.dbValue && discrepancy.stripeValue && (
                            <div className="text-sm text-gray-500 space-y-1">
                              <div>Database: {discrepancy.dbValue}</div>
                              <div>Stripe: {discrepancy.stripeValue}</div>
                              {discrepancy.difference && (
                                <div>Difference: {formatAmount(discrepancy.difference)}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // View details logic
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {discrepancy.autoResolvable && (
                          <Button
                            size="sm"
                            onClick={() => resolveDiscrepancy(discrepancy.matchId, {
                              action: 'auto_resolved',
                              notes: 'Auto-resolved by user',
                              resolvedBy: 'user',
                            })}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Auto-Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No discrepancies found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Matching Results</CardTitle>
            </CardHeader>
            <CardContent>
              {reconciliationData?.matchingResults ? (
                <div className="space-y-6">
                  {/* Matching Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {reconciliationData.matchingResults.matched.length}
                      </div>
                      <div className="text-sm text-green-700">Perfect Matches</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {reconciliationData.matchingResults.partialMatches.length}
                      </div>
                      <div className="text-sm text-yellow-700">Partial Matches</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {reconciliationData.matchingResults.unmatched.length}
                      </div>
                      <div className="text-sm text-red-700">Unmatched</div>
                    </div>
                  </div>

                  {/* Sample Matches */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recent Matches</h4>
                    {reconciliationData.matchingResults.matched.slice(0, 5).map((match, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {formatAmount(match.databasePayment.amount)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Booking {match.databasePayment.booking_id}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default">
                              {(match.matchScore * 100).toFixed(0)}% match
                            </Badge>
                            <p className="text-sm text-gray-600">
                              {formatDate(match.databasePayment.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No matching results available</p>
                  <Button onClick={runFullReconciliation} className="mt-4">
                    Run Reconciliation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Audit trail coming soon...</p>
                <p className="text-sm text-gray-500">
                  This will show all payment modifications and reconciliation actions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => exportReconciliationReport('csv')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV Report
                </Button>
                <Button
                  onClick={() => exportReconciliationReport('json')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON Data
                </Button>
                <Button
                  onClick={() => {/* Generate PDF logic */}}
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF Report (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No scheduled reports</p>
                  <Button className="mt-4" variant="outline" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Setup Scheduled Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentReconciliationDashboard;
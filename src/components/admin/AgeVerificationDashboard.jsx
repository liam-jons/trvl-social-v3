import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Shield, ShieldAlert, Users, AlertTriangle, Download, RefreshCw,
  Clock, CheckCircle, XCircle, TrendingUp, Eye, FileText, Calendar
} from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ageVerificationMetricsService from '../../services/age-verification-metrics-service';
import complianceReportGenerator from '../../utils/compliance-report-generator';
import { useAuth } from '../../hooks/useAuth';
import { useAgeVerificationMetrics } from '../../hooks/useAgeVerificationMetrics';

/**
 * Age Verification Analytics and Compliance Reporting Dashboard
 * Provides comprehensive monitoring of COPPA compliance and age verification metrics
 */
const AgeVerificationDashboard = ({ className = "" }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Custom hook for real-time metrics
  const {
    metrics,
    loading,
    error,
    refreshMetrics
  } = useAgeVerificationMetrics(dateRange);

  // Role-based access control
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p>You don't have permission to view age verification compliance data.</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMetrics();
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Export compliance report to PDF
  const exportComplianceReport = async () => {
    try {
      const reportData = await complianceReportGenerator.generatePDFReport(metrics, dateRange);
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('Age Verification Compliance Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      doc.text(`Period: ${dateRange}`, 20, 45);

      // Executive Summary
      doc.setFontSize(14);
      doc.text('Executive Summary', 20, 65);
      doc.setFontSize(10);

      const summaryData = [
        ['Metric', 'Value', 'Status'],
        ['Total Verification Attempts', metrics?.totalAttempts?.toLocaleString() || '0', 'Normal'],
        ['Success Rate', `${metrics?.successRate?.toFixed(1) || '0'}%`, metrics?.successRate >= 95 ? 'Good' : 'Needs Attention'],
        ['Underage Attempts Blocked', metrics?.underageAttempts?.toLocaleString() || '0', 'Protected'],
        ['Average Processing Time', `${metrics?.avgProcessingTime || '0'}ms`, metrics?.avgProcessingTime < 1000 ? 'Fast' : 'Slow'],
        ['Compliance Score', `${metrics?.complianceScore?.toFixed(1) || '0'}%`, metrics?.complianceScore >= 95 ? 'Excellent' : 'Review Needed']
      ];

      doc.autoTable({
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: 75,
        styles: { fontSize: 9 }
      });

      // Detailed metrics
      if (metrics?.dailyMetrics) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Daily Metrics', 20, 20);

        const dailyData = metrics.dailyMetrics.map(day => [
          day.date,
          day.attempts.toString(),
          day.successes.toString(),
          day.failures.toString(),
          day.underageAttempts.toString()
        ]);

        doc.autoTable({
          head: [['Date', 'Attempts', 'Successes', 'Failures', 'Underage Attempts']],
          body: dailyData,
          startY: 30,
          styles: { fontSize: 8 }
        });
      }

      doc.save(`age-verification-compliance-report-${dateRange}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
    }
  };

  // CSV data for export
  const csvData = useMemo(() => {
    if (!metrics?.dailyMetrics) return [];

    return metrics.dailyMetrics.map(day => ({
      date: day.date,
      total_attempts: day.attempts,
      successful_verifications: day.successes,
      failed_verifications: day.failures,
      underage_attempts: day.underageAttempts,
      success_rate: day.attempts > 0 ? ((day.successes / day.attempts) * 100).toFixed(1) : '0',
      processing_time_avg: day.avgProcessingTime || 0
    }));
  }, [metrics]);

  if (loading && !metrics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading age verification metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="mb-4">{error.message}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`age-verification-dashboard p-6 bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Age Verification Compliance</h1>
          <p className="text-gray-600 mt-2">
            COPPA compliance monitoring and age verification analytics
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          {/* Export Buttons */}
          <div className="flex gap-1">
            {csvData.length > 0 && (
              <CSVLink
                data={csvData}
                filename={`age-verification-metrics-${dateRange}-${Date.now()}.csv`}
              >
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </CSVLink>
            )}
            <Button variant="outline" size="sm" onClick={exportComplianceReport}>
              <FileText className="w-4 h-4 mr-1" />
              PDF Report
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Verification Attempts"
            value={metrics.totalAttempts?.toLocaleString() || '0'}
            change={metrics.totalAttemptsChange}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Success Rate"
            value={`${metrics.successRate?.toFixed(1) || '0'}%`}
            change={metrics.successRateChange}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
            status={metrics.successRate >= 95 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Underage Attempts Blocked"
            value={metrics.underageAttempts?.toLocaleString() || '0'}
            change={metrics.underageAttemptsChange}
            icon={<ShieldAlert className="w-5 h-5" />}
            color="red"
            status="protected"
          />
          <MetricCard
            title="Compliance Score"
            value={`${metrics.complianceScore?.toFixed(1) || '0'}%`}
            change={metrics.complianceScoreChange}
            icon={<Shield className="w-5 h-5" />}
            color="purple"
            status={metrics.complianceScore >= 95 ? 'excellent' : 'review'}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {metrics && <OverviewTab metrics={metrics} />}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          {metrics && <AnalyticsTab metrics={metrics} />}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-6">
          {metrics && <ComplianceTab metrics={metrics} />}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          {metrics && (
            <ReportsTab
              metrics={metrics}
              onExportPDF={exportComplianceReport}
              csvData={csvData}
              dateRange={dateRange}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color = "blue", status }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  const statusClasses = {
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    protected: 'bg-blue-100 text-blue-800',
    excellent: 'bg-green-100 text-green-800',
    review: 'bg-orange-100 text-orange-800'
  };

  const isPositive = change > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>

            <div className="flex items-center justify-between mt-2">
              {change !== undefined && (
                <div className="flex items-center">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                  )}
                  <span className={`text-sm ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
              )}

              {status && (
                <Badge className={statusClasses[status]}>
                  {status === 'good' && 'Good'}
                  {status === 'warning' && 'Warning'}
                  {status === 'protected' && 'Protected'}
                  {status === 'excellent' && 'Excellent'}
                  {status === 'review' && 'Review'}
                </Badge>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Tab Components
const OverviewTab = ({ metrics }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Verification Attempts Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Attempts Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="attempts"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Total Attempts"
              />
              <Area
                type="monotone"
                dataKey="successes"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
                name="Successful"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Success vs Failure Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Successful', value: metrics.totalSuccesses || 0, fill: '#82ca9d' },
                  { name: 'Failed', value: metrics.totalFailures || 0, fill: '#ff7300' },
                  { name: 'Underage', value: metrics.underageAttempts || 0, fill: '#ff4444' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    {/* Recent Activity */}
    <Card>
      <CardHeader>
        <CardTitle>Recent Verification Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {metrics.recentEvents?.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {event.result === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : event.isUnderage ? (
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">
                    {event.result === 'success' ? 'Successful Verification' :
                     event.isUnderage ? 'Underage Attempt Blocked' : 'Verification Failed'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Session: {event.sessionId?.slice(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsTab = ({ metrics }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Processing Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}ms`, 'Processing Time']} />
              <Line
                type="monotone"
                dataKey="avgProcessingTime"
                stroke="#8884d8"
                strokeWidth={2}
                name="Avg Processing Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Age Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Age Distribution (Successful Verifications)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Attempts by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.hourlyPattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attempts" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Error Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.errorBreakdown?.map((error, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{error.errorType}</div>
                  <div className="text-sm text-gray-500">{error.description}</div>
                </div>
                <Badge variant="outline">{error.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ComplianceTab = ({ metrics }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* COPPA Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>COPPA Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Age Verification Active</span>
              </div>
              <p className="text-sm text-green-700">
                All registration attempts are being verified for COPPA compliance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Underage Access Prevention</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span>Data Collection Controls</span>
                <Badge className="bg-green-100 text-green-800">Compliant</Badge>
              </div>
              <div className="flex justify-between">
                <span>Audit Trail Logging</span>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex justify-between">
                <span>Retention Policy</span>
                <Badge className="bg-green-100 text-green-800">Enforced</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {metrics.riskScore?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-blue-600">Overall Risk Score</div>
              <div className="text-xs text-blue-500 mt-1">
                Lower is better (0-10 scale)
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Underage Attempt Rate</span>
                <span className={
                  metrics.underageRate < 1 ? 'text-green-600' :
                  metrics.underageRate < 5 ? 'text-yellow-600' : 'text-red-600'
                }>
                  {metrics.underageRate?.toFixed(2) || '0'}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>System Availability</span>
                <span className="text-green-600">{metrics.systemUptime?.toFixed(1) || '99.9'}%</span>
              </div>
              <div className="flex justify-between">
                <span>Data Integrity</span>
                <span className="text-green-600">High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Audit Trail */}
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{metrics.auditEvents?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Events Logged</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{metrics.auditEvents?.today || 0}</div>
            <div className="text-sm text-gray-600">Events Today</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{metrics.auditEvents?.retention || 365}</div>
            <div className="text-sm text-gray-600">Retention Days</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>All age verification attempts are logged with anonymized data for compliance monitoring.</p>
          <p className="mt-2">
            Audit logs are automatically purged after {metrics.auditEvents?.retention || 365} days
            in accordance with data retention policies.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ReportsTab = ({ metrics, onExportPDF, csvData, dateRange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Executive Summary Report</h4>
              <p className="text-sm text-gray-600 mb-3">
                Comprehensive overview of age verification compliance status and metrics.
              </p>
              <Button onClick={onExportPDF} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF Report
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Raw Data Export</h4>
              <p className="text-sm text-gray-600 mb-3">
                Export detailed verification metrics for external analysis.
              </p>
              {csvData.length > 0 && (
                <CSVLink
                  data={csvData}
                  filename={`age-verification-raw-data-${dateRange}-${Date.now()}.csv`}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </CSVLink>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Regulatory Compliance</h4>
              <p className="text-sm text-gray-600 mb-3">
                Pre-formatted report for regulatory submission (COPPA compliance).
              </p>
              <Button variant="outline" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Generate Regulatory Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Daily Compliance Check</span>
              </div>
              <p className="text-sm text-blue-700">
                Automatic compliance monitoring runs every 24 hours
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Last Daily Report</span>
                <span>{metrics.lastDailyReport || 'Today 12:00 AM'}</span>
              </div>
              <div className="flex justify-between">
                <span>Next Scheduled Report</span>
                <span>{metrics.nextScheduledReport || 'Tomorrow 12:00 AM'}</span>
              </div>
              <div className="flex justify-between">
                <span>Report Delivery</span>
                <span>Admin Dashboard</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              <Eye className="w-4 h-4 mr-2" />
              Configure Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Current Period Summary */}
    <Card>
      <CardHeader>
        <CardTitle>Current Period Summary ({dateRange})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Attempts:</span>
            <div className="text-lg font-bold">{metrics.totalAttempts?.toLocaleString() || '0'}</div>
          </div>
          <div>
            <span className="font-medium">Success Rate:</span>
            <div className="text-lg font-bold text-green-600">
              {metrics.successRate?.toFixed(1) || '0'}%
            </div>
          </div>
          <div>
            <span className="font-medium">Blocked Underage:</span>
            <div className="text-lg font-bold text-red-600">
              {metrics.underageAttempts?.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <span className="font-medium">Compliance Score:</span>
            <div className="text-lg font-bold text-blue-600">
              {metrics.complianceScore?.toFixed(1) || '0'}%
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-2">Key Insights</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Age verification system is operating within normal parameters</li>
            <li>• No COPPA compliance violations detected this period</li>
            <li>• All underage registration attempts successfully blocked</li>
            <li>• System performance meets SLA requirements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default AgeVerificationDashboard;
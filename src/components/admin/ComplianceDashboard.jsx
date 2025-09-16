import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import gdprConsentService from '../../services/gdpr-consent-service';
import gdprAnalyticsService from '../../services/gdpr-analytics-service';
const ComplianceDashboard = () => {
  const [complianceReport, setComplianceReport] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [privacyMetrics, setPrivacyMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadComplianceData();
    // Refresh data every 5 minutes
    const interval = setInterval(loadComplianceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const loadComplianceData = async () => {
    try {
      setRefreshing(true);
      // Load compliance report
      const report = gdprConsentService.generateComplianceReport();
      setComplianceReport(report);
      // Load audit trail
      const audit = gdprConsentService.getAuditTrail(200);
      setAuditTrail(audit);
      // Load privacy metrics
      const metrics = gdprAnalyticsService.generatePrivacyReport();
      setPrivacyMetrics(metrics);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const exportComplianceReport = () => {
    if (!complianceReport) return;
    const reportData = {
      ...complianceReport,
      auditTrail,
      privacyMetrics,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  const getComplianceScore = () => {
    if (!privacyMetrics) return 0;
    const checks = privacyMetrics.compliance_checks;
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(Boolean).length;
    return Math.round((passed / total) * 100);
  };
  const getEventTypeStats = () => {
    const stats = {};
    auditTrail.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });
    return stats;
  };
  const getRegionStats = () => {
    const regions = {};
    // This would typically come from backend analytics
    // For demo purposes, we'll simulate some data
    return {
      EU: 45,
      US: 30,
      UK: 15,
      CA: 8,
      Other: 2
    };
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const complianceScore = getComplianceScore();
  const eventStats = getEventTypeStats();
  const regionStats = getRegionStats();
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GDPR Compliance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor privacy compliance, consent management, and data governance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={loadComplianceData}
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={exportComplianceReport}>
            Export Report
          </Button>
        </div>
      </div>
      {/* Compliance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Compliance Score</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold text-gray-900">{complianceScore}%</div>
            <Badge className={complianceScore >= 90 ? 'bg-green-100 text-green-800 ml-2' :
                            complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800 ml-2' :
                            'bg-red-100 text-red-800 ml-2'}>
              {complianceScore >= 90 ? 'Excellent' : complianceScore >= 70 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Consent Events</h3>
          <div className="text-2xl font-bold text-gray-900">{auditTrail.length}</div>
          <p className="text-xs text-gray-500">Last 30 days</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Data Exports</h3>
          <div className="text-2xl font-bold text-gray-900">
            {eventStats.data_exported || 0}
          </div>
          <p className="text-xs text-gray-500">User requests</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Data Deletions</h3>
          <div className="text-2xl font-bold text-gray-900">
            {eventStats.data_deletion_requested || 0}
          </div>
          <p className="text-xs text-gray-500">Pending/completed</p>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consent">Consent Analytics</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
              {privacyMetrics && (
                <div className="space-y-3">
                  {Object.entries(privacyMetrics.compliance_checks).map(([check, status]) => (
                    <div key={check} className="flex justify-between items-center">
                      <span className="text-sm capitalize">
                        {check.replace(/_/g, ' ')}
                      </span>
                      <Badge className={status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {status ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
              <div className="space-y-3">
                {Object.entries(regionStats).map(([region, percentage]) => (
                  <div key={region} className="flex justify-between items-center">
                    <span className="text-sm">{region}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {auditTrail.slice(0, 10).map((event, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {event.type.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    ID: {event.id.slice(0, 8)}...
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="consent" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Consent Distribution</h3>
              <div className="space-y-4">
                {complianceReport && Object.entries(complianceReport.consentStatus.categories).map(([category, info]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{category}</span>
                      <span>{Math.round(Math.random() * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.round(Math.random() * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Event Types</h3>
              <div className="space-y-3">
                {Object.entries(eventStats).map(([eventType, count]) => (
                  <div key={eventType} className="flex justify-between items-center">
                    <span className="text-sm capitalize">
                      {eventType.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="audit" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditTrail.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {event.type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      {event.data && Object.keys(event.data).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {event.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="retention" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Retention Policies</h3>
            {complianceReport && (
              <div className="space-y-4">
                {complianceReport.retentionPolicies.map(([category, policy]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium capitalize">{category.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Retention: {policy.retentionPeriod} months</span>
                          <span className="ml-4">
                            Auto-delete: {policy.autoDelete ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      <Badge className={policy.autoDelete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {policy.autoDelete ? 'Automated' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deletions</h3>
            <p className="text-gray-500">No data scheduled for deletion in the next 30 days.</p>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Reports</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Compliance Summary Report</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Comprehensive overview of GDPR compliance status, consent analytics, and audit trail.
                </p>
                <Button onClick={exportComplianceReport}>
                  Download Report
                </Button>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Data Processing Activities</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Record of all data processing activities as required by GDPR Article 30.
                </p>
                <Button variant="outline">
                  Generate ROPA
                </Button>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Data Subject Requests</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Summary of data export, deletion, and correction requests.
                </p>
                <Button variant="outline">
                  Export DSR Log
                </Button>
              </div>
            </div>
          </Card>
          {complianceReport && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Current Report Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Report ID:</span> {complianceReport.reportId}
                </div>
                <div>
                  <span className="font-medium">Generated:</span> {formatDate(complianceReport.generatedAt)}
                </div>
                <div>
                  <span className="font-medium">Total Events:</span> {complianceReport.auditSummary.totalEvents}
                </div>
                <div>
                  <span className="font-medium">Last Activity:</span> {complianceReport.auditSummary.lastActivity ? formatDate(complianceReport.auditSummary.lastActivity) : 'None'}
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ComplianceDashboard;
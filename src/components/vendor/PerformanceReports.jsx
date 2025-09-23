import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import vendorPerformanceService from '../../services/vendor-performance-service';
/**
 * Performance Reports Component - Generate and view comprehensive performance reports
 */
const PerformanceReports = ({ vendorId }) => {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [reportConfig, setReportConfig] = useState({
    period: '30',
    includeComparisons: true,
    includeRecommendations: true,
    includeTrends: true,
    format: 'detailed'
  });
  useEffect(() => {
    loadReportHistory();
  }, [vendorId]);
  const loadReportHistory = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would load saved reports from the database
      const savedReports = localStorage.getItem(`vendor-reports-${vendorId}`);
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      const [performanceResult, benchmarkResult, historyResult] = await Promise.all([
        vendorPerformanceService.calculatePerformanceMetrics(vendorId, parseInt(reportConfig.period)),
        vendorPerformanceService.getBenchmarkComparison(vendorId, parseInt(reportConfig.period)),
        vendorPerformanceService.getPerformanceHistory(vendorId, 12)
      ]);
      if (performanceResult.error || benchmarkResult.error) {
        throw new Error('Failed to generate performance report');
      }
      // Generate recommendations if requested
      let recommendations = [];
      if (reportConfig.includeRecommendations) {
        recommendations = await vendorPerformanceService.generateImprovementRecommendations(
          vendorId,
          performanceResult.data,
          benchmarkResult.data
        );
      }
      // Generate alerts
      const alerts = await vendorPerformanceService.checkPerformanceAlerts(vendorId, performanceResult.data);
      const report = {
        id: Date.now().toString(),
        vendorId,
        generatedAt: new Date().toISOString(),
        period: parseInt(reportConfig.period),
        config: { ...reportConfig },
        data: {
          performance: performanceResult.data,
          benchmarks: benchmarkResult.data,
          history: historyResult.data,
          recommendations,
          alerts
        }
      };
      // Save report
      const savedReports = [...reports, report];
      setReports(savedReports);
      localStorage.setItem(`vendor-reports-${vendorId}`, JSON.stringify(savedReports));
      setCurrentReport(report);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };
  const exportReport = (report, format = 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${report.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Generate CSV format for key metrics
      const csvData = generateCSVReport(report);
      const dataBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-metrics-${report.id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };
  const generateCSVReport = (report) => {
    const metrics = report.data.performance.metrics;
    const headers = [
      'Metric',
      'Value',
      'Unit',
      'Benchmark',
      'Status',
      'Period'
    ].join(',');
    const rows = [
      ['Performance Score', report.data.performance.performanceScore, 'Score', '', '', `${report.period} days`],
      ['Customer Rating', metrics.reviews.averageRating.toFixed(2), 'Rating', '4.2', '', ''],
      ['Completion Rate', metrics.bookings.completionRate.toFixed(1), '%', '85', '', ''],
      ['Response Time', metrics.responseTime.averageResponseTime.toFixed(1), 'Hours', '6', '', ''],
      ['Cancellation Rate', metrics.cancellations.cancellationRate.toFixed(1), '%', '8', '', ''],
      ['Total Revenue', metrics.revenue.totalRevenue.toFixed(2), 'USD', '', '', ''],
      ['Total Bookings', metrics.bookings.totalBookings, 'Count', '', '', ''],
      ['Total Reviews', metrics.reviews.totalReviews, 'Count', '', '', '']
    ].map(row => row.join(',')).join('\n');
    return `${headers}\n${rows}`;
  };
  const formatMetric = (value, type) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return value.toFixed(1);
      case 'hours':
        return `${value.toFixed(1)}h`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return Math.round(value).toLocaleString();
    }
  };
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Reports</h2>
          <p className="text-gray-500 mt-1">
            Generate comprehensive performance reports and track your progress over time
          </p>
        </div>
      </div>
      {/* Report Generation */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={reportConfig.period}
              onChange={(e) => setReportConfig({ ...reportConfig, period: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportConfig.format}
              onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="executive">Executive Summary</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Include</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.includeComparisons}
                  onChange={(e) => setReportConfig({ ...reportConfig, includeComparisons: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Benchmarks</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.includeRecommendations}
                  onChange={(e) => setReportConfig({ ...reportConfig, includeRecommendations: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Recommendations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.includeTrends}
                  onChange={(e) => setReportConfig({ ...reportConfig, includeTrends: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Trends</span>
              </label>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={generateReport}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </div>
      </Card>
      {/* Current Report Display */}
      {currentReport && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Performance Report - {new Date(currentReport.generatedAt).toLocaleDateString()}
              </h3>
              <p className="text-gray-500">
                {currentReport.period} day period ending {new Date(currentReport.generatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => exportReport(currentReport, 'json')}
                variant="outline"
                size="sm"
              >
                Export JSON
              </Button>
              <Button
                onClick={() => exportReport(currentReport, 'csv')}
                variant="outline"
                size="sm"
              >
                Export CSV
              </Button>
            </div>
          </div>
          {/* Executive Summary */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Executive Summary</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(currentReport.data.performance.performanceScore)}`}>
                    {currentReport.data.performance.performanceScore}
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatMetric(currentReport.data.performance.metrics.reviews.averageRating, 'rating')}
                  </div>
                  <div className="text-sm text-gray-600">Customer Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatMetric(currentReport.data.performance.metrics.revenue.totalRevenue, 'currency')}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                During the {currentReport.period}-day period, you completed {currentReport.data.performance.metrics.bookings.completedBookings} bookings
                with a {formatMetric(currentReport.data.performance.metrics.bookings.completionRate, 'percentage')} completion rate
                and maintained an average customer rating of {formatMetric(currentReport.data.performance.metrics.reviews.averageRating, 'rating')}.
              </p>
            </div>
          </div>
          {/* Key Metrics */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Key Performance Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600">Booking Completion</div>
                <div className="text-xl font-bold">
                  {formatMetric(currentReport.data.performance.metrics.bookings.completionRate, 'percentage')}
                </div>
                <div className="text-xs text-gray-500">
                  {currentReport.data.performance.metrics.bookings.completedBookings} of {currentReport.data.performance.metrics.bookings.totalBookings} bookings
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600">Response Time</div>
                <div className="text-xl font-bold">
                  {formatMetric(currentReport.data.performance.metrics.responseTime.averageResponseTime, 'hours')}
                </div>
                <div className="text-xs text-gray-500">
                  Average response time
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600">Cancellation Rate</div>
                <div className="text-xl font-bold">
                  {formatMetric(currentReport.data.performance.metrics.cancellations.cancellationRate, 'percentage')}
                </div>
                <div className="text-xs text-gray-500">
                  {currentReport.data.performance.metrics.cancellations.totalCancellations} cancellations
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600">Revenue Growth</div>
                <div className="text-xl font-bold">
                  {formatMetric(currentReport.data.performance.metrics.revenue.growthRate, 'percentage')}
                </div>
                <div className="text-xs text-gray-500">
                  vs previous period
                </div>
              </div>
            </div>
          </div>
          {/* Alerts */}
          {currentReport.data.alerts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Performance Alerts</h4>
              <div className="space-y-2">
                {currentReport.data.alerts.map((alert, index) => (
                  <div key={index} className="bg-red-50 border-l-4 border-red-400 p-3">
                    <div className="flex items-center">
                      <Badge className={alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                        {alert.severity} priority
                      </Badge>
                      <span className="ml-2 text-sm font-medium text-red-800">{alert.message}</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{alert.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Recommendations */}
          {currentReport.config.includeRecommendations && currentReport.data.recommendations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Improvement Recommendations</h4>
              <div className="space-y-4">
                {currentReport.data.recommendations.map((rec, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                      <Badge className={rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                    <div className="text-xs text-gray-500">
                      Impact: {rec.impact} | Effort: {rec.effort} | Timeline: {rec.timeline}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
      {/* Report History */}
      {reports.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report History</h3>
          <div className="space-y-3">
            {reports.slice().reverse().map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(report.generatedAt).toLocaleDateString()} - {report.period} days
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {report.data.performance.performanceScore} |
                    Revenue: {formatMetric(report.data.performance.metrics.revenue.totalRevenue, 'currency')}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentReport(report)}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => exportReport(report, 'json')}
                    variant="outline"
                    size="sm"
                  >
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Error Display */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </Card>
      )}
    </div>
  );
};
export default PerformanceReports;
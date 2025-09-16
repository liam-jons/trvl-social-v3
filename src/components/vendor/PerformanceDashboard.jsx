import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import vendorPerformanceService from '../../services/vendor-performance-service';

/**
 * Comprehensive performance dashboard for vendors
 * Shows KPIs, benchmarks, trends, and improvement recommendations
 */
const PerformanceDashboard = ({ vendorId }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPerformanceData();
  }, [vendorId, timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [performanceResult, benchmarkResult] = await Promise.all([
        vendorPerformanceService.calculatePerformanceMetrics(vendorId, timeRange),
        vendorPerformanceService.getBenchmarkComparison(vendorId, timeRange)
      ]);

      if (performanceResult.error) {
        throw new Error(performanceResult.error);
      }

      if (benchmarkResult.error) {
        throw new Error(benchmarkResult.error);
      }

      setPerformanceData(performanceResult.data);
      setBenchmarkData(benchmarkResult.data);

      // Generate alerts and recommendations
      const alertsData = await vendorPerformanceService.checkPerformanceAlerts(vendorId, performanceResult.data);
      const recommendationsData = await vendorPerformanceService.generateImprovementRecommendations(
        vendorId,
        performanceResult.data,
        benchmarkResult.data
      );

      setAlerts(alertsData);
      setRecommendations(recommendationsData);

    } catch (err) {
      console.error('Load performance data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (status) => {
    const variants = {
      excellent: 'bg-green-100 text-green-800',
      above: 'bg-blue-100 text-blue-800',
      average: 'bg-yellow-100 text-yellow-800',
      below: 'bg-red-100 text-red-800'
    };

    const labels = {
      excellent: 'Excellent',
      above: 'Above Average',
      average: 'Average',
      below: 'Below Average'
    };

    return (
      <Badge className={variants[status] || variants.average}>
        {labels[status] || 'Average'}
      </Badge>
    );
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
        return `$${value.toFixed(2)}`;
      default:
        return value.toFixed(1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Performance Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadPerformanceData}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-500 mt-1">
            Track your key performance indicators and improve your service
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <Button
            onClick={loadPerformanceData}
            variant="outline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-red-800 font-medium">Performance Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-red-800">{alert.message}</div>
                <div className="text-red-600">{alert.recommendation}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overall Performance Score */}
      <Card className="p-6">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(performanceData.performanceScore)}`}>
            {performanceData.performanceScore}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Overall Performance Score</h3>
          <p className="text-gray-500 mt-2">
            Based on customer satisfaction, booking completion, and response times
          </p>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Satisfaction */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Customer Rating</h4>
            {getStatusBadge(benchmarkData?.comparisons.averageRating.status)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetric(performanceData.metrics.reviews.averageRating, 'rating')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {performanceData.metrics.reviews.totalReviews} reviews
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <span>Benchmark: {formatMetric(benchmarkData?.comparisons.averageRating.benchmark, 'rating')}</span>
          </div>
        </Card>

        {/* Booking Completion */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Completion Rate</h4>
            {getStatusBadge(benchmarkData?.comparisons.completionRate.status)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetric(performanceData.metrics.bookings.completionRate, 'percentage')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {performanceData.metrics.bookings.completedBookings} of {performanceData.metrics.bookings.totalBookings} bookings
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <span>Benchmark: {formatMetric(benchmarkData?.comparisons.completionRate.benchmark, 'percentage')}</span>
          </div>
        </Card>

        {/* Response Time */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Response Time</h4>
            {getStatusBadge(benchmarkData?.comparisons.responseTime.status)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetric(performanceData.metrics.responseTime.averageResponseTime, 'hours')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Average response time
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <span>Benchmark: {formatMetric(benchmarkData?.comparisons.responseTime.benchmark, 'hours')}</span>
          </div>
        </Card>

        {/* Revenue Growth */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Revenue</h4>
            <Badge className={performanceData.metrics.revenue.growthRate >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {performanceData.metrics.revenue.growthRate >= 0 ? '+' : ''}{formatMetric(performanceData.metrics.revenue.growthRate, 'percentage')}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetric(performanceData.metrics.revenue.totalRevenue, 'currency')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Last {timeRange} days
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <span>Avg booking: {formatMetric(performanceData.metrics.revenue.averageBookingValue, 'currency')}</span>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Bookings</span>
              <span className="font-medium">{performanceData.metrics.bookings.totalBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmed Bookings</span>
              <span className="font-medium">{performanceData.metrics.bookings.confirmedBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Bookings</span>
              <span className="font-medium">{performanceData.metrics.bookings.completedBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cancelled Bookings</span>
              <span className="font-medium text-red-600">{performanceData.metrics.bookings.cancelledBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Booking Velocity</span>
              <span className="font-medium">{formatMetric(performanceData.metrics.bookings.bookingVelocity, '')} per day</span>
            </div>
          </div>
        </Card>

        {/* Customer Feedback */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Feedback</h3>
          <div className="space-y-4">
            {performanceData.metrics.reviews.ratingDistribution.map((rating) => (
              <div key={rating.rating} className="flex items-center space-x-3">
                <span className="w-8 text-sm text-gray-600">{rating.rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${rating.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12">{rating.count}</span>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Satisfaction Rate</span>
                <span className="font-medium">{formatMetric(performanceData.metrics.reviews.satisfactionRate, 'percentage')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Improvement Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Improvement Recommendations</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <Badge className={rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                <div className="space-y-1">
                  {rec.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{action}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                  <span>Impact: {rec.impact}</span>
                  <span>Effort: {rec.effort}</span>
                  <span>Timeline: {rec.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard;
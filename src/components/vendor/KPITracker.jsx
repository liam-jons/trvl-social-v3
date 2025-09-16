import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import vendorPerformanceService from '../../services/vendor-performance-service';

/**
 * KPI Tracker Component - Detailed performance metrics with trends and goals
 */
const KPITracker = ({ vendorId }) => {
  const [kpiData, setKpiData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('overall');

  useEffect(() => {
    loadKPIData();
  }, [vendorId]);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [currentResult, historyResult] = await Promise.all([
        vendorPerformanceService.calculatePerformanceMetrics(vendorId, 30),
        vendorPerformanceService.getPerformanceHistory(vendorId, 6)
      ]);

      if (currentResult.error) {
        throw new Error(currentResult.error);
      }

      setKpiData(currentResult.data);
      setHistoricalData(historyResult.data);

      // Load saved goals
      const savedGoals = localStorage.getItem(`vendor-goals-${vendorId}`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }

    } catch (err) {
      console.error('Load KPI data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = (metric, value) => {
    const newGoals = { ...goals, [metric]: value };
    setGoals(newGoals);
    localStorage.setItem(`vendor-goals-${vendorId}`, JSON.stringify(newGoals));
  };

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const getTrendIcon = (trend) => {
    if (!trend) return null;

    const icons = {
      up: (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 0H7" />
        </svg>
      ),
      down: (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0 0h10" />
        </svg>
      ),
      stable: (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      )
    };

    return icons[trend];
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return value.toFixed(1);
      case 'hours':
        return `${value.toFixed(1)}h`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'days':
        return `${value.toFixed(1)} days`;
      default:
        return Math.round(value).toLocaleString();
    }
  };

  const kpiMetrics = [
    {
      id: 'performance_score',
      name: 'Overall Score',
      value: kpiData?.performanceScore || 0,
      goal: goals.performance_score || 85,
      type: 'number',
      icon: '🎯',
      description: 'Overall performance rating'
    },
    {
      id: 'customer_rating',
      name: 'Customer Rating',
      value: kpiData?.metrics.reviews.averageRating || 0,
      goal: goals.customer_rating || 4.5,
      type: 'rating',
      icon: '⭐',
      description: 'Average customer rating'
    },
    {
      id: 'completion_rate',
      name: 'Completion Rate',
      value: kpiData?.metrics.bookings.completionRate || 0,
      goal: goals.completion_rate || 90,
      type: 'percentage',
      icon: '✅',
      description: 'Booking completion percentage'
    },
    {
      id: 'response_time',
      name: 'Response Time',
      value: kpiData?.metrics.responseTime.averageResponseTime || 0,
      goal: goals.response_time || 4,
      type: 'hours',
      icon: '⚡',
      description: 'Average response time to inquiries',
      reverse: true // Lower is better
    },
    {
      id: 'cancellation_rate',
      name: 'Cancellation Rate',
      value: kpiData?.metrics.cancellations.cancellationRate || 0,
      goal: goals.cancellation_rate || 5,
      type: 'percentage',
      icon: '❌',
      description: 'Percentage of cancelled bookings',
      reverse: true // Lower is better
    },
    {
      id: 'monthly_revenue',
      name: 'Monthly Revenue',
      value: kpiData?.metrics.revenue.totalRevenue || 0,
      goal: goals.monthly_revenue || 5000,
      type: 'currency',
      icon: '💰',
      description: 'Total revenue this month'
    },
    {
      id: 'booking_velocity',
      name: 'Booking Velocity',
      value: kpiData?.metrics.bookings.bookingVelocity || 0,
      goal: goals.booking_velocity || 3,
      type: 'number',
      icon: '📈',
      description: 'Bookings per day'
    },
    {
      id: 'satisfaction_rate',
      name: 'Satisfaction Rate',
      value: kpiData?.metrics.reviews.satisfactionRate || 0,
      goal: goals.satisfaction_rate || 85,
      type: 'percentage',
      icon: '😊',
      description: 'Customer satisfaction percentage'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading KPI Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadKPIData}>
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
          <h2 className="text-2xl font-bold text-gray-900">KPI Tracker</h2>
          <p className="text-gray-500 mt-1">
            Monitor your key performance indicators and track progress towards goals
          </p>
        </div>
        <Button onClick={loadKPIData} variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((metric) => {
          const progress = metric.reverse
            ? Math.max(0, 100 - calculateProgress(metric.value, metric.goal))
            : calculateProgress(metric.value, metric.goal);

          const isOnTrack = metric.reverse
            ? metric.value <= metric.goal
            : metric.value >= metric.goal;

          return (
            <Card key={metric.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{metric.icon}</span>
                  <h3 className="font-medium text-gray-900 text-sm">{metric.name}</h3>
                </div>
                {historicalData?.trends && getTrendIcon(historicalData.trends.performanceScore?.trend)}
              </div>

              <div className="space-y-3">
                {/* Current Value */}
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.type)}
                  </span>
                  <Badge className={isOnTrack ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {isOnTrack ? 'On Track' : 'Behind'}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isOnTrack ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Goal */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Goal: {formatValue(metric.goal, metric.type)}</span>
                  <button
                    onClick={() => {
                      const newGoal = prompt(`Set new goal for ${metric.name}:`, metric.goal);
                      if (newGoal && !isNaN(newGoal)) {
                        updateGoal(metric.id, parseFloat(newGoal));
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400">{metric.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Historical Performance Chart */}
      {historicalData?.snapshots && historicalData.snapshots.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-4">
            {/* Simple trend visualization */}
            <div className="h-48 flex items-end space-x-1">
              {historicalData.snapshots.map((snapshot, index) => {
                const height = (snapshot.performance_score / 100) * 100; // Convert to percentage of container
                return (
                  <div
                    key={index}
                    className="bg-blue-500 min-w-0 flex-1 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${snapshot.performance_score} - ${new Date(snapshot.created_at).toLocaleDateString()}`}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{new Date(historicalData.snapshots[0].created_at).toLocaleDateString()}</span>
              <span>{new Date(historicalData.snapshots[historicalData.snapshots.length - 1].created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Goal Setting Guide */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-4">💡 Goal Setting Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">SMART Goals</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Specific and measurable</li>
              <li>• Achievable and realistic</li>
              <li>• Time-bound with deadlines</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Benchmark Targets</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Customer Rating: 4.5+</li>
              <li>• Completion Rate: 90%+</li>
              <li>• Response Time: <4 hours</li>
              <li>• Cancellation Rate: <5%</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KPITracker;
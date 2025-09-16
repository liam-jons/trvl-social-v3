import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Activity, Clock, Users, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

/**
 * Algorithm Monitoring Dashboard
 * Real-time monitoring and analytics for group compatibility algorithms
 */

const AlgorithmMonitoringDashboard = ({
  metricsData = [],
  onRefresh,
  realTimeUpdates = true,
  className = ""
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [alertThreshold, setAlertThreshold] = useState({
    processingTime: 2000,
    compatibility: 70,
    errorRate: 5
  });

  // Mock real-time data - in production this would come from props or context
  const [liveMetrics, setLiveMetrics] = useState(() => generateMockMetrics());

  useEffect(() => {
    if (realTimeUpdates) {
      const interval = setInterval(() => {
        setLiveMetrics(prev => [...prev.slice(-50), generateLatestMetric()]);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [realTimeUpdates]);

  // Computed metrics
  const computedMetrics = useMemo(() => {
    const recent = liveMetrics.slice(-20);

    const avgProcessingTime = recent.reduce((sum, m) => sum + m.processingTimeMs, 0) / recent.length;
    const avgCompatibility = recent.reduce((sum, m) => sum + m.avgCompatibility, 0) / recent.length;
    const totalParticipants = recent.reduce((sum, m) => sum + m.participantCount, 0);
    const errorRate = (recent.filter(m => m.hasError).length / recent.length) * 100;

    const throughput = totalParticipants / (avgProcessingTime / 1000);

    return {
      avgProcessingTime: Math.round(avgProcessingTime),
      avgCompatibility: Math.round(avgCompatibility),
      totalParticipants,
      errorRate: Math.round(errorRate * 10) / 10,
      throughput: Math.round(throughput),
      alertCount: getActiveAlerts(recent, alertThreshold).length
    };
  }, [liveMetrics, alertThreshold]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className={`algorithm-monitoring-dashboard p-6 bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Algorithm Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time performance analytics for group compatibility algorithms</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Avg Processing Time"
          value={`${computedMetrics.avgProcessingTime}ms`}
          trend={getTrend(liveMetrics, 'processingTimeMs', -1)} // Lower is better
          threshold={alertThreshold.processingTime}
          currentValue={computedMetrics.avgProcessingTime}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          title="Avg Compatibility"
          value={`${computedMetrics.avgCompatibility}%`}
          trend={getTrend(liveMetrics, 'avgCompatibility', 1)} // Higher is better
          threshold={alertThreshold.compatibility}
          currentValue={computedMetrics.avgCompatibility}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Throughput"
          value={`${computedMetrics.throughput}/s`}
          trend={getTrend(liveMetrics, 'throughput', 1)}
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="Error Rate"
          value={`${computedMetrics.errorRate}%`}
          trend={getTrend(liveMetrics, 'errorRate', -1)}
          threshold={alertThreshold.errorRate}
          currentValue={computedMetrics.errorRate}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Alert Banner */}
      {computedMetrics.alertCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              {computedMetrics.alertCount} active alert{computedMetrics.alertCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="mt-2 text-sm text-red-600">
            Performance metrics are outside acceptable thresholds
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Processing Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={liveMetrics.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip labelFormatter={formatTooltipTime} />
                    <Line type="monotone" dataKey="processingTimeMs" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compatibility Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Compatibility Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getCompatibilityDistribution(liveMetrics)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Metric Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={liveMetrics.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip labelFormatter={formatTooltipTime} />
                    <Legend />
                    <Line type="monotone" dataKey="processingTimeMs" stroke="#8884d8" name="Processing Time (ms)" />
                    <Line type="monotone" dataKey="avgCompatibility" stroke="#82ca9d" name="Compatibility %" />
                    <Line type="monotone" dataKey="participantCount" stroke="#ffc658" name="Participant Count" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Throughput Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Throughput Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {computedMetrics.throughput}
                    </div>
                    <div className="text-sm text-blue-600">Participants/Second</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {computedMetrics.totalParticipants}
                    </div>
                    <div className="text-sm text-green-600">Total Processed</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={liveMetrics.slice(-15).map(m => ({
                    ...m,
                    throughput: m.participantCount / (m.processingTimeMs / 1000)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="throughput" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="algorithms" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Algorithm Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getAlgorithmComparison(liveMetrics)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="algorithm" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgProcessingTime" fill="#8884d8" name="Avg Processing Time (ms)" />
                    <Bar dataKey="avgCompatibility" fill="#82ca9d" name="Avg Compatibility %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Algorithm Usage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getAlgorithmUsage(liveMetrics)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAlgorithmUsage(liveMetrics).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-6">
          <div className="space-y-6">
            {/* Quality Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Compatibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {computedMetrics.avgCompatibility}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Target: ≥ {alertThreshold.compatibility}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conflict Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {getAverageConflicts(liveMetrics).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Avg conflicts per group
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((1 - computedMetrics.errorRate / 100) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Successful optimizations
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quality Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={liveMetrics.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip labelFormatter={formatTooltipTime} />
                    <Legend />
                    <Line type="monotone" dataKey="avgCompatibility" stroke="#82ca9d" name="Compatibility %" />
                    <Line type="monotone" dataKey="balanceScore" stroke="#8884d8" name="Balance Score %" />
                    <Line type="monotone" dataKey="conflictScore" stroke="#ff7300" name="Conflict Score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <AlertsPanel
            alerts={getActiveAlerts(liveMetrics, alertThreshold)}
            threshold={alertThreshold}
            onThresholdChange={setAlertThreshold}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, trend, threshold, currentValue, icon }) => {
  const isAlert = threshold && currentValue && (
    (title.includes('Time') && currentValue > threshold) ||
    (title.includes('Compatibility') && currentValue < threshold) ||
    (title.includes('Error') && currentValue > threshold)
  );

  return (
    <Card className={`${isAlert ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${isAlert ? 'text-red-700' : 'text-gray-900'}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-full ${isAlert ? 'bg-red-100' : 'bg-blue-100'}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center">
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ml-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Alerts Panel Component
const AlertsPanel = ({ alerts, threshold, onThresholdChange }) => {
  return (
    <div className="space-y-6">
      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Processing Time (ms)
              </label>
              <input
                type="number"
                value={threshold.processingTime}
                onChange={(e) => onThresholdChange({
                  ...threshold,
                  processingTime: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Compatibility (%)
              </label>
              <input
                type="number"
                value={threshold.compatibility}
                onChange={(e) => onThresholdChange({
                  ...threshold,
                  compatibility: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Error Rate (%)
              </label>
              <input
                type="number"
                value={threshold.errorRate}
                onChange={(e) => onThresholdChange({
                  ...threshold,
                  errorRate: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-red-800">{alert.title}</div>
                    <div className="text-sm text-red-600 mt-1">{alert.description}</div>
                    <Badge variant="destructive" className="mt-2">
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-red-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function generateMockMetrics() {
  const metrics = [];
  const now = new Date();

  for (let i = 60; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 1000);
    metrics.push(generateMetricForTime(timestamp));
  }

  return metrics;
}

function generateLatestMetric() {
  return generateMetricForTime(new Date());
}

function generateMetricForTime(timestamp) {
  const algorithms = ['kmeans', 'hierarchical', 'hybrid'];
  const algorithm = algorithms[Math.floor(Math.random() * algorithms.length)];

  const baseProcessingTime = algorithm === 'hybrid' ? 800 : algorithm === 'hierarchical' ? 600 : 400;
  const baseCompatibility = algorithm === 'hybrid' ? 85 : algorithm === 'hierarchical' ? 78 : 75;

  return {
    timestamp: timestamp.toISOString(),
    algorithm,
    processingTimeMs: baseProcessingTime + Math.random() * 400,
    avgCompatibility: Math.max(50, baseCompatibility + (Math.random() - 0.5) * 20),
    participantCount: 20 + Math.floor(Math.random() * 80),
    groupCount: 3 + Math.floor(Math.random() * 8),
    balanceScore: 70 + Math.random() * 25,
    conflictScore: Math.random() * 5,
    hasError: Math.random() < 0.02 // 2% error rate
  };
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTooltipTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function getTrend(data, field, direction = 1) {
  if (data.length < 10) return null;

  const recent = data.slice(-10);
  const older = data.slice(-20, -10);

  const recentAvg = recent.reduce((sum, item) => sum + item[field], 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + item[field], 0) / older.length;

  return ((recentAvg - olderAvg) / olderAvg * 100) * direction;
}

function getCompatibilityDistribution(data) {
  const ranges = [
    { range: '0-20%', min: 0, max: 20, count: 0 },
    { range: '21-40%', min: 21, max: 40, count: 0 },
    { range: '41-60%', min: 41, max: 60, count: 0 },
    { range: '61-80%', min: 61, max: 80, count: 0 },
    { range: '81-100%', min: 81, max: 100, count: 0 }
  ];

  data.forEach(item => {
    const compatibility = item.avgCompatibility;
    const range = ranges.find(r => compatibility >= r.min && compatibility <= r.max);
    if (range) range.count++;
  });

  return ranges;
}

function getAlgorithmComparison(data) {
  const algorithms = ['kmeans', 'hierarchical', 'hybrid'];

  return algorithms.map(algorithm => {
    const algorithmData = data.filter(item => item.algorithm === algorithm);
    if (algorithmData.length === 0) return { algorithm, avgProcessingTime: 0, avgCompatibility: 0 };

    const avgProcessingTime = algorithmData.reduce((sum, item) => sum + item.processingTimeMs, 0) / algorithmData.length;
    const avgCompatibility = algorithmData.reduce((sum, item) => sum + item.avgCompatibility, 0) / algorithmData.length;

    return {
      algorithm,
      avgProcessingTime: Math.round(avgProcessingTime),
      avgCompatibility: Math.round(avgCompatibility)
    };
  });
}

function getAlgorithmUsage(data) {
  const usage = {};

  data.forEach(item => {
    usage[item.algorithm] = (usage[item.algorithm] || 0) + 1;
  });

  return Object.entries(usage).map(([name, value]) => ({ name, value }));
}

function getAverageConflicts(data) {
  return data.reduce((sum, item) => sum + item.conflictScore, 0) / data.length;
}

function getActiveAlerts(data, threshold) {
  const alerts = [];
  const recent = data.slice(-5); // Check last 5 data points

  // Check processing time alerts
  const avgProcessingTime = recent.reduce((sum, item) => sum + item.processingTimeMs, 0) / recent.length;
  if (avgProcessingTime > threshold.processingTime) {
    alerts.push({
      title: 'High Processing Time',
      description: `Average processing time (${Math.round(avgProcessingTime)}ms) exceeds threshold (${threshold.processingTime}ms)`,
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  }

  // Check compatibility alerts
  const avgCompatibility = recent.reduce((sum, item) => sum + item.avgCompatibility, 0) / recent.length;
  if (avgCompatibility < threshold.compatibility) {
    alerts.push({
      title: 'Low Compatibility Score',
      description: `Average compatibility (${Math.round(avgCompatibility)}%) below threshold (${threshold.compatibility}%)`,
      severity: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  // Check error rate alerts
  const errorRate = (recent.filter(item => item.hasError).length / recent.length) * 100;
  if (errorRate > threshold.errorRate) {
    alerts.push({
      title: 'High Error Rate',
      description: `Error rate (${errorRate.toFixed(1)}%) exceeds threshold (${threshold.errorRate}%)`,
      severity: 'critical',
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default AlgorithmMonitoringDashboard;
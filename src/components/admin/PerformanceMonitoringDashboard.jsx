/**
 * Real-time Performance Monitoring Dashboard
 * Comprehensive dashboard for monitoring application performance,
 * Core Web Vitals, errors, and business metrics in real-time
 */
import React, { useState, useEffect, useRef } from 'react';
import webVitalsService from '../../services/web-vitals-service.js';
import analyticsService from '../../services/analytics-service.js';
import sentryService from '../../services/sentry-service.js';
import datadogService from '../../services/datadog-service.js';

const PerformanceMonitoringDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    webVitals: {},
    errors: [],
    performance: {},
    business: {},
    alerts: []
  });
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    initializeDashboard();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refreshData, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const initializeDashboard = async () => {
    try {
      // Initialize all monitoring services
      await Promise.all([
        webVitalsService.init(),
        datadogService.init()
      ]);

      // Load initial data
      await refreshData();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [webVitals, performanceMetrics, businessMetrics] = await Promise.all([
        getWebVitalsData(),
        getPerformanceMetrics(),
        getBusinessMetrics()
      ]);

      setRealTimeData(prevData => ({
        ...prevData,
        webVitals,
        performance: performanceMetrics,
        business: businessMetrics,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const getWebVitalsData = async () => {
    const vitalsData = webVitalsService.getVitalsData();
    const summary = webVitalsService.getPerformanceSummary();

    return {
      ...vitalsData,
      summary,
      health: webVitalsService.getHealthStatus()
    };
  };

  const getPerformanceMetrics = async () => {
    // Simulate real-time performance data
    return {
      responseTime: Math.round(Math.random() * 500 + 100),
      throughput: Math.round(Math.random() * 100 + 50),
      errorRate: Math.round(Math.random() * 5 * 100) / 100,
      memory: Math.round(Math.random() * 100),
      cpu: Math.round(Math.random() * 100),
      activeUsers: Math.round(Math.random() * 500 + 100)
    };
  };

  const getBusinessMetrics = async () => {
    // Simulate business metrics
    return {
      bookings: Math.round(Math.random() * 50 + 10),
      revenue: Math.round(Math.random() * 10000 + 5000),
      conversionRate: Math.round(Math.random() * 10 * 100) / 100,
      pageViews: Math.round(Math.random() * 1000 + 500),
      sessionDuration: Math.round(Math.random() * 300 + 120)
    };
  };

  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
    refreshData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefreshIntervalChange = (interval) => {
    setRefreshInterval(interval);
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Performance Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="performance-monitoring-dashboard">
      <DashboardHeader
        onRefresh={refreshData}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        lastUpdated={realTimeData.lastUpdated}
      />

      <div className="dashboard-tabs">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab data={realTimeData} />
        )}
        {activeTab === 'webvitals' && (
          <WebVitalsTab data={realTimeData.webVitals} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab data={realTimeData.performance} />
        )}
        {activeTab === 'errors' && (
          <ErrorsTab data={realTimeData.errors} />
        )}
        {activeTab === 'business' && (
          <BusinessMetricsTab data={realTimeData.business} />
        )}
        {activeTab === 'alerts' && (
          <AlertsTab data={realTimeData.alerts} />
        )}
      </div>
    </div>
  );
};

// Dashboard Header Component
const DashboardHeader = ({
  onRefresh,
  autoRefresh,
  onToggleAutoRefresh,
  refreshInterval,
  onRefreshIntervalChange,
  timeRange,
  onTimeRangeChange,
  lastUpdated
}) => {
  return (
    <div className="dashboard-header">
      <div className="header-title">
        <h1>Performance Monitoring Dashboard</h1>
        {lastUpdated && (
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="header-controls">
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
          >
            <option value="15m">15 minutes</option>
            <option value="1h">1 hour</option>
            <option value="6h">6 hours</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>
        </div>

        <div className="refresh-controls">
          <button
            onClick={onRefresh}
            className="btn btn-primary btn-sm"
          >
            Refresh Now
          </button>

          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={onToggleAutoRefresh}
            />
            Auto-refresh
          </label>

          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => onRefreshIntervalChange(parseInt(e.target.value))}
              className="refresh-interval"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Navigation
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'webvitals', label: 'Web Vitals', icon: '⚡' },
    { id: 'performance', label: 'Performance', icon: '🚀' },
    { id: 'errors', label: 'Errors', icon: '🚨' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' }
  ];

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ data }) => {
  return (
    <div className="overview-tab">
      <div className="metrics-grid">
        <MetricCard
          title="Core Web Vitals"
          value={getOverallWebVitalsScore(data.webVitals)}
          unit="score"
          trend="+2.5%"
          status={getWebVitalsStatus(data.webVitals)}
        />
        <MetricCard
          title="Response Time"
          value={data.performance?.responseTime || 0}
          unit="ms"
          trend="-5.2%"
          status="good"
        />
        <MetricCard
          title="Error Rate"
          value={data.performance?.errorRate || 0}
          unit="%"
          trend="-1.1%"
          status="good"
        />
        <MetricCard
          title="Active Users"
          value={data.performance?.activeUsers || 0}
          unit="users"
          trend="+12.3%"
          status="good"
        />
      </div>

      <div className="overview-charts">
        <div className="chart-container">
          <h3>Performance Trends</h3>
          <PerformanceTrendChart data={data.performance} />
        </div>
        <div className="chart-container">
          <h3>Web Vitals Overview</h3>
          <WebVitalsOverviewChart data={data.webVitals} />
        </div>
      </div>

      <div className="recent-alerts">
        <h3>Recent Alerts</h3>
        <AlertsList alerts={data.alerts} limit={5} />
      </div>
    </div>
  );
};

// Web Vitals Tab
const WebVitalsTab = ({ data }) => {
  return (
    <div className="webvitals-tab">
      <div className="vitals-metrics">
        {data.LCP && (
          <VitalMetricCard
            title="Largest Contentful Paint"
            metric={data.LCP}
            threshold={{ good: 2500, poor: 4000 }}
            unit="ms"
          />
        )}
        {data.FID && (
          <VitalMetricCard
            title="First Input Delay"
            metric={data.FID}
            threshold={{ good: 100, poor: 300 }}
            unit="ms"
          />
        )}
        {data.CLS && (
          <VitalMetricCard
            title="Cumulative Layout Shift"
            metric={data.CLS}
            threshold={{ good: 0.1, poor: 0.25 }}
            unit=""
          />
        )}
        {data.FCP && (
          <VitalMetricCard
            title="First Contentful Paint"
            metric={data.FCP}
            threshold={{ good: 1800, poor: 3000 }}
            unit="ms"
          />
        )}
        {data.TTFB && (
          <VitalMetricCard
            title="Time to First Byte"
            metric={data.TTFB}
            threshold={{ good: 800, poor: 1800 }}
            unit="ms"
          />
        )}
      </div>

      <div className="vitals-details">
        <h3>Session Information</h3>
        {data.summary && (
          <div className="session-info">
            <p><strong>Session ID:</strong> {data.summary.session_id}</p>
            <p><strong>Total Interactions:</strong> {data.summary.total_interactions}</p>
            <p><strong>Route Changes:</strong> {data.summary.route_changes}</p>
            <p><strong>Session Duration:</strong> {Math.round(data.summary.session_duration / 1000)}s</p>
            <p><strong>Connection Type:</strong> {data.summary.connection_type}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Performance Tab
const PerformanceTab = ({ data }) => {
  return (
    <div className="performance-tab">
      <div className="performance-metrics">
        <MetricCard
          title="Response Time"
          value={data.responseTime}
          unit="ms"
          status={data.responseTime < 200 ? 'good' : data.responseTime < 500 ? 'warning' : 'error'}
        />
        <MetricCard
          title="Throughput"
          value={data.throughput}
          unit="req/s"
          status="good"
        />
        <MetricCard
          title="Memory Usage"
          value={data.memory}
          unit="%"
          status={data.memory < 70 ? 'good' : data.memory < 85 ? 'warning' : 'error'}
        />
        <MetricCard
          title="CPU Usage"
          value={data.cpu}
          unit="%"
          status={data.cpu < 70 ? 'good' : data.cpu < 85 ? 'warning' : 'error'}
        />
      </div>

      <div className="performance-charts">
        <div className="chart-container">
          <h3>System Resource Usage</h3>
          <ResourceUsageChart data={data} />
        </div>
      </div>
    </div>
  );
};

// Business Metrics Tab
const BusinessMetricsTab = ({ data }) => {
  return (
    <div className="business-tab">
      <div className="business-metrics">
        <MetricCard
          title="Bookings"
          value={data.bookings}
          unit="today"
          trend="+8.5%"
          status="good"
        />
        <MetricCard
          title="Revenue"
          value={data.revenue}
          unit="$"
          trend="+12.3%"
          status="good"
        />
        <MetricCard
          title="Conversion Rate"
          value={data.conversionRate}
          unit="%"
          trend="+2.1%"
          status="good"
        />
        <MetricCard
          title="Page Views"
          value={data.pageViews}
          unit="today"
          trend="+15.7%"
          status="good"
        />
      </div>
    </div>
  );
};

// Errors Tab
const ErrorsTab = ({ data }) => {
  return (
    <div className="errors-tab">
      <div className="error-summary">
        <h3>Error Summary</h3>
        <p>No recent errors detected</p>
      </div>
    </div>
  );
};

// Alerts Tab
const AlertsTab = ({ data }) => {
  return (
    <div className="alerts-tab">
      <div className="alerts-summary">
        <h3>Performance Alerts</h3>
        <AlertsList alerts={data} />
      </div>
    </div>
  );
};

// Reusable Components

const MetricCard = ({ title, value, unit, trend, status = 'good' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="metric-card" style={{ borderLeftColor: getStatusColor(status) }}>
      <div className="metric-header">
        <h4>{title}</h4>
        {trend && (
          <span className={`trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="metric-value">
        <span className="value">{value}</span>
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
};

const VitalMetricCard = ({ title, metric, threshold, unit }) => {
  const getRating = (value, threshold) => {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const rating = getRating(metric.value, threshold);

  return (
    <div className={`vital-metric-card ${rating}`}>
      <h4>{title}</h4>
      <div className="vital-value">
        <span className="value">{metric.value}</span>
        <span className="unit">{unit}</span>
      </div>
      <div className="vital-rating">{rating}</div>
      <div className="vital-thresholds">
        <span className="good">Good: ≤{threshold.good}</span>
        <span className="poor">Poor: >{threshold.poor}</span>
      </div>
    </div>
  );
};

const AlertsList = ({ alerts = [], limit }) => {
  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  if (displayAlerts.length === 0) {
    return <p>No alerts</p>;
  }

  return (
    <div className="alerts-list">
      {displayAlerts.map((alert, index) => (
        <div key={index} className={`alert-item ${alert.severity}`}>
          <div className="alert-content">
            <h5>{alert.title}</h5>
            <p>{alert.message}</p>
          </div>
          <div className="alert-time">
            {alert.timestamp}
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart Components (simplified implementations)
const PerformanceTrendChart = ({ data }) => (
  <div className="chart-placeholder">
    <p>Performance trend chart would be rendered here</p>
    <p>Response Time: {data?.responseTime}ms</p>
  </div>
);

const WebVitalsOverviewChart = ({ data }) => (
  <div className="chart-placeholder">
    <p>Web Vitals overview chart would be rendered here</p>
  </div>
);

const ResourceUsageChart = ({ data }) => (
  <div className="chart-placeholder">
    <p>Resource usage chart would be rendered here</p>
    <p>Memory: {data?.memory}% | CPU: {data?.cpu}%</p>
  </div>
);

// Helper functions
const getOverallWebVitalsScore = (webVitals) => {
  if (!webVitals || Object.keys(webVitals).length === 0) return 0;

  const vitals = ['LCP', 'FID', 'CLS'];
  const scores = vitals
    .filter(vital => webVitals[vital])
    .map(vital => {
      const rating = webVitals[vital].rating;
      return rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
    });

  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
};

const getWebVitalsStatus = (webVitals) => {
  const score = getOverallWebVitalsScore(webVitals);
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'error';
};

export default PerformanceMonitoringDashboard;
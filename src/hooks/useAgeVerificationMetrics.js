import { useState, useEffect, useRef, useCallback } from 'react';
import ageVerificationMetricsService from '../services/age-verification-metrics-service';

/**
 * Custom hook for Age Verification Metrics
 * Provides real-time data, loading states, and error handling
 * for the age verification dashboard
 */
export const useAgeVerificationMetrics = (dateRange = '30d', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Fetch metrics data
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);

      const data = await ageVerificationMetricsService.getVerificationMetrics(dateRange);

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setMetrics(data);
        setLastUpdated(new Date());
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching age verification metrics:', err);

      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [dateRange]);

  /**
   * Refresh metrics manually
   */
  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    await fetchMetrics();
  }, [fetchMetrics]);

  /**
   * Clear cache and refresh data
   */
  const clearCacheAndRefresh = useCallback(async () => {
    ageVerificationMetricsService.clearCache();
    await refreshMetrics();
  }, [refreshMetrics]);

  /**
   * Setup auto-refresh interval
   */
  const setupAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchMetrics();
        }
      }, refreshInterval);
    }
  }, [fetchMetrics, refreshInterval]);

  /**
   * Initial data fetch and setup
   */
  useEffect(() => {
    mountedRef.current = true;
    fetchMetrics();
    setupAutoRefresh();

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMetrics, setupAutoRefresh]);

  /**
   * Update when date range changes
   */
  useEffect(() => {
    if (dateRange) {
      setLoading(true);
      fetchMetrics();
    }
  }, [dateRange, fetchMetrics]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refreshMetrics,
    clearCacheAndRefresh,
    isStale: lastUpdated && (Date.now() - lastUpdated.getTime()) > refreshInterval * 2
  };
};

/**
 * Hook for real-time compliance status
 */
export const useComplianceStatus = () => {
  const [status, setStatus] = useState({
    isCompliant: true,
    score: 100,
    alerts: [],
    lastCheck: new Date()
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkComplianceStatus = async () => {
      try {
        const metrics = await ageVerificationMetricsService.getVerificationMetrics('7d');

        const complianceScore = metrics.complianceScore || 0;
        const isCompliant = complianceScore >= 95;

        const alerts = [];

        // Generate alerts based on metrics
        if (metrics.successRate < 95) {
          alerts.push({
            type: 'warning',
            message: 'Age verification success rate below 95%',
            severity: 'medium'
          });
        }

        if (metrics.underageRate > 2) {
          alerts.push({
            type: 'alert',
            message: 'High underage attempt rate detected',
            severity: 'high'
          });
        }

        if (metrics.avgProcessingTime > 1000) {
          alerts.push({
            type: 'info',
            message: 'Processing time above optimal threshold',
            severity: 'low'
          });
        }

        setStatus({
          isCompliant,
          score: complianceScore,
          alerts,
          lastCheck: new Date()
        });

        setLoading(false);
      } catch (error) {
        console.error('Error checking compliance status:', error);
        setLoading(false);
      }
    };

    checkComplianceStatus();

    // Check compliance status every 5 minutes
    const interval = setInterval(checkComplianceStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { status, loading };
};

/**
 * Hook for underage attempt monitoring
 */
export const useUnderageMonitoring = (dateRange = '7d') => {
  const [underageAttempts, setUnderageAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnderageAttempts = async () => {
      try {
        setLoading(true);
        setError(null);

        const attempts = await ageVerificationMetricsService.getUnderageAttempts(dateRange);
        setUnderageAttempts(attempts);
      } catch (err) {
        console.error('Error fetching underage attempts:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnderageAttempts();
  }, [dateRange]);

  return {
    underageAttempts,
    loading,
    error,
    totalBlocked: underageAttempts.length
  };
};

/**
 * Hook for real-time metrics streaming (simulated)
 */
export const useRealTimeMetrics = () => {
  const [realTimeData, setRealTimeData] = useState({
    currentAttempts: 0,
    successRate: 0,
    blockedToday: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        currentAttempts: prev.currentAttempts + Math.floor(Math.random() * 3),
        successRate: 95 + Math.random() * 4, // 95-99%
        blockedToday: prev.blockedToday + (Math.random() > 0.95 ? 1 : 0),
        avgResponseTime: 200 + Math.random() * 100 // 200-300ms
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return realTimeData;
};

/**
 * Hook for metrics comparison
 */
export const useMetricsComparison = (currentDateRange, comparisonDateRange) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);

        const [currentMetrics, comparisonMetrics] = await Promise.all([
          ageVerificationMetricsService.getVerificationMetrics(currentDateRange),
          ageVerificationMetricsService.getVerificationMetrics(comparisonDateRange)
        ]);

        const comparison = {
          totalAttempts: {
            current: currentMetrics.totalAttempts,
            previous: comparisonMetrics.totalAttempts,
            change: calculatePercentageChange(currentMetrics.totalAttempts, comparisonMetrics.totalAttempts)
          },
          successRate: {
            current: currentMetrics.successRate,
            previous: comparisonMetrics.successRate,
            change: currentMetrics.successRate - comparisonMetrics.successRate
          },
          underageAttempts: {
            current: currentMetrics.underageAttempts,
            previous: comparisonMetrics.underageAttempts,
            change: calculatePercentageChange(currentMetrics.underageAttempts, comparisonMetrics.underageAttempts)
          },
          complianceScore: {
            current: currentMetrics.complianceScore,
            previous: comparisonMetrics.complianceScore,
            change: currentMetrics.complianceScore - comparisonMetrics.complianceScore
          }
        };

        setComparison(comparison);
      } catch (error) {
        console.error('Error fetching metrics comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentDateRange && comparisonDateRange) {
      fetchComparison();
    }
  }, [currentDateRange, comparisonDateRange]);

  return { comparison, loading };
};

/**
 * Hook for analytics export
 */
export const useMetricsExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportMetrics = useCallback(async (format, dateRange) => {
    try {
      setExporting(true);

      const data = await ageVerificationMetricsService.exportComplianceData(format, dateRange);

      // Create download
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `age-verification-metrics-${dateRange}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error exporting metrics:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportMetrics, exporting };
};

/**
 * Utility function to calculate percentage change
 */
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Default export
export default useAgeVerificationMetrics;
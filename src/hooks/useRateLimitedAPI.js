/**
 * React hooks for rate-limited API operations
 * Provides easy integration of rate limiting in React components
 */

import { useState, useCallback, useEffect } from 'react';
import apiService from '../services/api-service';
import supabaseRL from '../services/supabase-rate-limited';
import rateLimiter, { RateLimitError } from '../services/rate-limiter';

/**
 * Hook for making rate-limited API requests
 */
export const useRateLimitedAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.request(endpoint, options);
      setRateLimitInfo(apiService.getRateLimitInfo(endpoint));
      return result;
    } catch (err) {
      setError(err);
      if (err instanceof RateLimitError) {
        setRateLimitInfo({
          limited: true,
          retryAfter: err.retryAfter,
          waitTime: err.waitTime,
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, options) =>
    request(endpoint, { ...options, method: 'GET' }), [request]
  );

  const post = useCallback((endpoint, data, options) =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }), [request]
  );

  const put = useCallback((endpoint, data, options) =>
    request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }), [request]
  );

  const del = useCallback((endpoint, options) =>
    request(endpoint, { ...options, method: 'DELETE' }), [request]
  );

  return {
    request,
    get,
    post,
    put,
    delete: del,
    loading,
    error,
    rateLimitInfo,
  };
};

/**
 * Hook for rate-limited Supabase queries
 */
export const useRateLimitedSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useCallback(async (queryFn) => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn(supabaseRL);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    query,
    loading,
    error,
    client: supabaseRL,
  };
};

/**
 * Hook for monitoring rate limit status
 */
export const useRateLimitStatus = (endpoint = 'default', refreshInterval = 1000) => {
  const [status, setStatus] = useState(() =>
    rateLimiter.getRateLimitInfo(endpoint)
  );

  useEffect(() => {
    const updateStatus = () => {
      setStatus(rateLimiter.getRateLimitInfo(endpoint));
    };

    const interval = setInterval(updateStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [endpoint, refreshInterval]);

  const percentageRemaining = (status.available / status.limit) * 100;
  const isLimited = percentageRemaining < 10;
  const isWarning = percentageRemaining < 30;

  return {
    ...status,
    percentageRemaining,
    isLimited,
    isWarning,
  };
};

/**
 * Hook for rate-limited data fetching with caching
 */
export const useRateLimitedFetch = (key, fetcher, options = {}) => {
  const {
    refreshInterval = null,
    retryOnError = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    // Check cache
    if (!force && lastFetch && Date.now() - lastFetch < cacheTime && data) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rateLimiter.executeWithRetry(
        fetcher,
        key,
        { maxRetries: retryOnError ? 3 : 0 }
      );

      setData(result);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, retryOnError, cacheTime, data, lastFetch]);

  useEffect(() => {
    fetchData();
  }, [key]);

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => fetchData(true), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale: lastFetch && Date.now() - lastFetch > cacheTime,
  };
};

/**
 * Hook for handling rate limit errors with retry UI
 */
export const useRateLimitRetry = () => {
  const [retryInfo, setRetryInfo] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryInfo && retryInfo.retryAt > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((retryInfo.retryAt - Date.now()) / 1000);
        if (remaining <= 0) {
          setRetryInfo(null);
          setRetryCountdown(0);
        } else {
          setRetryCountdown(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryInfo]);

  const handleRateLimitError = useCallback((error) => {
    if (error instanceof RateLimitError) {
      setRetryInfo({
        endpoint: error.endpoint,
        retryAt: Date.now() + error.waitTime,
        message: error.message,
      });
      setRetryCountdown(Math.ceil(error.waitTime / 1000));
    }
  }, []);

  const clearRetry = useCallback(() => {
    setRetryInfo(null);
    setRetryCountdown(0);
  }, []);

  return {
    retryInfo,
    retryCountdown,
    handleRateLimitError,
    clearRetry,
    canRetry: retryCountdown === 0,
  };
};

export default {
  useRateLimitedAPI,
  useRateLimitedSupabase,
  useRateLimitStatus,
  useRateLimitedFetch,
  useRateLimitRetry,
};
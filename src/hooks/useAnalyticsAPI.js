import { useCallback } from 'react';
import { useAnalytics } from '../contexts/AnalyticsContext';

/**
 * Custom hook for tracking API calls with analytics
 * Provides automatic performance monitoring and error tracking for API requests
 */
export const useAnalyticsAPI = () => {
  const { trackAPICall, trackError, isInitialized } = useAnalytics();

  /**
   * Wrapper for fetch requests with analytics tracking
   * @param {string} url - API endpoint URL
   * @param {RequestInit} options - Fetch options
   * @param {Object} metadata - Additional tracking metadata
   * @returns {Promise} - Enhanced fetch promise with analytics
   */
  const trackedFetch = useCallback(async (url, options = {}, metadata = {}) => {
    if (!isInitialized) {
      return fetch(url, options);
    }

    const startTime = performance.now();
    const method = options.method || 'GET';
    const endpoint = extractEndpoint(url);

    // Track API call start
    const apiTracker = trackAPICall(endpoint, method, startTime);

    try {
      const response = await fetch(url, options);
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: null // We don't clone the response here to avoid consuming it
      };

      // Track successful response
      apiTracker.success(responseData);

      return response;
    } catch (error) {
      // Track API error
      apiTracker.error(error);
      throw error;
    }
  }, [trackAPICall, trackError, isInitialized]);

  /**
   * Wrapper for Supabase client operations
   * @param {Function} operation - Supabase operation function
   * @param {string} tableName - Name of the table being accessed
   * @param {string} operationType - Type of operation (select, insert, update, delete, rpc)
   * @param {Object} metadata - Additional tracking metadata
   * @returns {Promise} - Enhanced operation promise with analytics
   */
  const trackedSupabaseOp = useCallback(async (operation, tableName, operationType, metadata = {}) => {
    if (!isInitialized) {
      return await operation();
    }

    const startTime = performance.now();
    const endpoint = `supabase:${tableName}:${operationType}`;

    const apiTracker = trackAPICall(endpoint, operationType.toUpperCase(), startTime);

    try {
      const result = await operation();

      // Track successful response
      apiTracker.success({
        status: result.error ? 400 : 200,
        data: result.data,
        count: result.count,
        error: result.error
      });

      // Track Supabase-specific errors (even when no exception is thrown)
      if (result.error) {
        trackError(new Error(result.error.message), {
          tags: { error_type: 'supabase_error' },
          extra: {
            table: tableName,
            operation: operationType,
            error_code: result.error.code,
            error_details: result.error.details,
            ...metadata
          }
        });
      }

      return result;
    } catch (error) {
      // Track API error
      apiTracker.error(error);

      // Track additional context for Supabase errors
      trackError(error, {
        tags: { error_type: 'supabase_exception' },
        extra: {
          table: tableName,
          operation: operationType,
          ...metadata
        }
      });

      throw error;
    }
  }, [trackAPICall, trackError, isInitialized]);

  /**
   * Track performance for any async operation
   * @param {string} operationName - Name of the operation
   * @param {Function} operation - Async operation function
   * @param {Object} metadata - Additional tracking metadata
   * @returns {Promise} - Operation result with performance tracking
   */
  const trackAsyncOperation = useCallback(async (operationName, operation, metadata = {}) => {
    if (!isInitialized) {
      return await operation();
    }

    const performanceTracker = trackAPICall(`operation:${operationName}`, 'OPERATION', performance.now());

    try {
      const result = await operation();
      performanceTracker.success({ status: 200, data: result });
      return result;
    } catch (error) {
      performanceTracker.error(error);
      throw error;
    }
  }, [trackAPICall, isInitialized]);

  /**
   * Create a wrapper for multiple API calls (batch operations)
   * @param {string} batchName - Name of the batch operation
   * @param {Array} operations - Array of operation promises
   * @param {Object} metadata - Additional tracking metadata
   * @returns {Promise} - Results of all operations with tracking
   */
  const trackedBatch = useCallback(async (batchName, operations, metadata = {}) => {
    if (!isInitialized) {
      return await Promise.all(operations);
    }

    const startTime = performance.now();
    const batchTracker = trackAPICall(`batch:${batchName}`, 'BATCH', startTime);

    try {
      const results = await Promise.all(operations);
      batchTracker.success({
        status: 200,
        data: { count: operations.length, results }
      });
      return results;
    } catch (error) {
      batchTracker.error(error);
      throw error;
    }
  }, [trackAPICall, isInitialized]);

  return {
    trackedFetch,
    trackedSupabaseOp,
    trackAsyncOperation,
    trackedBatch
  };
};

/**
 * Extract endpoint name from URL for consistent tracking
 * @param {string} url - Full URL
 * @returns {string} - Extracted endpoint name
 */
function extractEndpoint(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove common prefixes
    let endpoint = pathname
      .replace(/^\/rest\/v1\//, '') // Supabase REST API
      .replace(/^\/api\//, '') // Generic API
      .replace(/^\//, ''); // Leading slash

    // Remove query parameters and fragments
    endpoint = endpoint.split('?')[0].split('#')[0];

    // Replace dynamic segments with placeholders
    endpoint = endpoint
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // UUIDs
      .replace(/\/[a-zA-Z0-9-_]{8,}/g, '/:slug'); // Long alphanumeric strings (likely slugs)

    return endpoint || 'unknown';
  } catch (error) {
    return 'invalid-url';
  }
}

export default useAnalyticsAPI;
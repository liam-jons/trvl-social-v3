import { useEffect, useCallback, useRef } from 'react';
import { useAnalytics } from '../contexts/AnalyticsContext';
/**
 * Custom hook for comprehensive performance monitoring
 * Tracks page load times, component render performance, and user interactions
 */
export const usePerformanceMonitoring = () => {
  const { trackEvent, trackBusinessKPI, startPerformanceTracking, isInitialized } = useAnalytics();
  /**
   * Track component mount and render performance
   * @param {string} componentName - Name of the component
   * @param {Object} props - Component props for context
   */
  const trackComponentPerformance = useCallback((componentName, props = {}) => {
    if (!isInitialized) return null;
    const startTime = performance.now();
    return {
      finish: () => {
        const renderTime = performance.now() - startTime;
        trackEvent('component_render', {
          component_name: componentName,
          render_time: renderTime,
          props_count: Object.keys(props).length,
          has_children: !!props.children
        });
        // Track slow renders
        if (renderTime > 100) {
          trackEvent('slow_component_render', {
            component_name: componentName,
            render_time: renderTime
          });
        }
        return renderTime;
      }
    };
  }, [trackEvent, isInitialized]);
  /**
   * Track page load performance using Navigation Timing API
   * @param {string} pageName - Name of the page
   */
  const trackPageLoadPerformance = useCallback((pageName) => {
    if (!isInitialized || typeof window === 'undefined') return;
    const timing = performance.getEntriesByType('navigation')[0];
    if (!timing) return;
    const metrics = {
      // Core Web Vitals and performance metrics
      dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcp_connection: timing.connectEnd - timing.connectStart,
      tls_negotiation: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
      request_time: timing.responseStart - timing.requestStart,
      response_time: timing.responseEnd - timing.responseStart,
      dom_parsing: timing.domContentLoadedEventStart - timing.responseEnd,
      resource_loading: timing.loadEventStart - timing.domContentLoadedEventEnd,
      // Time to First Byte
      ttfb: timing.responseStart - timing.requestStart,
      // DOM metrics
      dom_interactive: timing.domInteractive - timing.navigationStart,
      dom_content_loaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      load_complete: timing.loadEventEnd - timing.navigationStart,
      // Total page load time
      total_load_time: timing.loadEventEnd - timing.navigationStart
    };
    // Track individual metrics
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value > 0) {
        trackBusinessKPI(`page_performance.${metric}`, value, {
          page: pageName,
          unit: 'milliseconds'
        });
      }
    });
    // Track overall page performance event
    trackEvent('page_load_performance', {
      page_name: pageName,
      ...metrics,
      navigation_type: timing.type,
      transfer_size: timing.transferSize,
      encoded_body_size: timing.encodedBodySize,
      decoded_body_size: timing.decodedBodySize
    });
  }, [trackEvent, trackBusinessKPI, isInitialized]);
  /**
   * Track Core Web Vitals (LCP, FID, CLS)
   */
  const trackCoreWebVitals = useCallback(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          trackBusinessKPI('core_web_vitals.lcp', lastEntry.startTime, {
            metric_type: 'lcp',
            unit: 'milliseconds',
            element: lastEntry.element?.tagName || 'unknown'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            trackBusinessKPI('core_web_vitals.fid', entry.processingStart - entry.startTime, {
              metric_type: 'fid',
              unit: 'milliseconds',
              event_type: entry.name
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        // Track Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          trackBusinessKPI('core_web_vitals.cls', clsValue, {
            metric_type: 'cls',
            unit: 'score'
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        // Cleanup observers
        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (error) {
        console.warn('Failed to set up Core Web Vitals tracking:', error);
      }
    }
  }, [trackBusinessKPI, isInitialized]);
  /**
   * Track user interaction performance (click, scroll, etc.)
   * @param {string} interactionType - Type of interaction
   * @param {string} elementId - ID or name of the element
   */
  const trackInteractionPerformance = useCallback((interactionType, elementId) => {
    if (!isInitialized) return null;
    const startTime = performance.now();
    return {
      finish: () => {
        const interactionTime = performance.now() - startTime;
        trackEvent('user_interaction_performance', {
          interaction_type: interactionType,
          element_id: elementId,
          response_time: interactionTime
        });
        // Track slow interactions
        if (interactionTime > 100) {
          trackEvent('slow_interaction', {
            interaction_type: interactionType,
            element_id: elementId,
            response_time: interactionTime
          });
        }
        return interactionTime;
      }
    };
  }, [trackEvent, isInitialized]);
  /**
   * Monitor memory usage
   */
  const trackMemoryUsage = useCallback(() => {
    if (!isInitialized || !performance.memory) return;
    const memoryInfo = performance.memory;
    trackBusinessKPI('browser_memory.used_heap', memoryInfo.usedJSHeapSize, {
      unit: 'bytes',
      total_heap: memoryInfo.totalJSHeapSize,
      heap_limit: memoryInfo.jsHeapSizeLimit
    });
    // Track memory pressure
    const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    if (memoryUsagePercent > 80) {
      trackEvent('high_memory_usage', {
        memory_usage_percent: memoryUsagePercent,
        used_heap: memoryInfo.usedJSHeapSize,
        total_heap: memoryInfo.totalJSHeapSize
      });
    }
  }, [trackBusinessKPI, trackEvent, isInitialized]);
  /**
   * Track long tasks that block the main thread
   */
  const trackLongTasks = useCallback(() => {
    if (!isInitialized || !('PerformanceObserver' in window)) return;
    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          trackEvent('long_task_detected', {
            duration: entry.duration,
            start_time: entry.startTime,
            attribution: entry.attribution?.map(attr => ({
              name: attr.name,
              container_type: attr.containerType,
              container_src: attr.containerSrc,
              container_id: attr.containerId
            }))
          });
          // Track as business metric for monitoring
          trackBusinessKPI('performance.long_task_duration', entry.duration, {
            unit: 'milliseconds'
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      return () => longTaskObserver.disconnect();
    } catch (error) {
      console.warn('Failed to set up long task tracking:', error);
    }
  }, [trackEvent, trackBusinessKPI, isInitialized]);
  /**
   * Track resource loading performance
   */
  const trackResourcePerformance = useCallback(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    const resources = performance.getEntriesByType('resource');
    // Group resources by type
    const resourcesByType = resources.reduce((acc, resource) => {
      const type = getResourceType(resource.name);
      if (!acc[type]) acc[type] = [];
      acc[type].push(resource);
      return acc;
    }, {});
    // Track metrics for each resource type
    Object.entries(resourcesByType).forEach(([type, resources]) => {
      const avgDuration = resources.reduce((sum, r) => sum + r.duration, 0) / resources.length;
      const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      trackBusinessKPI(`resource_performance.${type}_avg_duration`, avgDuration, {
        unit: 'milliseconds',
        count: resources.length
      });
      trackBusinessKPI(`resource_performance.${type}_total_size`, totalSize, {
        unit: 'bytes',
        count: resources.length
      });
    });
    // Track slow resources
    const slowResources = resources.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      trackEvent('slow_resources_detected', {
        count: slowResources.length,
        resources: slowResources.map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize
        }))
      });
    }
  }, [trackBusinessKPI, trackEvent, isInitialized]);
  return {
    trackComponentPerformance,
    trackPageLoadPerformance,
    trackCoreWebVitals,
    trackInteractionPerformance,
    trackMemoryUsage,
    trackLongTasks,
    trackResourcePerformance
  };
};
/**
 * Hook for automatic performance monitoring of React components
 * @param {string} componentName - Name of the component
 * @param {Object} dependencies - Dependencies to watch for re-renders
 */
export const useComponentPerformance = (componentName, dependencies = []) => {
  const { trackComponentPerformance } = usePerformanceMonitoring();
  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current += 1;
    const tracker = trackComponentPerformance(componentName, {
      render_count: renderCountRef.current
    });
    // Track render completion
    const timeoutId = setTimeout(() => {
      tracker?.finish();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, dependencies);
  // Track excessive re-renders
  useEffect(() => {
    if (renderCountRef.current > 10) {
      console.warn(`Component ${componentName} has rendered ${renderCountRef.current} times`);
    }
  }, [componentName]);
};
/**
 * Helper function to determine resource type from URL
 * @param {string} url - Resource URL
 * @returns {string} - Resource type
 */
function getResourceType(url) {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
  if (url.includes('api/') || url.includes('supabase')) return 'api';
  return 'other';
}
export default usePerformanceMonitoring;
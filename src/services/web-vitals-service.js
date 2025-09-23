/**
 * Core Web Vitals Monitoring Service
 * Tracks Largest Contentful Paint (LCP), Interaction to Next Paint (INP),
 * and Cumulative Layout Shift (CLS) for production performance monitoring
 */
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import analyticsService from './analytics-service.js';
import sentryService from './sentry-service.js';

class WebVitalsService {
  constructor() {
    this.isInitialized = false;
    this.vitalsData = new Map();
    this.performanceBudgets = {
      // Performance budgets based on Core Web Vitals thresholds
      LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
      INP: { good: 200, poor: 500 },   // Interaction to Next Paint (ms)
      CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
      FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
      TTFB: { good: 800, poor: 1800 }  // Time to First Byte (ms)
    };
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: performance.now(),
      routeChanges: 0,
      interactions: 0
    };
  }

  /**
   * Initialize Web Vitals monitoring
   */
  init() {
    if (this.isInitialized) return;

    try {
      // Only initialize in browser environment
      if (typeof window === 'undefined') return;

      // Start monitoring Core Web Vitals
      this.initializeCoreWebVitals();

      // Monitor route changes for SPA performance
      this.initializeRouteChangeMonitoring();

      // Monitor user interactions
      this.initializeInteractionMonitoring();

      // Set up performance observer for additional metrics
      this.initializePerformanceObserver();

      this.isInitialized = true;

      // Track initialization
      analyticsService.trackEvent('web_vitals_initialized', {
        session_id: this.sessionData.sessionId,
        user_agent: navigator.userAgent,
        connection_type: this.getConnectionType()
      });

    } catch (error) {
      sentryService.captureException(error, {
        tags: { error_type: 'web_vitals_init_error' }
      });
    }
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  initializeCoreWebVitals() {
    // Largest Contentful Paint
    onLCP((metric) => {
      this.handleMetric('LCP', metric);
    });

    // Interaction to Next Paint (replaces FID)
    onINP((metric) => {
      this.handleMetric('INP', metric);
    });

    // Cumulative Layout Shift
    onCLS((metric) => {
      this.handleMetric('CLS', metric);
    });

    // First Contentful Paint
    onFCP((metric) => {
      this.handleMetric('FCP', metric);
    });

    // Time to First Byte
    onTTFB((metric) => {
      this.handleMetric('TTFB', metric);
    });
  }

  /**
   * Handle individual metric measurement
   */
  handleMetric(name, metric) {
    const value = metric.value;
    const rating = this.calculateRating(name, value);
    const budget = this.performanceBudgets[name];

    // Store metric data
    this.vitalsData.set(name, {
      ...metric,
      rating,
      budget,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      routeChanges: this.sessionData.routeChanges
    });

    // Send to analytics services
    this.reportMetric(name, metric, rating);

    // Check for performance alerts
    this.checkPerformanceAlert(name, value, rating);
  }

  /**
   * Calculate performance rating based on Core Web Vitals thresholds
   */
  calculateRating(metricName, value) {
    const budget = this.performanceBudgets[metricName];
    if (!budget) return 'unknown';

    if (value <= budget.good) return 'good';
    if (value <= budget.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Report metric to analytics and monitoring services
   */
  reportMetric(name, metric, rating) {
    const metricData = {
      metric_name: name,
      metric_value: metric.value,
      metric_rating: rating,
      metric_delta: metric.delta,
      metric_id: metric.id,
      session_id: this.sessionData.sessionId,
      route_changes: this.sessionData.routeChanges,
      page_url: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      connection_type: this.getConnectionType(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_memory: navigator.deviceMemory || 'unknown',
      effective_type: navigator.connection?.effectiveType || 'unknown'
    };

    // Track in analytics for performance analysis
    analyticsService.trackEvent('core_web_vital', metricData);

    // Add performance breadcrumb to Sentry
    sentryService.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${metric.value}ms (${rating})`,
      data: metricData,
      level: rating === 'poor' ? 'warning' : 'info'
    });

    // Track as custom metric in Sentry
    sentryService.addCustomMetric(`web_vitals.${name.toLowerCase()}`, metric.value, {
      rating,
      session_id: this.sessionData.sessionId
    });
  }

  /**
   * Check for performance alerts and trigger if needed
   */
  checkPerformanceAlert(metricName, value, rating) {
    if (rating === 'poor') {
      const alertData = {
        metric: metricName,
        value,
        rating,
        threshold: this.performanceBudgets[metricName].poor,
        session_id: this.sessionData.sessionId,
        page_url: window.location.href,
        user_agent: navigator.userAgent
      };

      // Send alert to Sentry
      sentryService.captureMessage(
        `Poor Core Web Vitals performance detected: ${metricName}`,
        'warning',
        {
          tags: {
            performance_alert: true,
            metric_name: metricName,
            metric_rating: rating
          },
          extra: alertData
        }
      );

      // Track performance regression
      analyticsService.trackEvent('performance_regression', alertData);
    }
  }

  /**
   * Initialize route change monitoring for SPA performance
   */
  initializeRouteChangeMonitoring() {
    let previousUrl = window.location.href;

    // Monitor history API changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleRouteChange(previousUrl, window.location.href);
      previousUrl = window.location.href;
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleRouteChange(previousUrl, window.location.href);
      previousUrl = window.location.href;
    };

    // Monitor popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.handleRouteChange(previousUrl, window.location.href);
      previousUrl = window.location.href;
    });
  }

  /**
   * Handle route changes and track navigation performance
   */
  handleRouteChange(fromUrl, toUrl) {
    this.sessionData.routeChanges++;
    const navigationStart = performance.now();

    // Track route change
    analyticsService.trackPageView(toUrl, {
      from_url: fromUrl,
      to_url: toUrl,
      route_change_number: this.sessionData.routeChanges,
      session_id: this.sessionData.sessionId,
      navigation_type: 'spa_route_change'
    });

    // Measure time to interactive after route change
    requestIdleCallback(() => {
      const timeToInteractive = performance.now() - navigationStart;

      analyticsService.trackEvent('spa_navigation_timing', {
        from_url: fromUrl,
        to_url: toUrl,
        time_to_interactive: timeToInteractive,
        route_change_number: this.sessionData.routeChanges,
        session_id: this.sessionData.sessionId
      });
    });
  }

  /**
   * Initialize interaction monitoring (click, scroll, etc.)
   */
  initializeInteractionMonitoring() {
    // Track user interactions for responsiveness monitoring
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.sessionData.interactions++;

        // Measure interaction delay for click events
        if (eventType === 'click') {
          this.measureInteractionDelay(event);
        }
      }, { passive: true });
    });
  }

  /**
   * Measure interaction delay for responsiveness monitoring
   */
  measureInteractionDelay(event) {
    const interactionStart = performance.now();

    // Use requestAnimationFrame to measure when the interaction is handled
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const interactionDelay = performance.now() - interactionStart;

        if (interactionDelay > 100) { // Only track slower interactions
          analyticsService.trackEvent('slow_interaction', {
            interaction_delay: interactionDelay,
            interaction_type: 'click',
            target_element: event.target.tagName,
            target_id: event.target.id || 'unknown',
            target_class: event.target.className || 'unknown',
            session_id: this.sessionData.sessionId,
            page_url: window.location.href
          });
        }
      });
    });
  }

  /**
   * Initialize Performance Observer for additional metrics
   */
  initializePerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Observe resource loading performance
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleResourceTiming(entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe long tasks
      if ('PerformanceLongTaskTiming' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleLongTask(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      }

      // Observe memory usage (if supported)
      this.observeMemoryUsage();

    } catch (error) {
      sentryService.captureException(error, {
        tags: { error_type: 'performance_observer_error' }
      });
    }
  }

  /**
   * Handle resource timing data
   */
  handleResourceTiming(entry) {
    const duration = entry.responseEnd - entry.requestStart;

    // Track slow resources
    if (duration > 1000) {
      analyticsService.trackEvent('slow_resource', {
        resource_url: entry.name,
        resource_type: entry.initiatorType,
        load_duration: duration,
        transfer_size: entry.transferSize || 0,
        session_id: this.sessionData.sessionId
      });
    }
  }

  /**
   * Handle long task detection
   */
  handleLongTask(entry) {
    const taskDuration = entry.duration;

    analyticsService.trackEvent('long_task_detected', {
      task_duration: taskDuration,
      task_start: entry.startTime,
      session_id: this.sessionData.sessionId,
      page_url: window.location.href
    });

    // Alert for very long tasks (>100ms)
    if (taskDuration > 100) {
      sentryService.captureMessage(
        `Long task detected: ${taskDuration}ms`,
        'warning',
        {
          tags: { performance_alert: true },
          extra: {
            duration: taskDuration,
            start_time: entry.startTime,
            session_id: this.sessionData.sessionId
          }
        }
      );
    }
  }

  /**
   * Observe memory usage if supported
   */
  observeMemoryUsage() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memInfo = performance.memory;

      analyticsService.trackEvent('memory_usage', {
        used_js_heap_size: memInfo.usedJSHeapSize,
        total_js_heap_size: memInfo.totalJSHeapSize,
        js_heap_size_limit: memInfo.jsHeapSizeLimit,
        session_id: this.sessionData.sessionId
      });

      // Alert for high memory usage
      const memoryUsagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) {
        sentryService.captureMessage(
          `High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`,
          'warning',
          {
            tags: { performance_alert: true },
            extra: {
              memory_usage_percent: memoryUsagePercent,
              used_heap_size: memInfo.usedJSHeapSize,
              heap_size_limit: memInfo.jsHeapSizeLimit,
              session_id: this.sessionData.sessionId
            }
          }
        );
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get network connection type
   */
  getConnectionType() {
    if (!navigator.connection) return 'unknown';
    return navigator.connection.effectiveType || 'unknown';
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current vitals data
   */
  getVitalsData() {
    return Object.fromEntries(this.vitalsData);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const vitals = this.getVitalsData();
    const summary = {
      session_id: this.sessionData.sessionId,
      total_interactions: this.sessionData.interactions,
      route_changes: this.sessionData.routeChanges,
      session_duration: Date.now() - this.sessionData.startTime,
      connection_type: this.getConnectionType(),
      core_web_vitals: {}
    };

    // Add Core Web Vitals with ratings
    Object.entries(vitals).forEach(([name, data]) => {
      summary.core_web_vitals[name] = {
        value: data.value,
        rating: data.rating,
        delta: data.delta
      };
    });

    return summary;
  }

  /**
   * Force report current vitals (useful for SPA route changes)
   */
  reportCurrentVitals() {
    const summary = this.getPerformanceSummary();

    analyticsService.trackEvent('performance_summary', summary);

    return summary;
  }

  /**
   * Set custom performance budget
   */
  setPerformanceBudget(metricName, goodThreshold, poorThreshold) {
    this.performanceBudgets[metricName] = {
      good: goodThreshold,
      poor: poorThreshold
    };
  }

  /**
   * Start performance measurement for custom operations
   */
  startMeasurement(name) {
    const measurementId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const startTime = performance.now();

    return {
      finish: () => {
        const duration = performance.now() - startTime;

        analyticsService.trackEvent('custom_performance_measurement', {
          measurement_name: name,
          measurement_id: measurementId,
          duration,
          session_id: this.sessionData.sessionId
        });

        return duration;
      }
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      session_id: this.sessionData.sessionId,
      metrics_collected: this.vitalsData.size,
      total_interactions: this.sessionData.interactions,
      route_changes: this.sessionData.routeChanges
    };
  }
}

// Create singleton instance
const webVitalsService = new WebVitalsService();

export default webVitalsService;
export { WebVitalsService };
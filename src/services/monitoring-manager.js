/**
 * Monitoring Manager
 * Central orchestrator for all monitoring services initialization and coordination
 */
import sentryService from './sentry-service.js';
import webVitalsService from './web-vitals-service.js';
import googleAnalyticsService from './google-analytics-service.js';
import analyticsService from './analytics-service.js';
import performanceAlertsService from './performance-alerts-service.js';
import datadogService from './datadog-service.js';
import mixpanelService from './mixpanel-service.js';

class MonitoringManager {
  constructor() {
    this.isInitialized = false;
    this.initializationStatus = {
      sentry: false,
      webVitals: false,
      googleAnalytics: false,
      analytics: false,
      alerts: false,
      datadog: false,
      mixpanel: false
    };
    this.config = {
      environment: 'production',
      consentRequired: true,
      enabledServices: [],
      thresholds: {},
      notifications: []
    };
    this.initializationErrors = [];
  }

  /**
   * Initialize all monitoring services
   */
  async init(userConfig = {}) {
    if (this.isInitialized) {
      console.warn('Monitoring Manager already initialized');
      return this.getInitializationStatus();
    }

    try {
      // Merge configuration
      this.config = this.mergeConfig(userConfig);

      console.log('🚀 Initializing Production Monitoring System...');

      // Initialize services in dependency order
      await this.initializeCore();
      await this.initializeAnalytics();
      await this.initializePerformanceMonitoring();
      await this.initializeAlerting();

      this.isInitialized = true;

      // Report initialization success
      this.reportInitializationStatus();

      console.log('✅ Production Monitoring System Initialized Successfully');

      return this.getInitializationStatus();

    } catch (error) {
      console.error('❌ Failed to initialize monitoring system:', error);
      this.initializationErrors.push({
        error: error.message,
        timestamp: Date.now(),
        stack: error.stack
      });

      // Try to report error through any available service
      this.reportInitializationError(error);

      throw error;
    }
  }

  /**
   * Merge user configuration with defaults
   */
  mergeConfig(userConfig) {
    const defaultConfig = {
      environment: import.meta.env.PROD ? 'production' : 'development',
      consentRequired: true,
      enabledServices: ['sentry', 'webVitals', 'analytics'],

      // Service-specific configurations
      sentry: {
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        profilesSampleRate: import.meta.env.PROD ? 0.05 : 0.5,
        replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1
      },

      googleAnalytics: {
        consentRequired: true,
        enhancedEcommerce: true,
        customDimensions: true
      },

      webVitals: {
        reportAllChanges: !import.meta.env.PROD,
        enableLogging: !import.meta.env.PROD
      },

      alerts: {
        thresholds: {
          webVitals: {
            LCP: { warning: 2500, critical: 4000 },
            FID: { warning: 100, critical: 300 },
            CLS: { warning: 0.1, critical: 0.25 }
          },
          performance: {
            responseTime: { warning: 500, critical: 1000 },
            errorRate: { warning: 1, critical: 5 }
          }
        },
        notifications: []
      },

      datadog: {
        enableRUM: true,
        enableLogs: true,
        enableTracing: import.meta.env.PROD
      }
    };

    return this.deepMerge(defaultConfig, userConfig);
  }

  /**
   * Initialize core monitoring services
   */
  async initializeCore() {
    console.log('🔧 Initializing core monitoring services...');

    // Initialize Sentry first (error tracking is critical)
    try {
      sentryService.init();
      this.initializationStatus.sentry = sentryService.isInitialized;
      console.log('✓ Sentry initialized');
    } catch (error) {
      console.error('✗ Sentry initialization failed:', error);
      this.initializationErrors.push({ service: 'sentry', error: error.message });
    }

    // Initialize Web Vitals monitoring
    try {
      webVitalsService.init();
      this.initializationStatus.webVitals = webVitalsService.isInitialized;
      console.log('✓ Web Vitals monitoring initialized');
    } catch (error) {
      console.error('✗ Web Vitals initialization failed:', error);
      this.initializationErrors.push({ service: 'webVitals', error: error.message });
    }
  }

  /**
   * Initialize analytics services
   */
  async initializeAnalytics() {
    console.log('📊 Initializing analytics services...');

    // Check for user consent
    const hasAnalyticsConsent = this.checkAnalyticsConsent();

    // Initialize Google Analytics 4
    if (this.config.enabledServices.includes('googleAnalytics')) {
      try {
        await googleAnalyticsService.init(hasAnalyticsConsent);
        this.initializationStatus.googleAnalytics = googleAnalyticsService.isInitialized;
        console.log('✓ Google Analytics 4 initialized');
      } catch (error) {
        console.error('✗ Google Analytics initialization failed:', error);
        this.initializationErrors.push({ service: 'googleAnalytics', error: error.message });
      }
    }

    // Initialize Mixpanel
    if (this.config.enabledServices.includes('mixpanel')) {
      try {
        await mixpanelService.init();
        this.initializationStatus.mixpanel = mixpanelService.isInitialized;
        console.log('✓ Mixpanel initialized');
      } catch (error) {
        console.error('✗ Mixpanel initialization failed:', error);
        this.initializationErrors.push({ service: 'mixpanel', error: error.message });
      }
    }

    // Initialize Datadog RUM
    if (this.config.enabledServices.includes('datadog')) {
      try {
        await datadogService.init();
        this.initializationStatus.datadog = datadogService.isInitialized;
        console.log('✓ Datadog RUM initialized');
      } catch (error) {
        console.error('✗ Datadog initialization failed:', error);
        this.initializationErrors.push({ service: 'datadog', error: error.message });
      }
    }

    // Initialize unified analytics service
    try {
      await analyticsService.init();
      this.initializationStatus.analytics = analyticsService.isInitialized;
      console.log('✓ Unified Analytics Service initialized');
    } catch (error) {
      console.error('✗ Analytics Service initialization failed:', error);
      this.initializationErrors.push({ service: 'analytics', error: error.message });
    }
  }

  /**
   * Initialize performance monitoring
   */
  async initializePerformanceMonitoring() {
    console.log('⚡ Initializing performance monitoring...');

    // Set up performance observers
    this.setupPerformanceObservers();

    // Initialize custom performance tracking
    this.setupCustomPerformanceTracking();

    console.log('✓ Performance monitoring configured');
  }

  /**
   * Initialize alerting system
   */
  async initializeAlerting() {
    console.log('🚨 Initializing alerting system...');

    try {
      await performanceAlertsService.init(this.config.alerts);
      this.initializationStatus.alerts = performanceAlertsService.isInitialized;
      console.log('✓ Performance alerts configured');
    } catch (error) {
      console.error('✗ Alerts initialization failed:', error);
      this.initializationErrors.push({ service: 'alerts', error: error.message });
    }
  }

  /**
   * Setup performance observers
   */
  setupPerformanceObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackNavigationTiming(entry);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Navigation timing observer failed:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPaintTiming(entry);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Paint timing observer failed:', error);
    }
  }

  /**
   * Setup custom performance tracking
   */
  setupCustomPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      this.trackPageLoadPerformance();
    });

    // Track route changes for SPA
    this.setupRouteChangeTracking();

    // Track user interactions
    this.setupInteractionTracking();
  }

  /**
   * Track navigation timing
   */
  trackNavigationTiming(entry) {
    const metrics = {
      dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcp_connect: entry.connectEnd - entry.connectStart,
      ssl_negotiation: entry.connectEnd - entry.secureConnectionStart,
      server_response: entry.responseEnd - entry.requestStart,
      dom_processing: entry.domContentLoadedEventStart - entry.responseEnd,
      total_load_time: entry.loadEventEnd - entry.navigationStart
    };

    analyticsService.trackEvent('navigation_timing', metrics);
  }

  /**
   * Track paint timing
   */
  trackPaintTiming(entry) {
    analyticsService.trackEvent('paint_timing', {
      paint_type: entry.name,
      paint_time: entry.startTime
    });
  }

  /**
   * Track page load performance
   */
  trackPageLoadPerformance() {
    if (!window.performance?.timing) return;

    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    analyticsService.trackEvent('page_load_complete', {
      load_time: loadTime,
      page_url: window.location.href,
      referrer: document.referrer
    });

    // Track Core Web Vitals
    webVitalsService.reportCurrentVitals();
  }

  /**
   * Setup route change tracking for SPAs
   */
  setupRouteChangeTracking() {
    let currentPath = window.location.pathname;

    // Monitor history API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      this.handleRouteChange(currentPath, window.location.pathname);
      currentPath = window.location.pathname;
    }.bind(this);

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      this.handleRouteChange(currentPath, window.location.pathname);
      currentPath = window.location.pathname;
    }.bind(this);

    // Monitor popstate
    window.addEventListener('popstate', () => {
      this.handleRouteChange(currentPath, window.location.pathname);
      currentPath = window.location.pathname;
    });
  }

  /**
   * Handle route changes
   */
  handleRouteChange(fromPath, toPath) {
    if (fromPath !== toPath) {
      analyticsService.trackPageView(toPath, document.title, {
        from_path: fromPath,
        navigation_type: 'spa_route_change'
      });

      // Report Web Vitals for the previous route
      webVitalsService.reportCurrentVitals();
    }
  }

  /**
   * Setup interaction tracking
   */
  setupInteractionTracking() {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-track]');
      if (target) {
        analyticsService.trackEvent('element_click', {
          element_type: target.tagName,
          element_id: target.id,
          element_class: target.className,
          track_data: target.dataset.track
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        analyticsService.trackEvent('form_submit', {
          form_id: form.id,
          form_action: form.action,
          form_method: form.method
        });
      }
    });
  }

  /**
   * Check analytics consent
   */
  checkAnalyticsConsent() {
    // Check for stored consent (implementation depends on consent management)
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'granted' || !this.config.consentRequired;
  }

  /**
   * Update consent status
   */
  updateConsent(granted) {
    localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');

    // Update all services
    if (googleAnalyticsService.isInitialized) {
      googleAnalyticsService.updateConsent(granted);
    }

    if (analyticsService.isInitialized) {
      if (granted) {
        analyticsService.optIn();
      } else {
        analyticsService.optOut();
      }
    }

    analyticsService.trackEvent('consent_updated', {
      consent_granted: granted,
      timestamp: Date.now()
    });
  }

  /**
   * Report initialization status
   */
  reportInitializationStatus() {
    const status = this.getInitializationStatus();

    analyticsService.trackEvent('monitoring_system_initialized', {
      ...status,
      environment: this.config.environment,
      enabled_services: this.config.enabledServices,
      errors_count: this.initializationErrors.length
    });

    if (this.initializationErrors.length > 0) {
      sentryService.captureMessage(
        'Monitoring system initialized with errors',
        'warning',
        {
          tags: { initialization: 'partial_failure' },
          extra: {
            status,
            errors: this.initializationErrors
          }
        }
      );
    }
  }

  /**
   * Report initialization error
   */
  reportInitializationError(error) {
    try {
      if (sentryService.isInitialized) {
        sentryService.captureException(error, {
          tags: { error_type: 'monitoring_init_error' }
        });
      }
    } catch (reportError) {
      console.error('Failed to report initialization error:', reportError);
    }
  }

  /**
   * Get initialization status
   */
  getInitializationStatus() {
    return {
      initialized: this.isInitialized,
      services: { ...this.initializationStatus },
      errors: this.initializationErrors,
      config: {
        environment: this.config.environment,
        enabled_services: this.config.enabledServices
      }
    };
  }

  /**
   * Get health status of all services
   */
  getHealthStatus() {
    return {
      monitoring_manager: this.isInitialized,
      services: {
        sentry: sentryService.isInitialized,
        web_vitals: webVitalsService.getHealthStatus(),
        google_analytics: googleAnalyticsService.getTrackingStatus(),
        analytics: analyticsService.getHealthStatus(),
        alerts: performanceAlertsService.getStatus(),
        datadog: datadogService.isInitialized,
        mixpanel: mixpanelService.isInitialized
      },
      last_checked: new Date().toISOString()
    };
  }

  /**
   * Shutdown all monitoring services
   */
  async shutdown() {
    console.log('🛑 Shutting down monitoring services...');

    try {
      // Flush any pending data
      await Promise.all([
        sentryService.flush?.(5000),
        analyticsService.flush?.(),
        googleAnalyticsService.flush?.()
      ]);

      this.isInitialized = false;
      console.log('✓ Monitoring services shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Deep merge utility
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

// Create singleton instance
const monitoringManager = new MonitoringManager();

export default monitoringManager;
export { MonitoringManager };
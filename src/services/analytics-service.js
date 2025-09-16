import mixpanelService from './mixpanel-service.js';
import sentryService from './sentry-service.js';
import datadogService from './datadog-service.js';

/**
 * Centralized Analytics Service
 * Provides a unified interface for all monitoring and analytics services
 */
class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.services = {
      mixpanel: mixpanelService,
      sentry: sentryService,
      datadog: datadogService
    };
    this.gdprConsentService = null; // Will be injected to avoid circular dependency
  }

  // Set GDPR consent service (to avoid circular dependency)
  setGDPRConsentService(service) {
    this.gdprConsentService = service;
  }

  // Initialize all services
  async init() {
    if (this.isInitialized) return;

    try {
      // Check if we have consent (if GDPR service is available)
      const hasConsent = !this.gdprConsentService ||
                        this.gdprConsentService.hasConsent('analytics') ||
                        this.gdprConsentService.hasConsent('essential');

      if (hasConsent) {
        // Initialize all services in parallel
        await Promise.all([
          this.services.mixpanel.init(),
          this.services.sentry.init(),
          this.services.datadog.init()
        ]);

        this.isInitialized = true;

        // Track initialization success (only if consent given)
        this.trackEvent('analytics_initialized', {
          services_enabled: {
            mixpanel: !!import.meta.env.VITE_MIXPANEL_TOKEN,
            sentry: !!import.meta.env.VITE_SENTRY_DSN,
            datadog: !!import.meta.env.VITE_DATADOG_APPLICATION_ID
          },
          gdpr_consent: this.gdprConsentService?.getConsentStatus() || 'not_required'
        });
      }
    } catch (error) {
      // Always allow error tracking for essential functionality
      this.services.sentry.captureException(error, {
        tags: { error_type: 'initialization_error' }
      });
    }
  }

  // User identification across all services
  identifyUser(userId, userData = {}) {
    try {
      this.services.mixpanel.identify(userId, userData);
      this.services.sentry.setUser(userData);
      this.services.datadog.setUser(userData);

      // Track user identification
      this.trackEvent('user_identified', {
        user_type: userData.user_type,
        has_completed_assessment: userData.assessment_completed
      });
    } catch (error) {
      this.services.sentry.captureException(error);
    }
  }

  // Clear user data across all services (logout)
  clearUser() {
    try {
      this.services.mixpanel.reset();
      this.services.sentry.clearUser();
      this.services.datadog.clearUser();
    } catch (error) {
      this.services.sentry.captureException(error);
    }
  }

  // Unified event tracking
  trackEvent(eventName, properties = {}) {
    try {
      // Track in Mixpanel for behavior analysis
      this.services.mixpanel.track(eventName, properties);

      // Track in Datadog as custom action for performance correlation
      this.services.datadog.addCustomMetric(`event.${eventName}`, 1, properties);

      // Add breadcrumb in Sentry for error context
      this.services.sentry.addBreadcrumb({
        category: 'user_action',
        message: eventName,
        data: properties,
        level: 'info'
      });
    } catch (error) {
      this.services.sentry.captureException(error);
    }
  }

  // Page view tracking
  trackPageView(pageName, properties = {}) {
    try {
      this.services.mixpanel.trackPageView(pageName, properties);
      this.services.datadog.trackPageLoad(pageName, {
        route: window.location.pathname,
        isInitialLoad: properties.is_initial_load || false,
        ...properties
      });
    } catch (error) {
      this.services.sentry.captureException(error);
    }
  }

  // Enhanced error tracking with context
  trackError(error, context = {}) {
    try {
      // Track in Mixpanel for error analytics
      this.services.mixpanel.trackError(error, context);

      // Capture in Sentry with full context
      this.services.sentry.captureException(error, context);

      // Log in Datadog for correlation with performance data
      this.services.datadog.logError('Application Error', error, context);
    } catch (trackingError) {
    }
  }

  // Business-specific tracking methods

  // Adventure search tracking
  trackAdventureSearch(searchParams) {
    const startTime = performance.now();

    return {
      finish: (resultsCount = 0) => {
        const searchDuration = performance.now() - startTime;

        const searchData = {
          ...searchParams,
          resultsCount,
          searchDuration
        };

        this.services.mixpanel.trackAdventureSearch(searchData);
        this.services.datadog.trackSearchPerformance({
          type: 'adventure_search',
          responseTime: searchDuration,
          resultsCount,
          hasFilters: Object.keys(searchParams).length > 2,
          query: searchParams.query,
          location: searchParams.location
        });
      }
    };
  }

  // Booking funnel tracking
  trackBookingFunnel(stage, bookingData) {
    this.services.mixpanel.trackBookingFunnel(stage, bookingData);

    if (stage === 'completed') {
      this.services.datadog.trackBookingConversion({
        rate: 1, // Individual conversion
        step: 'completed',
        userType: bookingData.userType,
        category: bookingData.adventureCategory,
        timeToConvert: bookingData.conversionTime,
        paymentMethod: bookingData.paymentMethod,
        bookingValue: bookingData.totalAmount,
        currency: bookingData.currency,
        vendorCategory: bookingData.vendorCategory
      });
    }

    if (stage === 'failed') {
      this.trackError(new Error(bookingData.errorMessage), {
        tags: { error_type: 'booking_error' },
        extra: bookingData
      });
    }
  }

  // Group interaction tracking
  trackGroupInteraction(action, groupData) {
    this.services.mixpanel.trackGroupInteraction(action, groupData);

    if (action === 'compatibility_viewed') {
      this.services.datadog.trackGroupMatchingSpeed({
        matchingTime: groupData.matchingTime || 0,
        groupSize: groupData.groupSize,
        algorithm: 'personality_based',
        averageScore: groupData.compatibilityScore,
        groupType: groupData.groupType,
        personalityTypes: groupData.personalityTypes
      });
    }
  }

  // Vendor action tracking
  trackVendorAction(action, vendorData) {
    this.services.mixpanel.trackVendorAction(action, vendorData);

    // Track vendor engagement metrics
    this.services.datadog.trackFeatureUsage(`vendor_${action}`, {
      userType: 'vendor',
      context: vendorData.context,
      engagementTime: vendorData.engagementTime || 0,
      sessionDuration: vendorData.sessionDuration || 0
    });
  }

  // API call monitoring
  trackAPICall(endpoint, method, startTime) {
    return {
      success: (responseData) => {
        const responseTime = performance.now() - startTime;
        const statusCode = responseData.status || 200;

        this.services.datadog.trackAPICall({
          endpoint,
          method,
          responseTime,
          statusCode,
          payloadSize: JSON.stringify(responseData.data || {}).length,
          direction: 'response',
          service: 'supabase'
        });

        // Track slow API calls
        if (responseTime > 2000) {
          this.trackEvent('slow_api_call', {
            endpoint,
            method,
            response_time: responseTime,
            status_code: statusCode
          });
        }
      },
      error: (error) => {
        const responseTime = performance.now() - startTime;

        this.services.datadog.trackAPICall({
          endpoint,
          method,
          responseTime,
          statusCode: error.status || 500,
          errorMessage: error.message,
          service: 'supabase'
        });

        this.trackError(error, {
          tags: { error_type: 'api_error' },
          extra: { endpoint, method, response_time: responseTime }
        });
      }
    };
  }

  // Performance monitoring
  startPerformanceTracking(name, attributes = {}) {
    const mixpanelStart = Date.now();
    const datadogTiming = this.services.datadog.startTiming(name, attributes);
    const sentryTransaction = this.services.sentry.startTransaction(name);

    return {
      finish: () => {
        const duration = Date.now() - mixpanelStart;

        // Finish all tracking
        datadogTiming?.finish();
        sentryTransaction?.setStatus('ok');
        sentryTransaction?.finish();

        // Track performance metrics
        this.trackEvent('performance_metric', {
          metric_name: name,
          duration,
          ...attributes
        });

        return duration;
      },
      error: (error) => {
        datadogTiming?.finish();
        sentryTransaction?.setStatus('internal_error');
        sentryTransaction?.finish();

        this.trackError(error, {
          tags: { error_type: 'performance_error' },
          extra: { operation: name, ...attributes }
        });
      }
    };
  }

  // A/B testing and experiments
  trackExperiment(experimentName, variant, outcome = null) {
    this.services.mixpanel.trackExperiment(experimentName, variant, { outcome });
    this.services.datadog.trackExperiment(experimentName, variant, outcome);

    this.services.sentry.setTag(`experiment_${experimentName}`, variant);
  }

  // Feature usage tracking
  trackFeatureUsage(featureName, usageData) {
    this.trackEvent(`feature_used_${featureName}`, usageData);
    this.services.datadog.trackFeatureUsage(featureName, usageData);
  }

  // User journey tracking
  trackUserJourney(journeyName, stepName, stepData = {}) {
    this.trackEvent('user_journey_step', {
      journey_name: journeyName,
      step_name: stepName,
      ...stepData
    });

    this.services.datadog.trackUserJourney({
      journeyName,
      stepName,
      stepOrder: stepData.stepOrder,
      duration: stepData.duration,
      success: stepData.success,
      dropOffPoint: stepData.dropOffPoint
    });
  }

  // Business KPI tracking
  trackBusinessKPI(kpiName, value, tags = {}) {
    this.services.datadog.trackBusinessMetrics({
      [kpiName]: {
        value,
        unit: tags.unit || 'count',
        tags
      }
    });

    this.trackEvent('business_kpi', {
      kpi_name: kpiName,
      kpi_value: value,
      ...tags
    });
  }

  // Privacy controls
  optOut() {
    this.services.mixpanel.optOut();
    // Sentry and Datadog don't have direct opt-out, but we can stop tracking
    this.isInitialized = false;
  }

  optIn() {
    this.services.mixpanel.optIn();
    this.isInitialized = true;
  }

  // Debug and health checks
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        mixpanel: this.services.mixpanel.isInitialized,
        sentry: this.services.sentry.isInitialized,
        datadog: this.services.datadog.isInitialized
      }
    };
  }

  // Flush all pending data (useful before page unload)
  async flush() {
    try {
      await Promise.all([
        this.services.mixpanel.flushEventQueue?.(),
        this.services.sentry.flush?.(2000),
        this.services.datadog.flush?.()
      ]);
    } catch (error) {
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
export { AnalyticsService };
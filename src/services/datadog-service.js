import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';
class DatadogService {
  constructor() {
    this.isInitialized = false;
    this.customMetrics = new Map();
  }
  // Initialize Datadog RUM and Logs
  init() {
    if (this.isInitialized) return;
    const applicationId = import.meta.env.VITE_DATADOG_APPLICATION_ID;
    const clientToken = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
    const site = import.meta.env.VITE_DATADOG_SITE || 'datadoghq.com';
    if (!applicationId || applicationId === 'YOUR_DATADOG_APPLICATION_ID_HERE' ||
        !clientToken || clientToken === 'YOUR_DATADOG_CLIENT_TOKEN_HERE') {
      console.warn('Datadog credentials not configured. Performance monitoring disabled.');
      return;
    }
    const isProduction = import.meta.env.NODE_ENV === 'production';
    // Initialize RUM
    datadogRum.init({
      applicationId,
      clientToken,
      site,
      service: 'trvl-social-v3',
      env: isProduction ? 'production' : 'development',
      version: process.env.npm_package_version || 'unknown',
      // Sampling configuration for cost optimization
      sampleRate: isProduction ? 10 : 100, // 10% in prod, 100% in dev
      sessionReplaySampleRate: isProduction ? 5 : 20, // 5% in prod, 20% in dev
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      // Default attributes for all events
      defaultPrivacyLevel: 'mask-user-input',
      // Custom configuration
      beforeSend: (event) => {
        // Filter out noisy errors in production
        if (isProduction && event.type === 'error') {
          const errorMessage = event.error?.message || '';
          const ignoredErrors = [
            'Network request failed',
            'Loading chunk',
            'ChunkLoadError',
            'Script error.'
          ];
          if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
            return false;
          }
        }
        // Add custom context to all events
        event.context = {
          ...event.context,
          build_version: process.env.npm_package_version || 'unknown',
          deployment_env: isProduction ? 'production' : 'development'
        };
        return true;
      }
    });
    // Initialize Logs
    datadogLogs.init({
      clientToken,
      site,
      service: 'trvl-social-v3',
      env: isProduction ? 'production' : 'development',
      version: process.env.npm_package_version || 'unknown',
      sampleRate: isProduction ? 50 : 100, // 50% in prod, 100% in dev
      forwardErrorsToLogs: true,
      silentMultipleInit: true
    });
    // Start RUM
    datadogRum.startSessionReplayRecording();
    this.isInitialized = true;
    console.log('Datadog RUM and Logs initialized successfully');
    // Track initialization
    this.addCustomMetric('datadog.initialization', 1, {
      environment: isProduction ? 'production' : 'development'
    });
  }
  // Set user context
  setUser(user) {
    if (!this.isInitialized) return;
    datadogRum.setUser({
      id: user.id,
      name: user.full_name || user.username,
      email: user.email,
      user_type: user.user_type,
      subscription_status: user.subscription_status,
      assessment_completed: user.assessment_completed,
      total_bookings: user.total_bookings || 0,
      registration_date: user.created_at
    });
  }
  // Set global context
  setGlobalContext(key, value) {
    if (!this.isInitialized) return;
    datadogRum.setGlobalContext(key, value);
  }
  // Add custom attributes to current view
  addAttribute(key, value) {
    if (!this.isInitialized) return;
    datadogRum.addAttribute(key, value);
  }
  // Remove attribute
  removeAttribute(key) {
    if (!this.isInitialized) return;
    datadogRum.removeAttribute(key);
  }
  // Track custom business KPIs
  addCustomMetric(name, value, tags = {}) {
    if (!this.isInitialized) return;
    // Store metric locally for aggregation
    const metricKey = `${name}_${JSON.stringify(tags)}`;
    this.customMetrics.set(metricKey, {
      name,
      value,
      tags,
      timestamp: Date.now()
    });
    // Send as custom action
    datadogRum.addAction(name, {
      metric_value: value,
      metric_type: 'custom',
      ...tags
    });
    // Also log for correlation
    this.logInfo('Custom Metric Recorded', {
      metric_name: name,
      metric_value: value,
      ...tags
    });
  }
  // Business KPI tracking methods
  trackBookingConversion(conversionData) {
    this.addCustomMetric('booking.conversion_rate', conversionData.rate, {
      funnel_step: conversionData.step,
      user_type: conversionData.userType,
      adventure_category: conversionData.category
    });
    this.addCustomMetric('booking.conversion_time', conversionData.timeToConvert, {
      user_type: conversionData.userType,
      payment_method: conversionData.paymentMethod
    });
    this.addCustomMetric('booking.value', conversionData.bookingValue, {
      currency: conversionData.currency,
      vendor_category: conversionData.vendorCategory
    });
  }
  trackSearchPerformance(searchData) {
    this.addCustomMetric('search.response_time', searchData.responseTime, {
      search_type: searchData.type,
      results_count: searchData.resultsCount,
      has_filters: searchData.hasFilters
    });
    this.addCustomMetric('search.click_through_rate', searchData.clickThroughRate, {
      search_query: searchData.query,
      location: searchData.location
    });
  }
  trackGroupMatchingSpeed(matchingData) {
    this.addCustomMetric('group.matching_time', matchingData.matchingTime, {
      group_size: matchingData.groupSize,
      compatibility_algorithm: matchingData.algorithm
    });
    this.addCustomMetric('group.compatibility_score', matchingData.averageScore, {
      group_type: matchingData.groupType,
      personality_types: matchingData.personalityTypes
    });
  }
  // Performance tracking
  startTiming(name, attributes = {}) {
    if (!this.isInitialized) return null;
    const startTime = performance.now();
    return {
      name,
      startTime,
      attributes,
      finish: () => {
        const duration = performance.now() - startTime;
        this.addCustomMetric(`timing.${name}`, duration, {
          ...attributes,
          unit: 'milliseconds'
        });
        return duration;
      }
    };
  }
  // Page performance monitoring
  trackPageLoad(pageName, loadData) {
    this.addCustomMetric('page.load_time', loadData.loadTime, {
      page_name: pageName,
      route: loadData.route,
      is_initial_load: loadData.isInitialLoad
    });
    this.addCustomMetric('page.ttfb', loadData.ttfb, {
      page_name: pageName
    });
    this.addCustomMetric('page.fcp', loadData.fcp, {
      page_name: pageName
    });
    this.addCustomMetric('page.lcp', loadData.lcp, {
      page_name: pageName
    });
  }
  // API performance monitoring
  trackAPICall(apiData) {
    this.addCustomMetric('api.response_time', apiData.responseTime, {
      endpoint: apiData.endpoint,
      method: apiData.method,
      status_code: apiData.statusCode,
      service: apiData.service || 'supabase'
    });
    this.addCustomMetric('api.payload_size', apiData.payloadSize, {
      endpoint: apiData.endpoint,
      direction: apiData.direction // 'request' or 'response'
    });
    if (apiData.statusCode >= 400) {
      this.logError('API Error', {
        endpoint: apiData.endpoint,
        method: apiData.method,
        status_code: apiData.statusCode,
        error_message: apiData.errorMessage,
        response_time: apiData.responseTime
      });
    }
  }
  // User journey tracking
  trackUserJourney(journeyData) {
    datadogRum.addAction('user_journey_step', {
      journey_name: journeyData.journeyName,
      step_name: journeyData.stepName,
      step_order: journeyData.stepOrder,
      duration: journeyData.duration,
      success: journeyData.success,
      drop_off_point: journeyData.dropOffPoint
    });
  }
  // Feature usage tracking
  trackFeatureUsage(featureName, usageData) {
    this.addCustomMetric('feature.usage_count', 1, {
      feature_name: featureName,
      user_type: usageData.userType,
      context: usageData.context
    });
    this.addCustomMetric('feature.engagement_time', usageData.engagementTime, {
      feature_name: featureName,
      session_duration: usageData.sessionDuration
    });
  }
  // Logging methods
  logInfo(message, context = {}) {
    if (!this.isInitialized) {
      console.info(message, context);
      return;
    }
    datadogLogs.logger.info(message, context);
  }
  logWarning(message, context = {}) {
    if (!this.isInitialized) {
      console.warn(message, context);
      return;
    }
    datadogLogs.logger.warn(message, context);
  }
  logError(message, error, context = {}) {
    if (!this.isInitialized) {
      console.error(message, error, context);
      return;
    }
    datadogLogs.logger.error(message, {
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      },
      ...context
    });
  }
  // A/B testing and feature flags
  trackExperiment(experimentName, variant, outcome = null) {
    datadogRum.addAction('experiment_exposure', {
      experiment_name: experimentName,
      variant,
      outcome,
      timestamp: Date.now()
    });
    if (outcome) {
      this.addCustomMetric('experiment.conversion', 1, {
        experiment_name: experimentName,
        variant,
        outcome
      });
    }
  }
  // SLO/SLI tracking
  trackSLI(sliName, value, threshold, tags = {}) {
    const isMet = value <= threshold;
    this.addCustomMetric(`sli.${sliName}`, value, {
      ...tags,
      threshold,
      sli_met: isMet,
      sli_type: 'performance'
    });
    // Track SLO compliance
    this.addCustomMetric(`slo.${sliName}_compliance`, isMet ? 1 : 0, tags);
  }
  // Error rate tracking
  trackErrorRate(service, errorCount, totalRequests, tags = {}) {
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    this.addCustomMetric('error_rate', errorRate, {
      service,
      error_count: errorCount,
      total_requests: totalRequests,
      ...tags
    });
  }
  // Custom dashboard metrics
  trackBusinessMetrics(metrics) {
    Object.entries(metrics).forEach(([metricName, metricData]) => {
      this.addCustomMetric(`business.${metricName}`, metricData.value, {
        metric_type: 'business',
        unit: metricData.unit,
        ...metricData.tags
      });
    });
  }
  // Memory and performance monitoring
  trackResourceUsage() {
    if (!performance.memory) return;
    this.addCustomMetric('browser.memory.used', performance.memory.usedJSHeapSize, {
      unit: 'bytes'
    });
    this.addCustomMetric('browser.memory.total', performance.memory.totalJSHeapSize, {
      unit: 'bytes'
    });
    this.addCustomMetric('browser.memory.limit', performance.memory.jsHeapSizeLimit, {
      unit: 'bytes'
    });
  }
  // Clear user data (logout)
  clearUser() {
    if (!this.isInitialized) return;
    datadogRum.clearUser();
  }
  // Stop session replay
  stopSessionReplay() {
    if (!this.isInitialized) return;
    datadogRum.stopSessionReplayRecording();
  }
  // Start session replay
  startSessionReplay() {
    if (!this.isInitialized) return;
    datadogRum.startSessionReplayRecording();
  }
  // Get session URL for support
  getSessionReplayUrl() {
    if (!this.isInitialized) return null;
    return datadogRum.getSessionReplayLink();
  }
  // Flush pending data
  flush() {
    if (!this.isInitialized) return Promise.resolve();
    // Datadog automatically handles flushing, but we can trigger it manually
    return new Promise(resolve => {
      setTimeout(resolve, 1000); // Give time for pending requests
    });
  }
}
// Create singleton instance
const datadogService = new DatadogService();
export default datadogService;
export { DatadogService };
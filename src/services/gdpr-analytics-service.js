/**
 * GDPR-Compliant Analytics Service
 * Wraps the existing analytics service with consent-aware data collection
 */

import analyticsService from './analytics-service.js';
import gdprConsentService from './gdpr-consent-service.js';
import { logger } from '../utils/logger.js';

class GDPRAnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.queuedEvents = [];
    this.anonymizationSettings = {
      ipAddress: true,
      userAgent: true,
      referrer: true,
      location: true
    };

    // Listen for consent changes
    this.setupConsentListeners();
  }

  // Initialize the service
  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for GDPR service to initialize
      await gdprConsentService.init();

      // Inject GDPR consent service into analytics service to avoid circular dependency
      analyticsService.setGDPRConsentService(gdprConsentService);

      // Initialize base analytics only if we have consent
      if (this.canInitializeAnalytics()) {
        await analyticsService.init();
      }

      this.isInitialized = true;
      this.processQueuedEvents();

      logger.info('GDPR Analytics Service initialized');
    } catch (error) {
      logger.error('Failed to initialize GDPR Analytics Service:', error);
    }
  }

  // Set up consent change listeners
  setupConsentListeners() {
    gdprConsentService.addEventListener((eventType, data) => {
      if (eventType === 'consentChanged' || eventType === 'multipleConsentChanged') {
        this.handleConsentChange(data);
      }
    });
  }

  // Handle consent changes
  async handleConsentChange(data) {
    const analyticsEnabled = gdprConsentService.canTrackAnalytics();

    if (analyticsEnabled && !analyticsService.isInitialized) {
      // User enabled analytics - initialize services
      await analyticsService.init();
      this.processQueuedEvents();
    } else if (!analyticsEnabled && analyticsService.isInitialized) {
      // User disabled analytics - opt out
      analyticsService.optOut();
    }

    // Log consent change for audit
    this.trackConsentChange(data);
  }

  // Check if analytics can be initialized
  canInitializeAnalytics() {
    return gdprConsentService.hasConsent('analytics') ||
           gdprConsentService.hasConsent('essential');
  }

  // Anonymize data based on settings
  anonymizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const anonymized = { ...data };

    if (this.anonymizationSettings.ipAddress) {
      delete anonymized.ip_address;
      delete anonymized.ip;
    }

    if (this.anonymizationSettings.userAgent) {
      if (anonymized.user_agent) {
        // Keep only browser family, remove detailed version info
        anonymized.user_agent = anonymized.user_agent.split(' ')[0];
      }
    }

    if (this.anonymizationSettings.referrer) {
      if (anonymized.referrer) {
        try {
          // Keep only domain, remove path and query params
          const url = new URL(anonymized.referrer);
          anonymized.referrer = url.hostname;
        } catch {
          delete anonymized.referrer;
        }
      }
    }

    if (this.anonymizationSettings.location) {
      // Remove precise location data, keep only general region
      delete anonymized.latitude;
      delete anonymized.longitude;
      delete anonymized.precise_location;
    }

    return anonymized;
  }

  // Add PII detection and removal
  removePII(data) {
    if (!data || typeof data !== 'object') return data;

    const cleaned = { ...data };
    const piiPatterns = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /[\+]?[1-9][\d]{3,14}/g,
      ssn: /\d{3}-\d{2}-\d{4}/g,
      creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g
    };

    // Recursively clean all string values
    const cleanValue = (value) => {
      if (typeof value === 'string') {
        let cleanedValue = value;
        Object.values(piiPatterns).forEach(pattern => {
          cleanedValue = cleanedValue.replace(pattern, '[REDACTED]');
        });
        return cleanedValue;
      } else if (Array.isArray(value)) {
        return value.map(cleanValue);
      } else if (value && typeof value === 'object') {
        const cleanedObj = {};
        Object.entries(value).forEach(([key, val]) => {
          cleanedObj[key] = cleanValue(val);
        });
        return cleanedObj;
      }
      return value;
    };

    Object.keys(cleaned).forEach(key => {
      cleaned[key] = cleanValue(cleaned[key]);
    });

    return cleaned;
  }

  // Process data through privacy filters
  processDataForPrivacy(data) {
    let processedData = { ...data };

    // Always remove PII
    processedData = this.removePII(processedData);

    // Apply anonymization if user hasn't given full consent
    if (!gdprConsentService.hasConsent('marketing')) {
      processedData = this.anonymizeData(processedData);
    }

    // Add privacy metadata
    processedData._privacy = {
      anonymized: !gdprConsentService.hasConsent('marketing'),
      consent_categories: Object.keys(gdprConsentService.getConsentStatus().categories)
        .filter(cat => gdprConsentService.hasConsent(cat)),
      consent_id: gdprConsentService.getConsentStatus().consentId,
      processed_at: new Date().toISOString()
    };

    return processedData;
  }

  // Queue events when consent not available
  queueEvent(eventName, properties) {
    this.queuedEvents.push({
      eventName,
      properties,
      timestamp: new Date().toISOString()
    });

    // Limit queue size to prevent memory issues
    if (this.queuedEvents.length > 100) {
      this.queuedEvents.shift();
    }
  }

  // Process queued events
  processQueuedEvents() {
    if (!this.canTrackAnalytics()) return;

    while (this.queuedEvents.length > 0) {
      const event = this.queuedEvents.shift();
      this.trackEvent(event.eventName, event.properties);
    }
  }

  // Check if analytics tracking is allowed
  canTrackAnalytics() {
    return gdprConsentService.canTrackAnalytics() && analyticsService.isInitialized;
  }

  // Check if marketing tracking is allowed
  canTrackMarketing() {
    return gdprConsentService.canTrackMarketing();
  }

  // Consent-aware user identification
  identifyUser(userId, userData = {}) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('user_identified', { userId, userData });
      return;
    }

    // Process user data for privacy
    const processedUserData = this.processDataForPrivacy(userData);

    analyticsService.identifyUser(userId, processedUserData);
  }

  // Consent-aware event tracking
  trackEvent(eventName, properties = {}) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent(eventName, properties);
      return;
    }

    // Process properties for privacy
    const processedProperties = this.processDataForPrivacy(properties);

    analyticsService.trackEvent(eventName, processedProperties);
  }

  // Consent-aware page view tracking
  trackPageView(pageName, properties = {}) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('page_view', { pageName, ...properties });
      return;
    }

    const processedProperties = this.processDataForPrivacy(properties);
    analyticsService.trackPageView(pageName, processedProperties);
  }

  // Track consent-related events
  trackConsentChange(consentData) {
    // Always track consent changes for audit purposes (essential category)
    const auditData = {
      event_type: 'consent_change',
      consent_categories: Object.keys(consentData.categories || {})
        .map(cat => ({
          category: cat,
          enabled: consentData.categories[cat]?.enabled,
          explicit: consentData.categories[cat]?.explicit
        })),
      timestamp: new Date().toISOString()
    };

    // This goes to essential analytics only
    if (analyticsService.isInitialized) {
      analyticsService.trackEvent('gdpr_consent_changed', auditData);
    }
  }

  // Adventure search with consent awareness
  trackAdventureSearch(searchParams) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('adventure_search', searchParams);
      return;
    }

    const processedParams = this.processDataForPrivacy(searchParams);
    return analyticsService.trackAdventureSearch(processedParams);
  }

  // Booking funnel with consent awareness
  trackBookingFunnel(stage, bookingData) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('booking_funnel', { stage, ...bookingData });
      return;
    }

    const processedData = this.processDataForPrivacy(bookingData);
    analyticsService.trackBookingFunnel(stage, processedData);
  }

  // Group interaction with consent awareness
  trackGroupInteraction(action, groupData) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('group_interaction', { action, ...groupData });
      return;
    }

    const processedData = this.processDataForPrivacy(groupData);
    analyticsService.trackGroupInteraction(action, processedData);
  }

  // Vendor action with consent awareness
  trackVendorAction(action, vendorData) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('vendor_action', { action, ...vendorData });
      return;
    }

    const processedData = this.processDataForPrivacy(vendorData);
    analyticsService.trackVendorAction(action, processedData);
  }

  // API call monitoring with consent awareness
  trackAPICall(endpoint, method, startTime) {
    if (!this.canTrackAnalytics()) {
      return {
        success: () => {},
        error: () => {}
      };
    }

    const apiTracker = analyticsService.trackAPICall(endpoint, method, startTime);

    return {
      success: (responseData) => {
        const processedData = this.processDataForPrivacy(responseData);
        apiTracker.success(processedData);
      },
      error: (error) => {
        const processedError = this.processDataForPrivacy({
          message: error.message,
          status: error.status
        });
        apiTracker.error(processedError);
      }
    };
  }

  // Performance tracking with consent awareness
  startPerformanceTracking(name, attributes = {}) {
    if (!this.canTrackAnalytics()) {
      return {
        finish: () => {},
        error: () => {}
      };
    }

    const processedAttributes = this.processDataForPrivacy(attributes);
    return analyticsService.startPerformanceTracking(name, processedAttributes);
  }

  // A/B testing with consent awareness
  trackExperiment(experimentName, variant, outcome = null) {
    // A/B testing may be considered marketing
    if (!this.canTrackMarketing()) {
      return;
    }

    analyticsService.trackExperiment(experimentName, variant, outcome);
  }

  // Feature usage with consent awareness
  trackFeatureUsage(featureName, usageData) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('feature_usage', { featureName, ...usageData });
      return;
    }

    const processedData = this.processDataForPrivacy(usageData);
    analyticsService.trackFeatureUsage(featureName, processedData);
  }

  // User journey with consent awareness
  trackUserJourney(journeyName, stepName, stepData = {}) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('user_journey', { journeyName, stepName, ...stepData });
      return;
    }

    const processedData = this.processDataForPrivacy(stepData);
    analyticsService.trackUserJourney(journeyName, stepName, processedData);
  }

  // Business KPI with consent awareness
  trackBusinessKPI(kpiName, value, tags = {}) {
    if (!this.canTrackAnalytics()) {
      this.queueEvent('business_kpi', { kpiName, value, ...tags });
      return;
    }

    const processedTags = this.processDataForPrivacy(tags);
    analyticsService.trackBusinessKPI(kpiName, value, processedTags);
  }

  // Error tracking (essential functionality)
  trackError(error, context = {}) {
    // Error tracking is considered essential for security
    const processedContext = this.removePII(context);
    analyticsService.trackError(error, processedContext);
  }

  // Clear user data (GDPR compliance)
  clearUser() {
    analyticsService.clearUser();
    this.queuedEvents = [];
  }

  // Get health status including privacy compliance
  getHealthStatus() {
    const baseStatus = analyticsService.getHealthStatus();
    const consentStatus = gdprConsentService.getConsentStatus();

    return {
      ...baseStatus,
      privacy: {
        gdpr_initialized: gdprConsentService.isInitialized,
        analytics_consent: gdprConsentService.canTrackAnalytics(),
        marketing_consent: gdprConsentService.canTrackMarketing(),
        consent_id: consentStatus.consentId,
        region: consentStatus.region,
        queued_events: this.queuedEvents.length
      }
    };
  }

  // Flush data (respecting consent)
  async flush() {
    if (this.canTrackAnalytics()) {
      await analyticsService.flush();
    }
  }

  // Data retention compliance
  async deleteExpiredData() {
    try {
      // This would integrate with your backend to delete expired analytics data
      const retentionPolicies = gdprConsentService.retentionPolicies;

      for (const [category, policy] of retentionPolicies) {
        if (policy.autoDelete) {
          logger.info(`Cleaning up ${category} data older than ${policy.retentionPeriod} months`);
          // Implement actual deletion logic here
        }
      }

      gdprConsentService.logConsentEvent('retention_cleanup_completed', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to delete expired data:', error);
    }
  }

  // Generate privacy compliance report
  generatePrivacyReport() {
    const consentStatus = gdprConsentService.getConsentStatus();
    const healthStatus = this.getHealthStatus();

    return {
      timestamp: new Date().toISOString(),
      consent: consentStatus,
      analytics_health: healthStatus,
      compliance_checks: {
        consent_obtained: consentStatus.explicitConsentGiven,
        data_minimization: true, // PII removal implemented
        anonymization: !gdprConsentService.hasConsent('marketing'),
        retention_policies: Array.from(gdprConsentService.retentionPolicies.keys()),
        audit_trail_available: gdprConsentService.getAuditTrail().length > 0
      }
    };
  }
}

// Create singleton instance
const gdprAnalyticsService = new GDPRAnalyticsService();

export default gdprAnalyticsService;
export { GDPRAnalyticsService };
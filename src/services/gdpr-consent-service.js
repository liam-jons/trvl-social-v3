/**
 * GDPR Consent Management Service
 * Handles user consent preferences, data collection controls, and compliance tracking
 */
import { v4 as uuidv4 } from 'uuid';
class GDPRConsentService {
  constructor() {
    this.version = '1.0.0';
    this.consentKey = 'trvl_gdpr_consent';
    this.auditKey = 'trvl_gdpr_audit';
    this.isInitialized = false;
    // Consent categories with default values
    this.consentCategories = {
      essential: {
        name: 'Essential Cookies',
        description: 'Required for basic site functionality and security',
        required: true,
        enabled: true,
        purposes: ['Authentication', 'Security', 'Basic functionality']
      },
      analytics: {
        name: 'Analytics & Performance',
        description: 'Help us understand how you use our platform to improve performance',
        required: false,
        enabled: false,
        purposes: ['Usage analytics', 'Performance monitoring', 'Error tracking']
      },
      marketing: {
        name: 'Marketing & Advertising',
        description: 'Personalized content and targeted advertising',
        required: false,
        enabled: false,
        purposes: ['Personalized ads', 'Marketing campaigns', 'Social media integration']
      },
      functional: {
        name: 'Functional',
        description: 'Enhanced features and personalization',
        required: false,
        enabled: false,
        purposes: ['Preferences storage', 'Enhanced search', 'Personalized recommendations']
      }
    };
    // Geographic consent rules
    this.geoRules = {
      EU: { requiresExplicitConsent: true, defaultToOptOut: true },
      UK: { requiresExplicitConsent: true, defaultToOptOut: true },
      CA: { requiresExplicitConsent: true, defaultToOptOut: true },
      US: { requiresExplicitConsent: false, defaultToOptOut: false },
      default: { requiresExplicitConsent: true, defaultToOptOut: true }
    };
    this.eventListeners = [];
    this.retentionPolicies = new Map();
    // Initialize with default consent to prevent undefined errors
    this.consent = {
      version: this.version,
      timestamp: new Date().toISOString(),
      consentId: null,
      region: 'default',
      categories: {
        essential: { enabled: true, explicit: false },
        analytics: { enabled: false, explicit: false },
        marketing: { enabled: false, explicit: false },
        functional: { enabled: false, explicit: false }
      },
      explicitConsentGiven: false,
      bannerShown: false
    };
    // Initialize asynchronously
    this.init().catch(error => {
      console.error('Failed to initialize GDPR service:', error);
    });
  }
  // Initialize the service
  async init() {
    if (this.isInitialized) return;
    try {
      // Load existing consent
      await this.loadConsent();
      // Set up retention policies
      this.setupRetentionPolicies();
      // Check consent expiry
      this.checkConsentExpiry();
      // Start cleanup scheduler
      this.startRetentionScheduler();
      this.isInitialized = true;
      // Notify listeners
      this.notifyListeners('initialized', this.getConsentStatus());
      console.log('GDPR Consent Service initialized');
    } catch (error) {
      console.error('Failed to initialize GDPR Consent Service:', error);
    }
  }
  // Get user's geographic region for consent rules
  async getUserRegion() {
    try {
      // Check stored region first
      const storedRegion = localStorage.getItem('trvl_user_region');
      if (storedRegion) return storedRegion;
      // Detect region via IP geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const region = this.mapCountryToRegion(data.country_code);
      localStorage.setItem('trvl_user_region', region);
      return region;
    } catch (error) {
      console.warn('Failed to detect user region, defaulting to EU rules:', error);
      return 'EU'; // Default to strictest rules
    }
  }
  // Map country codes to consent regions
  mapCountryToRegion(countryCode) {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    if (euCountries.includes(countryCode)) return 'EU';
    if (countryCode === 'GB') return 'UK';
    if (countryCode === 'CA') return 'CA';
    if (countryCode === 'US') return 'US';
    return 'default';
  }
  // Load existing consent from storage
  async loadConsent() {
    try {
      const stored = localStorage.getItem(this.consentKey);
      if (!stored) {
        this.consent = await this.createDefaultConsent();
        return;
      }
      const parsed = JSON.parse(stored);
      // Validate consent structure and version
      if (this.isValidConsent(parsed)) {
        this.consent = parsed;
      } else {
        console.warn('Invalid consent data found, creating new consent');
        this.consent = await this.createDefaultConsent();
      }
    } catch (error) {
      console.error('Failed to load consent data:', error);
      this.consent = await this.createDefaultConsent();
    }
  }
  // Create default consent based on user's region
  async createDefaultConsent() {
    const region = await this.getUserRegion();
    const rules = this.geoRules[region] || this.geoRules.default;
    const consent = {
      version: this.version,
      timestamp: new Date().toISOString(),
      consentId: uuidv4(),
      region,
      categories: {},
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      bannerShown: false,
      explicitConsentGiven: false
    };
    // Set default values based on region rules
    Object.keys(this.consentCategories).forEach(category => {
      const categoryInfo = this.consentCategories[category];
      consent.categories[category] = {
        enabled: categoryInfo.required || (!rules.defaultToOptOut && !rules.requiresExplicitConsent),
        timestamp: consent.timestamp,
        explicit: false
      };
    });
    return consent;
  }
  // Validate consent structure
  isValidConsent(consent) {
    if (!consent || typeof consent !== 'object') return false;
    if (!consent.version || !consent.timestamp || !consent.consentId) return false;
    if (!consent.categories || typeof consent.categories !== 'object') return false;
    // Check all required categories exist
    const requiredCategories = Object.keys(this.consentCategories);
    return requiredCategories.every(category => consent.categories[category]);
  }
  // Check if consent has expired
  checkConsentExpiry() {
    if (!this.consent || !this.consent.expires) return false;
    const expired = new Date(this.consent.expires) < new Date();
    if (expired) {
      console.log('Consent has expired, requiring new consent');
      this.consent.explicitConsentGiven = false;
      this.consent.bannerShown = false;
      this.saveConsent();
    }
    return expired;
  }
  // Save consent to storage
  saveConsent() {
    try {
      localStorage.setItem(this.consentKey, JSON.stringify(this.consent));
      this.logConsentEvent('consent_updated', this.consent);
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  }
  // Set consent for specific category
  setConsent(category, enabled, explicit = true) {
    if (!this.consentCategories[category]) {
      throw new Error(`Unknown consent category: ${category}`);
    }
    // Cannot disable essential cookies
    if (category === 'essential' && !enabled) {
      console.warn('Cannot disable essential cookies');
      return false;
    }
    const previousState = this.consent.categories[category]?.enabled;
    this.consent.categories[category] = {
      enabled,
      timestamp: new Date().toISOString(),
      explicit
    };
    if (explicit) {
      this.consent.explicitConsentGiven = true;
    }
    this.saveConsent();
    // Notify listeners of changes
    this.notifyListeners('consentChanged', {
      category,
      enabled,
      explicit,
      previousState
    });
    this.logConsentEvent('consent_category_changed', {
      category,
      enabled,
      explicit,
      previousState
    });
    return true;
  }
  // Set consent for multiple categories
  setMultipleConsent(consents, explicit = true) {
    const changes = [];
    Object.entries(consents).forEach(([category, enabled]) => {
      if (this.consentCategories[category]) {
        const previousState = this.consent.categories[category]?.enabled;
        if (category !== 'essential' || enabled) {
          this.consent.categories[category] = {
            enabled,
            timestamp: new Date().toISOString(),
            explicit
          };
          changes.push({ category, enabled, explicit, previousState });
        }
      }
    });
    if (explicit && changes.length > 0) {
      this.consent.explicitConsentGiven = true;
    }
    this.saveConsent();
    // Notify listeners
    this.notifyListeners('multipleConsentChanged', changes);
    this.logConsentEvent('multiple_consent_changed', { changes });
    return changes;
  }
  // Check if consent is given for category
  hasConsent(category) {
    if (!this.consent || !this.consent.categories || !this.consent.categories[category]) return false;
    return this.consent.categories[category].enabled;
  }
  // Check if analytics tracking is allowed
  canTrackAnalytics() {
    return this.hasConsent('analytics');
  }
  // Check if marketing tracking is allowed
  canTrackMarketing() {
    return this.hasConsent('marketing');
  }
  // Check if functional features are allowed
  canUseFunctional() {
    return this.hasConsent('functional');
  }
  // Get current consent status
  getConsentStatus() {
    // Return default status if consent not initialized
    if (!this.consent) {
      return {
        consentId: null,
        version: this.version,
        timestamp: null,
        expires: null,
        region: 'default',
        requiresExplicitConsent: true,
        explicitConsentGiven: false,
        bannerShown: false,
        categories: Object.keys(this.consentCategories).reduce((acc, category) => {
          const categoryInfo = this.consentCategories[category];
          acc[category] = {
            ...categoryInfo,
            enabled: category === 'essential',
            explicit: false,
            timestamp: null
          };
          return acc;
        }, {})
      };
    }
    const region = this.consent.region;
    const rules = this.geoRules[region] || this.geoRules.default;
    return {
      consentId: this.consent.consentId,
      version: this.consent.version,
      timestamp: this.consent.timestamp,
      expires: this.consent.expires,
      region,
      requiresExplicitConsent: rules.requiresExplicitConsent,
      explicitConsentGiven: this.consent.explicitConsentGiven,
      bannerShown: this.consent.bannerShown,
      categories: Object.keys(this.consentCategories).reduce((acc, category) => {
        const categoryInfo = this.consentCategories[category];
        const consent = this.consent.categories?.[category];
        acc[category] = {
          ...categoryInfo,
          enabled: consent?.enabled || false,
          explicit: consent?.explicit || false,
          timestamp: consent?.timestamp
        };
        return acc;
      }, {}),
      expired: this.checkConsentExpiry()
    };
  }
  // Mark banner as shown
  markBannerShown() {
    this.consent.bannerShown = true;
    this.consent.timestamp = new Date().toISOString();
    this.saveConsent();
    this.logConsentEvent('banner_shown', {});
  }
  // Accept all non-required consent categories
  acceptAll() {
    const changes = [];
    Object.keys(this.consentCategories).forEach(category => {
      const previousState = this.consent.categories[category]?.enabled;
      this.consent.categories[category] = {
        enabled: true,
        timestamp: new Date().toISOString(),
        explicit: true
      };
      changes.push({ category, enabled: true, explicit: true, previousState });
    });
    this.consent.explicitConsentGiven = true;
    this.saveConsent();
    this.notifyListeners('allConsentAccepted', changes);
    this.logConsentEvent('accept_all', { categories: Object.keys(this.consentCategories) });
    return changes;
  }
  // Reject all non-essential consent categories
  rejectAll() {
    const changes = [];
    Object.keys(this.consentCategories).forEach(category => {
      const categoryInfo = this.consentCategories[category];
      const previousState = this.consent.categories[category]?.enabled;
      const enabled = categoryInfo.required; // Only essential remains enabled
      this.consent.categories[category] = {
        enabled,
        timestamp: new Date().toISOString(),
        explicit: true
      };
      changes.push({ category, enabled, explicit: true, previousState });
    });
    this.consent.explicitConsentGiven = true;
    this.saveConsent();
    this.notifyListeners('allConsentRejected', changes);
    this.logConsentEvent('reject_all', { categories: Object.keys(this.consentCategories) });
    return changes;
  }
  // Check if consent banner should be shown
  shouldShowBanner() {
    const region = this.consent.region;
    const rules = this.geoRules[region] || this.geoRules.default;
    return rules.requiresExplicitConsent &&
           !this.consent.explicitConsentGiven &&
           !this.consent.bannerShown;
  }
  // Data export functionality
  async exportUserData(userId) {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId,
          consentId: this.consent.consentId,
          dataSubject: 'user_requested_export'
        },
        consent: this.getConsentStatus(),
        auditTrail: this.getAuditTrail(),
        retentionPolicies: Array.from(this.retentionPolicies.entries())
      };
      this.logConsentEvent('data_exported', { userId, exportId: uuidv4() });
      return exportData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }
  // Data deletion functionality
  async deleteUserData(userId, categories = []) {
    try {
      const deletionId = uuidv4();
      const deletionRecord = {
        deletionId,
        userId,
        timestamp: new Date().toISOString(),
        categories: categories.length > 0 ? categories : ['all'],
        status: 'initiated'
      };
      // Log deletion request
      this.logConsentEvent('data_deletion_requested', deletionRecord);
      // If all data deletion, clear consent
      if (categories.length === 0 || categories.includes('all')) {
        this.clearAllConsent();
      }
      // Return deletion reference
      return {
        deletionId,
        status: 'initiated',
        message: 'Data deletion request has been logged and will be processed within 30 days'
      };
    } catch (error) {
      console.error('Failed to initiate data deletion:', error);
      throw error;
    }
  }
  // Clear all consent and data
  clearAllConsent() {
    try {
      // Create deletion record before clearing
      const deletionRecord = {
        consentId: this.consent.consentId,
        clearedAt: new Date().toISOString(),
        reason: 'user_requested_deletion'
      };
      // Clear consent storage
      localStorage.removeItem(this.consentKey);
      // Create new default consent
      this.consent = this.createDefaultConsent();
      this.logConsentEvent('all_consent_cleared', deletionRecord);
      this.notifyListeners('consentCleared', deletionRecord);
    } catch (error) {
      console.error('Failed to clear consent:', error);
    }
  }
  // Set up data retention policies
  setupRetentionPolicies() {
    // Analytics data retention
    this.retentionPolicies.set('analytics', {
      category: 'analytics',
      retentionPeriod: 24, // months
      autoDelete: true,
      description: 'User behavior and usage analytics'
    });
    // Marketing data retention
    this.retentionPolicies.set('marketing', {
      category: 'marketing',
      retentionPeriod: 12, // months
      autoDelete: true,
      description: 'Marketing preferences and campaign data'
    });
    // Essential data retention
    this.retentionPolicies.set('essential', {
      category: 'essential',
      retentionPeriod: 60, // months
      autoDelete: false,
      description: 'Account and security data'
    });
    // Consent audit retention
    this.retentionPolicies.set('consent_audit', {
      category: 'consent_audit',
      retentionPeriod: 84, // months (7 years for compliance)
      autoDelete: false,
      description: 'Consent decisions and audit trail'
    });
  }
  // Start retention scheduler
  startRetentionScheduler() {
    // Check retention policies daily
    setInterval(() => {
      this.enforceRetentionPolicies();
    }, 24 * 60 * 60 * 1000);
  }
  // Enforce retention policies
  enforceRetentionPolicies() {
    try {
      this.retentionPolicies.forEach((policy, category) => {
        if (policy.autoDelete) {
          this.cleanupExpiredData(category, policy.retentionPeriod);
        }
      });
    } catch (error) {
      console.error('Failed to enforce retention policies:', error);
    }
  }
  // Clean up expired data
  cleanupExpiredData(category, retentionMonths) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
      this.logConsentEvent('retention_cleanup', {
        category,
        cutoffDate: cutoffDate.toISOString(),
        retentionMonths
      });
      // Here you would integrate with your data storage systems
      // to actually delete the expired data
      console.log(`Cleaning up ${category} data older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      console.error(`Failed to cleanup ${category} data:`, error);
    }
  }
  // Event logging for audit trail
  logConsentEvent(eventType, eventData = {}) {
    try {
      const auditEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: eventType,
        consentId: this.consent?.consentId,
        userAgent: navigator.userAgent,
        ipAddress: null, // Would be set server-side
        data: eventData
      };
      // Get existing audit trail
      const existing = localStorage.getItem(this.auditKey);
      const auditTrail = existing ? JSON.parse(existing) : [];
      // Add new event
      auditTrail.push(auditEvent);
      // Keep only last 1000 events to prevent storage bloat
      if (auditTrail.length > 1000) {
        auditTrail.splice(0, auditTrail.length - 1000);
      }
      localStorage.setItem(this.auditKey, JSON.stringify(auditTrail));
    } catch (error) {
      console.error('Failed to log consent event:', error);
    }
  }
  // Get audit trail
  getAuditTrail(limit = 100) {
    try {
      const stored = localStorage.getItem(this.auditKey);
      if (!stored) return [];
      const auditTrail = JSON.parse(stored);
      return auditTrail.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return [];
    }
  }
  // Add event listener
  addEventListener(callback) {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }
  // Notify all listeners
  notifyListeners(eventType, data) {
    this.eventListeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Error in consent event listener:', error);
      }
    });
  }
  // Generate compliance report
  generateComplianceReport() {
    const auditTrail = this.getAuditTrail(1000);
    const consentStatus = this.getConsentStatus();
    return {
      reportId: uuidv4(),
      generatedAt: new Date().toISOString(),
      consentStatus,
      auditSummary: {
        totalEvents: auditTrail.length,
        lastActivity: auditTrail[0]?.timestamp,
        consentChanges: auditTrail.filter(e => e.type.includes('consent')).length,
        dataExports: auditTrail.filter(e => e.type === 'data_exported').length,
        dataDeletions: auditTrail.filter(e => e.type === 'data_deletion_requested').length
      },
      retentionPolicies: Array.from(this.retentionPolicies.entries()),
      auditTrail: auditTrail.slice(0, 50) // Last 50 events
    };
  }
}
// Create singleton instance
const gdprConsentService = new GDPRConsentService();
export default gdprConsentService;
export { GDPRConsentService };
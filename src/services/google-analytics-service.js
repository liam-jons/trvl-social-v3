/**
 * Google Analytics 4 Service
 * Comprehensive GA4 integration with enhanced ecommerce tracking,
 * custom events, and privacy-compliant data collection
 */
// gtag is loaded dynamically and attached to window object

class GoogleAnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.measurementId = null;
    this.consentGiven = false;
    this.eventQueue = [];
    this.userProperties = {};
    this.customDimensions = {};
    this.debugMode = false;
  }

  /**
   * Initialize Google Analytics 4
   */
  async init(consentGiven = false) {
    if (this.isInitialized) return;

    const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
      console.warn('Google Analytics 4 measurement ID not configured');
      return;
    }

    this.measurementId = measurementId;
    this.consentGiven = consentGiven;
    this.debugMode = import.meta.env.DEV;

    try {
      // Load gtag script dynamically
      await this.loadGtagScript();

      // Configure GA4 with privacy settings
      window.gtag('config', measurementId, {
        // Privacy and consent settings
        anonymize_ip: true,
        allow_google_signals: consentGiven,
        allow_ad_personalization_signals: consentGiven,

        // Performance settings
        send_page_view: false, // We'll handle page views manually

        // Enhanced ecommerce settings
        enhanced_ecommerce: true,

        // Custom configuration
        debug_mode: this.debugMode,

        // Cookie settings
        cookie_flags: 'secure;samesite=strict',
        cookie_expires: consentGiven ? 63072000 : 0, // 2 years if consent given, session only otherwise

        // Data retention
        storage: consentGiven ? 'granted' : 'denied'
      });

      // Set consent state
      window.gtag('consent', 'default', {
        analytics_storage: consentGiven ? 'granted' : 'denied',
        ad_storage: 'denied', // Always deny ad storage for privacy
        functionality_storage: consentGiven ? 'granted' : 'denied',
        personalization_storage: 'denied', // Deny personalization for privacy
        security_storage: 'granted' // Always allow security storage
      });

      // Configure custom dimensions
      this.setupCustomDimensions();

      this.isInitialized = true;

      // Process queued events
      this.processEventQueue();

      // Track initialization
      this.trackEvent('ga4_initialized', {
        measurement_id: measurementId,
        consent_given: consentGiven,
        debug_mode: this.debugMode
      });

    } catch (error) {
      console.error('Failed to initialize Google Analytics 4:', error);
    }
  }

  /**
   * Load gtag script dynamically
   */
  async loadGtagScript() {
    return new Promise((resolve, reject) => {
      // Check if gtag is already loaded
      if (window.gtag) {
        resolve();
        return;
      }

      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => {
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Setup custom dimensions for business metrics
   */
  setupCustomDimensions() {
    this.customDimensions = {
      user_type: 'custom_dimension_1',
      subscription_status: 'custom_dimension_2',
      personality_type: 'custom_dimension_3',
      group_size_preference: 'custom_dimension_4',
      vendor_category: 'custom_dimension_5',
      booking_source: 'custom_dimension_6',
      payment_method: 'custom_dimension_7',
      adventure_category: 'custom_dimension_8',
      compatibility_score_range: 'custom_dimension_9',
      onboarding_completed: 'custom_dimension_10'
    };
  }

  /**
   * Update consent status
   */
  updateConsent(consentGiven) {
    if (!this.isInitialized) {
      this.consentGiven = consentGiven;
      return;
    }

    this.consentGiven = consentGiven;

    window.gtag('consent', 'update', {
      analytics_storage: consentGiven ? 'granted' : 'denied',
      functionality_storage: consentGiven ? 'granted' : 'denied'
    });

    // Re-configure with updated consent
    window.gtag('config', this.measurementId, {
      allow_google_signals: consentGiven,
      allow_ad_personalization_signals: consentGiven,
      cookie_expires: consentGiven ? 63072000 : 0,
      storage: consentGiven ? 'granted' : 'denied'
    });
  }

  /**
   * Track page view
   */
  trackPageView(pagePath, pageTitle, customData = {}) {
    const eventData = {
      page_title: pageTitle || document.title,
      page_location: window.location.href,
      page_path: pagePath || window.location.pathname,
      ...this.getCustomDimensionData(customData),
      ...customData
    };

    this.sendEvent('page_view', eventData);
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, parameters = {}) {
    const eventData = {
      ...this.getCustomDimensionData(parameters),
      ...parameters
    };

    this.sendEvent(eventName, eventData);
  }

  /**
   * Enhanced ecommerce tracking - Purchase
   */
  trackPurchase(transactionData) {
    const {
      transactionId,
      value,
      currency = 'USD',
      items = [],
      coupon,
      affiliation = 'TRVL Social',
      ...customData
    } = transactionData;

    const eventData = {
      transaction_id: transactionId,
      value: parseFloat(value),
      currency,
      affiliation,
      coupon,
      items: items.map(item => ({
        item_id: item.id || item.adventureId,
        item_name: item.name || item.title,
        category: item.category,
        quantity: item.quantity || 1,
        price: parseFloat(item.price),
        item_brand: item.vendor || 'TRVL Social',
        item_variant: item.variant,
        affiliation: item.affiliation || affiliation
      })),
      ...this.getCustomDimensionData(customData),
      ...customData
    };

    this.sendEvent('purchase', eventData);
  }

  /**
   * Enhanced ecommerce tracking - Begin Checkout
   */
  trackBeginCheckout(checkoutData) {
    const {
      value,
      currency = 'USD',
      items = [],
      coupon,
      ...customData
    } = checkoutData;

    const eventData = {
      currency,
      value: parseFloat(value),
      coupon,
      items: items.map(item => ({
        item_id: item.id || item.adventureId,
        item_name: item.name || item.title,
        category: item.category,
        quantity: item.quantity || 1,
        price: parseFloat(item.price)
      })),
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('begin_checkout', eventData);
  }

  /**
   * Enhanced ecommerce tracking - Add to Cart
   */
  trackAddToCart(itemData) {
    const {
      value,
      currency = 'USD',
      items = [],
      ...customData
    } = itemData;

    const eventData = {
      currency,
      value: parseFloat(value),
      items: items.map(item => ({
        item_id: item.id || item.adventureId,
        item_name: item.name || item.title,
        category: item.category,
        quantity: item.quantity || 1,
        price: parseFloat(item.price)
      })),
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('add_to_cart', eventData);
  }

  /**
   * Track search events
   */
  trackSearch(searchData) {
    const {
      searchTerm,
      searchResults,
      searchCategory,
      searchLocation,
      filters = {},
      ...customData
    } = searchData;

    const eventData = {
      search_term: searchTerm,
      search_results: searchResults,
      search_category: searchCategory,
      search_location: searchLocation,
      search_filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('search', eventData);
  }

  /**
   * Track user engagement events
   */
  trackEngagement(engagementData) {
    const {
      engagementType,
      engagementValue,
      contentType,
      contentId,
      ...customData
    } = engagementData;

    const eventData = {
      engagement_type: engagementType,
      engagement_value: engagementValue,
      content_type: contentType,
      content_id: contentId,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('engagement', eventData);
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionData) {
    const {
      conversionType,
      conversionValue,
      conversionCurrency = 'USD',
      ...customData
    } = conversionData;

    const eventData = {
      conversion_type: conversionType,
      value: parseFloat(conversionValue),
      currency: conversionCurrency,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('conversion', eventData);
  }

  /**
   * Track user signup
   */
  trackSignUp(signupData) {
    const {
      method,
      userType,
      source,
      ...customData
    } = signupData;

    const eventData = {
      method,
      user_type: userType,
      signup_source: source,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('sign_up', eventData);
  }

  /**
   * Track user login
   */
  trackLogin(loginData) {
    const {
      method,
      userType,
      ...customData
    } = loginData;

    const eventData = {
      method,
      user_type: userType,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('login', eventData);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties) {
    if (!this.isInitialized) {
      Object.assign(this.userProperties, properties);
      return;
    }

    // Convert properties to include custom dimensions
    const userProps = this.getCustomDimensionData(properties);

    window.gtag('config', this.measurementId, {
      user_properties: userProps
    });

    Object.assign(this.userProperties, properties);
  }

  /**
   * Set user ID for cross-device tracking
   */
  setUserId(userId) {
    if (!this.isInitialized) {
      this.userId = userId;
      return;
    }

    window.gtag('config', this.measurementId, {
      user_id: userId
    });
  }

  /**
   * Track timing events
   */
  trackTiming(timingData) {
    const {
      name,
      value,
      category = 'performance',
      label,
      ...customData
    } = timingData;

    const eventData = {
      timing_category: category,
      timing_label: label,
      value: parseInt(value),
      metric_name: name,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('timing_complete', eventData);
  }

  /**
   * Track exceptions
   */
  trackException(exceptionData) {
    const {
      description,
      fatal = false,
      ...customData
    } = exceptionData;

    const eventData = {
      description,
      fatal,
      ...this.getCustomDimensionData(customData)
    };

    this.sendEvent('exception', eventData);
  }

  /**
   * Convert custom data to custom dimension format
   */
  getCustomDimensionData(data) {
    const customDimensions = {};

    Object.entries(data).forEach(([key, value]) => {
      if (this.customDimensions[key]) {
        customDimensions[this.customDimensions[key]] = value;
      }
    });

    return customDimensions;
  }

  /**
   * Send event to GA4
   */
  sendEvent(eventName, eventData) {
    if (!this.isInitialized) {
      this.eventQueue.push({ eventName, eventData });
      return;
    }

    try {
      window.gtag('event', eventName, eventData);

      if (this.debugMode) {
        console.log('GA4 Event:', eventName, eventData);
      }
    } catch (error) {
      console.error('Failed to send GA4 event:', error);
    }
  }

  /**
   * Process queued events
   */
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const { eventName, eventData } = this.eventQueue.shift();
      this.sendEvent(eventName, eventData);
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;

    if (this.isInitialized) {
      window.gtag('config', this.measurementId, {
        debug_mode: enabled
      });
    }
  }

  /**
   * Opt out of tracking
   */
  optOut() {
    if (typeof window !== 'undefined') {
      window[`ga-disable-${this.measurementId}`] = true;
    }
  }

  /**
   * Opt in to tracking
   */
  optIn() {
    if (typeof window !== 'undefined') {
      window[`ga-disable-${this.measurementId}`] = false;
    }
  }

  /**
   * Get tracking status
   */
  getTrackingStatus() {
    return {
      initialized: this.isInitialized,
      consent_given: this.consentGiven,
      measurement_id: this.measurementId,
      debug_mode: this.debugMode,
      queued_events: this.eventQueue.length,
      opted_out: typeof window !== 'undefined' ? window[`ga-disable-${this.measurementId}`] : false
    };
  }

  /**
   * Clear all data
   */
  clearData() {
    this.userProperties = {};
    this.eventQueue = [];

    if (this.isInitialized) {
      window.gtag('config', this.measurementId, {
        user_id: undefined,
        user_properties: {}
      });
    }
  }
}

// Create singleton instance
const googleAnalyticsService = new GoogleAnalyticsService();

export default googleAnalyticsService;
export { GoogleAnalyticsService };
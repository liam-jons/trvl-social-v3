import mixpanel from 'mixpanel-browser';
class MixpanelService {
  constructor() {
    this.isInitialized = false;
    this.eventQueue = [];
    this.isOnline = navigator.onLine;
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEventQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  // Initialize Mixpanel
  init() {
    if (this.isInitialized) return;
    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    if (!token || token === 'YOUR_MIXPANEL_TOKEN_HERE') {
      console.warn('Mixpanel token not configured. Analytics disabled.');
      return;
    }
    const isProduction = import.meta.env.NODE_ENV === 'production';
    mixpanel.init(token, {
      debug: !isProduction,
      track_pageview: false, // We'll handle this manually
      persistence: 'localStorage',
      api_host: 'https://api.mixpanel.com',
      loaded: () => {
        console.log('Mixpanel loaded successfully');
      },
      // Sampling configuration for cost optimization
      loaded_callback: () => {
        // Set sampling rate based on environment
        const sampleRate = isProduction ? 0.1 : 1.0; // 10% in prod, 100% in dev
        mixpanel.set_config({
          ignore_dnt: false,
          batch_requests: true,
          batch_size: 50,
          batch_flush_interval_ms: 5000,
          sample_rate: sampleRate
        });
      }
    });
    this.isInitialized = true;
    this.flushEventQueue();
  }
  // Event naming conventions
  static EVENT_NAMES = {
    // Page Views
    PAGE_VIEW: 'Page View',
    // Authentication
    USER_SIGNUP: 'User Signup',
    USER_LOGIN: 'User Login',
    USER_LOGOUT: 'User Logout',
    ONBOARDING_COMPLETED: 'Onboarding Completed',
    // Adventure & Search
    ADVENTURE_SEARCH: 'Adventure Search',
    ADVENTURE_VIEW: 'Adventure View',
    ADVENTURE_SHARE: 'Adventure Share',
    ADVENTURE_SAVE: 'Adventure Save',
    ADVENTURE_UNSAVE: 'Adventure Unsave',
    // Booking Funnel
    BOOKING_INITIATED: 'Booking Initiated',
    BOOKING_PAYMENT_INFO: 'Booking Payment Info Entered',
    BOOKING_COMPLETED: 'Booking Completed',
    BOOKING_CANCELLED: 'Booking Cancelled',
    BOOKING_FAILED: 'Booking Failed',
    // Group Interactions
    GROUP_CREATED: 'Group Created',
    GROUP_JOINED: 'Group Joined',
    GROUP_LEFT: 'Group Left',
    GROUP_INVITATION_SENT: 'Group Invitation Sent',
    GROUP_MESSAGE_SENT: 'Group Message Sent',
    GROUP_COMPATIBILITY_VIEWED: 'Group Compatibility Viewed',
    // Vendor Actions
    VENDOR_PROFILE_CREATED: 'Vendor Profile Created',
    VENDOR_LISTING_CREATED: 'Vendor Listing Created',
    VENDOR_LISTING_UPDATED: 'Vendor Listing Updated',
    VENDOR_DASHBOARD_VIEWED: 'Vendor Dashboard Viewed',
    VENDOR_ANALYTICS_VIEWED: 'Vendor Analytics Viewed',
    // Personality Assessment
    ASSESSMENT_STARTED: 'Personality Assessment Started',
    ASSESSMENT_COMPLETED: 'Personality Assessment Completed',
    ASSESSMENT_ABANDONED: 'Personality Assessment Abandoned',
    // Notifications
    NOTIFICATION_RECEIVED: 'Notification Received',
    NOTIFICATION_OPENED: 'Notification Opened',
    NOTIFICATION_DISMISSED: 'Notification Dismissed',
    // Errors
    ERROR_OCCURRED: 'Error Occurred'
  };
  // User identification
  identify(userId, userData = {}) {
    if (!this.isInitialized) return;
    mixpanel.identify(userId);
    this.setUserProperties(userData);
  }
  // Set user properties for segmentation
  setUserProperties(properties) {
    if (!this.isInitialized) return;
    // Standardize user properties
    const userProps = {
      $email: properties.email,
      $name: properties.full_name || properties.name,
      $avatar: properties.avatar_url,
      $created: properties.created_at,
      // Custom properties
      user_type: properties.user_type || 'traveler', // traveler, vendor, admin
      subscription_status: properties.subscription_status || 'free',
      assessment_completed: properties.assessment_completed || false,
      personality_type: properties.personality_type,
      travel_preferences: properties.travel_preferences,
      location: properties.location,
      age_group: properties.age_group,
      total_bookings: properties.total_bookings || 0,
      total_groups: properties.total_groups || 0,
      last_active: new Date().toISOString(),
      // Vendor specific
      ...(properties.user_type === 'vendor' && {
        vendor_category: properties.vendor_category,
        vendor_verified: properties.vendor_verified || false,
        total_listings: properties.total_listings || 0,
        average_rating: properties.average_rating
      })
    };
    mixpanel.people.set(userProps);
  }
  // Track events
  track(eventName, properties = {}) {
    const eventData = {
      ...properties,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    };
    if (this.isOnline && this.isInitialized) {
      mixpanel.track(eventName, eventData);
    } else {
      // Queue events when offline or not initialized
      this.eventQueue.push({ eventName, properties: eventData });
    }
  }
  // Flush queued events
  flushEventQueue() {
    if (!this.isInitialized || this.eventQueue.length === 0) return;
    this.eventQueue.forEach(({ eventName, properties }) => {
      mixpanel.track(eventName, properties);
    });
    this.eventQueue = [];
  }
  // Page tracking
  trackPageView(pageName, properties = {}) {
    this.track(MixpanelService.EVENT_NAMES.PAGE_VIEW, {
      page_name: pageName,
      page_title: document.title,
      ...properties
    });
  }
  // Adventure search tracking
  trackAdventureSearch(searchParams) {
    this.track(MixpanelService.EVENT_NAMES.ADVENTURE_SEARCH, {
      search_query: searchParams.query,
      location: searchParams.location,
      date_range: searchParams.dateRange,
      group_size: searchParams.groupSize,
      budget_range: searchParams.budgetRange,
      activity_type: searchParams.activityType,
      filters_applied: searchParams.filtersApplied,
      results_count: searchParams.resultsCount,
      search_duration: searchParams.searchDuration
    });
  }
  // Booking funnel tracking
  trackBookingFunnel(stage, bookingData) {
    const eventMap = {
      initiated: MixpanelService.EVENT_NAMES.BOOKING_INITIATED,
      payment_info: MixpanelService.EVENT_NAMES.BOOKING_PAYMENT_INFO,
      completed: MixpanelService.EVENT_NAMES.BOOKING_COMPLETED,
      cancelled: MixpanelService.EVENT_NAMES.BOOKING_CANCELLED,
      failed: MixpanelService.EVENT_NAMES.BOOKING_FAILED
    };
    this.track(eventMap[stage], {
      booking_id: bookingData.bookingId,
      adventure_id: bookingData.adventureId,
      adventure_title: bookingData.adventureTitle,
      vendor_id: bookingData.vendorId,
      total_amount: bookingData.totalAmount,
      currency: bookingData.currency,
      group_size: bookingData.groupSize,
      booking_date: bookingData.bookingDate,
      payment_method: bookingData.paymentMethod,
      ...(stage === 'failed' && { error_code: bookingData.errorCode })
    });
  }
  // Group interaction tracking
  trackGroupInteraction(action, groupData) {
    const eventMap = {
      created: MixpanelService.EVENT_NAMES.GROUP_CREATED,
      joined: MixpanelService.EVENT_NAMES.GROUP_JOINED,
      left: MixpanelService.EVENT_NAMES.GROUP_LEFT,
      invitation_sent: MixpanelService.EVENT_NAMES.GROUP_INVITATION_SENT,
      message_sent: MixpanelService.EVENT_NAMES.GROUP_MESSAGE_SENT,
      compatibility_viewed: MixpanelService.EVENT_NAMES.GROUP_COMPATIBILITY_VIEWED
    };
    this.track(eventMap[action], {
      group_id: groupData.groupId,
      group_type: groupData.groupType,
      group_size: groupData.groupSize,
      adventure_id: groupData.adventureId,
      compatibility_score: groupData.compatibilityScore
    });
  }
  // Vendor action tracking
  trackVendorAction(action, vendorData) {
    const eventMap = {
      profile_created: MixpanelService.EVENT_NAMES.VENDOR_PROFILE_CREATED,
      listing_created: MixpanelService.EVENT_NAMES.VENDOR_LISTING_CREATED,
      listing_updated: MixpanelService.EVENT_NAMES.VENDOR_LISTING_UPDATED,
      dashboard_viewed: MixpanelService.EVENT_NAMES.VENDOR_DASHBOARD_VIEWED,
      analytics_viewed: MixpanelService.EVENT_NAMES.VENDOR_ANALYTICS_VIEWED
    };
    this.track(eventMap[action], {
      vendor_id: vendorData.vendorId,
      listing_id: vendorData.listingId,
      category: vendorData.category,
      listing_type: vendorData.listingType,
      price_range: vendorData.priceRange
    });
  }
  // Error tracking
  trackError(error, context = {}) {
    this.track(MixpanelService.EVENT_NAMES.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      error_type: error.name,
      context,
      user_id: mixpanel.get_distinct_id()
    });
  }
  // Create conversion funnel
  createFunnel(funnelName, steps) {
    // Mixpanel funnels are created in the dashboard, but we can track funnel steps
    steps.forEach((step, index) => {
      this.track(`${funnelName} - ${step}`, {
        funnel_step: index + 1,
        funnel_name: funnelName
      });
    });
  }
  // A/B testing support
  trackExperiment(experimentName, variant, properties = {}) {
    this.track(`Experiment: ${experimentName}`, {
      experiment_name: experimentName,
      variant,
      ...properties
    });
  }
  // Reset user (logout)
  reset() {
    if (!this.isInitialized) return;
    mixpanel.reset();
  }
  // Opt out user
  optOut() {
    if (!this.isInitialized) return;
    mixpanel.opt_out_tracking();
  }
  // Opt in user
  optIn() {
    if (!this.isInitialized) return;
    mixpanel.opt_in_tracking();
  }
  // Get user properties
  getUserProperties() {
    if (!this.isInitialized) return {};
    return mixpanel.people.get_property() || {};
  }
  // Custom cohort analysis
  trackCohortEvent(eventName, cohortData) {
    this.track(eventName, {
      ...cohortData,
      cohort_date: cohortData.cohortDate,
      cohort_type: cohortData.cohortType
    });
  }
}
// Create singleton instance
const mixpanelService = new MixpanelService();
export default mixpanelService;
export { MixpanelService };
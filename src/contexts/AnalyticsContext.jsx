import React, { createContext, useContext, useEffect, useState } from 'react';
import gdprAnalyticsService from '../services/gdpr-analytics-service.js';
import abTestingService from '../services/ab-testing-service.js';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

const AnalyticsContext = createContext({});

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isABTestingInitialized, setIsABTestingInitialized] = useState(false);
  const { user } = useAuth();

  // Initialize analytics services
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await gdprAnalyticsService.init();
        setIsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);

  // Initialize A/B testing service
  useEffect(() => {
    const initializeABTesting = async () => {
      try {
        await abTestingService.init();
        setIsABTestingInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize A/B testing:', error);
      }
    };

    initializeABTesting();
  }, []);

  // Identify user when auth state changes
  useEffect(() => {
    if (isInitialized && user) {
      gdprAnalyticsService.identifyUser(user.id, {
        email: user.email,
        full_name: user.user_metadata?.full_name,
        user_type: user.user_metadata?.user_type || 'traveler',
        subscription_status: user.user_metadata?.subscription_status || 'free',
        assessment_completed: user.user_metadata?.assessment_completed || false,
        created_at: user.created_at,
        total_bookings: user.user_metadata?.total_bookings || 0,
        total_groups: user.user_metadata?.total_groups || 0,
        personality_type: user.user_metadata?.personality_type,
        travel_preferences: user.user_metadata?.travel_preferences,
        location: user.user_metadata?.location,
        age_group: user.user_metadata?.age_group
      });
    } else if (isInitialized && !user) {
      // Clear user data on logout
      gdprAnalyticsService.clearUser();
    }
  }, [isInitialized, user]);

  // Track page views on route changes
  useEffect(() => {
    if (!isInitialized) return;

    const trackPageView = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const pageName = getPageNameFromPath(path);

      gdprAnalyticsService.trackPageView(pageName, {
        path,
        search,
        referrer: document.referrer,
        user_type: user?.user_metadata?.user_type || 'anonymous',
        is_authenticated: !!user
      });
    };

    // Track initial page load
    trackPageView();

    // Listen for navigation changes
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        trackPageView();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [isInitialized, user]);

  // Flush analytics data before page unload
  useEffect(() => {
    if (!isInitialized) return;

    const handleBeforeUnload = () => {
      gdprAnalyticsService.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInitialized]);

  // Get current context for A/B testing
  const getCurrentContext = () => ({
    currentPage: window.location.pathname,
    country: user?.user_metadata?.country,
    userAgent: navigator.userAgent
  });

  // A/B Testing methods
  const getExperimentVariant = (experimentId) => {
    if (!isABTestingInitialized) return null;
    const context = getCurrentContext();
    return abTestingService.getUserVariant(experimentId, user, context);
  };

  const isFeatureEnabled = (flagId) => {
    if (!isABTestingInitialized) return false;
    const context = getCurrentContext();
    return abTestingService.isFeatureEnabled(flagId, user, context);
  };

  const trackExperimentEvent = (experimentId, eventName, properties = {}) => {
    if (!isABTestingInitialized) return;
    abTestingService.trackExperimentEvent(experimentId, eventName, properties, user);
  };

  const contextValue = {
    isInitialized,
    isABTestingInitialized,

    // Event tracking methods
    trackEvent: gdprAnalyticsService.trackEvent.bind(gdprAnalyticsService),
    trackPageView: gdprAnalyticsService.trackPageView.bind(gdprAnalyticsService),
    trackError: gdprAnalyticsService.trackError.bind(gdprAnalyticsService),

    // Business-specific tracking
    trackAdventureSearch: gdprAnalyticsService.trackAdventureSearch.bind(gdprAnalyticsService),
    trackBookingFunnel: gdprAnalyticsService.trackBookingFunnel.bind(gdprAnalyticsService),
    trackGroupInteraction: gdprAnalyticsService.trackGroupInteraction.bind(gdprAnalyticsService),
    trackVendorAction: gdprAnalyticsService.trackVendorAction.bind(gdprAnalyticsService),
    trackAPICall: gdprAnalyticsService.trackAPICall.bind(gdprAnalyticsService),

    // Performance and feature tracking
    startPerformanceTracking: gdprAnalyticsService.startPerformanceTracking.bind(gdprAnalyticsService),
    trackFeatureUsage: gdprAnalyticsService.trackFeatureUsage.bind(gdprAnalyticsService),
    trackExperiment: gdprAnalyticsService.trackExperiment.bind(gdprAnalyticsService),
    trackUserJourney: gdprAnalyticsService.trackUserJourney.bind(gdprAnalyticsService),
    trackBusinessKPI: gdprAnalyticsService.trackBusinessKPI.bind(gdprAnalyticsService),

    // A/B Testing and Feature Flags
    getExperimentVariant,
    isFeatureEnabled,
    trackExperimentEvent,
    abTestingService: isABTestingInitialized ? abTestingService : null,

    // Privacy controls
    optOut: gdprAnalyticsService.optOut?.bind(gdprAnalyticsService),
    optIn: gdprAnalyticsService.optIn?.bind(gdprAnalyticsService),

    // Debugging
    getHealthStatus: gdprAnalyticsService.getHealthStatus.bind(gdprAnalyticsService)
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Helper function to extract page names from paths
function getPageNameFromPath(path) {
  const pathMap = {
    '/': 'Home',
    '/login': 'Login',
    '/register': 'Register',
    '/dashboard': 'Dashboard',
    '/adventures': 'Adventures',
    '/community': 'Community',
    '/groups': 'Groups',
    '/vendors': 'Vendors',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/quiz': 'Personality Quiz',
    '/search': 'Search',
    '/wishlist': 'Wishlist',
    '/onboarding': 'Onboarding',
    '/trips': 'Trips'
  };

  // Check for exact matches first
  if (pathMap[path]) {
    return pathMap[path];
  }

  // Handle dynamic routes
  if (path.startsWith('/adventures/')) {
    return 'Adventure Detail';
  }
  if (path.startsWith('/groups/')) {
    if (path.includes('/recommendations')) {
      return 'Group Recommendations';
    }
    return 'Group Detail';
  }
  if (path.startsWith('/vendors/')) {
    return 'Vendor Detail';
  }
  if (path.startsWith('/vendor-portal')) {
    return 'Vendor Portal';
  }
  if (path.startsWith('/quiz/')) {
    if (path.includes('results')) {
      return 'Quiz Results';
    }
    if (path.includes('history')) {
      return 'Quiz History';
    }
    return 'Personality Quiz';
  }
  if (path.startsWith('/auth/')) {
    return 'Auth';
  }
  if (path.startsWith('/trips/')) {
    return 'Trip Request';
  }

  // Default fallback
  return path.replace(/^\/+|\/+$/g, '') || 'Unknown Page';
}

export default AnalyticsProvider;
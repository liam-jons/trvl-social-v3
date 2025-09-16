/**
 * GDPR Compliance Hook
 * Provides easy access to GDPR functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
import gdprConsentService from '../services/gdpr-consent-service';
import gdprAnalyticsService from '../services/gdpr-analytics-service';

export const useGDPRCompliance = () => {
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load consent status
  const loadConsentStatus = useCallback(async () => {
    try {
      setLoading(true);
      await gdprConsentService.init();
      const status = gdprConsentService.getConsentStatus();
      setConsentStatus(status);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load GDPR consent status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadConsentStatus();

    // Listen for consent changes
    const removeListener = gdprConsentService.addEventListener((eventType) => {
      if (eventType === 'consentChanged' || eventType === 'multipleConsentChanged' || eventType === 'consentCleared') {
        loadConsentStatus();
      }
    });

    return removeListener;
  }, [loadConsentStatus]);

  // Set consent for a category
  const setConsent = useCallback((category, enabled) => {
    return gdprConsentService.setConsent(category, enabled, true);
  }, []);

  // Set consent for multiple categories
  const setMultipleConsent = useCallback((consents) => {
    return gdprConsentService.setMultipleConsent(consents, true);
  }, []);

  // Accept all consent categories
  const acceptAll = useCallback(() => {
    return gdprConsentService.acceptAll();
  }, []);

  // Reject all non-essential consent categories
  const rejectAll = useCallback(() => {
    return gdprConsentService.rejectAll();
  }, []);

  // Check if consent is given for category
  const hasConsent = useCallback((category) => {
    return gdprConsentService.hasConsent(category);
  }, []);

  // Check if banner should be shown
  const shouldShowBanner = useCallback(() => {
    return gdprConsentService.shouldShowBanner();
  }, []);

  // Export user data
  const exportUserData = useCallback(async (userId) => {
    try {
      const exportData = await gdprConsentService.exportUserData(userId);

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privacy-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }, []);

  // Delete user data
  const deleteUserData = useCallback(async (userId, categories = []) => {
    try {
      return await gdprConsentService.deleteUserData(userId, categories);
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw error;
    }
  }, []);

  // Get audit trail
  const getAuditTrail = useCallback((limit = 100) => {
    return gdprConsentService.getAuditTrail(limit);
  }, []);

  // Generate compliance report
  const generateComplianceReport = useCallback(() => {
    return gdprConsentService.generateComplianceReport();
  }, []);

  // Clear all consent
  const clearAllConsent = useCallback(() => {
    return gdprConsentService.clearAllConsent();
  }, []);

  // Analytics methods with consent awareness
  const analytics = {
    canTrack: useCallback(() => {
      return gdprAnalyticsService.canTrackAnalytics();
    }, []),

    canTrackMarketing: useCallback(() => {
      return gdprAnalyticsService.canTrackMarketing();
    }, []),

    trackEvent: useCallback((eventName, properties) => {
      return gdprAnalyticsService.trackEvent(eventName, properties);
    }, []),

    trackPageView: useCallback((pageName, properties) => {
      return gdprAnalyticsService.trackPageView(pageName, properties);
    }, []),

    identifyUser: useCallback((userId, userData) => {
      return gdprAnalyticsService.identifyUser(userId, userData);
    }, []),

    clearUser: useCallback(() => {
      return gdprAnalyticsService.clearUser();
    }, []),

    getHealthStatus: useCallback(() => {
      return gdprAnalyticsService.getHealthStatus();
    }, [])
  };

  return {
    // State
    consentStatus,
    loading,
    isInitialized,

    // Consent management
    setConsent,
    setMultipleConsent,
    acceptAll,
    rejectAll,
    hasConsent,
    shouldShowBanner,

    // Data rights
    exportUserData,
    deleteUserData,
    clearAllConsent,

    // Audit and compliance
    getAuditTrail,
    generateComplianceReport,

    // Analytics
    analytics,

    // Utility
    refresh: loadConsentStatus
  };
};

export default useGDPRCompliance;
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import gdprConsentService from '../../services/gdpr-consent-service';
const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Initialize and check if banner should be shown
    const initializeBanner = async () => {
      await gdprConsentService.init();
      const status = gdprConsentService.getConsentStatus();
      setConsentStatus(status);
      const shouldShow = gdprConsentService.shouldShowBanner();
      setIsVisible(shouldShow);
      if (shouldShow) {
        gdprConsentService.markBannerShown();
      }
    };
    initializeBanner();
    // Listen for consent changes
    const removeListener = gdprConsentService.addEventListener((eventType, data) => {
      if (eventType === 'consentChanged' || eventType === 'multipleConsentChanged') {
        setConsentStatus(gdprConsentService.getConsentStatus());
      }
    });
    return removeListener;
  }, []);
  const handleAcceptAll = async () => {
    setLoading(true);
    try {
      await gdprConsentService.acceptAll();
      setIsVisible(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleRejectAll = async () => {
    setLoading(true);
    try {
      await gdprConsentService.rejectAll();
      setIsVisible(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleCategoryToggle = (category, enabled) => {
    gdprConsentService.setConsent(category, enabled, true);
  };
  const handleSavePreferences = () => {
    setIsVisible(false);
  };
  if (!isVisible || !consentStatus) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <Card className="mx-4 mb-4 max-w-4xl bg-white shadow-2xl">
        <div className="p-6">
          {!showDetails ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    We value your privacy
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    We use cookies and similar technologies to enhance your experience,
                    analyze site usage, and assist with marketing efforts. You can customize
                    your preferences or accept all cookies.
                  </p>
                  {consentStatus.requiresExplicitConsent && (
                    <p className="mt-2 text-xs text-blue-600">
                      {consentStatus.region === 'EU' && "GDPR compliance: "}
                      {consentStatus.region === 'UK' && "UK GDPR compliance: "}
                      {consentStatus.region === 'CA' && "PIPEDA compliance: "}
                      Explicit consent required for data processing.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
                <Button
                  onClick={handleAcceptAll}
                  disabled={loading}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {loading ? 'Processing...' : 'Accept All'}
                </Button>
                <Button
                  onClick={handleRejectAll}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {loading ? 'Processing...' : 'Reject All'}
                </Button>
                <Button
                  onClick={() => setShowDetails(true)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Customize Preferences
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                By continuing to use our site, you agree to our{' '}
                <a href="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/cookie-policy" className="text-blue-600 hover:underline">
                  Cookie Policy
                </a>
                .
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Privacy Preferences
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Choose which types of cookies you're comfortable with. You can change
                  these settings at any time.
                </p>
              </div>
              <div className="space-y-4">
                {Object.entries(consentStatus.categories).map(([category, info]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{info.name}</h4>
                          {info.required && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{info.description}</p>
                        {info.purposes && info.purposes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700">Used for:</p>
                            <ul className="mt-1 text-xs text-gray-600">
                              {info.purposes.map((purpose, index) => (
                                <li key={index}>• {purpose}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={info.enabled}
                            disabled={info.required}
                            onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {info.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
                <Button
                  onClick={handleSavePreferences}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Preferences
                </Button>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </Button>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-gray-900">Data Retention</h5>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>• Analytics data: Retained for 24 months</p>
                  <p>• Marketing data: Retained for 12 months</p>
                  <p>• Essential data: Retained for account duration</p>
                  <p>• Consent records: Retained for 7 years (compliance)</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-gray-900">Your Rights</h5>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>• Access your personal data</p>
                  <p>• Correct inaccurate data</p>
                  <p>• Delete your data</p>
                  <p>• Export your data</p>
                  <p>• Object to processing</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
export default CookieConsentBanner;
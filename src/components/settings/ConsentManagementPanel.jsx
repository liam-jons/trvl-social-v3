import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../ui/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const ConsentManagementPanel = () => {
  const { user } = useAuth();
  const [consents, setConsents] = useState({
    allow_analytics: true,
    allow_marketing: false,
    allow_personalization: true,
    allow_third_party_sharing: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    loadConsents();
  }, [user]);

  const loadConsents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('allow_analytics, allow_marketing, allow_personalization, allow_third_party_sharing')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading consents:', error);
        return;
      }

      if (data) {
        setConsents({
          allow_analytics: data.allow_analytics ?? true,
          allow_marketing: data.allow_marketing ?? false,
          allow_personalization: data.allow_personalization ?? true,
          allow_third_party_sharing: data.allow_third_party_sharing ?? false
        });
      }
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (consentType, value) => {
    const newConsents = {
      ...consents,
      [consentType]: value
    };
    setConsents(newConsents);

    // Save to database
    setSaving(true);
    setSaveStatus(null);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [consentType]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update analytics consent in real-time if applicable
      if (consentType === 'allow_analytics') {
        if (window.mixpanel) {
          if (value) {
            window.mixpanel.opt_in_tracking();
          } else {
            window.mixpanel.opt_out_tracking();
          }
        }
      }

      setSaveStatus({
        type: 'success',
        message: 'Preference saved successfully'
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);

    } catch (error) {
      console.error('Error saving consent:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save preference'
      });

      // Revert the change
      setConsents(consents);
    } finally {
      setSaving(false);
    }
  };

  const consentOptions = [
    {
      id: 'allow_analytics',
      title: 'Analytics & Performance',
      description: 'Allow us to collect anonymous usage data to improve our service. This includes page views, feature usage, and performance metrics.',
      purposes: [
        'Understand how you use our platform',
        'Identify and fix bugs',
        'Improve user experience and features',
        'Measure feature adoption and engagement'
      ],
      required: false,
      providers: ['Mixpanel', 'Google Analytics', 'Sentry']
    },
    {
      id: 'allow_marketing',
      title: 'Marketing Communications',
      description: 'Receive personalized emails about new features, travel deals, adventure recommendations, and special offers.',
      purposes: [
        'Send promotional emails and newsletters',
        'Notify you about special offers and deals',
        'Share personalized travel recommendations',
        'Announce new features and updates'
      ],
      required: false,
      providers: ['Mailchimp', 'SendGrid', 'Customer.io']
    },
    {
      id: 'allow_personalization',
      title: 'Personalization & Recommendations',
      description: 'Use your activity and preferences to provide personalized adventure recommendations, match you with compatible travelers, and customize your experience.',
      purposes: [
        'Recommend adventures based on your interests',
        'Match you with compatible travel companions',
        'Customize your feed and search results',
        'Improve trip planning suggestions'
      ],
      required: false,
      providers: ['Internal ML Models', 'Content Recommendation Engine']
    },
    {
      id: 'allow_third_party_sharing',
      title: 'Third-Party Service Integration',
      description: 'Share necessary data with trusted partners to enable bookings, payments, and enhanced features (e.g., Stripe for payments, map providers for location services).',
      purposes: [
        'Process payments securely via Stripe',
        'Display maps and location information',
        'Enable social sharing features',
        'Provide customer support integrations'
      ],
      required: false,
      providers: ['Stripe', 'Google Maps', 'WhatsApp Business']
    }
  ];

  if (loading) {
    return (
      <GlassCard>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Consent Management
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control how we use your data. You can change these preferences at any time.
        </p>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveStatus.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {saveStatus.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-sm ${
              saveStatus.type === 'success'
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {saveStatus.message}
            </p>
          </div>
        </div>
      )}

      {/* Essential Notice */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-1">Essential Services (Always Active)</p>
            <p>
              Some data processing is essential for our service to function (account authentication,
              booking management, secure payments). These cannot be disabled but are only used for
              their stated purpose.
            </p>
          </div>
        </div>
      </div>

      {/* Consent Options */}
      <div className="space-y-4">
        {consentOptions.map((option) => (
          <div
            key={option.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {option.title}
                  </h4>
                  {consents[option.id] && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={consents[option.id]}
                  onChange={(e) => handleConsentChange(option.id, e.target.checked)}
                  disabled={option.required || saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {/* Expandable Details */}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                View details
              </summary>
              <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Used for:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {option.purposes.map((purpose, idx) => (
                      <li key={idx}>• {purpose}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service providers:
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {option.providers.join(', ')}
                  </p>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your consent choices are saved automatically and take effect immediately. For more information
          about how we process your data, please review our{' '}
          <a
            href="/legal/privacy"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>.
        </p>
      </div>
    </GlassCard>
  );
};

export default ConsentManagementPanel;

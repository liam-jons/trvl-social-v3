import { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import useNotificationStore from '../../stores/notificationStore';

const NotificationPreferences = () => {
  const {
    preferences,
    permission,
    loading,
    error,
    updatePreferences,
    requestPermission
  } = useNotificationStore();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when store preferences change
  useEffect(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences]);

  const handlePreferenceChange = (key, value) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSavePreferences = async () => {
    const success = await updatePreferences(localPreferences);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleResetPreferences = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const handleEnableNotifications = async () => {
    const newPermission = await requestPermission();
    if (newPermission === 'granted') {
      handlePreferenceChange('pushNotifications', true);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Enabled', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' };
      case 'denied':
        return { text: 'Blocked', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20' };
      default:
        return { text: 'Not set', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <GlassCard>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6">Notification Preferences</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Permission Status */}
        <div className="mb-6 p-4 rounded-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Browser Permissions</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Allow TRVL Social to send you push notifications
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${permissionStatus.bg} ${permissionStatus.color}`}>
                {permissionStatus.text}
              </span>
              {permission !== 'granted' && (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={handleEnableNotifications}
                >
                  Enable
                </GlassButton>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications directly in your browser
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.pushNotifications}
                onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                className="sr-only peer"
                disabled={permission !== 'granted'}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications via email as backup
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Notification Categories */}
          <div className="border-t border-white/20 pt-6">
            <h4 className="font-medium mb-4">Notification Types</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Vendor Offers</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    New adventure offers from vendors
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.vendorOffers}
                    onChange={(e) => handlePreferenceChange('vendorOffers', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Booking Updates</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Confirmation, reminders, and changes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.bookingUpdates}
                    onChange={(e) => handlePreferenceChange('bookingUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Group Invitations</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Invites to join travel groups
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.groupInvitations}
                    onChange={(e) => handlePreferenceChange('groupInvitations', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Marketing Emails</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Special offers and travel tips
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.marketingEmails}
                    onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="border-t border-white/20 pt-6">
            <h4 className="font-medium mb-4">Notification Frequency</h4>
            <div className="space-y-2">
              {[
                { value: 'immediate', label: 'Immediate', description: 'Get notified right away' },
                { value: 'daily_digest', label: 'Daily Digest', description: 'Once per day summary' },
                { value: 'weekly_digest', label: 'Weekly Digest', description: 'Weekly summary' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={localPreferences.frequency === option.value}
                    onChange={(e) => handlePreferenceChange('frequency', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="mt-8 flex space-x-3 pt-6 border-t border-white/20">
            <GlassButton
              variant="primary"
              onClick={handleSavePreferences}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </GlassButton>
            <GlassButton
              variant="secondary"
              onClick={handleResetPreferences}
              disabled={loading}
            >
              Reset
            </GlassButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default NotificationPreferences;
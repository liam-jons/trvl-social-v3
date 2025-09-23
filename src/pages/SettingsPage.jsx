import { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  CogIcon,
  EyeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import NotificationPreferences from '../components/settings/NotificationPreferences';
import PrivacyPreferenceCenter from '../components/settings/PrivacyPreferenceCenter';
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account'); // account, notifications, privacy, preferences
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Adventure seeker and travel enthusiast. Love exploring new cultures and meeting fellow travelers!',
    avatar_url: '',
    travel_preferences: {
      budget_range: 'medium',
      accommodation_type: 'hotel',
      group_size_preference: 'small',
      adventure_level: 'moderate'
    }
  });
  const [generalSettings, setGeneralSettings] = useState({
    currency: 'USD',
    language: 'en',
    timezone: 'America/Los_Angeles',
    measurement_unit: 'imperial',
    date_format: 'MM/DD/YYYY'
  });
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    show_location: true,
    allow_messages_from: 'friends',
    search_engine_indexing: true
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleProfileChange = (field, value) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  const handleTravelPreferenceChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      travel_preferences: { ...prev.travel_preferences, [field]: value }
    }));
    setHasChanges(true);
  };
  const handleGeneralSettingChange = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  const handlePrivacySettingChange = (field, value) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      // Show success message
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };
  const handleResetChanges = () => {
    // Reset to original values (would fetch from API in real app)
    setHasChanges(false);
  };
  const tabs = [
    { id: 'account', label: 'Account', icon: UserCircleIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
    { id: 'preferences', label: 'Preferences', icon: CogIcon }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your account, preferences, and privacy settings
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <GlassCard className="sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                      <ArrowRightIcon className="h-4 w-4 ml-auto" />
                    </button>
                  );
                })}
              </nav>
            </GlassCard>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Profile Information */}
                <GlassCard>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Profile Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassInput
                      label="Full Name"
                      value={userProfile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      required
                    />
                    <GlassInput
                      label="Email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      required
                    />
                    <GlassInput
                      label="Phone Number"
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                    />
                    <GlassInput
                      label="Location"
                      value={userProfile.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                    />
                  </div>
                  <div className="mt-6">
                    <GlassInput
                      label="Bio"
                      type="textarea"
                      value={userProfile.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </GlassCard>
                {/* Travel Preferences */}
                <GlassCard>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Travel Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Budget Range
                      </label>
                      <select
                        value={userProfile.travel_preferences.budget_range}
                        onChange={(e) => handleTravelPreferenceChange('budget_range', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="budget">Budget ($50-100/day)</option>
                        <option value="medium">Medium ($100-200/day)</option>
                        <option value="luxury">Luxury ($200+/day)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Accommodation Type
                      </label>
                      <select
                        value={userProfile.travel_preferences.accommodation_type}
                        onChange={(e) => handleTravelPreferenceChange('accommodation_type', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="hostel">Hostel</option>
                        <option value="hotel">Hotel</option>
                        <option value="airbnb">Airbnb</option>
                        <option value="resort">Resort</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Group Size Preference
                      </label>
                      <select
                        value={userProfile.travel_preferences.group_size_preference}
                        onChange={(e) => handleTravelPreferenceChange('group_size_preference', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="solo">Solo Travel</option>
                        <option value="small">Small (2-4 people)</option>
                        <option value="medium">Medium (5-8 people)</option>
                        <option value="large">Large (9+ people)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Adventure Level
                      </label>
                      <select
                        value={userProfile.travel_preferences.adventure_level}
                        onChange={(e) => handleTravelPreferenceChange('adventure_level', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="relaxed">Relaxed</option>
                        <option value="moderate">Moderate</option>
                        <option value="adventurous">Adventurous</option>
                        <option value="extreme">Extreme</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>
                {/* Account Security */}
                <GlassCard>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Account Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Password</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last changed 3 months ago
                        </p>
                      </div>
                      <GlassButton variant="secondary">
                        Change Password
                      </GlassButton>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <GlassButton variant="primary">
                        Enable 2FA
                      </GlassButton>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Login Sessions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Manage devices that are logged into your account
                        </p>
                      </div>
                      <GlassButton variant="secondary">
                        Manage Sessions
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
            {/* Notifications Tab */}
            {activeTab === 'notifications' && <NotificationPreferences />}
            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Privacy Settings */}
                <GlassCard>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Privacy Settings
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Profile Visibility</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Who can see your profile information
                        </p>
                      </div>
                      <select
                        value={privacySettings.profile_visibility}
                        onChange={(e) => handlePrivacySettingChange('profile_visibility', e.target.value)}
                        className="px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Show Email Address</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow others to see your email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_email}
                          onChange={(e) => handlePrivacySettingChange('show_email', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Show Phone Number</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow others to see your phone number
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_phone}
                          onChange={(e) => handlePrivacySettingChange('show_phone', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Show Location</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow others to see your location
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_location}
                          onChange={(e) => handlePrivacySettingChange('show_location', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Allow Messages From</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Who can send you direct messages
                        </p>
                      </div>
                      <select
                        value={privacySettings.allow_messages_from}
                        onChange={(e) => handlePrivacySettingChange('allow_messages_from', e.target.value)}
                        className="px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends">Friends Only</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>
                {/* GDPR Privacy Center */}
                <PrivacyPreferenceCenter />
              </div>
            )}
            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <GlassCard>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  General Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => handleGeneralSettingChange('currency', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => handleGeneralSettingChange('language', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => handleGeneralSettingChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="Europe/London">GMT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Measurement Unit
                    </label>
                    <select
                      value={generalSettings.measurement_unit}
                      onChange={(e) => handleGeneralSettingChange('measurement_unit', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="imperial">Imperial (miles, °F)</option>
                      <option value="metric">Metric (km, °C)</option>
                    </select>
                  </div>
                </div>
              </GlassCard>
            )}
            {/* Save Changes Button */}
            {hasChanges && ['account', 'privacy', 'preferences'].includes(activeTab) && (
              <div className="flex items-center space-x-4 pt-6 border-t border-white/20">
                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={handleResetChanges}
                  disabled={saving}
                >
                  Cancel
                </GlassButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;

import { useState, useEffect } from 'react';
import { locationService } from '../../services/location-service';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LocationSearch from './LocationSearch';
const LocationSettings = ({ onClose }) => {
  const { user } = useAuth();
  const { location, requestLocation, clearLocation } = useGeolocation();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customLocation, setCustomLocation] = useState(null);
  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      try {
        const userPrefs = await locationService.getLocationPreferences(user.id);
        setPreferences(userPrefs);
        if (userPrefs.custom_location) {
          setCustomLocation(userPrefs.custom_location);
        }
      } catch (error) {
        // Set defaults if loading fails
        setPreferences({
          default_filter: 'global',
          location_sharing: 'public',
          custom_location: null,
          auto_detect: true
        });
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user]);
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const handleCustomLocationSelect = (location) => {
    setCustomLocation(location);
    handlePreferenceChange('custom_location', location);
  };
  const handleSave = async () => {
    if (!user || !preferences) return;
    setSaving(true);
    try {
      await locationService.updateLocationPreferences(user.id, preferences);
      onClose?.();
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };
  const privacyOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Show your location in posts and allow location-based filtering'
    },
    {
      value: 'regional',
      label: 'Regional Only',
      description: 'Show general area only (city/state level)'
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Never share location data'
    }
  ];
  const defaultFilterOptions = [
    {
      value: 'local',
      label: 'Local (50 miles)',
      description: 'Default to showing nearby posts'
    },
    {
      value: 'regional',
      label: 'Regional (500 miles)',
      description: 'Default to showing regional posts'
    },
    {
      value: 'global',
      label: 'Global',
      description: 'Default to showing all posts worldwide'
    }
  ];
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300/20 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300/20 rounded"></div>
            <div className="h-4 bg-gray-300/20 rounded w-2/3"></div>
          </div>
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Location Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="space-y-6">
        {/* Auto-detect Location */}
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences?.auto_detect || false}
              onChange={(e) => handlePreferenceChange('auto_detect', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Auto-detect Location
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Automatically detect your location when browsing
              </div>
            </div>
          </label>
          {preferences?.auto_detect && (
            <div className="mt-3 pl-7">
              <div className="flex items-center gap-2 text-sm">
                {location ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600 dark:text-green-400">
                      Location detected
                    </span>
                    <button
                      onClick={clearLocation}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <>
                    <GlassButton
                      onClick={requestLocation}
                      size="sm"
                      variant="secondary"
                    >
                      Detect Now
                    </GlassButton>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Custom Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Location
          </label>
          <LocationSearch
            onLocationSelect={handleCustomLocationSelect}
            placeholder="Set a custom location..."
          />
          {customLocation && (
            <div className="mt-2 p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded text-sm">
              <span className="font-medium">Selected:</span> {customLocation.name}
              <button
                onClick={() => {
                  setCustomLocation(null);
                  handlePreferenceChange('custom_location', null);
                }}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Override auto-detection with a specific location
          </p>
        </div>
        {/* Default Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Default Community Filter
          </label>
          <div className="space-y-2">
            {defaultFilterOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-3">
                <input
                  type="radio"
                  name="defaultFilter"
                  value={option.value}
                  checked={preferences?.default_filter === option.value}
                  onChange={(e) => handlePreferenceChange('default_filter', e.target.value)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        {/* Privacy Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Location Privacy
          </label>
          <div className="space-y-2">
            {privacyOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-3">
                <input
                  type="radio"
                  name="locationSharing"
                  value={option.value}
                  checked={preferences?.location_sharing === option.value}
                  onChange={(e) => handlePreferenceChange('location_sharing', e.target.value)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200/20">
          {onClose && (
            <GlassButton
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GlassButton>
          )}
          <GlassButton
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};
export default LocationSettings;
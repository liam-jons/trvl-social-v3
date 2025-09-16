import { useState, useEffect } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const LocationFilter = ({ onFilterChange, activeFilter = 'global' }) => {
  const { location, loading, error, requestLocation } = useGeolocation();
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Location filtering options
  const filters = [
    {
      id: 'local',
      label: 'Local',
      description: 'Within 50 miles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      requiresLocation: true,
      radius: 50
    },
    {
      id: 'regional',
      label: 'Regional',
      description: 'Within 500 miles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      requiresLocation: true,
      radius: 500
    },
    {
      id: 'global',
      label: 'Global',
      description: 'Worldwide',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
        </svg>
      ),
      requiresLocation: false,
      radius: null
    }
  ];

  useEffect(() => {
    // Update user location when geolocation changes
    if (location) {
      setUserLocation(location);
      setShowLocationPrompt(false);
    }
  }, [location]);

  useEffect(() => {
    // Check if location is required for the active filter
    const currentFilter = filters.find(f => f.id === activeFilter);
    if (currentFilter?.requiresLocation && !userLocation && !loading) {
      setShowLocationPrompt(true);
    }
  }, [activeFilter, userLocation, loading]);

  const handleFilterClick = (filterId) => {
    const filter = filters.find(f => f.id === filterId);

    if (filter.requiresLocation && !userLocation) {
      // Request location first
      setShowLocationPrompt(true);
      requestLocation();
      return;
    }

    onFilterChange({
      type: filterId,
      userLocation: userLocation,
      radius: filter.radius
    });
  };

  const handleLocationRequest = () => {
    setShowLocationPrompt(false);
    requestLocation();
  };

  const handleLocationDeny = () => {
    setShowLocationPrompt(false);
    // Fall back to global filter
    onFilterChange({
      type: 'global',
      userLocation: null,
      radius: null
    });
  };

  return (
    <div className="space-y-4">
      {/* Location Filter Tabs */}
      <GlassCard className="p-1">
        <div className="flex flex-wrap gap-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            const isDisabled = filter.requiresLocation && !userLocation && !loading;

            return (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg flex-1
                  transition-all duration-200 font-medium text-sm
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : isDisabled
                      ? 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-glass-light text-gray-600 dark:text-gray-300'
                  }
                `}
              >
                {loading && filter.requiresLocation ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  filter.icon
                )}
                <div className="text-left">
                  <div className="font-medium">{filter.label}</div>
                  <div className="text-xs opacity-75">{filter.description}</div>
                </div>
                {filter.requiresLocation && !userLocation && (
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-2a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Location Status */}
      {userLocation && (
        <GlassCard variant="light" className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Location detected
            </div>
            <button
              onClick={() => {
                setUserLocation(null);
                onFilterChange({ type: 'global', userLocation: null, radius: null });
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        </GlassCard>
      )}

      {/* Location Error */}
      {error && (
        <GlassCard variant="accent" className="p-3">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
          <GlassButton
            onClick={requestLocation}
            size="sm"
            className="mt-2 w-full"
          >
            Try Again
          </GlassButton>
        </GlassCard>
      )}

      {/* Location Permission Prompt */}
      {showLocationPrompt && !error && (
        <GlassCard className="p-4 border border-blue-500/30">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Enable Location Access
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Allow location access to see local and regional community posts near you.
              </p>
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={handleLocationDeny}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                Skip
              </GlassButton>
              <GlassButton
                onClick={handleLocationRequest}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Allow Location
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default LocationFilter;
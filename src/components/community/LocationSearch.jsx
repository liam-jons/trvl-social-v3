import { useState, useRef, useEffect } from 'react';
import { locationService } from '../../services/location-service';
import GlassInput from '../ui/GlassInput';
import GlassCard from '../ui/GlassCard';
const LocationSearch = ({ onLocationSelect, placeholder = "Search locations..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);
  const resultsRef = useRef(null);
  // Debounced search function
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    try {
      const locations = await locationService.geocodeAddress(searchQuery);
      setResults(locations);
      setShowResults(true);
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };
  // Handle location selection
  const handleLocationSelect = (location) => {
    setQuery(location.place_name);
    setShowResults(false);
    onLocationSelect({
      name: location.place_name,
      latitude: location.center.latitude,
      longitude: location.center.longitude,
      context: location.context
    });
  };
  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);
  return (
    <div className="relative" ref={resultsRef}>
      <div className="relative">
        <GlassInput
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
        />
        {/* Search/Loading Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>
      {/* Search Results */}
      {showResults && results.length > 0 && (
        <GlassCard className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto" padding="none">
          {results.map((location, index) => (
            <button
              key={location.id || index}
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-white/10 dark:hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {location.place_name}
                  </div>
                  {location.context.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {location.context
                        .filter(ctx => ctx.id.includes('region') || ctx.id.includes('country'))
                        .map(ctx => ctx.text)
                        .join(', ')
                      }
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </GlassCard>
      )}
      {/* No Results */}
      {showResults && results.length === 0 && !loading && query.length >= 3 && (
        <GlassCard className="absolute top-full left-0 right-0 z-50 mt-1" padding="sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.049-5.709-2.709M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            No locations found for "{query}"
          </div>
        </GlassCard>
      )}
    </div>
  );
};
export default LocationSearch;
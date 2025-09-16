import { useState, useRef, useCallback, useEffect } from 'react';
import { useMapbox } from '../../contexts/MapboxContext';
import GlassCard from '../ui/GlassCard';
const LocationSearch = ({
  onResultSelect,
  onError,
  placeholder = 'Search for locations...',
  limit = 5,
  types = ['place', 'poi', 'address'],
  countries = [], // Empty array means all countries
  bbox = null, // Bounding box for biased results [minLng, minLat, maxLng, maxLat]
  proximity = null, // [lng, lat] for proximity bias
  className = '',
}) => {
  const { accessToken, geocodingEndpoint, isConfigured } = useMapbox();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef();
  const resultsRef = useRef();
  const abortControllerRef = useRef();
  // Debounce search
  const searchTimeoutRef = useRef();
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || !isConfigured) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    try {
      const url = new URL(`${geocodingEndpoint}/${encodeURIComponent(searchQuery)}.json`);
      // Add parameters
      url.searchParams.set('access_token', accessToken);
      url.searchParams.set('limit', limit.toString());
      if (types.length > 0) {
        url.searchParams.set('types', types.join(','));
      }
      if (countries.length > 0) {
        url.searchParams.set('country', countries.join(','));
      }
      if (bbox && Array.isArray(bbox) && bbox.length === 4) {
        url.searchParams.set('bbox', bbox.join(','));
      }
      if (proximity && Array.isArray(proximity) && proximity.length === 2) {
        url.searchParams.set('proximity', proximity.join(','));
      }
      const response = await fetch(url.toString(), {
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      const data = await response.json();
      // Process results
      const processedResults = data.features.map(feature => ({
        id: feature.id,
        text: feature.text,
        placeName: feature.place_name,
        center: feature.center,
        bbox: feature.bbox,
        relevance: feature.relevance,
        placeType: feature.place_type,
        properties: feature.properties,
        context: feature.context,
        // Additional helper properties
        shortName: feature.text,
        fullName: feature.place_name,
        longitude: feature.center[0],
        latitude: feature.center[1],
      }));
      setResults(processedResults);
      setIsOpen(processedResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Location search error:', error);
        onError?.(error);
        setResults([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, geocodingEndpoint, isConfigured, limit, types, countries, bbox, proximity, onError]);
  // Handle input change with debouncing
  const handleInputChange = useCallback((e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  }, [performSearch]);
  // Handle result selection
  const handleResultSelect = useCallback((result) => {
    setQuery(result.placeName);
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    onResultSelect?.(result);
  }, [onResultSelect]);
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || results.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, handleResultSelect]);
  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  }, [results.length]);
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        resultsRef.current && !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  if (!isConfigured) {
    return (
      <GlassCard className="p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Location search requires Mapbox configuration
        </p>
      </GlassCard>
    );
  }
  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <GlassCard variant="light" blur="lg" padding="none" className="relative">
        <div className="flex items-center p-3">
          <svg
            className="w-5 h-5 text-gray-400 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {isLoading && (
            <div className="ml-2">
              <svg className="w-4 h-4 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6v-4z"
                />
              </svg>
            </div>
          )}
        </div>
      </GlassCard>
      {/* Search results */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50"
        >
          <GlassCard variant="light" blur="lg" padding="none" className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleResultSelect(result)}
                className={`
                  w-full text-left p-3 transition-colors border-none bg-transparent
                  ${index === selectedIndex
                    ? 'bg-primary-100/50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/20'
                  }
                  ${index > 0 ? 'border-t border-white/20 dark:border-gray-700/50' : ''}
                `}
              >
                <div className="flex items-start">
                  <svg
                    className="w-4 h-4 text-gray-400 mt-1 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {result.text}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {result.placeName}
                    </div>
                  </div>
                  {result.placeType && result.placeType[0] && (
                    <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full flex-shrink-0">
                      {result.placeType[0]}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </GlassCard>
        </div>
      )}
      {/* No results message */}
      {isOpen && !isLoading && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <GlassCard variant="light" blur="lg" className="text-center text-gray-600 dark:text-gray-400 text-sm">
            No locations found for "{query}"
          </GlassCard>
        </div>
      )}
    </div>
  );
};
export default LocationSearch;
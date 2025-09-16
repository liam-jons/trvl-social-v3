import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import searchService from '../../services/searchService';

const SearchBar = ({
  onSearch,
  onResultSelect,
  placeholder = "Search adventures, locations, activities...",
  showSuggestions = true,
  className = "",
  adventures = []
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState({
    adventures: [],
    locations: [],
    activities: [],
    popular: []
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initialize search service with adventures data
  useEffect(() => {
    if (adventures.length > 0) {
      searchService.initialize(adventures);
    }
  }, [adventures]);

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    hasQuery
  } = useDebouncedSearch((searchQuery) => {
    // Get suggestions for dropdown
    const suggestions = searchService.getSuggestions(searchQuery, adventures);
    setSuggestions(suggestions);

    // Perform main search
    const searchResults = searchService.search(searchQuery);
    onSearch?.(searchResults, searchQuery);
    return searchResults;
  }, 300);

  const recentSearches = searchService.getRecentSearches();
  const trendingSearches = searchService.getTrendingSearches();

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
    if (!hasQuery) {
      // Show recent and popular searches when focused with no query
      setSuggestions({
        adventures: [],
        locations: [],
        activities: [],
        popular: searchService.popularSearches.slice(0, 5)
      });
    }
  };

  // Handle input blur
  const handleBlur = (e) => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setShowDropdown(false);
      }
    }, 150);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion, type) => {
    if (type === 'adventure') {
      setQuery(suggestion.title);
      onResultSelect?.(suggestion);
    } else {
      setQuery(suggestion);
    }
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Handle clear search
  const handleClear = () => {
    clearSearch();
    setSuggestions({
      adventures: [],
      locations: [],
      activities: [],
      popular: searchService.popularSearches.slice(0, 5)
    });
    inputRef.current?.focus();
  };

  // Handle click outside to close dropdown and keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };

    const handleKeyDown = (event) => {
      // Focus search input with CMD/Ctrl + K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      // Escape key closes dropdown
      if (event.key === 'Escape') {
        setShowDropdown(false);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showSuggestionsDropdown = showSuggestions && showDropdown && isFocused;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`relative transition-all duration-200 ${
        isFocused
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'ring-1 ring-gray-300 hover:ring-gray-400'
      } rounded-lg bg-white`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full pl-10 pr-24 py-3 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent"
        />

        {/* Keyboard shortcut hint */}
        {!hasQuery && !isFocused && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
              ⌘K
            </kbd>
          </div>
        )}

        {hasQuery && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm z-10">
          {error}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
        >
          {/* Adventure Suggestions */}
          {suggestions.adventures.length > 0 && (
            <div className="p-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                Adventures
              </h4>
              {suggestions.adventures.map((adventure, index) => (
                <button
                  key={`adventure-${adventure.id}`}
                  onClick={() => handleSuggestionSelect(adventure, 'adventure')}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <img
                    src={adventure.image}
                    alt={adventure.title}
                    className="w-10 h-10 rounded-md object-cover mr-3"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {adventure.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {adventure.location} • ${adventure.price}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {adventure.category}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Location Suggestions */}
          {suggestions.locations.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                Locations
              </h4>
              {suggestions.locations.map((location, index) => (
                <button
                  key={`location-${index}`}
                  onClick={() => handleSuggestionSelect(location, 'location')}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">{location}</span>
                </button>
              ))}
            </div>
          )}

          {/* Activity Suggestions */}
          {suggestions.activities.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                Activities
              </h4>
              {suggestions.activities.map((activity, index) => (
                <button
                  key={`activity-${index}`}
                  onClick={() => handleSuggestionSelect(activity, 'activity')}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs text-green-600">#</span>
                  </div>
                  <span className="text-sm text-gray-700 capitalize">{activity}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!hasQuery && recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" />
                Recent Searches
              </h4>
              {recentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSuggestionSelect(search.query, 'recent')}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <ClockIcon className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{search.query}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular/Trending Searches */}
          {suggestions.popular.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 flex items-center">
                <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                {hasQuery ? 'Related Searches' : 'Popular Searches'}
              </h4>
              {suggestions.popular.map((search, index) => (
                <button
                  key={`popular-${index}`}
                  onClick={() => handleSuggestionSelect(search, 'popular')}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <ArrowTrendingUpIcon className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* No suggestions */}
          {hasQuery &&
           suggestions.adventures.length === 0 &&
           suggestions.locations.length === 0 &&
           suggestions.activities.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
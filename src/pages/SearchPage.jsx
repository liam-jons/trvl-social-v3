import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import FilterPanel from '../components/adventure/FilterPanel';
import MapView from '../components/adventure/MapView';
import searchService from '../services/searchService';
import { mockAdventures } from '../data/mock-adventures';
const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    duration: '',
    difficulty: '',
    tags: [],
    groupSize: '',
    rating: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showTrendingSection, setShowTrendingSection] = useState(true);
  // Initialize search service
  useEffect(() => {
    searchService.initialize(mockAdventures);
  }, []);
  // Handle initial search from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, [searchParams]);
  // Perform search
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowTrendingSection(true);
      return;
    }
    setIsLoading(true);
    setShowTrendingSection(false);
    try {
      const results = searchService.search(searchQuery, { limit: 50 });
      const filteredResults = applyFilters(results);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Apply filters to search results
  const applyFilters = (results) => {
    return results.filter(adventure => {
      // Price filter
      if (adventure.price < filters.priceRange[0] || adventure.price > filters.priceRange[1]) {
        return false;
      }
      // Duration filter
      if (filters.duration && !adventure.duration.toLowerCase().includes(filters.duration.toLowerCase())) {
        return false;
      }
      // Difficulty filter
      if (filters.difficulty && adventure.difficulty !== filters.difficulty) {
        return false;
      }
      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => adventure.tags?.includes(tag))) {
        return false;
      }
      // Rating filter
      if (filters.rating > 0 && adventure.rating < filters.rating) {
        return false;
      }
      return true;
    });
  };
  // Handle search from search bar
  const handleSearch = (results, searchQuery) => {
    setQuery(searchQuery);
    setSearchParams(searchQuery ? { q: searchQuery } : {});
    setSearchResults(results);
  };
  // Handle adventure selection
  const handleAdventureSelect = (adventure) => {
    navigate(`/adventures/${adventure.id}`);
  };
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (query.trim()) {
      const results = searchService.search(query, { limit: 50 });
      const filteredResults = applyFilters(results.map(r => ({ ...r, ...newFilters })));
      setSearchResults(filteredResults);
    }
  };
  // Get trending searches for empty state
  const trendingSearches = searchService.getTrendingSearches();
  const popularSearches = searchService.popularSearches.slice(0, 8);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="flex-1 max-w-2xl">
              <SearchBar
                onSearch={handleSearch}
                onResultSelect={handleAdventureSelect}
                adventures={mockAdventures}
                placeholder="Search adventures, locations, activities..."
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'text-gray-600 hover:text-gray-800 border-gray-200'
                }`}
              >
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  adventures={mockAdventures}
                />
              </div>
            </div>
          )}
          {/* Main Content */}
          <div className="flex-1">
            {showMap && searchResults.length > 0 && (
              <div className="mb-8 h-96 rounded-lg overflow-hidden shadow-sm">
                <MapView
                  adventures={searchResults}
                  onAdventureClick={handleAdventureSelect}
                />
              </div>
            )}
            {/* Trending Section (shown when no search) */}
            {showTrendingSection && !query.trim() && (
              <div className="space-y-8">
                <TrendingSection
                  trendingSearches={trendingSearches}
                  popularSearches={popularSearches}
                  onSearchSelect={(searchQuery) => {
                    setQuery(searchQuery);
                    setSearchParams({ q: searchQuery });
                    performSearch(searchQuery);
                  }}
                />
                <PopularAdventures
                  adventures={mockAdventures.filter(adv => adv.featured).slice(0, 6)}
                  onAdventureClick={handleAdventureSelect}
                />
              </div>
            )}
            {/* Search Results */}
            {(query.trim() || !showTrendingSection) && (
              <SearchResults
                results={searchResults}
                query={query}
                isLoading={isLoading}
                totalCount={searchResults.length}
                onResultClick={handleAdventureSelect}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showMap={showMap}
                onToggleMap={() => setShowMap(!showMap)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
const TrendingSection = ({ trendingSearches, popularSearches, onSearchSelect }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Discover Adventures</h2>
        {/* Trending Searches */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending Now
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingSearches.map((trend, index) => (
              <button
                key={index}
                onClick={() => onSearchSelect(trend.query)}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {trend.query}
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    {trend.trend}
                  </span>
                </div>
                <span className="text-sm text-gray-500">Popular search</span>
              </button>
            ))}
          </div>
        </div>
        {/* Popular Searches */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Searches</h3>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => onSearchSelect(search)}
                className="px-4 py-2 bg-white text-gray-700 rounded-full border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors text-sm"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
const PopularAdventures = ({ adventures, onAdventureClick }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Adventures</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adventures.map((adventure) => (
          <button
            key={adventure.id}
            onClick={() => onAdventureClick(adventure)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden text-left"
          >
            <img
              src={adventure.image}
              alt={adventure.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-1">{adventure.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{adventure.location}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-medium">{adventure.rating}</span>
                </div>
                <span className="font-semibold text-gray-900">${adventure.price.toLocaleString()}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
export default SearchPage;
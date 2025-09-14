import { useState } from 'react';
import { ChevronDownIcon, StarIcon, MapPinIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/solid';
import { EyeIcon, HeartIcon } from '@heroicons/react/24/outline';

const SearchResults = ({
  results = [],
  query = '',
  isLoading = false,
  totalCount = 0,
  onResultClick,
  sortBy = 'relevance',
  onSortChange,
  showMap = false,
  onToggleMap
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'duration', label: 'Duration' }
  ];

  const getSortedResults = () => {
    if (!results.length) return [];

    const sortedResults = [...results];

    switch (sortBy) {
      case 'price-low':
        return sortedResults.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sortedResults.sort((a, b) => b.price - a.price);
      case 'rating':
        return sortedResults.sort((a, b) => b.rating - a.rating);
      case 'duration':
        return sortedResults.sort((a, b) => {
          const aDays = parseInt(a.duration);
          const bDays = parseInt(b.duration);
          return aDays - bDays;
        });
      case 'relevance':
      default:
        return sortedResults.sort((a, b) => (a.score || 0) - (b.score || 0));
    }
  };

  const getRelevanceScore = (score) => {
    if (!score) return null;
    const percentage = Math.round((1 - score) * 100);
    return percentage;
  };

  const formatHighlightedText = (text, highlights, field) => {
    if (!highlights || !highlights[field]) {
      return text;
    }

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: highlights[field]
        }}
      />
    );
  };

  const sortedResults = getSortedResults();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-48 h-32 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {totalCount > 0 ? (
              <>
                {totalCount.toLocaleString()} result{totalCount !== 1 ? 's' : ''} for "
                <span className="text-blue-600">{query}</span>"
              </>
            ) : (
              'No results found'
            )}
          </h2>
          {results.length > 0 && totalCount > results.length && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {results.length} of {totalCount} results
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Map Toggle */}
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showMap
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 border-gray-200'
              }`}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      {sortedResults.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
          : 'space-y-4'
        }>
          {sortedResults.map((result, index) => (
            <SearchResultCard
              key={`${result.id}-${index}`}
              result={result}
              query={query}
              onClick={() => onResultClick?.(result)}
              viewMode={viewMode}
              relevanceScore={getRelevanceScore(result.score)}
              formatHighlightedText={formatHighlightedText}
            />
          ))}
        </div>
      ) : (
        <EmptySearchState query={query} />
      )}
    </div>
  );
};

const SearchResultCard = ({
  result,
  query,
  onClick,
  viewMode,
  relevanceScore,
  formatHighlightedText
}) => {
  const cardClass = viewMode === 'grid'
    ? 'bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden'
    : 'bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer p-6';

  if (viewMode === 'grid') {
    return (
      <div className={cardClass} onClick={onClick}>
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={result.image}
            alt={result.title}
            className="w-full h-48 object-cover"
          />
          {relevanceScore && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              {relevanceScore}% match
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {formatHighlightedText(result.title, result.highlights, 'title') || result.title}
            </h3>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {formatHighlightedText(result.location, result.highlights, 'location') || result.location}
            </p>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 ml-1">
                  {result.rating}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">
                {result.reviewCount} reviews
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">
              ${result.price.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {result.duration}
            </div>
          </div>

          {result.tags && result.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
              {result.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{result.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass} onClick={onClick}>
      <div className="flex space-x-4">
        <div className="flex-shrink-0 relative">
          <img
            src={result.image}
            alt={result.title}
            className="w-48 h-32 object-cover rounded-lg"
          />
          {relevanceScore && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              {relevanceScore}% match
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {formatHighlightedText(result.title, result.highlights, 'title') || result.title}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {formatHighlightedText(result.location, result.highlights, 'location') || result.location}
            </p>
          </div>

          <div className="mb-3">
            <p className="text-gray-700 line-clamp-2">
              {formatHighlightedText(result.description, result.highlights, 'description') || result.description}
            </p>
          </div>

          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900 ml-1">
                {result.rating}
              </span>
              <span className="text-sm text-gray-600 ml-1">
                ({result.reviewCount})
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              {result.duration}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <UsersIcon className="w-4 h-4 mr-1" />
              {result.groupSize}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-gray-900">
                ${result.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                per person
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {result.tags && result.tags.length > 0 && (
                <div className="flex space-x-1">
                  {result.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <HeartIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <EyeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptySearchState = ({ query }) => {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No adventures found for "{query}"
          </h3>
          <p className="text-gray-600 mb-6">
            Try searching with different keywords or check out our popular adventures below.
          </p>
        </div>

        <div className="space-y-2 text-left">
          <p className="text-sm font-medium text-gray-700 mb-3">Search suggestions:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['northern lights', 'photography', 'trekking', 'wildlife', 'culture', 'sailing'].map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdventureGrid from './AdventureGrid';
import ViewToggle from './ViewToggle';
import { useViewPreference } from '../../hooks/useViewPreference';
import { useGeolocation } from '../../hooks/useGeolocation';
import { usePagination } from '../../hooks/usePagination';
import { useInfiniteScrollObserver } from '../../hooks/useInfiniteScroll';
import PaginationControls from '../common/PaginationControls';
import LoadMoreButton from '../common/LoadMoreButton';
import ScrollToTop from '../common/ScrollToTop';
import AdventureLoadingSkeleton from './AdventureLoadingSkeleton';
import GlassCard from '../ui/GlassCard';

const AdventureList = ({
  adventures = [],
  loading = false,
  onAdventureClick,
  filters = {},
  searchQuery = '',
  sortBy = 'featured',
  className = '',
  // Pagination options
  paginationMode = 'infinite', // 'pagination', 'infinite', 'both'
  pageSize = 12,
  enableVirtualScroll = false,
  onLoadMore,
  hasMore = true,
  totalCount,
  // URL-based pagination
  currentPage: urlPage,
  onPageChange: urlPageChange
}) => {
  const [viewMode, setViewMode] = useViewPreference('grid');
  const { location: userLocation, calculateDistance } = useGeolocation();

  // Internal state for infinite scroll
  const [displayedAdventures, setDisplayedAdventures] = useState([]);
  const [infiniteLoading, setInfiniteLoading] = useState(false);

  // Filter and sort adventures
  const filteredAdventures = useMemo(() => {
    let filtered = [...adventures];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        adventure =>
          adventure.title.toLowerCase().includes(query) ||
          adventure.location.toLowerCase().includes(query) ||
          adventure.description.toLowerCase().includes(query) ||
          adventure.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Location filter (with geolocation support)
    if (filters.location && filters.location !== 'all' && userLocation) {
      filtered = filtered.filter(adventure => {
        // Mock coordinates for adventures (would come from API in real app)
        const adventureCoords = getAdventureCoordinates(adventure.location);
        if (!adventureCoords) return true;

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          adventureCoords.latitude,
          adventureCoords.longitude
        );

        switch (filters.location) {
          case 'local':
            return distance <= 50;
          case 'regional':
            return distance <= 500;
          case 'global':
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      filtered = filtered.filter(adventure => {
        // In a real app, adventures would have available dates
        // For now, assume all adventures are available for filtering demo
        return true;
      });
    }

    // Price range filter
    if (filters.priceMin !== undefined && filters.priceMin > 0) {
      filtered = filtered.filter(adventure => adventure.price >= filters.priceMin);
    }
    if (filters.priceMax !== undefined && filters.priceMax < 5000) {
      filtered = filtered.filter(adventure => adventure.price <= filters.priceMax);
    }

    // Adventure type filter
    if (filters.adventureTypes && filters.adventureTypes.length > 0) {
      filtered = filtered.filter(adventure => {
        const adventureTypeMappings = {
          'hiking': ['trekking', 'hiking', 'mountains'],
          'water-sports': ['sailing', 'water'],
          'cultural': ['culture', 'temples', 'meditation'],
          'extreme': ['challenging'],
          'wildlife': ['wildlife', 'nature', 'conservation'],
          'urban': ['urban'],
          'photography': ['photography'],
          'wellness': ['relaxation', 'meditation', 'wellness']
        };

        return filters.adventureTypes.some(filterType => {
          const mappedTags = adventureTypeMappings[filterType] || [filterType];
          return adventure.tags.some(tag =>
            mappedTags.some(mappedTag => tag.toLowerCase().includes(mappedTag))
          );
        });
      });
    }

    // Group size filter
    if (filters.groupSize && filters.groupSize !== 'all') {
      filtered = filtered.filter(adventure => {
        const groupSizeText = adventure.groupSize.toLowerCase();
        const maxSize = parseInt(groupSizeText.split('-')[1] || groupSizeText.split(' ')[0]);

        switch (filters.groupSize) {
          case 'solo':
            return maxSize >= 1;
          case 'couple':
            return maxSize >= 2;
          case 'small':
            return maxSize >= 3 && maxSize <= 6;
          case 'large':
            return maxSize >= 7;
          default:
            return true;
        }
      });
    }

    // Legacy filters for backward compatibility
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(adventure =>
        adventure.tags.includes(filters.category)
      );
    }

    if (filters.duration) {
      filtered = filtered.filter(adventure => {
        const days = parseInt(adventure.duration);
        switch (filters.duration) {
          case 'short': return days <= 3;
          case 'medium': return days >= 4 && days <= 7;
          case 'long': return days >= 8;
          default: return true;
        }
      });
    }

    if (filters.difficulty) {
      filtered = filtered.filter(adventure =>
        adventure.difficulty === filters.difficulty
      );
    }

    // Sort adventures
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [adventures, searchQuery, filters, sortBy, userLocation, calculateDistance]);

  // Pagination hook (for traditional pagination)
  const pagination = usePagination(filteredAdventures, {
    initialPage: urlPage || 1,
    pageSize,
    enabled: paginationMode === 'pagination' || paginationMode === 'both'
  });

  // Infinite scroll implementation
  const handleInfiniteLoadMore = useCallback(async ({ page }) => {
    if (onLoadMore) {
      setInfiniteLoading(true);
      try {
        const result = await onLoadMore({ page, pageSize });
        return {
          hasMore: result?.hasMore ?? hasMore,
          nextPage: page,
          error: result?.error
        };
      } catch (error) {
        return {
          hasMore: false,
          error: error.message
        };
      } finally {
        setInfiniteLoading(false);
      }
    } else {
      // Client-side infinite scroll
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize;
      const newItems = filteredAdventures.slice(startIndex, endIndex);

      if (newItems.length > 0) {
        setDisplayedAdventures(prev => [...prev, ...newItems]);
      }

      return {
        hasMore: endIndex < filteredAdventures.length,
        nextPage: page
      };
    }
  }, [onLoadMore, pageSize, hasMore, filteredAdventures]);

  // Infinite scroll hook
  const infiniteScroll = useInfiniteScrollObserver(handleInfiniteLoadMore, {
    enabled: paginationMode === 'infinite' || paginationMode === 'both',
    pageSize,
    threshold: 0.8
  });

  // Initialize displayed adventures for infinite scroll
  useEffect(() => {
    if (paginationMode === 'infinite' || paginationMode === 'both') {
      if (!onLoadMore) {
        // Client-side: show first page
        setDisplayedAdventures(filteredAdventures.slice(0, pageSize));
        infiniteScroll.reset();
      }
    }
  }, [filteredAdventures, paginationMode, pageSize, onLoadMore]);

  // Handle URL-based pagination changes
  useEffect(() => {
    if (urlPageChange && pagination.currentPage !== urlPage) {
      pagination.goToPage(urlPage);
    }
  }, [urlPage, urlPageChange]);

  // Mock function to get coordinates for adventures (in real app, this would come from API)
  const getAdventureCoordinates = (location) => {
    const locationCoords = {
      'Reykjavik, Iceland': { latitude: 64.1466, longitude: -21.9426 },
      'Manaus, Brazil': { latitude: -3.1190, longitude: -60.0217 },
      'Kathmandu, Nepal': { latitude: 27.7172, longitude: 85.3240 },
      'Santorini, Greece': { latitude: 36.3932, longitude: 25.4615 },
      'El Calafate, Argentina': { latitude: -50.3374, longitude: -72.2647 },
      'Kyoto, Japan': { latitude: 35.0116, longitude: 135.7681 }
    };
    return locationCoords[location];
  };

  // Determine which adventures to display based on pagination mode
  const adventuresToDisplay = useMemo(() => {
    switch (paginationMode) {
      case 'pagination':
        return pagination.currentItems;
      case 'infinite':
        return onLoadMore ? adventures : displayedAdventures;
      case 'both':
        return pagination.currentItems;
      default:
        return filteredAdventures;
    }
  }, [paginationMode, pagination.currentItems, adventures, displayedAdventures, filteredAdventures, onLoadMore]);

  const resultsCount = adventuresToDisplay.length;
  const totalFilteredCount = filteredAdventures.length;
  const allAdventuresCount = totalCount || adventures.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with results count and view toggle */}
      <GlassCard variant="light" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Adventures
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {loading ? (
              <span className="animate-pulse">Loading adventures...</span>
            ) : (
              <>
                {paginationMode === 'infinite' && !onLoadMore ? (
                  <>
                    Showing {resultsCount} of {totalFilteredCount} adventure{totalFilteredCount !== 1 ? 's' : ''}
                    {totalFilteredCount !== allAdventuresCount && (
                      <span className="text-gray-500"> ({allAdventuresCount} total)</span>
                    )}
                  </>
                ) : paginationMode === 'pagination' ? (
                  <>
                    Showing {pagination.startIndex}-{pagination.endIndex} of {totalFilteredCount} adventure{totalFilteredCount !== 1 ? 's' : ''}
                    {totalFilteredCount !== allAdventuresCount && (
                      <span className="text-gray-500"> ({allAdventuresCount} total)</span>
                    )}
                  </>
                ) : (
                  <>
                    Showing {resultsCount} of {allAdventuresCount} adventure{allAdventuresCount !== 1 ? 's' : ''}
                  </>
                )}
                {searchQuery && (
                  <span className="ml-1">
                    for "<strong>{searchQuery}</strong>"
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <ViewToggle
          viewMode={viewMode}
          onViewChange={setViewMode}
        />
      </GlassCard>

      {/* Adventure Grid/List */}
      <motion.div
        layout
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <AdventureLoadingSkeleton
            count={pageSize}
            viewMode={viewMode}
          />
        ) : (
          <AdventureGrid
            adventures={adventuresToDisplay}
            viewMode={viewMode}
            onAdventureClick={onAdventureClick}
            loading={infiniteLoading}
          />
        )}
      </motion.div>

      {/* Pagination Controls */}
      {!loading && (paginationMode === 'pagination' || paginationMode === 'both') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            visiblePages={pagination.visiblePages}
            onPageChange={urlPageChange || pagination.goToPage}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            isFirstPage={pagination.isFirstPage}
            isLastPage={pagination.isLastPage}
            onFirst={pagination.goToFirst}
            onLast={pagination.goToLast}
            onNext={pagination.goToNext}
            onPrevious={pagination.goToPrevious}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            totalItems={pagination.totalItems}
          />
        </motion.div>
      )}

      {/* Infinite Scroll Controls */}
      {!loading && (paginationMode === 'infinite' || paginationMode === 'both') && (
        <>
          {/* Infinite scroll sentinel */}
          <div ref={infiniteScroll.sentinelRef} className="h-4" />

          {/* Load More Button (fallback) */}
          {infiniteScroll.canLoadMore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LoadMoreButton
                onClick={infiniteScroll.loadMore}
                loading={infiniteLoading || infiniteScroll.isLoading}
                hasMore={infiniteScroll.hasNextPage}
                className="mt-6"
              >
                Load More Adventures
              </LoadMoreButton>
            </motion.div>
          )}

          {/* Loading more indicator */}
          {(infiniteLoading || infiniteScroll.isLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <AdventureLoadingSkeleton
                count={3}
                viewMode={viewMode}
              />
            </motion.div>
          )}
        </>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Results summary */}
      {!loading && adventuresToDisplay.length > 0 && paginationMode !== 'infinite' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {paginationMode === 'pagination' && pagination.isLastPage ? 'End of results' : ''}
        </motion.div>
      )}

      {/* No more results for infinite scroll */}
      {!loading && (paginationMode === 'infinite' || paginationMode === 'both') &&
       !infiniteScroll.hasNextPage && adventuresToDisplay.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 py-4"
        >
          No more adventures to load
        </motion.div>
      )}
    </div>
  );
};

export default AdventureList;
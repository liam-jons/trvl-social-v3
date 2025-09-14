import { useMemo } from 'react';
import { motion } from 'framer-motion';
import AdventureGrid from './AdventureGrid';
import ViewToggle from './ViewToggle';
import { useViewPreference } from '../../hooks/useViewPreference';
import { useGeolocation } from '../../hooks/useGeolocation';
import GlassCard from '../ui/GlassCard';

const AdventureList = ({
  adventures = [],
  loading = false,
  onAdventureClick,
  filters = {},
  searchQuery = '',
  sortBy = 'featured',
  className = ''
}) => {
  const [viewMode, setViewMode] = useViewPreference('grid');
  const { location: userLocation, calculateDistance } = useGeolocation();

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

  const resultsCount = filteredAdventures.length;
  const totalCount = adventures.length;

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
                Showing {resultsCount} of {totalCount} adventure{totalCount !== 1 ? 's' : ''}
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
        <AdventureGrid
          adventures={filteredAdventures}
          viewMode={viewMode}
          onAdventureClick={onAdventureClick}
          loading={loading}
        />
      </motion.div>

      {/* Results summary */}
      {!loading && filteredAdventures.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400"
        >
          End of results
        </motion.div>
      )}
    </div>
  );
};

export default AdventureList;
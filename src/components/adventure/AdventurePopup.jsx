import { useMemo } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const AdventurePopup = ({ adventure, onClose, userLocation, onViewDetails }) => {
  // Calculate distance if user location is available
  const distance = useMemo(() => {
    if (!userLocation || !adventure.latitude || !adventure.longitude) {
      return null;
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      return distance < 1 ?
        `${(distance * 5280).toFixed(0)} ft` :
        `${distance.toFixed(1)} mi`;
    };

    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      adventure.latitude,
      adventure.longitude
    );
  }, [userLocation, adventure.latitude, adventure.longitude]);

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'text-green-600 dark:text-green-400',
      intermediate: 'text-yellow-600 dark:text-yellow-400',
      advanced: 'text-orange-600 dark:text-orange-400',
      expert: 'text-red-600 dark:text-red-400',
    };

    return colors[difficulty?.toLowerCase()] || 'text-primary-600 dark:text-primary-400';
  };

  // Format rating
  const formatRating = (rating) => {
    if (!rating) return null;
    return parseFloat(rating).toFixed(1);
  };

  const handleViewDetails = () => {
    onViewDetails?.(adventure);
    onClose();
  };

  return (
    <div className="adventure-popup-container">
      <GlassCard
        variant="light"
        blur="lg"
        padding="sm"
        className="min-w-[280px] max-w-[320px]"
      >
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Adventure image */}
        {adventure.imageUrl && (
          <div className="mb-3">
            <img
              src={adventure.imageUrl}
              alt={adventure.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Title and location */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {adventure.title}
          </h3>
          {adventure.location && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {adventure.location}
            </p>
          )}
        </div>

        {/* Tags and info row */}
        <div className="flex items-center justify-between mb-3 text-xs">
          {/* Activity type */}
          {adventure.activityType && (
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full">
              {adventure.activityType}
            </span>
          )}

          {/* Difficulty */}
          {adventure.difficulty && (
            <span className={`font-medium ${getDifficultyColor(adventure.difficulty)}`}>
              {adventure.difficulty}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-3">
          {/* Distance from user */}
          {distance && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {distance}
            </div>
          )}

          {/* Rating */}
          {adventure.rating && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {formatRating(adventure.rating)}
              {adventure.reviewCount && (
                <span className="ml-1">({adventure.reviewCount})</span>
              )}
            </div>
          )}

          {/* Duration */}
          {adventure.duration && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {adventure.duration}
            </div>
          )}
        </div>

        {/* Price */}
        {adventure.price && (
          <div className="mb-3">
            <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
              ${adventure.price}
              {adventure.priceUnit && (
                <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                  /{adventure.priceUnit}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {adventure.description && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {adventure.description}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1"
          >
            View Details
          </GlassButton>

          {adventure.bookingUrl && (
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => window.open(adventure.bookingUrl, '_blank')}
              className="flex-1"
            >
              Book Now
            </GlassButton>
          )}
        </div>

        {/* Tags */}
        {adventure.tags && adventure.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-700/50">
            <div className="flex flex-wrap gap-1">
              {adventure.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {adventure.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{adventure.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Custom styles for popup */}
      <style jsx>{`
        .adventure-popup-container :global(.mapboxgl-popup-content) {
          padding: 0 !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .adventure-popup-container :global(.mapboxgl-popup-tip) {
          display: none !important;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdventurePopup;
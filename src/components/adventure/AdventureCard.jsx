import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import FavoriteButton from '../wishlist/FavoriteButton';
const AdventureCard = memo(({
  adventure,
  viewMode = 'grid',
  className = '',
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };
  const isListView = viewMode === 'list';
  // Removed unused cardVariants
  const imageVariants = {
    grid: {
      width: '100%',
      height: '200px',
      borderRadius: '0.75rem 0.75rem 0 0'
    },
    list: {
      width: '200px',
      height: '150px',
      borderRadius: '0.75rem 0 0 0.75rem'
    }
  };
  const contentVariants = {
    grid: {
      padding: '1.5rem',
      flex: '1'
    },
    list: {
      padding: '1.5rem',
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={className}
    >
      <GlassCard
        variant="default"
        padding="none"
        className={`
          cursor-pointer overflow-hidden group
          hover:shadow-xl hover:shadow-primary-500/10
          transition-all duration-300
          ${isListView ? 'flex flex-row' : 'flex flex-col'}
        `}
        onClick={onClick}
      >
        {/* Image Container */}
        <motion.div
          layout
          variants={imageVariants}
          animate={viewMode}
          className="relative overflow-hidden bg-gray-200 dark:bg-gray-800"
        >
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
          )}
          {!imageError ? (
            <img
              src={adventure.image}
              alt={adventure.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Badge Overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {adventure.featured && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-accent-500 rounded-full">
                Featured
              </span>
            )}
            {adventure.availability === 'Limited' && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                Limited
              </span>
            )}
          </div>
          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3 fill-yellow-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {adventure.rating}
          </div>
          {/* Favorite Button */}
          <div className="absolute bottom-3 right-3">
            <FavoriteButton
              adventureId={adventure.id}
              size="md"
              variant="floating"
              onToggle={(adventureId, isFavorited) => {
                // Optional: Update parent component state
              }}
            />
          </div>
        </motion.div>
        {/* Content */}
        <motion.div
          layout
          variants={contentVariants}
          animate={viewMode}
          className="flex-1"
        >
          <div className={`${isListView ? 'flex flex-col justify-between h-full' : ''}`}>
            {/* Title and Location */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {adventure.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {adventure.location}
              </p>
            </div>
            {/* Details Grid */}
            <div className={`space-y-2 mb-4 ${isListView ? 'flex-1' : ''}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Duration
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{adventure.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Group Size
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{adventure.groupSize}</span>
              </div>
            </div>
            {/* Price and Reviews */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  ${adventure.price.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">per person</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {adventure.rating}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ({adventure.reviewCount} reviews)
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
});
AdventureCard.displayName = 'AdventureCard';
export default AdventureCard;
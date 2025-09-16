import { motion } from 'framer-motion';

const AdventureLoadingSkeleton = ({
  count = 6,
  viewMode = 'grid',
  className = ''
}) => {
  const skeletonVariants = {
    initial: { opacity: 0.7 },
    animate: { opacity: 1 },
    transition: {
      duration: 1.2,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut'
    }
  };

  const GridSkeleton = () => (
    <motion.div
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col bg-white/50 dark:bg-black/20 rounded-xl p-6 space-y-4"
    >
      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />

      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
      </div>

      {/* Tags */}
      <div className="flex gap-2">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-14 animate-pulse" />
      </div>

      {/* Price and rating */}
      <div className="flex justify-between items-center pt-2">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse" />
      </div>
    </motion.div>
  );

  const ListSkeleton = () => (
    <motion.div
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      className="flex bg-white/50 dark:bg-black/20 rounded-xl p-6 space-x-6"
    >
      {/* Image placeholder */}
      <div className="w-48 h-36 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Title and location */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        </div>

        {/* Tags */}
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-14 animate-pulse" />
        </div>
      </div>

      {/* Price and rating column */}
      <div className="flex flex-col items-end space-y-3 flex-shrink-0">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 animate-pulse" />
      </div>
    </motion.div>
  );

  const containerVariants = {
    grid: {
      display: 'grid',
      gap: '1.5rem'
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      animate={viewMode}
      className={`${viewMode === 'grid' ? 'adventure-grid' : ''} ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />}
        </div>
      ))}
    </motion.div>
  );
};

export default AdventureLoadingSkeleton;
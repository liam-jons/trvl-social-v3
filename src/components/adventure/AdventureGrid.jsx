import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import AdventureCard from './AdventureCard';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useExperimentWithTracking } from '../../hooks/useABTesting';

const AdventureGrid = ({
  adventures = [],
  viewMode = 'grid',
  onAdventureClick,
  loading = false,
  className = ''
}) => {
  // A/B Testing: Adventure card layout experiment
  const {
    variant: cardLayoutVariant,
    trackClick,
    trackConversion
  } = useExperimentWithTracking('adventure_card_layout');

  const { trackEvent } = useAnalytics();

  // Track grid view event
  useEffect(() => {
    if (adventures.length > 0) {
      trackEvent('adventure_grid_viewed', {
        view_mode: viewMode,
        adventures_count: adventures.length,
        experiment_variant: cardLayoutVariant
      });
    }
  }, [adventures.length, viewMode, cardLayoutVariant, trackEvent]);

  // Enhanced adventure click handler with A/B testing tracking
  const handleAdventureClick = (adventure) => {
    // Track A/B test click event
    if (cardLayoutVariant) {
      trackClick('adventure_card', {
        adventure_id: adventure.id,
        adventure_title: adventure.title,
        card_layout: cardLayoutVariant,
        view_mode: viewMode,
        position: adventures.findIndex(a => a.id === adventure.id)
      });
    }

    // Track regular analytics event
    trackEvent('adventure_clicked', {
      adventure_id: adventure.id,
      adventure_title: adventure.title,
      view_mode: viewMode,
      source: 'adventure_grid'
    });

    // Call the original click handler
    onAdventureClick?.(adventure);
  };
  // Container variants with A/B testing layout variations
  const containerVariants = {
    grid: {
      display: 'grid',
      gap: cardLayoutVariant === 'compact' ? '1rem' : '1.5rem'
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: cardLayoutVariant === 'compact' ? '0.5rem' : '1rem'
    }
  };

  const LoadingSkeleton = ({ viewMode }) => (
    <div className={`
      animate-pulse
      ${viewMode === 'grid'
        ? 'flex flex-col'
        : 'flex flex-row'
      }
    `}>
      <div className={`
        bg-gray-300 dark:bg-gray-700 rounded-lg
        ${viewMode === 'grid'
          ? 'w-full h-48 mb-4'
          : 'w-48 h-36 mr-4 flex-shrink-0'
        }
      `} />
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        animate={viewMode}
        className={className}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} viewMode={viewMode} />
        ))}
      </motion.div>
    );
  }

  if (!adventures.length) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No adventures found
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Try adjusting your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      variants={containerVariants}
      animate={viewMode}
      transition={{
        duration: 0.3,
        staggerChildren: 0.1
      }}
      className={`
        ${viewMode === 'grid' ? 'adventure-grid' : ''}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {adventures.map((adventure) => (
          <AdventureCard
            key={adventure.id}
            adventure={adventure}
            viewMode={viewMode}
            onClick={() => handleAdventureClick(adventure)}
            className={`
              ${viewMode === 'list' ? 'w-full' : ''}
              ${cardLayoutVariant === 'compact' ? 'adventure-card-compact' : ''}
            `}
            layoutVariant={cardLayoutVariant}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdventureGrid;
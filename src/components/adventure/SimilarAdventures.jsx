import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';

const SimilarAdventures = ({ currentAdventure, adventures }) => {
  if (!adventures || adventures.length === 0) {
    return null;
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Filter similar adventures based on tags or location
  const getSimilarAdventures = () => {
    if (!currentAdventure) return adventures;

    return adventures
      .map(adventure => {
        let similarity = 0;

        // Check for matching tags
        const matchingTags = adventure.tags?.filter(tag =>
          currentAdventure.tags?.includes(tag)
        ).length || 0;

        similarity += matchingTags * 2;

        // Check for same location/region
        if (adventure.location?.includes(currentAdventure.location?.split(',')[1]) ||
            currentAdventure.location?.includes(adventure.location?.split(',')[1])) {
          similarity += 1;
        }

        // Check for similar difficulty
        if (adventure.difficulty === currentAdventure.difficulty) {
          similarity += 1;
        }

        // Check for similar price range (within 30%)
        const priceDiff = Math.abs(adventure.price - currentAdventure.price) / currentAdventure.price;
        if (priceDiff <= 0.3) {
          similarity += 1;
        }

        return { ...adventure, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  };

  const similarAdventures = getSimilarAdventures();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <GlassCard variant="light" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Similar Adventures
          </h3>
          <Link
            to="/adventures"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {similarAdventures.map((adventure, index) => (
            <motion.div
              key={adventure.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/adventures/${adventure.id}`}
                className="block group"
              >
                <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Adventure Image */}
                  <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                    <img
                      src={adventure.image}
                      alt={adventure.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {adventure.featured && (
                      <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Adventure Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {adventure.title}
                    </h4>

                    <div className="flex items-center gap-1 mb-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {adventure.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {renderStars(adventure.rating)}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {adventure.rating}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({adventure.reviewCount})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ${adventure.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {adventure.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Show more button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/adventures"
            className="block w-full py-3 px-4 text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
          >
            Discover More Adventures
          </Link>
        </div>

        {/* Why These Are Similar */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
            Why These Adventures?
          </h4>
          <div className="flex flex-wrap gap-1">
            {currentAdventure?.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Similar activities, difficulty level, and price range
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default SimilarAdventures;
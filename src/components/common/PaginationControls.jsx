import { motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../ui/GlassCard';

const PaginationControls = ({
  currentPage,
  totalPages,
  visiblePages = [],
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  isFirstPage,
  isLastPage,
  onFirst,
  onLast,
  onNext,
  onPrevious,
  showFirstLast = true,
  showInfo = true,
  startIndex,
  endIndex,
  totalItems,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const sizeClasses = {
    small: {
      button: 'px-2 py-1 text-sm',
      icon: 'h-4 w-4',
      spacing: 'gap-1'
    },
    medium: {
      button: 'px-3 py-2',
      icon: 'h-5 w-5',
      spacing: 'gap-2'
    },
    large: {
      button: 'px-4 py-3 text-lg',
      icon: 'h-6 w-6',
      spacing: 'gap-3'
    }
  };

  const classes = sizeClasses[size];

  if (totalPages <= 1) {
    return showInfo ? (
      <GlassCard variant="light" className={`text-center py-3 ${className}`}>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Showing {totalItems} result{totalItems !== 1 ? 's' : ''}
        </span>
      </GlassCard>
    ) : null;
  }

  return (
    <GlassCard variant="light" className={`${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results info */}
        {showInfo && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {startIndex}-{endIndex} of {totalItems} results
          </div>
        )}

        {/* Pagination controls */}
        <div className={`flex items-center ${classes.spacing}`}>
          {/* First page button */}
          {showFirstLast && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFirst}
              disabled={isFirstPage}
              className={`
                ${classes.button} rounded-lg font-medium transition-all
                ${isFirstPage
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                }
              `}
              title="First page"
            >
              <ChevronDoubleLeftIcon className={classes.icon} />
            </motion.button>
          )}

          {/* Previous page button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPrevious}
            disabled={!hasPreviousPage}
            className={`
              ${classes.button} rounded-lg font-medium transition-all
              ${!hasPreviousPage
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
              }
            `}
            title="Previous page"
          >
            <ChevronLeftIcon className={classes.icon} />
          </motion.button>

          {/* Page numbers */}
          <div className={`flex items-center ${classes.spacing}`}>
            {visiblePages.map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page)}
                className={`
                  ${classes.button} rounded-lg font-medium transition-all min-w-[40px]
                  ${page === currentPage
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }
                `}
              >
                {page}
              </motion.button>
            ))}

            {/* Ellipsis for gap in page numbers */}
            {visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
            )}

            {/* Last page number if not in visible pages */}
            {visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(totalPages)}
                className={`
                  ${classes.button} rounded-lg font-medium transition-all min-w-[40px]
                  ${totalPages === currentPage
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }
                `}
              >
                {totalPages}
              </motion.button>
            )}
          </div>

          {/* Next page button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            disabled={!hasNextPage}
            className={`
              ${classes.button} rounded-lg font-medium transition-all
              ${!hasNextPage
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
              }
            `}
            title="Next page"
          >
            <ChevronRightIcon className={classes.icon} />
          </motion.button>

          {/* Last page button */}
          {showFirstLast && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLast}
              disabled={isLastPage}
              className={`
                ${classes.button} rounded-lg font-medium transition-all
                ${isLastPage
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                }
              `}
              title="Last page"
            >
              <ChevronDoubleRightIcon className={classes.icon} />
            </motion.button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default PaginationControls;
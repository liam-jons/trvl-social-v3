import { motion } from 'framer-motion';
import { ArrowDownIcon } from '@heroicons/react/24/outline';

const LoadMoreButton = ({
  onClick,
  loading = false,
  hasMore = true,
  disabled = false,
  className = '',
  children,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'primary' // 'primary', 'secondary', 'ghost'
}) => {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3',
    large: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg',
    secondary: 'bg-white/50 dark:bg-black/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400',
    ghost: 'bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
  };

  const isDisabled = disabled || loading || !hasMore;

  if (!hasMore) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-4"
      >
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No more results to load
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        onClick={onClick}
        disabled={isDisabled}
        className={`
          ${sizeClasses[size]}
          ${isDisabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : variantClasses[variant]
          }
          rounded-lg font-medium transition-all duration-200
          flex items-center gap-2
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          disabled:shadow-none
        `}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            />
            Loading more...
          </>
        ) : (
          <>
            {children || 'Load More'}
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDownIcon className="h-5 w-5" />
            </motion.div>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default LoadMoreButton;
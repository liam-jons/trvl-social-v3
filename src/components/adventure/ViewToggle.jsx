import { motion } from 'framer-motion';

const ViewToggle = ({
  viewMode,
  onViewChange,
  className = ''
}) => {
  const iconVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  const GridIcon = () => (
    <motion.svg
      variants={iconVariants}
      whileHover="hover"
      whileTap="tap"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </motion.svg>
  );

  const ListIcon = () => (
    <motion.svg
      variants={iconVariants}
      whileHover="hover"
      whileTap="tap"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </motion.svg>
  );

  return (
    <div className={`flex rounded-lg overflow-hidden ${className}`}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onViewChange('grid')}
        className={`
          flex items-center justify-center px-4 py-2 transition-all duration-200
          ${viewMode === 'grid'
            ? 'bg-primary-500 text-white shadow-lg'
            : 'bg-white/10 dark:bg-black/10 text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
          }
          border-r border-white/20 dark:border-white/10
        `}
        title="Grid view"
      >
        <GridIcon />
        <span className="ml-2 text-sm font-medium hidden sm:inline">Grid</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onViewChange('list')}
        className={`
          flex items-center justify-center px-4 py-2 transition-all duration-200
          ${viewMode === 'list'
            ? 'bg-primary-500 text-white shadow-lg'
            : 'bg-white/10 dark:bg-black/10 text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
          }
        `}
        title="List view"
      >
        <ListIcon />
        <span className="ml-2 text-sm font-medium hidden sm:inline">List</span>
      </motion.button>
    </div>
  );
};

export default ViewToggle;
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { WishlistService } from '../../services/wishlist-service';
const FavoriteButton = ({
  adventureId,
  size = 'md',
  variant = 'floating',
  className = '',
  onToggle = null,
  showTooltip = true,
  disabled = false
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  };
  // Variant configurations
  const variantConfig = {
    floating: 'bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-lg hover:shadow-xl border border-white/20 dark:border-white/10',
    solid: 'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent hover:bg-white/10 dark:hover:bg-white/5',
    minimal: 'bg-transparent'
  };
  const config = sizeConfig[size];
  const variantStyle = variantConfig[variant];
  // Check initial favorite status
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !adventureId) return;
      try {
        const { isInWishlist, error } = await WishlistService.isInWishlist(user.id, adventureId);
        if (error) {
          console.error('Error checking favorite status:', error);
          return;
        }
        setIsFavorited(isInWishlist);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    checkFavoriteStatus();
  }, [user, adventureId]);
  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent parent click events
    if (!user) {
      addNotification({
        type: 'info',
        title: 'Sign In Required',
        message: 'Please sign in to save adventures to your wishlist'
      });
      return;
    }
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      if (isFavorited) {
        // Remove from wishlist
        const { error } = await WishlistService.removeFromWishlist(user.id, adventureId);
        if (error) {
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to remove from wishlist. Please try again.'
          });
          return;
        }
        setIsFavorited(false);
        addNotification({
          type: 'success',
          title: 'Removed from Wishlist',
          message: 'Adventure removed from your wishlist'
        });
      } else {
        // Add to wishlist
        const { data, error } = await WishlistService.addToWishlist(user.id, adventureId);
        if (error) {
          if (error.message === 'Adventure already in wishlist') {
            setIsFavorited(true);
            return;
          }
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to add to wishlist. Please try again.'
          });
          return;
        }
        setIsFavorited(true);
        addNotification({
          type: 'success',
          title: 'Added to Wishlist',
          message: 'Adventure saved to your wishlist'
        });
      }
      // Trigger callback if provided
      if (onToggle) {
        onToggle(adventureId, !isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const heartVariants = {
    unfavorited: {
      scale: 1,
      rotate: 0,
    },
    favorited: {
      scale: [1, 1.3, 1],
      rotate: [0, -10, 0],
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    },
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    loading: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity
      }
    }
  };
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  // Floating hearts animation for celebration
  const FloatingHearts = () => (
    <AnimatePresence>
      {isFavorited && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, -20 - Math.random() * 20]
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              style={{
                left: '50%',
                top: '50%',
                marginLeft: -8,
                marginTop: -8
              }}
            >
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
  return (
    <div className="relative group">
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={handleToggleFavorite}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled || isLoading}
        className={`
          ${config.button}
          ${variantStyle}
          rounded-full
          flex items-center justify-center
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <motion.div
          variants={heartVariants}
          animate={
            isLoading ? 'loading' :
            isFavorited ? 'favorited' :
            isHovered ? 'hover' : 'unfavorited'
          }
          className="relative"
        >
          {isFavorited ? (
            <HeartSolidIcon
              className={`${config.icon} text-red-500 drop-shadow-sm`}
            />
          ) : (
            <HeartIcon
              className={`${config.icon} text-gray-600 dark:text-gray-300 group-hover:text-red-500 transition-colors duration-200`}
            />
          )}
        </motion.div>
        <FloatingHearts />
      </motion.button>
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 dark:bg-white/80 text-white dark:text-black text-xs rounded-lg whitespace-nowrap z-10"
          >
            {isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80 dark:border-t-white/80" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default FavoriteButton;
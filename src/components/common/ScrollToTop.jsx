import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

const ScrollToTop = ({
  showAfter = 300,
  smooth = true,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-14 h-14'
  };

  const iconSizes = {
    small: 'h-5 w-5',
    medium: 'h-6 w-6',
    large: 'h-7 w-7'
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > showAfter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-6 right-6 z-docked ${className}`}
        >
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className={`
              ${sizeClasses[size]}
              bg-indigo-500 hover:bg-indigo-600 text-white
              rounded-full shadow-lg hover:shadow-xl
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              backdrop-blur-sm bg-opacity-90
            `}
            title="Scroll to top"
          >
            <motion.div
              animate={{ y: [-1, 1, -1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowUpIcon className={iconSizes[size]} />
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
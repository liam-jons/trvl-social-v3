import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing header visibility and height with IntersectionObserver
 * Provides smooth header hide/show behavior and dynamic height tracking
 */
export const useHeaderVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(88); // Default height
  const headerRef = useRef(null);
  const sentinelRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef('up');

  // Update CSS custom property for header height
  const updateHeaderHeight = useCallback((height) => {
    if (height && height !== headerHeight) {
      setHeaderHeight(height);
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    }
  }, [headerHeight]);

  // Track header height changes with ResizeObserver
  useEffect(() => {
    if (!headerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        updateHeaderHeight(height);
      }
    });

    resizeObserver.observe(headerRef.current);

    // Initial height calculation
    const initialHeight = headerRef.current.offsetHeight;
    updateHeaderHeight(initialHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateHeaderHeight]);

  // Handle scroll direction and header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down and past threshold
        scrollDirection.current = 'down';
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        scrollDirection.current = 'up';
        setIsVisible(true);
      }

      // Always show header at top of page
      if (currentScrollY < 50) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    isVisible,
    headerHeight,
    headerRef,
    sentinelRef,
  };
};

export default useHeaderVisibility;

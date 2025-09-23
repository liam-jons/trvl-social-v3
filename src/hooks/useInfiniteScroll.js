import { useState, useEffect, useCallback, useRef } from 'react';
/**
 * Custom hook for infinite scroll functionality
 * @param {Function} fetchMore - Function to fetch more data
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and functions
 */
export const useInfiniteScroll = (fetchMore, options = {}) => {
  const {
    threshold = 100, // Distance from bottom to trigger fetch
    delay = 300, // Debounce delay for scroll events
    initialPage = 0,
    pageSize = 10,
    enabled = true
  } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState(null);
  const scrollTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    if (!enabled || isLoading || !hasNextPage) return;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
      if (distanceFromBottom <= threshold) {
        loadMore();
      }
    }, delay);
  }, [enabled, isLoading, hasNextPage, threshold, delay]);
  // Load more data function
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || !hasNextPage) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchMore({
        page: currentPage + 1,
        pageSize,
        currentPage
      });
      if (result) {
        const { hasMore = true, nextPage, error: fetchError } = result;
        if (fetchError) {
          setError(fetchError);
        } else {
          setCurrentPage(nextPage !== undefined ? nextPage : currentPage + 1);
          setHasNextPage(hasMore);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load more data');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isLoading, hasNextPage, fetchMore, currentPage, pageSize]);
  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setHasNextPage(true);
    setIsLoading(false);
    setError(null);
  }, [initialPage]);
  // Manual trigger for loading more
  const triggerLoad = useCallback(() => {
    if (enabled && !isLoading && hasNextPage) {
      loadMore();
    }
  }, [enabled, isLoading, hasNextPage, loadMore]);
  // Set up scroll listener
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, enabled]);
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  return {
    isLoading,
    hasNextPage,
    currentPage,
    error,
    loadMore: triggerLoad,
    reset,
    // Utility functions
    canLoadMore: enabled && !isLoading && hasNextPage,
    isFirstLoad: currentPage === initialPage && !isLoading
  };
};
/**
 * Hook for intersection observer-based infinite scroll
 * More efficient for large lists
 */
export const useInfiniteScrollObserver = (fetchMore, options = {}) => {
  const {
    root = null,
    rootMargin = '100px',
    threshold = 0.1,
    initialPage = 0,
    pageSize = 10,
    enabled = true
  } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  // Load more data function
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || !hasNextPage) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchMore({
        page: currentPage + 1,
        pageSize,
        currentPage
      });
      if (result) {
        const { hasMore = true, nextPage, error: fetchError } = result;
        if (fetchError) {
          setError(fetchError);
        } else {
          setCurrentPage(nextPage !== undefined ? nextPage : currentPage + 1);
          setHasNextPage(hasMore);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load more data');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isLoading, hasNextPage, fetchMore, currentPage, pageSize]);
  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setHasNextPage(true);
    setIsLoading(false);
    setError(null);
  }, [initialPage]);
  // Set up intersection observer
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isLoading) {
          loadMore();
        }
      },
      {
        root,
        rootMargin,
        threshold
      }
    );
    observer.observe(sentinel);
    observerRef.current = observer;
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, loadMore, hasNextPage, isLoading, root, rootMargin, threshold]);
  return {
    isLoading,
    hasNextPage,
    currentPage,
    error,
    sentinelRef, // Ref to attach to the sentinel element
    loadMore,
    reset,
    // Utility functions
    canLoadMore: enabled && !isLoading && hasNextPage,
    isFirstLoad: currentPage === initialPage && !isLoading
  };
};
/**
 * Hook for virtualized infinite scroll
 * For very large datasets with performance considerations
 */
export const useVirtualInfiniteScroll = (fetchMore, options = {}) => {
  const {
    itemHeight = 200, // Estimated height of each item
    containerHeight = 600, // Height of the visible container
    bufferSize = 5, // Number of items to render outside visible area
    initialPage = 0,
    pageSize = 10,
    enabled = true
  } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  // Calculate visible range
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.min(
    startIndex + visibleItemsCount + bufferSize * 2,
    currentPage * pageSize
  );
  // Load more data function
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || !hasNextPage) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchMore({
        page: currentPage + 1,
        pageSize,
        currentPage
      });
      if (result) {
        const { hasMore = true, nextPage, error: fetchError } = result;
        if (fetchError) {
          setError(fetchError);
        } else {
          setCurrentPage(nextPage !== undefined ? nextPage : currentPage + 1);
          setHasNextPage(hasMore);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load more data');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isLoading, hasNextPage, fetchMore, currentPage, pageSize]);
  // Handle scroll events
  const handleScroll = useCallback((event) => {
    const { scrollTop: newScrollTop } = event.target;
    setScrollTop(newScrollTop);
    // Check if we need to load more
    const totalHeight = currentPage * pageSize * itemHeight;
    const scrollBottom = newScrollTop + containerHeight;
    if (scrollBottom >= totalHeight - itemHeight * bufferSize && hasNextPage && !isLoading) {
      loadMore();
    }
  }, [currentPage, pageSize, itemHeight, containerHeight, bufferSize, hasNextPage, isLoading, loadMore]);
  // Reset function
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setHasNextPage(true);
    setIsLoading(false);
    setError(null);
    setScrollTop(0);
  }, [initialPage]);
  return {
    isLoading,
    hasNextPage,
    currentPage,
    error,
    containerRef,
    scrollTop,
    startIndex,
    endIndex,
    visibleItemsCount,
    totalHeight: currentPage * pageSize * itemHeight,
    handleScroll,
    loadMore,
    reset,
    // Utility functions
    canLoadMore: enabled && !isLoading && hasNextPage,
    isFirstLoad: currentPage === initialPage && !isLoading,
    // Virtualization helpers
    getItemStyle: (index) => ({
      position: 'absolute',
      top: index * itemHeight,
      height: itemHeight,
      width: '100%'
    })
  };
};
export default useInfiniteScroll;
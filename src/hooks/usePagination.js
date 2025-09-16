import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for managing pagination state and logic
 * @param {Array} items - Array of items to paginate
 * @param {Object} options - Configuration options
 * @returns {Object} - Pagination state and functions
 */
export const usePagination = (items = [], options = {}) => {
  const {
    initialPage = 1,
    pageSize = 10,
    maxVisiblePages = 5,
    enabled = true
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate pagination values
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get current page items
  const currentItems = useMemo(() => {
    if (!enabled) return items;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize, enabled]);

  // Calculate visible page numbers for pagination controls
  const visiblePages = useMemo(() => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we don't have enough pages at the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToFirst = useCallback(() => goToPage(1), [goToPage]);
  const goToLast = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);
  const goToNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goToPrevious = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Reset pagination when items change significantly
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Pagination info
  const startIndex = enabled ? (currentPage - 1) * pageSize + 1 : 1;
  const endIndex = enabled ? Math.min(currentPage * pageSize, totalItems) : totalItems;

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return {
    // Current state
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    currentItems,

    // Navigation info
    hasNextPage,
    hasPreviousPage,
    isFirstPage,
    isLastPage,
    startIndex,
    endIndex,
    visiblePages,

    // Navigation functions
    goToPage,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    reset,

    // Utility functions
    getPageItems: (page) => {
      const start = (page - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },

    // Status helpers
    isEmpty: totalItems === 0,
    isSinglePage: totalPages <= 1,
    isEnabled: enabled && totalPages > 1
  };
};

export default usePagination;
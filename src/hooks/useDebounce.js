import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced search functionality
 * @param {Function} searchFunction - Function to call with search query
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} Search state and functions
 */
export function useDebouncedSearch(searchFunction, delay = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await Promise.resolve(searchFunction(debouncedQuery));
        setResults(searchResults);
      } catch (err) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchFunction]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    hasQuery: query.trim().length > 0,
    hasResults: results.length > 0
  };
}
import { useState, useEffect } from 'react';
const VIEW_PREFERENCE_KEY = 'adventure_view_preference';
export const useViewPreference = (defaultView = 'grid') => {
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem(VIEW_PREFERENCE_KEY);
      return saved ? JSON.parse(saved) : defaultView;
    } catch (error) {
      console.warn('Failed to load view preference from localStorage:', error);
      return defaultView;
    }
  });
  const setViewPreference = (newView) => {
    try {
      setViewMode(newView);
      localStorage.setItem(VIEW_PREFERENCE_KEY, JSON.stringify(newView));
    } catch (error) {
      console.warn('Failed to save view preference to localStorage:', error);
      // Still update the state even if localStorage fails
      setViewMode(newView);
    }
  };
  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === VIEW_PREFERENCE_KEY && event.newValue) {
        try {
          const newView = JSON.parse(event.newValue);
          setViewMode(newView);
        } catch (error) {
          console.warn('Failed to parse view preference from storage event:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  return [viewMode, setViewPreference];
};
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing dropdown behavior with keyboard navigation
 * Provides consistent dropdown patterns across the application
 */
export const useDropdown = (options = {}) => {
  const {
    closeOnEscape = true,
    closeOnClickOutside = true,
    closeOnRouteChange = true,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Toggle dropdown
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Open dropdown
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close dropdown
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        close();
        // Return focus to trigger button
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close, closeOnEscape]);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        close();
      }
    };

    // Use capture phase to ensure we catch clicks before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen, close, closeOnClickOutside]);

  // Focus management when dropdown opens
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    // Find first focusable element in dropdown
    const focusableElements = dropdownRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        focusableElements[0].focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle tab key for focus trapping (optional)
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const handleTab = (event) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        dropdownRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  return {
    isOpen,
    toggle,
    open,
    close,
    dropdownRef,
    triggerRef,
    // ARIA props for trigger button
    triggerProps: {
      'aria-expanded': isOpen,
      'aria-haspopup': true,
      ref: triggerRef,
      onClick: toggle,
    },
    // ARIA props for dropdown container
    dropdownProps: {
      ref: dropdownRef,
      role: 'menu',
      'aria-hidden': !isOpen,
    },
  };
};

export default useDropdown;

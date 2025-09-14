import { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const GlassModal = forwardRef(({
  isOpen = false,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  size = 'md',
  ...props
}, ref) => {
  const modalRef = useRef(null);
  const combinedRef = ref || modalRef;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (closeOnEsc && e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEsc]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0 bg-black/50 glass-blur-sm" />

      <div
        ref={combinedRef}
        className={`
          relative z-10
          ${sizeClasses[size]}
          w-full
          glass-blur-md bg-white/10 dark:bg-black/20
          border border-white/20 dark:border-white/10
          rounded-2xl shadow-2xl
          p-6
          transform transition-all duration-300
          animate-in fade-in zoom-in-95
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  ml-auto p-2 rounded-lg
                  glass-blur-sm bg-white/10 dark:bg-white/5
                  border border-white/20 dark:border-white/10
                  hover:bg-white/20 dark:hover:bg-white/10
                  transition-all duration-200
                  text-gray-600 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                "
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

GlassModal.displayName = 'GlassModal';

export default GlassModal;
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

const ImageGallery = ({ images = [] }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!lightboxOpen) return;

      switch (e.key) {
        case 'Escape':
          setLightboxOpen(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateLightbox(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateLightbox(1);
          break;
        default:
          break;
      }
    };

    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  const navigateLightbox = useCallback((direction) => {
    setLightboxImageIndex((prev) => {
      const newIndex = prev + direction;
      if (newIndex < 0) return images.length - 1;
      if (newIndex >= images.length) return 0;
      return newIndex;
    });
  }, [images.length]);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigateLightbox(1),
    onSwipedRight: () => navigateLightbox(-1),
    trackMouse: true,
    trackTouch: true
  });

  const openLightbox = (index) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  if (!images.length) {
    return (
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer group"
          onClick={() => openLightbox(selectedImageIndex)}
        >
          <img
            src={images[selectedImageIndex]}
            alt={`Adventure image ${selectedImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setLoading(false)}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 dark:bg-black/90 rounded-full p-2">
                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Image counter */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {selectedImageIndex + 1} / {images.length}
          </div>

          {/* Navigation arrows for main image */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </motion.div>

        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {images.slice(0, 12).map((image, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedImageIndex(index)}
                className={`
                  aspect-square overflow-hidden rounded-md cursor-pointer transition-all duration-200
                  ${selectedImageIndex === index
                    ? 'ring-2 ring-primary-500 scale-95'
                    : 'hover:scale-95 opacity-70 hover:opacity-100'
                  }
                `}
              >
                <img
                  src={image}
                  alt={`Adventure thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}

            {/* More images indicator */}
            {images.length > 12 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 12 * 0.05 }}
                onClick={() => openLightbox(12)}
                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  +{images.length - 12}
                </span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div {...swipeHandlers} className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                aria-label="Close image gallery"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Main lightbox image */}
              <motion.img
                key={lightboxImageIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                src={images[lightboxImageIndex]}
                alt={`Adventure image ${lightboxImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox(-1);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox(1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {lightboxImageIndex + 1} / {images.length}
              </div>

              {/* Thumbnail strip */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-4xl w-full px-4">
                <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImageIndex(index);
                      }}
                      className={`
                        flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all duration-200
                        ${lightboxImageIndex === index
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-60 hover:opacity-80'
                        }
                      `}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Swipe indicator for mobile */}
              <div className="absolute bottom-4 right-4 text-white/70 text-xs md:hidden">
                Swipe to navigate
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;
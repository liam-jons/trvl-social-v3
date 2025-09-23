/**
 * Image Optimization Utilities
 * Handles lazy loading, WebP conversion, and responsive images
 */

/**
 * Check if browser supports WebP format
 */
export function supportsWebP() {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get optimized image URL with WebP support and CDN
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fallback = true
  } = options;

  // If it's already a CDN URL, return as-is
  if (originalUrl.includes('supabase.co/storage') || originalUrl.includes('cdn.trvlsocial.com')) {
    const url = new URL(originalUrl);

    // Add optimization parameters for Supabase Storage
    if (originalUrl.includes('supabase.co/storage')) {
      if (width) url.searchParams.set('width', width);
      if (height) url.searchParams.set('height', height);
      if (quality !== 80) url.searchParams.set('quality', quality);

      // Use WebP if supported, unless explicitly disabled
      if (format === 'auto' && supportsWebP()) {
        url.searchParams.set('format', 'webp');
      } else if (format !== 'auto') {
        url.searchParams.set('format', format);
      }
    }

    return url.toString();
  }

  // For other URLs, return the original (could be enhanced with image proxy service)
  return originalUrl;
}

/**
 * Generate responsive image source set
 */
export function generateResponsiveSources(baseUrl, breakpoints = [480, 768, 1024, 1200]) {
  const sources = breakpoints.map(width => {
    const optimizedUrl = getOptimizedImageUrl(baseUrl, { width, quality: 85 });
    return `${optimizedUrl} ${width}w`;
  });

  return sources.join(', ');
}

/**
 * Create picture element with WebP and fallback sources
 */
export function createPictureElement(src, alt, options = {}) {
  const {
    className = '',
    loading = 'lazy',
    sizes = '100vw',
    width,
    height
  } = options;

  const webpSrc = getOptimizedImageUrl(src, { format: 'webp', width, height });
  const fallbackSrc = getOptimizedImageUrl(src, { format: 'jpg', width, height });
  const responsiveSources = generateResponsiveSources(src);

  return {
    webpSrc,
    fallbackSrc,
    srcSet: responsiveSources,
    alt,
    className,
    loading,
    sizes,
    width,
    height
  };
}

/**
 * Lazy loading intersection observer
 */
class LazyImageObserver {
  constructor() {
    this.observer = null;
    this.images = new Set();
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
              this.images.delete(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Load images 50px before they enter viewport
          threshold: 0.1
        }
      );
    }
  }

  observe(imageElement) {
    if (this.observer && imageElement) {
      this.images.add(imageElement);
      this.observer.observe(imageElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(imageElement);
    }
  }

  loadImage(imageElement) {
    const src = imageElement.dataset.src;
    const srcset = imageElement.dataset.srcset;

    if (src) {
      imageElement.src = src;
      imageElement.removeAttribute('data-src');
    }

    if (srcset) {
      imageElement.srcset = srcset;
      imageElement.removeAttribute('data-srcset');
    }

    imageElement.classList.add('lazy-loaded');
    imageElement.classList.remove('lazy-loading');

    // Dispatch load event for any listeners
    imageElement.dispatchEvent(new Event('lazyload'));
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

// Create singleton instance
const lazyImageObserver = new LazyImageObserver();

/**
 * Set up lazy loading for an image element
 */
export function setupLazyLoading(imageElement, src, options = {}) {
  if (!imageElement) return;

  const { srcset, placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=' } = options;

  // Set placeholder
  imageElement.src = placeholder;
  imageElement.classList.add('lazy-loading');

  // Set data attributes for actual image
  imageElement.dataset.src = src;
  if (srcset) {
    imageElement.dataset.srcset = srcset;
  }

  // Start observing
  lazyImageObserver.observe(imageElement);
}

/**
 * React hook for lazy loading images
 */
export function useLazyImage(src, options = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    const handleLoad = () => setIsLoaded(true);
    const handleLazyLoad = () => setIsInView(true);

    currentImg.addEventListener('load', handleLoad);
    currentImg.addEventListener('lazyload', handleLazyLoad);

    // Set up lazy loading
    const optimizedSrc = getOptimizedImageUrl(src, options);
    const responsiveSrcSet = generateResponsiveSources(src);

    setupLazyLoading(currentImg, optimizedSrc, {
      srcset: responsiveSrcSet,
      ...options
    });

    return () => {
      currentImg.removeEventListener('load', handleLoad);
      currentImg.removeEventListener('lazyload', handleLazyLoad);
    };
  }, [src, options]);

  return {
    imgRef,
    isLoaded,
    isInView,
    src: getOptimizedImageUrl(src, options)
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;

    img.src = getOptimizedImageUrl(src, options);
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(urls, options = {}) {
  const promises = urls.map(url => preloadImage(url, options));

  try {
    return await Promise.allSettled(promises);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
    return [];
  }
}

export default {
  supportsWebP,
  getOptimizedImageUrl,
  generateResponsiveSources,
  createPictureElement,
  setupLazyLoading,
  useLazyImage,
  preloadImage,
  preloadImages,
  observer: lazyImageObserver
};
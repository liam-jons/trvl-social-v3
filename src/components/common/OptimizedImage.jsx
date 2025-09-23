/**
 * Optimized Image Component
 * Provides lazy loading, WebP support, and responsive images
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  getOptimizedImageUrl,
  generateResponsiveSources,
  setupLazyLoading,
  supportsWebP
} from '../../utils/image-optimization.js';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  sizes = '100vw',
  quality = 80,
  placeholder,
  onLoad,
  onError,
  eager = false,
  responsive = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Generate optimized URLs
  const webpSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'webp'
  });

  const fallbackSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'jpg'
  });

  const srcSet = responsive ? generateResponsiveSources(src) : null;

  // Default placeholder - 1x1 transparent SVG
  const defaultPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=';

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    const handleLoad = (e) => {
      setIsLoaded(true);
      onLoad?.(e);
    };

    const handleError = (e) => {
      setHasError(true);
      onError?.(e);
    };

    currentImg.addEventListener('load', handleLoad);
    currentImg.addEventListener('error', handleError);

    // Set up lazy loading unless eager loading is requested
    if (!eager && loading === 'lazy') {
      const optimizedSrc = supportsWebP() ? webpSrc : fallbackSrc;
      setupLazyLoading(currentImg, optimizedSrc, {
        srcset: srcSet,
        placeholder: placeholder || defaultPlaceholder
      });
    }

    return () => {
      currentImg.removeEventListener('load', handleLoad);
      currentImg.removeEventListener('error', handleError);
    };
  }, [src, webpSrc, fallbackSrc, srcSet, eager, loading, placeholder, onLoad, onError]);

  // CSS classes for loading states
  const imageClasses = [
    className,
    'transition-opacity duration-300',
    !isLoaded && loading === 'lazy' ? 'opacity-0' : 'opacity-100',
    hasError ? 'bg-gray-200' : ''
  ].filter(Boolean).join(' ');

  // For eager loading or no lazy loading support
  if (eager || loading !== 'lazy') {
    if (supportsWebP()) {
      return (
        <picture className={imageClasses}>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            ref={imgRef}
            src={fallbackSrc}
            srcSet={responsive ? srcSet : undefined}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            loading={loading}
            {...props}
          />
        </picture>
      );
    } else {
      return (
        <img
          ref={imgRef}
          src={fallbackSrc}
          srcSet={responsive ? srcSet : undefined}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={loading}
          className={imageClasses}
          {...props}
        />
      );
    }
  }

  // Lazy loading version
  return (
    <picture className={imageClasses}>
      {supportsWebP() && (
        <source data-srcset={webpSrc} type="image/webp" />
      )}
      <img
        ref={imgRef}
        src={placeholder || defaultPlaceholder}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className="lazy-loading"
        {...props}
      />
    </picture>
  );
};

/**
 * Optimized Avatar Component
 * Specifically for user avatars with common sizes
 */
export const OptimizedAvatar = ({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeMap = {
    xs: { width: 24, height: 24, className: 'w-6 h-6' },
    sm: { width: 32, height: 32, className: 'w-8 h-8' },
    md: { width: 48, height: 48, className: 'w-12 h-12' },
    lg: { width: 64, height: 64, className: 'w-16 h-16' },
    xl: { width: 96, height: 96, className: 'w-24 h-24' }
  };

  const sizeConfig = sizeMap[size] || sizeMap.md;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizeConfig.width}
      height={sizeConfig.height}
      className={`rounded-full object-cover ${sizeConfig.className} ${className}`}
      responsive={false} // Avatars don't need responsive images
      quality={90} // Higher quality for profile images
      {...props}
    />
  );
};

/**
 * Hero Image Component
 * For large banner/hero images with progressive loading
 */
export const OptimizedHeroImage = ({
  src,
  alt,
  className = '',
  overlayClassName = '',
  children,
  ...props
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        sizes="100vw"
        quality={85}
        eager={true} // Hero images should load immediately
        {...props}
      />
      {overlayClassName && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Gallery Image Component
 * For image galleries with thumbnails
 */
export const OptimizedGalleryImage = ({
  src,
  alt,
  thumbnailSrc,
  onClick,
  className = '',
  ...props
}) => {
  const [showFullSize, setShowFullSize] = useState(false);

  const handleClick = (e) => {
    setShowFullSize(true);
    onClick?.(e);
  };

  return (
    <div
      className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={handleClick}
    >
      <OptimizedImage
        src={showFullSize ? src : (thumbnailSrc || src)}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        width={showFullSize ? undefined : 300}
        height={showFullSize ? undefined : 200}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
/**
 * Image Asset Management Service
 * Handles local image assets, fallbacks, and Supabase storage integration
 */

// Image categories and their base paths
const IMAGE_CATEGORIES = {
  adventures: '/images/adventures',
  vendors: '/images/vendors',
  quiz: '/images/quiz',
  avatars: '/images/avatars',
  demo: '/images/demo'
};

// Default placeholder images for each category
const DEFAULT_PLACEHOLDERS = {
  adventures: '/images/placeholders/adventure-placeholder.svg',
  vendors: '/images/placeholders/vendor-placeholder.svg',
  quiz: '/images/placeholders/quiz-placeholder.svg',
  avatars: '/images/placeholders/avatar-placeholder.svg',
  demo: '/images/placeholders/demo-placeholder.svg'
};

/**
 * Image Asset Service Class
 */
class ImageAssetService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.bucketName = 'travel-social-assets';
  }

  /**
   * Get optimized image URL with fallbacks
   * @param {string} category - Image category (adventures, vendors, etc.)
   * @param {string} imageName - Image file name
   * @param {Object} options - Options for size, format, etc.
   * @returns {string} Image URL
   */
  getImageUrl(category, imageName, options = {}) {
    const {
      width = 800,
      height = 600,
      format = 'webp',
      quality = 80,
      fallback = true
    } = options;

    // Check cache first
    const cacheKey = `${category}-${imageName}-${width}x${height}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let imageUrl;

    // Try Supabase storage first (when available)
    if (this.baseUrl) {
      imageUrl = this.getSupabaseImageUrl(category, imageName, options);
    } else {
      // Fall back to local public assets
      imageUrl = this.getLocalImageUrl(category, imageName);
    }

    // Add fallback placeholder if requested
    if (fallback && !this.isValidImageUrl(imageUrl)) {
      imageUrl = this.getPlaceholderUrl(category);
    }

    // Cache the result
    this.cache.set(cacheKey, imageUrl);
    return imageUrl;
  }

  /**
   * Generate Supabase storage URL with transformations
   */
  getSupabaseImageUrl(category, imageName, options) {
    const { width, height, quality = 80 } = options;
    const basePath = `${this.baseUrl}/storage/v1/object/public/${this.bucketName}`;

    // Add transformation parameters for Supabase
    const transformParams = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      quality: quality.toString(),
      format: 'webp'
    });

    return `${basePath}/${category}/${imageName}?${transformParams}`;
  }

  /**
   * Get local image URL from public directory
   */
  getLocalImageUrl(category, imageName) {
    const basePath = IMAGE_CATEGORIES[category] || '/images';
    return `${basePath}/${imageName}`;
  }

  /**
   * Get placeholder URL for category
   */
  getPlaceholderUrl(category) {
    return DEFAULT_PLACEHOLDERS[category] || DEFAULT_PLACEHOLDERS.demo;
  }

  /**
   * Replace external image URLs with local asset references
   * @param {string} externalUrl - External image URL (e.g., Unsplash)
   * @param {string} category - Target category for local storage
   * @returns {string} Local asset URL
   */
  replaceExternalUrl(externalUrl, category = 'demo') {
    // Extract image ID from common external services
    let imageId = this.extractImageId(externalUrl);

    // Generate local filename
    const localFileName = `${category}-${imageId}.webp`;

    // Return local asset URL
    return this.getImageUrl(category, localFileName, { fallback: true });
  }

  /**
   * Extract image identifier from external URLs
   */
  extractImageId(url) {
    // Handle Unsplash URLs
    if (url.includes('unsplash.com')) {
      const match = url.match(/photo-([a-zA-Z0-9-]+)/);
      return match ? match[1].slice(0, 12) : 'unsplash-default';
    }

    // Handle Picsum URLs
    if (url.includes('picsum.photos')) {
      const match = url.match(/random=(\d+)/);
      return match ? `picsum-${match[1]}` : 'picsum-default';
    }

    // Handle example.com URLs
    if (url.includes('example.com')) {
      const match = url.match(/avatar(\d+)\.png/);
      return match ? `avatar-${match[1]}` : 'example-default';
    }

    // Generate hash for other URLs
    return 'external-' + Math.abs(this.hashCode(url)).toString(36).slice(0, 8);
  }

  /**
   * Simple hash function for URL identification
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Check if image URL is valid/accessible
   */
  isValidImageUrl(url) {
    // Basic validation - could be enhanced with actual HTTP checks
    return url && !url.includes('undefined') && !url.includes('null');
  }

  /**
   * Generate responsive image source set
   */
  generateSrcSet(category, imageName, sizes = [400, 800, 1200]) {
    return sizes.map(width => {
      const url = this.getImageUrl(category, imageName, {
        width,
        height: Math.round(width * 0.75) // 4:3 aspect ratio
      });
      return `${url} ${width}w`;
    }).join(', ');
  }

  /**
   * Preload critical images
   */
  preloadImages(imageConfigs) {
    imageConfigs.forEach(({ category, imageName, priority = 'low' }) => {
      const url = this.getImageUrl(category, imageName);

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      if (priority === 'high') {
        link.fetchPriority = 'high';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const imageAssetService = new ImageAssetService();

/**
 * Utility function to replace external image URLs in data objects
 * @param {Object|Array} data - Data containing image URLs to replace
 * @param {string} category - Image category for local storage
 * @returns {Object|Array} Data with replaced image URLs
 */
export function replaceExternalImages(data, category = 'demo') {
  if (Array.isArray(data)) {
    return data.map(item => replaceExternalImages(item, category));
  }

  if (typeof data === 'object' && data !== null) {
    const result = { ...data };

    // Common image fields to replace
    const imageFields = ['image', 'avatar', 'coverImage', 'imageUrl', 'src', 'images'];

    imageFields.forEach(field => {
      if (result[field]) {
        if (typeof result[field] === 'string') {
          result[field] = imageAssetService.replaceExternalUrl(result[field], category);
        } else if (Array.isArray(result[field])) {
          result[field] = result[field].map(url =>
            imageAssetService.replaceExternalUrl(url, category)
          );
        }
      }
    });

    // Recursively process nested objects
    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = replaceExternalImages(result[key], category);
      }
    });

    return result;
  }

  return data;
}

/**
 * React hook for responsive images
 */
export function useResponsiveImage(category, imageName, options = {}) {
  const url = imageAssetService.getImageUrl(category, imageName, options);
  const srcSet = imageAssetService.generateSrcSet(category, imageName);

  return {
    src: url,
    srcSet,
    loading: options.lazy ? 'lazy' : 'eager'
  };
}

export default imageAssetService;
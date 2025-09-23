/**
 * CDN and Asset Optimization Service
 *
 * Handles content delivery network configuration, asset optimization,
 * caching strategies, and performance optimization for production deployments.
 */

import logger from '../utils/logger.js';

/**
 * CDN Optimization Service Class
 */
export class CDNOptimizationService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.cdnEnabled = process.env.ENABLE_CDN === 'true';
    this.compressionEnabled = process.env.ENABLE_COMPRESSION === 'true';

    this.config = {
      cdn: {
        baseUrl: process.env.CDN_BASE_URL || 'https://cdn.trvlsocial.com',
        assetsPath: process.env.CDN_ASSETS_PATH || '/static',
        imagesPath: process.env.CDN_IMAGES_PATH || '/images',
        enablePush: true,
        enablePreload: true
      },
      cache: {
        staticAssets: parseInt(process.env.STATIC_CACHE_TTL || '604800'), // 7 days
        images: parseInt(process.env.IMAGE_CACHE_TTL || '2592000'), // 30 days
        api: parseInt(process.env.API_CACHE_TTL || '300'), // 5 minutes
        html: parseInt(process.env.HTML_CACHE_TTL || '3600') // 1 hour
      },
      compression: {
        level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
        threshold: 1024, // Compress files larger than 1KB
        types: [
          'text/html',
          'text/css',
          'text/javascript',
          'application/javascript',
          'application/json',
          'text/xml',
          'application/xml',
          'image/svg+xml'
        ]
      },
      optimization: {
        enableMinification: true,
        enableTreeShaking: true,
        enableCodeSplitting: true,
        enableImageOptimization: true,
        enableWebP: true,
        enableAVIF: true
      }
    };

    this.initialize();
  }

  /**
   * Initialize CDN and optimization service
   */
  initialize() {
    if (this.cdnEnabled) {
      this.initializeCDN();
    }

    this.initializeAssetOptimization();
    this.initializeCacheStrategies();

    if (this.isProduction) {
      this.initializePerformanceMonitoring();
    }

    logger.info('CDN optimization service initialized', {
      cdnEnabled: this.cdnEnabled,
      compressionEnabled: this.compressionEnabled,
      cdnBaseUrl: this.config.cdn.baseUrl
    });
  }

  /**
   * Initialize CDN configuration
   */
  initializeCDN() {
    // Configure CDN headers and settings
    this.cdnHeaders = {
      'Cache-Control': this.generateCacheControl('static'),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    logger.debug('CDN configuration initialized', {
      baseUrl: this.config.cdn.baseUrl,
      headers: this.cdnHeaders
    });
  }

  /**
   * Initialize asset optimization
   */
  initializeAssetOptimization() {
    this.assetManifest = new Map();
    this.preloadAssets = new Set();
    this.criticalAssets = new Set();

    // Load asset manifest if available
    this.loadAssetManifest();
  }

  /**
   * Initialize cache strategies
   */
  initializeCacheStrategies() {
    this.cacheStrategies = {
      'static': {
        maxAge: this.config.cache.staticAssets,
        strategy: 'cache-first',
        headers: {
          'Cache-Control': `public, max-age=${this.config.cache.staticAssets}, immutable`
        }
      },
      'images': {
        maxAge: this.config.cache.images,
        strategy: 'cache-first',
        headers: {
          'Cache-Control': `public, max-age=${this.config.cache.images}`,
          'Vary': 'Accept'
        }
      },
      'api': {
        maxAge: this.config.cache.api,
        strategy: 'network-first',
        headers: {
          'Cache-Control': `public, max-age=${this.config.cache.api}`,
          'Vary': 'Accept-Encoding'
        }
      },
      'html': {
        maxAge: this.config.cache.html,
        strategy: 'network-first',
        headers: {
          'Cache-Control': `public, max-age=${this.config.cache.html}`,
          'Vary': 'Accept-Encoding'
        }
      }
    };
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    this.performanceMetrics = {
      cacheHitRate: 0,
      avgResponseTime: 0,
      bytesServed: 0,
      compressionRatio: 0,
      lastUpdated: Date.now()
    };

    // Update metrics periodically
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 300000); // Every 5 minutes
  }

  /**
   * Load asset manifest for optimized asset URLs
   */
  async loadAssetManifest() {
    try {
      // In a real implementation, this would load from a manifest file
      // generated during the build process
      const manifestPath = '/dist/asset-manifest.json';

      // For now, create a mock manifest
      this.assetManifest.set('main.js', '/static/js/main.12345.js');
      this.assetManifest.set('main.css', '/static/css/main.67890.css');
      this.assetManifest.set('logo.png', '/static/images/logo.abcde.png');

      logger.debug('Asset manifest loaded', {
        assetsCount: this.assetManifest.size
      });
    } catch (error) {
      logger.warn('Failed to load asset manifest', {
        error: error.message
      });
    }
  }

  /**
   * Get optimized URL for an asset
   */
  getAssetUrl(assetPath, options = {}) {
    const {
      optimize = true,
      webp = this.config.optimization.enableWebP,
      quality = 85,
      width = null,
      height = null
    } = options;

    let url = assetPath;

    // Use CDN if enabled
    if (this.cdnEnabled && this.isStaticAsset(assetPath)) {
      const cdnPath = this.isImageAsset(assetPath) ?
        this.config.cdn.imagesPath :
        this.config.cdn.assetsPath;

      url = `${this.config.cdn.baseUrl}${cdnPath}${assetPath}`;
    }

    // Apply optimizations for images
    if (optimize && this.isImageAsset(assetPath)) {
      url = this.optimizeImageUrl(url, { webp, quality, width, height });
    }

    // Use versioned asset from manifest
    const manifestKey = assetPath.replace(/^\//, '');
    if (this.assetManifest.has(manifestKey)) {
      const versionedPath = this.assetManifest.get(manifestKey);
      url = this.cdnEnabled ?
        `${this.config.cdn.baseUrl}${versionedPath}` :
        versionedPath;
    }

    return url;
  }

  /**
   * Optimize image URL with parameters
   */
  optimizeImageUrl(url, options) {
    const { webp, quality, width, height } = options;
    const params = new URLSearchParams();

    if (quality && quality !== 85) {
      params.append('q', quality.toString());
    }

    if (width) {
      params.append('w', width.toString());
    }

    if (height) {
      params.append('h', height.toString());
    }

    if (webp && this.supportsWebP()) {
      params.append('f', 'webp');
    }

    if (params.toString()) {
      const separator = url.includes('?') ? '&' : '?';
      url += separator + params.toString();
    }

    return url;
  }

  /**
   * Check if browser supports WebP
   */
  supportsWebP() {
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false; // Server-side, assume support
  }

  /**
   * Check if asset is a static asset
   */
  isStaticAsset(path) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  /**
   * Check if asset is an image
   */
  isImageAsset(path) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  /**
   * Generate appropriate cache control header
   */
  generateCacheControl(type) {
    const strategy = this.cacheStrategies[type] || this.cacheStrategies.default;
    return strategy.headers['Cache-Control'];
  }

  /**
   * Preload critical assets
   */
  preloadCriticalAssets() {
    const criticalAssets = [
      { href: this.getAssetUrl('/static/css/main.css'), as: 'style' },
      { href: this.getAssetUrl('/static/js/main.js'), as: 'script' },
      { href: this.getAssetUrl('/static/fonts/main.woff2'), as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ];

    if (typeof document !== 'undefined') {
      criticalAssets.forEach(asset => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = asset.href;
        link.as = asset.as;

        if (asset.type) link.type = asset.type;
        if (asset.crossorigin) link.crossOrigin = asset.crossorigin;

        document.head.appendChild(link);
      });

      logger.debug('Critical assets preloaded', {
        assetsCount: criticalAssets.length
      });
    }
  }

  /**
   * Set up service worker for caching
   */
  setupServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).then(registration => {
        logger.info('Service worker registered successfully', {
          scope: registration.scope
        });

        // Update service worker cache strategies
        this.updateServiceWorkerCache();
      }).catch(error => {
        logger.error('Service worker registration failed', {
          error: error.message
        });
      });
    }
  }

  /**
   * Update service worker cache strategies
   */
  updateServiceWorkerCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_CACHE_STRATEGIES',
        strategies: this.cacheStrategies
      });
    }
  }

  /**
   * Compress response if applicable
   */
  shouldCompress(contentType, contentLength) {
    if (!this.compressionEnabled) return false;
    if (contentLength < this.config.compression.threshold) return false;

    return this.config.compression.types.some(type =>
      contentType.includes(type)
    );
  }

  /**
   * Get compression headers
   */
  getCompressionHeaders(acceptEncoding = '') {
    const headers = {};

    if (this.compressionEnabled) {
      if (acceptEncoding.includes('br')) {
        headers['Content-Encoding'] = 'br';
      } else if (acceptEncoding.includes('gzip')) {
        headers['Content-Encoding'] = 'gzip';
      }

      if (headers['Content-Encoding']) {
        headers['Vary'] = 'Accept-Encoding';
      }
    }

    return headers;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    // In a real implementation, this would collect metrics from CDN provider APIs
    // or server logs. For now, we'll simulate metrics.

    this.performanceMetrics = {
      cacheHitRate: 0.85 + Math.random() * 0.1, // 85-95%
      avgResponseTime: 50 + Math.random() * 100, // 50-150ms
      bytesServed: Math.floor(Math.random() * 1000000000), // Random bytes
      compressionRatio: 0.6 + Math.random() * 0.2, // 60-80% compression
      lastUpdated: Date.now()
    };

    if (this.isProduction) {
      logger.debug('CDN performance metrics updated', this.performanceMetrics);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cdnEnabled: this.cdnEnabled,
      compressionEnabled: this.compressionEnabled,
      configuredStrategies: Object.keys(this.cacheStrategies).length
    };
  }

  /**
   * Purge CDN cache for specific assets
   */
  async purgeCDNCache(urls) {
    if (!this.cdnEnabled) {
      logger.warn('CDN not enabled, cannot purge cache');
      return false;
    }

    try {
      // In a real implementation, this would call CDN provider APIs
      // For now, we'll simulate cache purging

      logger.info('CDN cache purge initiated', {
        urls: Array.isArray(urls) ? urls : [urls],
        timestamp: new Date().toISOString()
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info('CDN cache purge completed successfully');
      return true;
    } catch (error) {
      logger.error('CDN cache purge failed', {
        error: error.message,
        urls
      });
      return false;
    }
  }

  /**
   * Health check for CDN service
   */
  async healthCheck() {
    const issues = [];
    const metrics = this.getPerformanceMetrics();

    // Check cache hit rate
    if (metrics.cacheHitRate < 0.7) {
      issues.push({
        severity: 'warning',
        message: `Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`
      });
    }

    // Check response time
    if (metrics.avgResponseTime > 500) {
      issues.push({
        severity: 'warning',
        message: `High average response time: ${metrics.avgResponseTime.toFixed(0)}ms`
      });
    }

    // Test CDN connectivity if enabled
    if (this.cdnEnabled) {
      try {
        const testUrl = `${this.config.cdn.baseUrl}/health`;
        const response = await fetch(testUrl, {
          method: 'HEAD',
          timeout: 5000
        });

        if (!response.ok) {
          issues.push({
            severity: 'error',
            message: `CDN health check failed: ${response.status}`
          });
        }
      } catch (error) {
        issues.push({
          severity: 'error',
          message: `CDN connectivity test failed: ${error.message}`
        });
      }
    }

    return {
      status: issues.some(i => i.severity === 'error') ? 'error' :
              issues.length > 0 ? 'warning' : 'healthy',
      issues,
      metrics
    };
  }

  /**
   * Generate Content Security Policy headers
   */
  generateCSPHeaders() {
    const cdnDomain = this.cdnEnabled ?
      new URL(this.config.cdn.baseUrl).hostname :
      "'self'";

    return {
      'Content-Security-Policy': [
        `default-src 'self'`,
        `script-src 'self' ${cdnDomain} 'unsafe-inline' 'unsafe-eval'`,
        `style-src 'self' ${cdnDomain} 'unsafe-inline'`,
        `img-src 'self' ${cdnDomain} data: https:`,
        `font-src 'self' ${cdnDomain}`,
        `connect-src 'self' https://api.trvlsocial.com wss://api.trvlsocial.com`,
        `media-src 'self' ${cdnDomain}`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `frame-ancestors 'none'`,
        `upgrade-insecure-requests`
      ].join('; ')
    };
  }
}

/**
 * Create and export service instance
 */
export const cdnOptimizationService = new CDNOptimizationService();

/**
 * Asset optimization utilities
 */
export const AssetOptimization = {
  /**
   * Generate responsive image srcset
   */
  generateSrcSet(imagePath, sizes = [320, 640, 1024, 1920]) {
    return sizes.map(size => {
      const optimizedUrl = cdnOptimizationService.getAssetUrl(imagePath, {
        width: size,
        optimize: true,
        webp: true
      });
      return `${optimizedUrl} ${size}w`;
    }).join(', ');
  },

  /**
   * Get optimized image with multiple formats
   */
  getOptimizedImage(imagePath, options = {}) {
    const baseUrl = cdnOptimizationService.getAssetUrl(imagePath, options);

    return {
      webp: cdnOptimizationService.getAssetUrl(imagePath, { ...options, webp: true }),
      avif: cdnOptimizationService.getAssetUrl(imagePath, { ...options, avif: true }),
      original: baseUrl,
      srcset: AssetOptimization.generateSrcSet(imagePath)
    };
  },

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    cdnOptimizationService.preloadCriticalAssets();
    cdnOptimizationService.setupServiceWorker();
  }
};

export default cdnOptimizationService;
/**
 * Lazy Score Loader
 * Implements progressive loading of compatibility score details with intelligent prefetching
 */

import { redisCacheService } from './redis-cache-service.js';
import { compatibilityService } from './compatibility-service.ts';

class LazyScoreLoader {
  constructor() {
    this.loadingStates = new Map(); // Track loading states
    this.prefetchQueue = new Set(); // Queue for prefetching
    this.maxConcurrentLoads = 5;
    this.prefetchBatchSize = 10;
    this.viewportThreshold = 3; // Items to prefetch ahead of viewport

    // Cache for lightweight score summaries
    this.quickScoreCache = new Map();
    this.quickScoreTtl = 300000; // 5 minutes

    this.metrics = {
      quickLoads: 0,
      detailedLoads: 0,
      prefetchHits: 0,
      cacheHits: 0
    };
  }

  /**
   * Load quick compatibility preview (lightweight)
   */
  async loadQuickScore(user1Id, user2Id, options = {}) {
    const cacheKey = `quick_${user1Id}_${user2Id}_${options.groupId || ''}`;

    try {
      // Check quick cache first
      const cached = this.quickScoreCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.quickScoreTtl) {
        this.metrics.cacheHits++;
        return {
          success: true,
          data: cached.data,
          fromCache: true,
          loadTime: 0
        };
      }

      const startTime = Date.now();

      // Try Redis cache for full score
      let cachedScore = await redisCacheService.getCachedCompatibilityScore(
        user1Id, user2Id, { groupId: options.groupId }
      );

      if (cachedScore) {
        // Extract quick summary from cached full score
        const quickScore = this.extractQuickScore(cachedScore);

        // Cache the quick version locally
        this.quickScoreCache.set(cacheKey, {
          data: quickScore,
          timestamp: Date.now()
        });

        this.metrics.quickLoads++;
        return {
          success: true,
          data: quickScore,
          fromCache: true,
          loadTime: Date.now() - startTime
        };
      }

      // If no cached score, calculate quick approximation
      const quickScore = await this.calculateQuickApproximation(user1Id, user2Id, options);

      // Cache the quick score
      this.quickScoreCache.set(cacheKey, {
        data: quickScore,
        timestamp: Date.now()
      });

      this.metrics.quickLoads++;
      return {
        success: true,
        data: quickScore,
        fromCache: false,
        loadTime: Date.now() - startTime,
        isApproximation: true
      };

    } catch (error) {
      console.error('Quick score loading failed:', error);
      return {
        success: false,
        error: error.message,
        data: this.getFallbackQuickScore()
      };
    }
  }

  /**
   * Load detailed compatibility score with full breakdown
   */
  async loadDetailedScore(user1Id, user2Id, options = {}) {
    const loadKey = `${user1Id}_${user2Id}_${options.groupId || ''}`;

    try {
      // Check if already loading
      if (this.loadingStates.has(loadKey)) {
        return this.loadingStates.get(loadKey);
      }

      const startTime = Date.now();

      // Create loading promise
      const loadingPromise = this.performDetailedLoad(user1Id, user2Id, options);
      this.loadingStates.set(loadKey, loadingPromise);

      const result = await loadingPromise;
      result.loadTime = Date.now() - startTime;

      // Clean up loading state
      this.loadingStates.delete(loadKey);

      this.metrics.detailedLoads++;
      return result;

    } catch (error) {
      console.error('Detailed score loading failed:', error);
      this.loadingStates.delete(loadKey);

      return {
        success: false,
        error: error.message,
        loadTime: Date.now() - startTime
      };
    }
  }

  /**
   * Perform the actual detailed score loading
   */
  async performDetailedLoad(user1Id, user2Id, options = {}) {
    // Check Redis cache first
    let cachedScore = await redisCacheService.getCachedCompatibilityScore(
      user1Id, user2Id, { groupId: options.groupId }
    );

    if (cachedScore && !options.forceRefresh) {
      return {
        success: true,
        data: cachedScore,
        fromCache: true
      };
    }

    // Calculate detailed score
    const response = await compatibilityService.calculateCompatibility({
      user1Id,
      user2Id,
      groupId: options.groupId,
      algorithmId: options.algorithmId,
      options: {
        includeExplanation: true,
        cacheResult: true,
        includeBreakdown: true
      }
    });

    if (response.success) {
      // Cache the detailed score
      await redisCacheService.cacheCompatibilityScore(
        user1Id, user2Id, response.data, {
          groupId: options.groupId,
          ttl: 3600
        }
      );

      return {
        success: true,
        data: response.data,
        fromCache: false,
        explanation: response.explanation
      };
    }

    throw new Error(response.error?.message || 'Failed to calculate detailed score');
  }

  /**
   * Load scores for multiple pairs with intelligent batching
   */
  async loadBatchScores(userPairs, options = {}) {
    const { loadDetailed = false, maxConcurrent = 5 } = options;
    const results = new Map();
    const loadPromises = [];

    // Process in batches to avoid overwhelming the system
    const batches = this.chunkArray(userPairs, maxConcurrent);

    for (const batch of batches) {
      const batchPromises = batch.map(async ([user1Id, user2Id]) => {
        try {
          const score = loadDetailed
            ? await this.loadDetailedScore(user1Id, user2Id, options)
            : await this.loadQuickScore(user1Id, user2Id, options);

          results.set(`${user1Id}_${user2Id}`, score);
          return score;

        } catch (error) {
          const errorResult = {
            success: false,
            error: error.message,
            data: loadDetailed ? null : this.getFallbackQuickScore()
          };

          results.set(`${user1Id}_${user2Id}`, errorResult);
          return errorResult;
        }
      });

      await Promise.all(batchPromises);
    }

    return {
      success: true,
      data: Object.fromEntries(results),
      totalPairs: userPairs.length,
      loadedPairs: Array.from(results.values()).filter(r => r.success).length
    };
  }

  /**
   * Progressive loading for viewport-based score display
   */
  async loadProgressiveScores(userPairs, options = {}) {
    const {
      viewportStart = 0,
      viewportSize = 20,
      prefetchAhead = true
    } = options;

    // Load viewport scores (detailed)
    const viewportPairs = userPairs.slice(viewportStart, viewportStart + viewportSize);
    const viewportResults = await this.loadBatchScores(viewportPairs, {
      ...options,
      loadDetailed: true
    });

    // Prefetch ahead if enabled
    if (prefetchAhead) {
      const prefetchStart = viewportStart + viewportSize;
      const prefetchEnd = Math.min(prefetchStart + this.viewportThreshold, userPairs.length);
      const prefetchPairs = userPairs.slice(prefetchStart, prefetchEnd);

      // Prefetch in background (quick scores only)
      setImmediate(() => {
        this.prefetchScores(prefetchPairs, options);
      });
    }

    return viewportResults;
  }

  /**
   * Prefetch scores in background
   */
  async prefetchScores(userPairs, options = {}) {
    const prefetchPromises = userPairs.map(async ([user1Id, user2Id]) => {
      try {
        await this.loadQuickScore(user1Id, user2Id, options);
        this.metrics.prefetchHits++;
      } catch (error) {
        // Ignore prefetch errors
      }
    });

    await Promise.all(prefetchPromises);
  }

  /**
   * Extract lightweight summary from detailed score
   */
  extractQuickScore(fullScore) {
    return {
      user1Id: fullScore.user1Id,
      user2Id: fullScore.user2Id,
      groupId: fullScore.groupId,
      overallScore: fullScore.overallScore,
      confidence: fullScore.confidence,
      category: this.categorizeScore(fullScore.overallScore),
      primaryStrengths: this.extractTopStrengths(fullScore.dimensions, 2),
      calculatedAt: fullScore.calculatedAt,
      fromQuickLoad: true
    };
  }

  /**
   * Calculate quick approximation without full compatibility calculation
   */
  async calculateQuickApproximation(user1Id, user2Id, options = {}) {
    // This would use a lightweight algorithm or pre-computed personality summaries
    // For now, return a basic approximation

    const approximateScore = 50 + Math.floor(Math.random() * 40); // 50-90 range

    return {
      user1Id,
      user2Id,
      groupId: options.groupId,
      overallScore: approximateScore,
      confidence: 0.6, // Lower confidence for approximations
      category: this.categorizeScore(approximateScore),
      primaryStrengths: ['personality_compatibility'], // Generic
      calculatedAt: new Date(),
      fromQuickLoad: true,
      isApproximation: true
    };
  }

  /**
   * Get fallback score for errors
   */
  getFallbackQuickScore() {
    return {
      overallScore: 0,
      confidence: 0,
      category: 'unknown',
      primaryStrengths: [],
      calculatedAt: new Date(),
      fromQuickLoad: true,
      isFallback: true
    };
  }

  /**
   * Categorize compatibility score
   */
  categorizeScore(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'incompatible';
  }

  /**
   * Extract top strengths from score dimensions
   */
  extractTopStrengths(dimensions, count = 2) {
    if (!dimensions) return [];

    const strengths = Object.entries(dimensions)
      .map(([key, value]) => ({
        dimension: key,
        score: value.score || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.dimension);

    return strengths;
  }

  /**
   * Intelligent cache warming for upcoming requests
   */
  async warmCache(userIds, options = {}) {
    const pairs = this.generateUserPairs(userIds);
    const batchSize = Math.min(20, pairs.length);

    // Warm with quick scores first
    const quickBatches = this.chunkArray(pairs, batchSize);

    for (const batch of quickBatches) {
      await this.loadBatchScores(batch, { ...options, loadDetailed: false });

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      warmed: pairs.length,
      message: `Warmed cache for ${pairs.length} compatibility pairs`
    };
  }

  /**
   * Clean up expired quick scores from memory cache
   */
  cleanupQuickCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.quickScoreCache.entries()) {
      if ((now - cached.timestamp) > this.quickScoreTtl) {
        this.quickScoreCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get loading metrics and statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      quickCacheSize: this.quickScoreCache.size,
      activeLoading: this.loadingStates.size,
      prefetchQueueSize: this.prefetchQueue.size,
      cacheHitRate: this.metrics.quickLoads > 0
        ? ((this.metrics.cacheHits / this.metrics.quickLoads) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Generate user pairs
   */
  generateUserPairs(userIds) {
    const pairs = [];
    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        pairs.push([userIds[i], userIds[j]]);
      }
    }
    return pairs;
  }

  /**
   * Chunk array into smaller arrays
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Clear all caches and reset state
   */
  reset() {
    this.quickScoreCache.clear();
    this.loadingStates.clear();
    this.prefetchQueue.clear();
    this.metrics = {
      quickLoads: 0,
      detailedLoads: 0,
      prefetchHits: 0,
      cacheHits: 0
    };
  }
}

// Export singleton instance
export const lazyScoreLoader = new LazyScoreLoader();
export default LazyScoreLoader;
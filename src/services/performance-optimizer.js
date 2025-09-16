/**
 * Performance Optimizer
 * Main orchestrator for all performance optimization components
 */
import { redisCacheService } from './redis-cache-service.js';
import { batchCompatibilityProcessor } from './batch-compatibility-processor.js';
import { lazyScoreLoader } from './lazy-score-loader.js';
import { scoreApproximationEngine } from './score-approximation-engine.js';
import { backgroundJobQueue } from './background-job-queue.js';
import { cdnCacheManager } from './cdn-cache-manager.js';
class PerformanceOptimizer {
  constructor() {
    this.initialized = false;
    this.optimizationLevel = 'balanced'; // aggressive, balanced, conservative
    this.metrics = {
      totalOptimizations: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      backgroundJobs: 0,
      approximationAccuracy: 0
    };
    this.strategies = {
      aggressive: {
        useApproximation: true,
        maxBatchSize: 200,
        backgroundProcessing: true,
        cacheEverything: true,
        prefetchAggressive: true
      },
      balanced: {
        useApproximation: true,
        maxBatchSize: 100,
        backgroundProcessing: true,
        cacheEverything: false,
        prefetchAggressive: false
      },
      conservative: {
        useApproximation: false,
        maxBatchSize: 50,
        backgroundProcessing: false,
        cacheEverything: false,
        prefetchAggressive: false
      }
    };
  }
  /**
   * Initialize all performance optimization components
   */
  async initialize(options = {}) {
    if (this.initialized) return;
    console.log('🚀 Initializing Performance Optimizer...');
    try {
      // Set optimization level
      this.optimizationLevel = options.level || 'balanced';
      const strategy = this.strategies[this.optimizationLevel];
      // Initialize CDN cache manager first (static assets)
      await cdnCacheManager.preloadCriticalAssets();
      console.log('✅ CDN cache manager initialized');
      // Initialize Redis cache service
      const redisHealth = await redisCacheService.healthCheck();
      if (redisHealth.status !== 'healthy') {
        console.warn('⚠️  Redis cache not available, using fallback memory cache');
      } else {
        console.log('✅ Redis cache service connected');
      }
      // Initialize approximation engine with personality archetypes
      const archetypes = await cdnCacheManager.getStaticAsset('personality-archetypes');
      if (archetypes.data) {
        scoreApproximationEngine.personalityArchetypes.clear();
        Object.entries(archetypes.data).forEach(([key, value]) => {
          scoreApproximationEngine.personalityArchetypes.set(key, value);
        });
        console.log('✅ Score approximation engine loaded with personality data');
      }
      // Start background job queue if enabled
      if (strategy.backgroundProcessing) {
        backgroundJobQueue.startWorkers();
        console.log('✅ Background job queue started');
      }
      this.initialized = true;
      console.log(`🎯 Performance Optimizer initialized with ${this.optimizationLevel} strategy`);
      return {
        success: true,
        level: this.optimizationLevel,
        components: {
          redis: redisHealth.status === 'healthy',
          cdn: true,
          backgroundJobs: strategy.backgroundProcessing,
          approximation: true
        }
      };
    } catch (error) {
      console.error('❌ Performance Optimizer initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Optimize compatibility calculation request
   */
  async optimizeCompatibilityRequest(request) {
    const startTime = Date.now();
    const strategy = this.strategies[this.optimizationLevel];
    try {
      // Determine the best optimization approach
      const approach = this.selectOptimizationApproach(request);
      let result;
      switch (approach) {
        case 'cache_hit':
          result = await this.handleCacheHit(request);
          break;
        case 'approximation':
          result = await this.handleApproximation(request);
          break;
        case 'batch_processing':
          result = await this.handleBatchProcessing(request);
          break;
        case 'background_job':
          result = await this.handleBackgroundJob(request);
          break;
        case 'lazy_loading':
          result = await this.handleLazyLoading(request);
          break;
        default:
          result = await this.handleDirectCalculation(request);
      }
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(approach, processingTime, result.success);
      return {
        ...result,
        optimization: {
          approach,
          processingTime,
          strategy: this.optimizationLevel
        }
      };
    } catch (error) {
      console.error('Optimization failed:', error);
      return {
        success: false,
        error: error.message,
        optimization: {
          approach: 'error',
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  /**
   * Select the best optimization approach based on request characteristics
   */
  selectOptimizationApproach(request) {
    const strategy = this.strategies[this.optimizationLevel];
    // Check for cache hit first
    if (request.checkCache !== false) {
      return 'cache_hit';
    }
    // For bulk requests, use batch processing
    if (request.userIds && request.userIds.length > 10) {
      if (request.userIds.length > strategy.maxBatchSize && strategy.backgroundProcessing) {
        return 'background_job';
      }
      return 'batch_processing';
    }
    // For quick previews, use approximation
    if (request.quickPreview && strategy.useApproximation) {
      return 'approximation';
    }
    // For detailed scores that might be viewed later, use lazy loading
    if (request.includeExplanation && !request.immediate) {
      return 'lazy_loading';
    }
    // Default to direct calculation
    return 'direct_calculation';
  }
  /**
   * Handle cache hit optimization
   */
  async handleCacheHit(request) {
    // Try Redis cache first
    if (request.user1Id && request.user2Id) {
      const cached = await redisCacheService.getCachedCompatibilityScore(
        request.user1Id,
        request.user2Id,
        { groupId: request.groupId }
      );
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true,
          cacheType: 'redis'
        };
      }
    }
    // Try lazy loader cache for quick scores
    if (request.quickPreview) {
      const quickScore = await lazyScoreLoader.loadQuickScore(
        request.user1Id,
        request.user2Id,
        { groupId: request.groupId }
      );
      if (quickScore.success && quickScore.fromCache) {
        return {
          success: true,
          data: quickScore.data,
          fromCache: true,
          cacheType: 'lazy_loader'
        };
      }
    }
    // No cache hit, proceed with other approaches
    return this.selectFallbackApproach(request);
  }
  /**
   * Handle approximation optimization
   */
  async handleApproximation(request) {
    const approximation = await scoreApproximationEngine.approximateCompatibility(
      request.user1Id,
      request.user2Id,
      { groupId: request.groupId }
    );
    // Cache the approximation for future quick access
    if (approximation && !approximation.error) {
      await redisCacheService.cacheCompatibilityScore(
        request.user1Id,
        request.user2Id,
        approximation,
        {
          groupId: request.groupId,
          ttl: 1800 // 30 minutes for approximations
        }
      );
    }
    return {
      success: true,
      data: approximation,
      fromApproximation: true
    };
  }
  /**
   * Handle batch processing optimization
   */
  async handleBatchProcessing(request) {
    const result = await batchCompatibilityProcessor.processBulkCompatibility(
      request.userIds,
      {
        groupId: request.groupId,
        algorithmId: request.algorithmId,
        includeMatrix: request.includeMatrix,
        onProgress: request.onProgress
      }
    );
    return result;
  }
  /**
   * Handle background job optimization
   */
  async handleBackgroundJob(request) {
    // Queue the job for background processing
    const jobInfo = await backgroundJobQueue.addBulkCompatibilityJob(
      request.userIds,
      {
        groupId: request.groupId,
        algorithmId: request.algorithmId,
        priority: request.priority || 'normal',
        includeMatrix: request.includeMatrix
      }
    );
    return {
      success: true,
      data: {
        jobId: jobInfo.jobId,
        queuePosition: jobInfo.queuePosition,
        estimatedStartTime: jobInfo.estimatedStartTime,
        estimatedDuration: jobInfo.estimatedDuration
      },
      queued: true,
      backgroundProcessing: true
    };
  }
  /**
   * Handle lazy loading optimization
   */
  async handleLazyLoading(request) {
    // Load quick score first
    const quickScore = await lazyScoreLoader.loadQuickScore(
      request.user1Id,
      request.user2Id,
      { groupId: request.groupId }
    );
    // If detailed score is needed, load it asynchronously
    if (request.includeExplanation) {
      setImmediate(() => {
        lazyScoreLoader.loadDetailedScore(
          request.user1Id,
          request.user2Id,
          { groupId: request.groupId }
        ).catch(error => {
          console.error('Background detailed score loading failed:', error);
        });
      });
    }
    return {
      success: quickScore.success,
      data: quickScore.data,
      lazyLoading: true,
      detailedScoreLoading: request.includeExplanation
    };
  }
  /**
   * Handle direct calculation (fallback)
   */
  async handleDirectCalculation(request) {
    // Import the compatibility service dynamically to avoid circular dependencies
    const { compatibilityService } = await import('./compatibility-service.ts');
    const result = await compatibilityService.calculateCompatibility({
      user1Id: request.user1Id,
      user2Id: request.user2Id,
      groupId: request.groupId,
      algorithmId: request.algorithmId,
      options: {
        includeExplanation: request.includeExplanation,
        cacheResult: true
      }
    });
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      explanation: result.explanation,
      directCalculation: true
    };
  }
  /**
   * Select fallback approach when cache miss occurs
   */
  async selectFallbackApproach(request) {
    const strategy = this.strategies[this.optimizationLevel];
    if (request.quickPreview && strategy.useApproximation) {
      return this.handleApproximation(request);
    }
    return this.handleDirectCalculation(request);
  }
  /**
   * Intelligent cache warming based on usage patterns
   */
  async warmCaches(options = {}) {
    const strategy = this.strategies[this.optimizationLevel];
    try {
      console.log('🔥 Starting intelligent cache warming...');
      // Load frequently accessed user pairs from database
      const hotPairs = await this.getHotUserPairs(options.limit || 100);
      // Warm approximation cache
      if (strategy.useApproximation && hotPairs.length > 0) {
        console.log(`Warming approximation cache for ${hotPairs.length} pairs...`);
        const userIds = [...new Set(hotPairs.flatMap(pair => [pair.user1Id, pair.user2Id]))];
        await scoreApproximationEngine.approximateBatch(
          hotPairs.map(pair => [pair.user1Id, pair.user2Id]),
          { batchSize: 20 }
        );
      }
      // Warm lazy loader cache
      if (hotPairs.length > 0) {
        console.log('Warming lazy loader cache...');
        const userIds = [...new Set(hotPairs.flatMap(pair => [pair.user1Id, pair.user2Id]))];
        await lazyScoreLoader.warmCache(userIds);
      }
      console.log('✅ Cache warming completed');
      return {
        success: true,
        warmedPairs: hotPairs.length,
        caches: ['approximation', 'lazy_loader', 'redis']
      };
    } catch (error) {
      console.error('Cache warming failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Get frequently accessed user pairs for cache warming
   */
  async getHotUserPairs(limit = 100) {
    try {
      // This would typically query your analytics or usage logs
      // For now, return a mock dataset
      return Array(limit).fill(0).map((_, i) => ({
        user1Id: `user_${i * 2}`,
        user2Id: `user_${i * 2 + 1}`,
        accessCount: Math.floor(Math.random() * 50) + 10
      }));
    } catch (error) {
      console.error('Failed to get hot user pairs:', error);
      return [];
    }
  }
  /**
   * Update performance metrics
   */
  updateMetrics(approach, processingTime, success) {
    this.metrics.totalOptimizations++;
    if (success) {
      // Update average response time
      const currentAvg = this.metrics.averageResponseTime;
      const count = this.metrics.totalOptimizations;
      this.metrics.averageResponseTime = ((currentAvg * (count - 1)) + processingTime) / count;
      // Update cache hit rate
      if (approach === 'cache_hit') {
        const hits = Math.floor(this.metrics.cacheHitRate * (count - 1) / 100) + 1;
        this.metrics.cacheHitRate = (hits / count) * 100;
      }
    }
  }
  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics() {
    const redisStats = redisCacheService.getCacheStats();
    const batchStats = batchCompatibilityProcessor.getMetrics();
    const lazyStats = lazyScoreLoader.getMetrics();
    const approximationStats = scoreApproximationEngine.getMetrics();
    const jobQueueStats = backgroundJobQueue.getMetrics();
    const cdnStats = cdnCacheManager.getCacheStats();
    return {
      overall: this.metrics,
      components: {
        redis: redisStats,
        batchProcessor: batchStats,
        lazyLoader: lazyStats,
        approximationEngine: approximationStats,
        jobQueue: jobQueueStats,
        cdnCache: cdnStats
      },
      optimization: {
        level: this.optimizationLevel,
        strategy: this.strategies[this.optimizationLevel]
      },
      health: {
        redis: redisStats.connected,
        backgroundJobs: jobQueueStats.activeJobs < jobQueueStats.workers.length,
        overall: this.calculateOverallHealth()
      }
    };
  }
  /**
   * Calculate overall system health score
   */
  calculateOverallHealth() {
    let healthScore = 0;
    let factors = 0;
    // Redis health
    if (redisCacheService.getCacheStats().connected) {
      healthScore += 25;
    }
    factors += 25;
    // Cache hit rate health
    if (this.metrics.cacheHitRate > 70) healthScore += 25;
    else if (this.metrics.cacheHitRate > 50) healthScore += 15;
    else if (this.metrics.cacheHitRate > 30) healthScore += 10;
    factors += 25;
    // Response time health
    if (this.metrics.averageResponseTime < 100) healthScore += 25;
    else if (this.metrics.averageResponseTime < 500) healthScore += 15;
    else if (this.metrics.averageResponseTime < 1000) healthScore += 10;
    factors += 25;
    // Background job health
    const jobStats = backgroundJobQueue.getMetrics();
    const jobSuccessRate = parseFloat(jobStats.successRate.replace('%', ''));
    if (jobSuccessRate > 95) healthScore += 25;
    else if (jobSuccessRate > 85) healthScore += 15;
    else if (jobSuccessRate > 70) healthScore += 10;
    factors += 25;
    return Math.round((healthScore / factors) * 100);
  }
  /**
   * Adjust optimization strategy based on performance metrics
   */
  async autoTuneStrategy() {
    const metrics = await this.getPerformanceMetrics();
    const currentStrategy = this.strategies[this.optimizationLevel];
    // Suggest strategy adjustments based on metrics
    const suggestions = [];
    if (metrics.overall.cacheHitRate < 30) {
      suggestions.push('Increase cache TTL and enable aggressive prefetching');
    }
    if (metrics.overall.averageResponseTime > 1000) {
      suggestions.push('Enable approximation mode for quick responses');
    }
    if (metrics.components.jobQueue.totalQueuedJobs > 50) {
      suggestions.push('Increase background worker count');
    }
    if (!metrics.health.redis) {
      suggestions.push('Redis connection issues detected - check configuration');
    }
    return {
      currentLevel: this.optimizationLevel,
      healthScore: metrics.health.overall,
      suggestions,
      autoAdjustments: suggestions.length
    };
  }
  /**
   * Shutdown all performance optimization components
   */
  async shutdown() {
    console.log('🛑 Shutting down Performance Optimizer...');
    try {
      await backgroundJobQueue.shutdown();
      await redisCacheService.disconnect();
      this.initialized = false;
      console.log('✅ Performance Optimizer shutdown complete');
    } catch (error) {
      console.error('❌ Performance Optimizer shutdown failed:', error);
    }
  }
}
// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
export default PerformanceOptimizer;
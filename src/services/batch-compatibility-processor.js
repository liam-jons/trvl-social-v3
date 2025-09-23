/**
 * Batch Compatibility Processor
 * High-performance batch processing system for bulk compatibility calculations
 */
import { redisCacheService } from './redis-cache-service.js';
import { groupBuilderService } from './group-builder-service.js';
import { compatibilityService } from './compatibility-service.ts';
class BatchCompatibilityProcessor {
  constructor() {
    this.maxConcurrency = parseInt(process.env.BATCH_CONCURRENCY) || 10;
    this.maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE) || 100;
    this.processingQueue = [];
    this.activeJobs = new Set();
    this.metrics = {
      processed: 0,
      failed: 0,
      queued: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    };
  }
  /**
   * Process bulk compatibility calculations with intelligent batching
   */
  async processBulkCompatibility(userIds, options = {}) {
    const startTime = Date.now();
    try {
      // Validate inputs
      if (!Array.isArray(userIds) || userIds.length < 2) {
        throw new Error('At least 2 user IDs required for compatibility calculation');
      }
      if (userIds.length > this.maxBatchSize) {
        throw new Error(`Batch size exceeds maximum of ${this.maxBatchSize} users`);
      }
      // Check cache first for entire batch
      const cacheKey = await redisCacheService.getCachedBulkResults(userIds, options);
      if (cacheKey && !options.forceRecalculation) {
        return {
          success: true,
          fromCache: true,
          data: cacheKey,
          meta: {
            processingTime: Date.now() - startTime,
            userCount: userIds.length,
            pairCount: this.calculatePairCount(userIds.length),
            cacheHit: true
          }
        };
      }
      // Determine optimal batch strategy
      const strategy = this.determineBatchStrategy(userIds.length, options);
      // Process based on strategy
      let results;
      switch (strategy.type) {
        case 'small_concurrent':
          results = await this.processSmallBatch(userIds, options);
          break;
        case 'medium_chunked':
          results = await this.processMediumBatch(userIds, options);
          break;
        case 'large_distributed':
          results = await this.processLargeBatch(userIds, options);
          break;
        default:
          results = await this.processSmallBatch(userIds, options);
      }
      // Cache results if successful
      if (results.success && options.cacheResults !== false) {
        await redisCacheService.cacheBulkResults(
          userIds,
          results.data,
          options,
          strategy.cacheTtl || 3600
        );
      }
      // Update metrics
      this.updateMetrics(true, Date.now() - startTime);
      return {
        ...results,
        meta: {
          ...results.meta,
          processingTime: Date.now() - startTime,
          strategy: strategy.type,
          userCount: userIds.length,
          pairCount: this.calculatePairCount(userIds.length)
        }
      };
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      return {
        success: false,
        error: {
          code: 'BATCH_PROCESSING_ERROR',
          message: error.message,
          details: error
        },
        meta: {
          processingTime: Date.now() - startTime,
          userCount: userIds.length,
          pairCount: this.calculatePairCount(userIds.length)
        }
      };
    }
  }
  /**
   * Determine optimal batch processing strategy
   */
  determineBatchStrategy(userCount, options = {}) {
    const pairCount = this.calculatePairCount(userCount);
    // Small batch - process all pairs concurrently
    if (pairCount <= 50) {
      return {
        type: 'small_concurrent',
        concurrency: Math.min(this.maxConcurrency, pairCount),
        cacheTtl: 3600
      };
    }
    // Medium batch - chunk into smaller groups
    if (pairCount <= 500) {
      return {
        type: 'medium_chunked',
        chunkSize: Math.ceil(userCount / 4),
        concurrency: this.maxConcurrency,
        cacheTtl: 7200
      };
    }
    // Large batch - distributed processing with progressive results
    return {
      type: 'large_distributed',
      chunkSize: Math.ceil(userCount / 8),
      concurrency: this.maxConcurrency,
      cacheTtl: 14400, // 4 hours
      progressiveResults: true
    };
  }
  /**
   * Process small batches with full concurrency
   */
  async processSmallBatch(userIds, options = {}) {
    const pairs = this.generateUserPairs(userIds);
    const results = [];
    // Process all pairs concurrently with limited concurrency
    const chunks = this.chunkArray(pairs, this.maxConcurrency);
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async ([user1Id, user2Id]) => {
        try {
          // Check individual pair cache first
          let score = await redisCacheService.getCachedCompatibilityScore(
            user1Id, user2Id, { groupId: options.groupId }
          );
          if (!score || options.forceRecalculation) {
            // Calculate compatibility score
            const response = await compatibilityService.calculateCompatibility({
              user1Id,
              user2Id,
              groupId: options.groupId,
              algorithmId: options.algorithmId,
              options: {
                includeExplanation: options.includeExplanation,
                cacheResult: options.cacheResults !== false
              }
            });
            if (response.success) {
              score = response.data;
            } else {
              throw new Error(`Failed to calculate compatibility: ${response.error.message}`);
            }
          }
          return score;
        } catch (error) {
          return null;
        }
      });
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter(result => result !== null));
    }
    return {
      success: true,
      data: {
        scores: results,
        matrix: options.includeMatrix ? this.buildCompatibilityMatrix(userIds, results) : undefined
      }
    };
  }
  /**
   * Process medium batches with chunking strategy
   */
  async processMediumBatch(userIds, options = {}) {
    const chunkSize = Math.ceil(userIds.length / 4);
    const userChunks = this.chunkArray(userIds, chunkSize);
    const allResults = [];
    // Process chunks with overlap to ensure all pairs are calculated
    for (let i = 0; i < userChunks.length; i++) {
      const chunk = userChunks[i];
      // Process pairs within chunk
      const intraChunkResults = await this.processSmallBatch(chunk, options);
      if (intraChunkResults.success) {
        allResults.push(...intraChunkResults.data.scores);
      }
      // Process pairs between current chunk and subsequent chunks
      for (let j = i + 1; j < userChunks.length; j++) {
        const otherChunk = userChunks[j];
        const interChunkPairs = [];
        for (const user1 of chunk) {
          for (const user2 of otherChunk) {
            interChunkPairs.push([user1, user2]);
          }
        }
        // Process inter-chunk pairs
        const interResults = await this.processSmallBatch(
          interChunkPairs.flat(),
          { ...options, _skipPairGeneration: true }
        );
        if (interResults.success) {
          allResults.push(...interResults.data.scores);
        }
      }
    }
    return {
      success: true,
      data: {
        scores: allResults,
        matrix: options.includeMatrix ? this.buildCompatibilityMatrix(userIds, allResults) : undefined
      }
    };
  }
  /**
   * Process large batches with distributed strategy
   */
  async processLargeBatch(userIds, options = {}) {
    const chunkSize = Math.ceil(userIds.length / 8);
    const userChunks = this.chunkArray(userIds, chunkSize);
    const allResults = [];
    const progressCallback = options.onProgress;
    let processedChunks = 0;
    const totalChunks = (userChunks.length * (userChunks.length + 1)) / 2;
    // Process with progress updates
    for (let i = 0; i < userChunks.length; i++) {
      const chunk = userChunks[i];
      // Intra-chunk processing
      const intraResults = await this.processSmallBatch(chunk, {
        ...options,
        onProgress: undefined // Remove nested progress callbacks
      });
      if (intraResults.success) {
        allResults.push(...intraResults.data.scores);
      }
      processedChunks++;
      if (progressCallback) {
        progressCallback({
          processed: processedChunks,
          total: totalChunks,
          percentage: Math.round((processedChunks / totalChunks) * 100),
          currentPhase: 'intra-chunk'
        });
      }
      // Inter-chunk processing
      for (let j = i + 1; j < userChunks.length; j++) {
        const otherChunk = userChunks[j];
        const crossChunkUsers = [...chunk, ...otherChunk];
        const crossResults = await this.processSmallBatch(crossChunkUsers, {
          ...options,
          onProgress: undefined
        });
        if (crossResults.success) {
          // Filter out pairs that were already processed in intra-chunk
          const newPairs = crossResults.data.scores.filter(score => {
            const inChunk1 = chunk.includes(score.user1Id) && chunk.includes(score.user2Id);
            const inChunk2 = otherChunk.includes(score.user1Id) && otherChunk.includes(score.user2Id);
            return !(inChunk1 || inChunk2);
          });
          allResults.push(...newPairs);
        }
        processedChunks++;
        if (progressCallback) {
          progressCallback({
            processed: processedChunks,
            total: totalChunks,
            percentage: Math.round((processedChunks / totalChunks) * 100),
            currentPhase: 'inter-chunk'
          });
        }
      }
    }
    return {
      success: true,
      data: {
        scores: allResults,
        matrix: options.includeMatrix ? this.buildCompatibilityMatrix(userIds, allResults) : undefined
      }
    };
  }
  /**
   * Generate all unique user pairs
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
   * Build compatibility matrix from results
   */
  buildCompatibilityMatrix(userIds, scores) {
    const matrix = Array(userIds.length).fill(null).map(() => Array(userIds.length).fill(0));
    // Set diagonal to 100 (self-compatibility)
    for (let i = 0; i < userIds.length; i++) {
      matrix[i][i] = 100;
    }
    // Fill matrix with scores
    scores.forEach(score => {
      const i = userIds.indexOf(score.user1Id);
      const j = userIds.indexOf(score.user2Id);
      if (i !== -1 && j !== -1) {
        matrix[i][j] = score.overallScore;
        matrix[j][i] = score.overallScore; // Symmetric matrix
      }
    });
    return matrix;
  }
  /**
   * Calculate number of pairs for n users
   */
  calculatePairCount(userCount) {
    return (userCount * (userCount - 1)) / 2;
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
   * Update processing metrics
   */
  updateMetrics(success, processingTime) {
    if (success) {
      this.metrics.processed++;
    } else {
      this.metrics.failed++;
    }
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime =
      this.metrics.totalProcessingTime / (this.metrics.processed + this.metrics.failed);
  }
  /**
   * Get batch processing statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.processed + this.metrics.failed > 0
        ? (this.metrics.processed / (this.metrics.processed + this.metrics.failed) * 100).toFixed(2) + '%'
        : '0%',
      queueSize: this.processingQueue.length,
      activeJobs: this.activeJobs.size
    };
  }
  /**
   * Queue batch job for background processing
   */
  async queueBatchJob(userIds, options = {}) {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      userIds,
      options: {
        ...options,
        priority: options.priority || 'normal'
      },
      createdAt: new Date(),
      status: 'queued'
    };
    this.processingQueue.push(job);
    this.metrics.queued++;
    // Auto-start processing if not at capacity
    if (this.activeJobs.size < this.maxConcurrency) {
      setImmediate(() => this.processNextJob());
    }
    return {
      jobId,
      queuePosition: this.processingQueue.length,
      estimatedWaitTime: this.estimateWaitTime()
    };
  }
  /**
   * Process next job in queue
   */
  async processNextJob() {
    if (this.processingQueue.length === 0 || this.activeJobs.size >= this.maxConcurrency) {
      return;
    }
    // Get highest priority job
    const jobIndex = this.getNextJobIndex();
    if (jobIndex === -1) return;
    const job = this.processingQueue.splice(jobIndex, 1)[0];
    this.activeJobs.add(job.id);
    this.metrics.queued--;
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      const result = await this.processBulkCompatibility(job.userIds, job.options);
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    } finally {
      this.activeJobs.delete(job.id);
      // Process next job
      setImmediate(() => this.processNextJob());
    }
  }
  /**
   * Get index of next job to process (priority-based)
   */
  getNextJobIndex() {
    if (this.processingQueue.length === 0) return -1;
    const priorities = { high: 3, normal: 2, low: 1 };
    let bestIndex = 0;
    let bestScore = 0;
    for (let i = 0; i < this.processingQueue.length; i++) {
      const job = this.processingQueue[i];
      const priorityScore = priorities[job.options.priority] || 2;
      const ageScore = (Date.now() - job.createdAt.getTime()) / (60 * 1000); // Age in minutes
      const score = priorityScore + (ageScore * 0.1);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex;
  }
  /**
   * Estimate wait time for new jobs
   */
  estimateWaitTime() {
    const avgProcessingTime = this.metrics.averageProcessingTime || 30000; // 30s default
    const queueSize = this.processingQueue.length;
    const parallelCapacity = this.maxConcurrency;
    return Math.ceil((queueSize / parallelCapacity) * avgProcessingTime);
  }
  /**
   * Cancel queued job
   */
  cancelJob(jobId) {
    const index = this.processingQueue.findIndex(job => job.id === jobId);
    if (index !== -1) {
      this.processingQueue.splice(index, 1);
      this.metrics.queued--;
      return true;
    }
    return false;
  }
  /**
   * Get job status
   */
  getJobStatus(jobId) {
    // Check active jobs
    if (this.activeJobs.has(jobId)) {
      return { status: 'processing' };
    }
    // Check queued jobs
    const queuedJob = this.processingQueue.find(job => job.id === jobId);
    if (queuedJob) {
      return {
        status: 'queued',
        position: this.processingQueue.indexOf(queuedJob) + 1,
        estimatedWaitTime: this.estimateWaitTime()
      };
    }
    return { status: 'not_found' };
  }
}
// Export singleton instance
export const batchCompatibilityProcessor = new BatchCompatibilityProcessor();
export default BatchCompatibilityProcessor;
/**
 * Background Job Queue for Intensive Compatibility Calculations
 * Manages long-running compatibility calculations in the background
 */

import { batchCompatibilityProcessor } from './batch-compatibility-processor.js';
import { redisCacheService } from './redis-cache-service.js';
import { supabase } from '../lib/supabase.js';

class BackgroundJobQueue {
  constructor() {
    this.queues = {
      high: [],
      normal: [],
      low: []
    };

    this.workers = [];
    this.maxWorkers = parseInt(process.env.JOB_QUEUE_WORKERS) || 3;
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    this.maxCompletedJobs = 1000;

    this.jobTypes = {
      BULK_COMPATIBILITY: 'bulk_compatibility',
      GROUP_ANALYSIS: 'group_analysis',
      ALGORITHM_COMPARISON: 'algorithm_comparison',
      CACHE_WARMING: 'cache_warming',
      SCORE_RECALCULATION: 'score_recalculation'
    };

    this.metrics = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0,
      queueSizes: { high: 0, normal: 0, low: 0 }
    };

    this.isRunning = false;
    this.startWorkers();
  }

  /**
   * Add bulk compatibility calculation job
   */
  async addBulkCompatibilityJob(userIds, options = {}) {
    const job = {
      id: this.generateJobId(),
      type: this.jobTypes.BULK_COMPATIBILITY,
      priority: options.priority || 'normal',
      data: {
        userIds,
        options: {
          ...options,
          algorithmId: options.algorithmId || 'default',
          includeMatrix: options.includeMatrix !== false,
          cacheResults: options.cacheResults !== false
        }
      },
      createdAt: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      timeout: options.timeout || 300000, // 5 minutes default
      metadata: {
        userCount: userIds.length,
        pairCount: (userIds.length * (userIds.length - 1)) / 2,
        estimatedDuration: this.estimateProcessingTime(userIds.length)
      }
    };

    this.queues[job.priority].push(job);
    this.metrics.totalJobs++;
    this.updateQueueSizes();

    console.log(`Added bulk compatibility job ${job.id} for ${userIds.length} users`);

    return {
      jobId: job.id,
      queuePosition: this.getQueuePosition(job),
      estimatedStartTime: this.estimateStartTime(job),
      estimatedDuration: job.metadata.estimatedDuration
    };
  }

  /**
   * Add group analysis job
   */
  async addGroupAnalysisJob(userIds, algorithmId = 'hybrid', options = {}) {
    const job = {
      id: this.generateJobId(),
      type: this.jobTypes.GROUP_ANALYSIS,
      priority: options.priority || 'normal',
      data: {
        userIds,
        algorithmId,
        options: {
          includeConflicts: options.includeConflicts !== false,
          includeOptimization: options.includeOptimization !== false,
          targetGroupSize: options.targetGroupSize || 6
        }
      },
      createdAt: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: 2,
      timeout: options.timeout || 600000, // 10 minutes for complex analysis
      metadata: {
        userCount: userIds.length,
        algorithm: algorithmId,
        estimatedDuration: this.estimateAnalysisTime(userIds.length)
      }
    };

    this.queues[job.priority].push(job);
    this.metrics.totalJobs++;
    this.updateQueueSizes();

    return {
      jobId: job.id,
      queuePosition: this.getQueuePosition(job),
      estimatedStartTime: this.estimateStartTime(job)
    };
  }

  /**
   * Add algorithm comparison job
   */
  async addAlgorithmComparisonJob(userIds, algorithms = ['kmeans', 'hierarchical', 'hybrid'], options = {}) {
    const job = {
      id: this.generateJobId(),
      type: this.jobTypes.ALGORITHM_COMPARISON,
      priority: options.priority || 'low', // Usually not urgent
      data: {
        userIds,
        algorithms,
        options: {
          iterations: options.iterations || 1,
          includeMetrics: options.includeMetrics !== false,
          saveResults: options.saveResults !== false
        }
      },
      createdAt: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: 2,
      timeout: options.timeout || 900000, // 15 minutes
      metadata: {
        userCount: userIds.length,
        algorithmCount: algorithms.length,
        estimatedDuration: this.estimateComparisonTime(userIds.length, algorithms.length)
      }
    };

    this.queues[job.priority].push(job);
    this.metrics.totalJobs++;
    this.updateQueueSizes();

    return {
      jobId: job.id,
      queuePosition: this.getQueuePosition(job)
    };
  }

  /**
   * Add cache warming job
   */
  async addCacheWarmingJob(userIds, options = {}) {
    const job = {
      id: this.generateJobId(),
      type: this.jobTypes.CACHE_WARMING,
      priority: options.priority || 'low',
      data: {
        userIds,
        options: {
          warmQuickScores: options.warmQuickScores !== false,
          warmDetailedScores: options.warmDetailedScores || false,
          batchSize: options.batchSize || 50
        }
      },
      createdAt: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: 1,
      timeout: options.timeout || 180000, // 3 minutes
      metadata: {
        userCount: userIds.length,
        pairCount: (userIds.length * (userIds.length - 1)) / 2
      }
    };

    this.queues[job.priority].push(job);
    this.metrics.totalJobs++;
    this.updateQueueSizes();

    return { jobId: job.id };
  }

  /**
   * Process bulk compatibility job
   */
  async processBulkCompatibilityJob(job) {
    const { userIds, options } = job.data;

    const result = await batchCompatibilityProcessor.processBulkCompatibility(userIds, {
      ...options,
      onProgress: (progress) => {
        job.progress = progress;
        this.updateJobProgress(job.id, progress);
      }
    });

    if (result.success) {
      // Store results in database for later retrieval
      await this.storeJobResults(job.id, result.data);
    }

    return result;
  }

  /**
   * Process group analysis job
   */
  async processGroupAnalysisJob(job) {
    const { userIds, algorithmId, options } = job.data;

    const { groupBuilderService } = await import('./group-builder-service.js');

    let result;
    switch (algorithmId) {
      case 'kmeans':
        result = await groupBuilderService.performKMeansGrouping(
          userIds.map(id => ({ id, userId: id })),
          Math.ceil(userIds.length / options.targetGroupSize),
          options
        );
        break;
      case 'hierarchical':
        result = await groupBuilderService.performHierarchicalGrouping(
          userIds.map(id => ({ id, userId: id })),
          options.targetGroupSize,
          options
        );
        break;
      case 'hybrid':
      default:
        result = await groupBuilderService.performHybridOptimization(
          userIds.map(id => ({ id, userId: id })),
          options
        );
        break;
    }

    // Process and analyze conflicts if requested
    if (options.includeConflicts && result) {
      for (let i = 0; i < result.length; i++) {
        const conflicts = await groupBuilderService.detectGroupConflicts(
          result[i].participants,
          { includeMinorConflicts: true }
        );
        result[i].conflicts = conflicts;
      }
    }

    return {
      success: true,
      data: {
        groups: result,
        algorithm: algorithmId,
        participantCount: userIds.length,
        groupCount: result?.length || 0
      }
    };
  }

  /**
   * Process algorithm comparison job
   */
  async processAlgorithmComparisonJob(job) {
    const { userIds, algorithms, options } = job.data;
    const results = {};

    for (const algorithm of algorithms) {
      const startTime = Date.now();

      try {
        // Process with current algorithm
        const analysisResult = await this.processGroupAnalysisJob({
          data: {
            userIds,
            algorithmId: algorithm,
            options: {
              targetGroupSize: 6,
              includeConflicts: true
            }
          }
        });

        const processingTime = Date.now() - startTime;

        if (analysisResult.success) {
          const groups = analysisResult.data.groups;

          // Calculate metrics
          const metrics = {
            processingTime,
            groupCount: groups.length,
            averageGroupSize: groups.reduce((sum, g) => sum + g.participants.length, 0) / groups.length,
            averageCompatibility: groups.reduce((sum, g) => sum + (g.compatibility?.averageScore || 0), 0) / groups.length,
            totalConflicts: groups.reduce((sum, g) => sum + (g.conflicts?.totalConflicts || 0), 0)
          };

          results[algorithm] = {
            success: true,
            groups,
            metrics
          };
        } else {
          results[algorithm] = {
            success: false,
            error: analysisResult.error,
            processingTime
          };
        }

        // Update job progress
        const progress = ((algorithms.indexOf(algorithm) + 1) / algorithms.length) * 100;
        job.progress = { percentage: progress, currentAlgorithm: algorithm };
        this.updateJobProgress(job.id, job.progress);

      } catch (error) {
        results[algorithm] = {
          success: false,
          error: error.message,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Generate comparison report
    const comparison = this.generateComparisonReport(results);

    return {
      success: true,
      data: {
        results,
        comparison,
        algorithms,
        participantCount: userIds.length
      }
    };
  }

  /**
   * Process cache warming job
   */
  async processCacheWarmingJob(job) {
    const { userIds, options } = job.data;
    const { lazyScoreLoader } = await import('./lazy-score-loader.js');

    try {
      const result = await lazyScoreLoader.warmCache(userIds, {
        loadDetailed: options.warmDetailedScores,
        batchSize: options.batchSize
      });

      return {
        success: true,
        data: {
          ...result,
          userCount: userIds.length,
          pairCount: (userIds.length * (userIds.length - 1)) / 2
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start background workers
   */
  startWorkers() {
    if (this.isRunning) return;

    this.isRunning = true;

    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = this.createWorker(`worker_${i}`);
      this.workers.push(worker);
    }

    console.log(`Started ${this.maxWorkers} background job workers`);
  }

  /**
   * Create individual worker
   */
  createWorker(workerId) {
    const worker = {
      id: workerId,
      active: false,
      currentJob: null,
      processedJobs: 0
    };

    const processNextJob = async () => {
      if (!this.isRunning || worker.active) return;

      const job = this.getNextJob();
      if (!job) {
        // No jobs available, wait and retry
        setTimeout(processNextJob, 1000);
        return;
      }

      worker.active = true;
      worker.currentJob = job;
      this.activeJobs.set(job.id, { job, workerId, startTime: Date.now() });

      try {
        job.status = 'processing';
        job.startedAt = new Date();
        job.workerId = workerId;

        let result;
        switch (job.type) {
          case this.jobTypes.BULK_COMPATIBILITY:
            result = await this.processBulkCompatibilityJob(job);
            break;
          case this.jobTypes.GROUP_ANALYSIS:
            result = await this.processGroupAnalysisJob(job);
            break;
          case this.jobTypes.ALGORITHM_COMPARISON:
            result = await this.processAlgorithmComparisonJob(job);
            break;
          case this.jobTypes.CACHE_WARMING:
            result = await this.processCacheWarmingJob(job);
            break;
          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }

        // Job completed successfully
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        job.processingTime = Date.now() - job.startedAt.getTime();

        this.completedJobs.set(job.id, job);
        this.metrics.completedJobs++;

        console.log(`Job ${job.id} completed by ${workerId} in ${job.processingTime}ms`);

      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);

        job.status = 'failed';
        job.error = error.message;
        job.failedAt = new Date();
        job.processingTime = Date.now() - job.startedAt.getTime();

        // Retry if possible
        if (job.retryCount < job.maxRetries) {
          job.retryCount++;
          job.status = 'queued';
          job.retryAt = new Date(Date.now() + (job.retryCount * 30000)); // Exponential backoff
          this.queues[job.priority].push(job);
          console.log(`Job ${job.id} queued for retry ${job.retryCount}/${job.maxRetries}`);
        } else {
          this.completedJobs.set(job.id, job);
          this.metrics.failedJobs++;
        }

      } finally {
        this.activeJobs.delete(job.id);
        worker.active = false;
        worker.currentJob = null;
        worker.processedJobs++;

        // Clean up completed jobs if too many
        this.cleanupCompletedJobs();

        // Process next job
        setImmediate(processNextJob);
      }
    };

    // Start worker
    setImmediate(processNextJob);
    return worker;
  }

  /**
   * Get next job from highest priority queue
   */
  getNextJob() {
    // Check high priority first
    for (const priority of ['high', 'normal', 'low']) {
      const queue = this.queues[priority];
      if (queue.length > 0) {
        const job = queue.shift();
        this.updateQueueSizes();
        return job;
      }
    }
    return null;
  }

  /**
   * Get job status and result
   */
  getJobStatus(jobId) {
    // Check active jobs
    if (this.activeJobs.has(jobId)) {
      const { job, workerId, startTime } = this.activeJobs.get(jobId);
      return {
        status: 'processing',
        workerId,
        progress: job.progress,
        processingTime: Date.now() - startTime,
        estimatedTimeRemaining: job.metadata?.estimatedDuration - (Date.now() - startTime)
      };
    }

    // Check completed jobs
    if (this.completedJobs.has(jobId)) {
      const job = this.completedJobs.get(jobId);
      return {
        status: job.status,
        result: job.result,
        error: job.error,
        processingTime: job.processingTime,
        completedAt: job.completedAt,
        failedAt: job.failedAt
      };
    }

    // Check queued jobs
    for (const queue of Object.values(this.queues)) {
      const job = queue.find(j => j.id === jobId);
      if (job) {
        return {
          status: 'queued',
          queuePosition: queue.indexOf(job) + 1,
          estimatedStartTime: this.estimateStartTime(job)
        };
      }
    }

    return { status: 'not_found' };
  }

  /**
   * Cancel queued job
   */
  cancelJob(jobId) {
    for (const queue of Object.values(this.queues)) {
      const index = queue.findIndex(job => job.id === jobId);
      if (index !== -1) {
        queue.splice(index, 1);
        this.updateQueueSizes();
        return true;
      }
    }
    return false;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate processing time based on user count
   */
  estimateProcessingTime(userCount) {
    const pairCount = (userCount * (userCount - 1)) / 2;
    const baseTime = 100; // ms per pair
    return Math.min(pairCount * baseTime, 300000); // Max 5 minutes
  }

  /**
   * Estimate analysis time
   */
  estimateAnalysisTime(userCount) {
    return Math.min(userCount * 1000, 600000); // Max 10 minutes
  }

  /**
   * Estimate comparison time
   */
  estimateComparisonTime(userCount, algorithmCount) {
    return this.estimateAnalysisTime(userCount) * algorithmCount;
  }

  /**
   * Get queue position for job
   */
  getQueuePosition(job) {
    const queue = this.queues[job.priority];
    return queue.indexOf(job) + 1;
  }

  /**
   * Estimate start time for job
   */
  estimateStartTime(job) {
    const position = this.getQueuePosition(job);
    const avgProcessingTime = this.metrics.averageProcessingTime || 30000;
    const estimatedWait = ((position - 1) / this.maxWorkers) * avgProcessingTime;
    return new Date(Date.now() + estimatedWait);
  }

  /**
   * Update queue size metrics
   */
  updateQueueSizes() {
    this.metrics.queueSizes.high = this.queues.high.length;
    this.metrics.queueSizes.normal = this.queues.normal.length;
    this.metrics.queueSizes.low = this.queues.low.length;
  }

  /**
   * Update job progress
   */
  updateJobProgress(jobId, progress) {
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.get(jobId).job.progress = progress;
    }
  }

  /**
   * Store job results in database
   */
  async storeJobResults(jobId, results) {
    try {
      await supabase
        .from('background_job_results')
        .upsert({
          job_id: jobId,
          results: JSON.stringify(results),
          stored_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store job results:', error);
    }
  }

  /**
   * Generate comparison report for algorithm comparison
   */
  generateComparisonReport(results) {
    const algorithms = Object.keys(results);
    const comparison = {
      fastest: null,
      mostAccurate: null,
      fewestConflicts: null,
      summary: {}
    };

    let fastestTime = Infinity;
    let highestCompatibility = 0;
    let fewestConflicts = Infinity;

    for (const [algorithm, result] of Object.entries(results)) {
      if (!result.success) continue;

      const metrics = result.metrics;

      // Track fastest
      if (metrics.processingTime < fastestTime) {
        fastestTime = metrics.processingTime;
        comparison.fastest = algorithm;
      }

      // Track most accurate
      if (metrics.averageCompatibility > highestCompatibility) {
        highestCompatibility = metrics.averageCompatibility;
        comparison.mostAccurate = algorithm;
      }

      // Track fewest conflicts
      if (metrics.totalConflicts < fewestConflicts) {
        fewestConflicts = metrics.totalConflicts;
        comparison.fewestConflicts = algorithm;
      }

      comparison.summary[algorithm] = {
        processingTime: metrics.processingTime,
        compatibility: metrics.averageCompatibility,
        conflicts: metrics.totalConflicts,
        groupBalance: metrics.averageGroupSize
      };
    }

    return comparison;
  }

  /**
   * Clean up old completed jobs
   */
  cleanupCompletedJobs() {
    if (this.completedJobs.size > this.maxCompletedJobs) {
      const entries = Array.from(this.completedJobs.entries());
      const toRemove = entries
        .sort((a, b) => a[1].completedAt - b[1].completedAt)
        .slice(0, Math.floor(this.maxCompletedJobs * 0.2));

      toRemove.forEach(([jobId]) => {
        this.completedJobs.delete(jobId);
      });
    }
  }

  /**
   * Get queue statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeJobs: this.activeJobs.size,
      totalQueuedJobs: Object.values(this.metrics.queueSizes).reduce((sum, size) => sum + size, 0),
      workers: this.workers.map(w => ({
        id: w.id,
        active: w.active,
        processedJobs: w.processedJobs,
        currentJobId: w.currentJob?.id
      })),
      completedJobsInMemory: this.completedJobs.size,
      successRate: this.metrics.totalJobs > 0
        ? ((this.metrics.completedJobs / this.metrics.totalJobs) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Shutdown the job queue gracefully
   */
  async shutdown() {
    console.log('Shutting down background job queue...');
    this.isRunning = false;

    // Wait for active jobs to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.activeJobs.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      console.warn(`${this.activeJobs.size} jobs were forcefully terminated during shutdown`);
    }

    console.log('Background job queue shutdown complete');
  }
}

// Export singleton instance
export const backgroundJobQueue = new BackgroundJobQueue();
export default BackgroundJobQueue;
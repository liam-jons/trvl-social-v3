/**
 * Log Aggregation Service
 *
 * Handles collection, processing, and forwarding of logs
 * to external log management services for production environments.
 */

import logger from '../utils/logger.js';

/**
 * Log Aggregation Service Class
 */
export class LogAggregationService {
  constructor() {
    this.enabled = process.env.NODE_ENV === 'production';
    this.batchSize = parseInt(process.env.LOG_BATCH_SIZE || '50');
    this.flushInterval = parseInt(process.env.LOG_FLUSH_INTERVAL || '5000'); // 5 seconds
    this.logBuffer = [];
    this.isInitialized = false;

    if (this.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize log aggregation service
   */
  initialize() {
    if (this.isInitialized) return;

    // Initialize external log services
    this.initializeDatadog();
    this.initializeCloudWatch();
    this.initializeElk();

    // Start periodic log flushing
    this.startPeriodicFlush();

    // Setup error handling
    this.setupErrorHandling();

    this.isInitialized = true;
    logger.info('Log aggregation service initialized');
  }

  /**
   * Initialize Datadog logging
   */
  initializeDatadog() {
    if (!process.env.VITE_DATADOG_CLIENT_TOKEN) return;

    this.datadogEnabled = true;
    logger.debug('Datadog log aggregation configured');
  }

  /**
   * Initialize AWS CloudWatch logging
   */
  initializeCloudWatch() {
    if (!process.env.AWS_CLOUDWATCH_LOG_GROUP) return;

    this.cloudWatchEnabled = true;
    logger.debug('CloudWatch log aggregation configured');
  }

  /**
   * Initialize ELK Stack logging
   */
  initializeElk() {
    if (!process.env.ELASTICSEARCH_URL) return;

    this.elkEnabled = true;
    logger.debug('ELK Stack log aggregation configured');
  }

  /**
   * Start periodic log flushing
   */
  startPeriodicFlush() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush logs on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushLogs();
      });
    }
  }

  /**
   * Setup error handling for log aggregation
   */
  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      this.addLog({
        level: 'ERROR',
        message: 'Uncaught Exception',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        category: 'system'
      });
      this.flushLogs();
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.addLog({
        level: 'ERROR',
        message: 'Unhandled Promise Rejection',
        reason: reason.toString(),
        timestamp: new Date().toISOString(),
        category: 'system'
      });
      this.flushLogs();
    });
  }

  /**
   * Add log entry to buffer
   */
  addLog(logEntry) {
    if (!this.enabled) return;

    // Enhance log entry with metadata
    const enhancedEntry = {
      ...logEntry,
      service: 'trvl-social',
      version: process.env.VITE_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      processId: typeof process !== 'undefined' ? process.pid : null
    };

    this.logBuffer.push(enhancedEntry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Flush accumulated logs to external services
   */
  async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await Promise.allSettled([
        this.sendToDatadog(logsToFlush),
        this.sendToCloudWatch(logsToFlush),
        this.sendToElk(logsToFlush)
      ]);
    } catch (error) {
      logger.error('Failed to flush logs to external services', {
        error: error.message,
        logCount: logsToFlush.length
      });
    }
  }

  /**
   * Send logs to Datadog
   */
  async sendToDatadog(logs) {
    if (!this.datadogEnabled) return;

    try {
      const response = await fetch('https://http-intake.logs.datadoghq.com/v1/input/YOUR_API_KEY', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': process.env.VITE_DATADOG_CLIENT_TOKEN
        },
        body: JSON.stringify(logs)
      });

      if (!response.ok) {
        throw new Error(`Datadog API responded with status ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send logs to Datadog', {
        error: error.message,
        logCount: logs.length
      });
    }
  }

  /**
   * Send logs to AWS CloudWatch
   */
  async sendToCloudWatch(logs) {
    if (!this.cloudWatchEnabled) return;

    try {
      // CloudWatch logs implementation would go here
      // For now, just log that we would send to CloudWatch
      logger.debug(`Would send ${logs.length} logs to CloudWatch`);
    } catch (error) {
      logger.error('Failed to send logs to CloudWatch', {
        error: error.message,
        logCount: logs.length
      });
    }
  }

  /**
   * Send logs to ELK Stack
   */
  async sendToElk(logs) {
    if (!this.elkEnabled) return;

    try {
      const bulkBody = logs.flatMap(log => [
        { index: { _index: `trvl-social-logs-${new Date().toISOString().split('T')[0]}` } },
        log
      ]);

      const response = await fetch(`${process.env.ELASTICSEARCH_URL}/_bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-ndjson'
        },
        body: bulkBody.map(JSON.stringify).join('\n') + '\n'
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch API responded with status ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send logs to ELK Stack', {
        error: error.message,
        logCount: logs.length
      });
    }
  }

  /**
   * Search logs (for development/debugging)
   */
  async searchLogs(query, options = {}) {
    const {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime = new Date().toISOString(),
      level = null,
      category = null,
      limit = 100
    } = options;

    if (!this.elkEnabled) {
      logger.warn('Log search requires Elasticsearch configuration');
      return [];
    }

    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                range: {
                  timestamp: {
                    gte: startTime,
                    lte: endTime
                  }
                }
              }
            ]
          }
        },
        sort: [
          { timestamp: { order: 'desc' } }
        ],
        size: limit
      };

      // Add filters
      if (level) {
        searchQuery.query.bool.must.push({ term: { level } });
      }

      if (category) {
        searchQuery.query.bool.must.push({ term: { category } });
      }

      // Add text search if provided
      if (query) {
        searchQuery.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['message', 'error', 'category']
          }
        });
      }

      const response = await fetch(`${process.env.ELASTICSEARCH_URL}/trvl-social-logs-*/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      const result = await response.json();
      return result.hits?.hits?.map(hit => hit._source) || [];
    } catch (error) {
      logger.error('Failed to search logs', {
        error: error.message,
        query
      });
      return [];
    }
  }

  /**
   * Get log statistics
   */
  async getLogStatistics(timeRange = '24h') {
    if (!this.elkEnabled) {
      logger.warn('Log statistics require Elasticsearch configuration');
      return null;
    }

    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - this.getTimeRangeMs(timeRange));

      const aggregationQuery = {
        query: {
          range: {
            timestamp: {
              gte: startTime.toISOString(),
              lte: now.toISOString()
            }
          }
        },
        aggs: {
          levels: {
            terms: { field: 'level' }
          },
          categories: {
            terms: { field: 'category' }
          },
          timeline: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: '1h'
            }
          }
        },
        size: 0
      };

      const response = await fetch(`${process.env.ELASTICSEARCH_URL}/trvl-social-logs-*/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aggregationQuery)
      });

      const result = await response.json();
      return {
        totalLogs: result.hits?.total?.value || 0,
        levelDistribution: result.aggregations?.levels?.buckets || [],
        categoryDistribution: result.aggregations?.categories?.buckets || [],
        timeline: result.aggregations?.timeline?.buckets || []
      };
    } catch (error) {
      logger.error('Failed to get log statistics', {
        error: error.message,
        timeRange
      });
      return null;
    }
  }

  /**
   * Convert time range string to milliseconds
   */
  getTimeRangeMs(timeRange) {
    const units = {
      'm': 60 * 1000,        // minutes
      'h': 60 * 60 * 1000,   // hours
      'd': 24 * 60 * 60 * 1000  // days
    };

    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // default to 24 hours

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Health check for log aggregation service
   */
  async healthCheck() {
    const checks = {
      bufferSize: this.logBuffer.length,
      datadogEnabled: this.datadogEnabled,
      cloudWatchEnabled: this.cloudWatchEnabled,
      elkEnabled: this.elkEnabled,
      isInitialized: this.isInitialized
    };

    // Test connectivity to external services
    if (this.elkEnabled) {
      try {
        const response = await fetch(`${process.env.ELASTICSEARCH_URL}/_cluster/health`);
        checks.elasticsearchHealth = response.ok ? 'healthy' : 'unhealthy';
      } catch (error) {
        checks.elasticsearchHealth = 'unreachable';
      }
    }

    return checks;
  }
}

/**
 * Create and export service instance
 */
export const logAggregationService = new LogAggregationService();

/**
 * Log monitoring and alerting utilities
 */
export const LogMonitoring = {
  /**
   * Set up error rate monitoring
   */
  setupErrorRateMonitoring() {
    const errorRateThreshold = parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.05'); // 5%
    const checkInterval = parseInt(process.env.ERROR_RATE_CHECK_INTERVAL || '300000'); // 5 minutes

    setInterval(async () => {
      try {
        const stats = await logAggregationService.getLogStatistics('5m');
        if (!stats) return;

        const totalLogs = stats.totalLogs;
        const errorLogs = stats.levelDistribution
          .find(bucket => bucket.key === 'ERROR')?.doc_count || 0;

        const errorRate = totalLogs > 0 ? errorLogs / totalLogs : 0;

        if (errorRate > errorRateThreshold) {
          logger.error('High error rate detected', {
            errorRate: (errorRate * 100).toFixed(2) + '%',
            threshold: (errorRateThreshold * 100).toFixed(2) + '%',
            totalLogs,
            errorLogs,
            category: 'monitoring'
          });

          // Trigger alert (email, Slack, etc.)
          this.triggerErrorRateAlert(errorRate, errorRateThreshold);
        }
      } catch (error) {
        logger.error('Error rate monitoring failed', {
          error: error.message
        });
      }
    }, checkInterval);
  },

  /**
   * Trigger error rate alert
   */
  async triggerErrorRateAlert(currentRate, threshold) {
    const alertData = {
      type: 'error_rate_alert',
      severity: 'high',
      currentRate: (currentRate * 100).toFixed(2) + '%',
      threshold: (threshold * 100).toFixed(2) + '%',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // Send to external alerting systems
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        logger.error('Failed to send error rate alert', {
          error: error.message
        });
      }
    }
  }
};

// Start error rate monitoring in production
if (process.env.NODE_ENV === 'production') {
  LogMonitoring.setupErrorRateMonitoring();
}

export default logAggregationService;
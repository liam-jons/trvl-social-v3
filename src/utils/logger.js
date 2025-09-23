/**
 * Production-grade logging infrastructure with structured logging,
 * log aggregation, error tracking, and audit logging capabilities.
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';

/**
 * Log levels in order of severity
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

/**
 * Log categories for structured logging
 */
export const LOG_CATEGORIES = {
  AUTH: 'auth',
  PAYMENT: 'payment',
  API: 'api',
  DATABASE: 'database',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  USER_ACTION: 'user_action',
  SYSTEM: 'system',
  AUDIT: 'audit',
  ERROR: 'error'
};

/**
 * Production Logger Class
 */
class ProductionLogger {
  constructor() {
    this.level = this.getLogLevel();
    this.format = this.getLogFormat();
    this.destination = this.getLogDestination();
    this.maxSize = this.getMaxSize();
    this.maxFiles = this.getMaxFiles();
    this.auditEnabled = process.env.ENABLE_AUDIT_LOGGING === 'true';
    this.errorTrackingEnabled = process.env.ENABLE_ERROR_TRACKING === 'true';

    // Initialize external services
    this.initializeExternalServices();
  }

  /**
   * Get configured log level
   */
  getLogLevel() {
    const configuredLevel = process.env.LOG_LEVEL || (isDevelopment ? 'DEBUG' : 'INFO');
    return LOG_LEVELS[configuredLevel.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  /**
   * Get log format (json for production, pretty for development)
   */
  getLogFormat() {
    return process.env.LOG_FORMAT || (isProduction ? 'json' : 'pretty');
  }

  /**
   * Get log destination
   */
  getLogDestination() {
    return process.env.LOG_DESTINATION || (isProduction ? 'file' : 'console');
  }

  /**
   * Get maximum log file size
   */
  getMaxSize() {
    return process.env.LOG_MAX_SIZE || '100mb';
  }

  /**
   * Get maximum number of log files
   */
  getMaxFiles() {
    return parseInt(process.env.LOG_MAX_FILES || '10');
  }

  /**
   * Initialize external logging services
   */
  initializeExternalServices() {
    // Initialize Sentry for error tracking
    if (this.errorTrackingEnabled && process.env.VITE_SENTRY_DSN) {
      this.initializeSentry();
    }

    // Initialize Datadog for performance monitoring
    if (process.env.VITE_DATADOG_APPLICATION_ID) {
      this.initializeDatadog();
    }
  }

  /**
   * Initialize Sentry error tracking
   */
  initializeSentry() {
    if (typeof window !== 'undefined') {
      // Client-side Sentry initialization would go here
      this.sentryEnabled = true;
    }
  }

  /**
   * Initialize Datadog monitoring
   */
  initializeDatadog() {
    if (typeof window !== 'undefined') {
      // Client-side Datadog initialization would go here
      this.datadogEnabled = true;
    }
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logLevel = Object.keys(LOG_LEVELS)[level];

    const entry = {
      timestamp,
      level: logLevel,
      message,
      environment: isProduction ? 'production' : 'development',
      ...meta
    };

    // Add request context if available
    if (typeof window !== 'undefined') {
      entry.url = window.location.href;
      entry.userAgent = navigator.userAgent;
    }

    // Add session information if available
    if (meta.userId) {
      entry.userId = meta.userId;
    }

    if (meta.sessionId) {
      entry.sessionId = meta.sessionId;
    }

    return entry;
  }

  /**
   * Format log entry based on configuration
   */
  formatLogEntry(entry) {
    if (this.format === 'json') {
      return JSON.stringify(entry);
    } else {
      const { timestamp, level, message, ...meta } = entry;
      const metaStr = Object.keys(meta).length > 0 ?
        ` | ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    }
  }

  /**
   * Output log entry to configured destination
   */
  outputLog(entry) {
    const formatted = this.formatLogEntry(entry);

    if (this.destination === 'console' || isDevelopment) {
      const consoleMethod = entry.level === 'ERROR' ? 'error' :
                           entry.level === 'WARN' ? 'warn' : 'log';
      console[consoleMethod](formatted);
    }

    // In production, you would write to files or send to log aggregation service
    if (this.destination === 'file' && isProduction) {
      this.writeToFile(formatted);
    }
  }

  /**
   * Write log to file (placeholder for production file writing)
   */
  writeToFile(logEntry) {
    // In a real implementation, this would use fs.appendFile or a logging library
    // For now, we'll just output to console in production as well
    console.log(logEntry);
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return level <= this.level;
  }

  /**
   * Core logging method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, meta);
    this.outputLog(entry);

    // Send to external services
    if (level === LOG_LEVELS.ERROR && this.sentryEnabled) {
      this.sendToSentry(entry);
    }
  }

  /**
   * Send error to Sentry
   */
  sendToSentry(entry) {
    // Sentry integration would go here
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(new Error(entry.message), {
        extra: entry
      });
    }
  }

  /**
   * Error logging
   */
  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, {
      ...meta,
      category: meta.category || LOG_CATEGORIES.ERROR
    });
  }

  /**
   * Warning logging
   */
  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  /**
   * Info logging
   */
  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  /**
   * Debug logging
   */
  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  /**
   * Trace logging
   */
  trace(message, meta = {}) {
    this.log(LOG_LEVELS.TRACE, message, meta);
  }

  /**
   * Audit logging for security events
   */
  audit(action, meta = {}) {
    if (!this.auditEnabled) return;

    this.log(LOG_LEVELS.INFO, `Audit: ${action}`, {
      ...meta,
      category: LOG_CATEGORIES.AUDIT,
      auditEvent: true
    });
  }

  /**
   * Performance logging
   */
  performance(operation, duration, meta = {}) {
    this.log(LOG_LEVELS.INFO, `Performance: ${operation} took ${duration}ms`, {
      ...meta,
      category: LOG_CATEGORIES.PERFORMANCE,
      duration,
      operation
    });
  }

  /**
   * User action logging
   */
  userAction(action, userId, meta = {}) {
    this.log(LOG_LEVELS.INFO, `User action: ${action}`, {
      ...meta,
      category: LOG_CATEGORIES.USER_ACTION,
      userId,
      action
    });
  }

  /**
   * API request/response logging
   */
  api(method, url, statusCode, duration, meta = {}) {
    const level = statusCode >= 500 ? LOG_LEVELS.ERROR :
                 statusCode >= 400 ? LOG_LEVELS.WARN :
                 LOG_LEVELS.INFO;

    this.log(level, `API ${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...meta,
      category: LOG_CATEGORIES.API,
      method,
      url,
      statusCode,
      duration
    });
  }

  /**
   * Database operation logging
   */
  database(operation, table, duration, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, `DB ${operation} on ${table} (${duration}ms)`, {
      ...meta,
      category: LOG_CATEGORIES.DATABASE,
      operation,
      table,
      duration
    });
  }

  /**
   * Security event logging
   */
  security(event, severity = 'medium', meta = {}) {
    const level = severity === 'high' ? LOG_LEVELS.ERROR :
                 severity === 'medium' ? LOG_LEVELS.WARN :
                 LOG_LEVELS.INFO;

    this.log(level, `Security event: ${event}`, {
      ...meta,
      category: LOG_CATEGORIES.SECURITY,
      event,
      severity
    });
  }

  /**
   * Payment transaction logging
   */
  payment(event, amount, currency, meta = {}) {
    this.log(LOG_LEVELS.INFO, `Payment: ${event} - ${amount} ${currency}`, {
      ...meta,
      category: LOG_CATEGORIES.PAYMENT,
      event,
      amount,
      currency
    });
  }

  /**
   * Authentication event logging
   */
  auth(event, userId, meta = {}) {
    this.log(LOG_LEVELS.INFO, `Auth: ${event}`, {
      ...meta,
      category: LOG_CATEGORIES.AUTH,
      event,
      userId
    });
  }
}

/**
 * Create and export logger instance
 */
export const logger = new ProductionLogger();

/**
 * Performance measurement utilities
 */
export const Performance = {
  /**
   * Start performance measurement
   */
  start(operation) {
    return {
      operation,
      startTime: performance.now(),
      end() {
        const duration = Math.round(performance.now() - this.startTime);
        logger.performance(this.operation, duration);
        return duration;
      }
    };
  },

  /**
   * Measure async operation
   */
  async measure(operation, asyncFn) {
    const timer = Performance.start(operation);
    try {
      const result = await asyncFn();
      timer.end();
      return result;
    } catch (error) {
      const duration = timer.end();
      logger.error(`Performance measurement failed for ${operation}`, {
        error: error.message,
        duration
      });
      throw error;
    }
  }
};

/**
 * Request logging middleware helper
 */
export const RequestLogger = {
  /**
   * Log API request start
   */
  logRequest(method, url, headers = {}) {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = performance.now();

    logger.debug(`API Request started: ${method} ${url}`, {
      requestId,
      method,
      url,
      userAgent: headers['user-agent']
    });

    return {
      requestId,
      startTime,
      logResponse(statusCode, responseSize = 0) {
        const duration = Math.round(performance.now() - startTime);
        logger.api(method, url, statusCode, duration, {
          requestId,
          responseSize
        });
      }
    };
  }
};

/**
 * Error boundary logging helper
 */
export const ErrorBoundaryLogger = {
  /**
   * Log React error boundary errors
   */
  logError(error, errorInfo, userId = null) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userId,
      category: LOG_CATEGORIES.ERROR
    });
  }
};

// Export logger as default for convenience
export default logger;
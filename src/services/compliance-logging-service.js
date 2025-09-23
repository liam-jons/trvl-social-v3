/**
 * Compliance Logging Service
 * Handles COPPA compliance logging for age verification attempts
 * Stores verification attempts for compliance monitoring without exposing PII
 */

import { supabase } from '../lib/supabase';

/**
 * Event types for compliance logging
 */
export const COMPLIANCE_EVENTS = {
  AGE_VERIFICATION_ATTEMPT: 'age_verification_attempt',
  AGE_VERIFICATION_SUCCESS: 'age_verification_success',
  AGE_VERIFICATION_FAILURE: 'age_verification_failure',
  UNDERAGE_ATTEMPT: 'underage_attempt',
  REGISTRATION_ATTEMPT: 'registration_attempt',
  REGISTRATION_SUCCESS: 'registration_success',
  REGISTRATION_FAILURE: 'registration_failure',
  ENCRYPTION_FAILURE: 'encryption_failure',
  DECRYPTION_FAILURE: 'decryption_failure'
};

/**
 * Compliance logging utility class
 */
class ComplianceLogger {
  constructor() {
    this.isEnabled = true;
    this.batchSize = 10;
    this.batchTimeout = 5000; // 5 seconds
    this.pendingLogs = [];
    this.batchTimer = null;
  }

  /**
   * Log a compliance event
   * @param {string} eventType - Type of event (use COMPLIANCE_EVENTS constants)
   * @param {Object} eventData - Event-specific data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} Success status
   */
  async logEvent(eventType, eventData = {}, metadata = {}) {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const logEntry = this.createLogEntry(eventType, eventData, metadata);

      // For critical events, log immediately
      if (this.isCriticalEvent(eventType)) {
        return await this.insertLogEntry(logEntry);
      }

      // For non-critical events, use batching
      this.addToBatch(logEntry);
      return true;
    } catch (error) {
      console.error('Compliance logging failed:', error);
      return false;
    }
  }

  /**
   * Log age verification attempt
   * @param {Object} params - Verification parameters
   * @param {string} params.result - 'success' | 'failure'
   * @param {number} params.calculatedAge - Calculated age (if successful)
   * @param {string} params.errorCode - Error code (if failed)
   * @param {string} params.userAgent - User agent string
   * @param {string} params.origin - Request origin
   * @param {boolean} params.wasEncrypted - Whether birth date was encrypted
   * @returns {Promise<boolean>} Success status
   */
  async logAgeVerification({
    result,
    calculatedAge = null,
    errorCode = null,
    userAgent = 'unknown',
    origin = 'unknown',
    wasEncrypted = false
  }) {
    const eventType = result === 'success'
      ? COMPLIANCE_EVENTS.AGE_VERIFICATION_SUCCESS
      : COMPLIANCE_EVENTS.AGE_VERIFICATION_FAILURE;

    const eventData = {
      result,
      calculated_age: calculatedAge,
      error_code: errorCode,
      was_encrypted: wasEncrypted,
      is_underage: calculatedAge !== null && calculatedAge < 13
    };

    const metadata = {
      user_agent: this.sanitizeUserAgent(userAgent),
      origin: this.sanitizeOrigin(origin),
      timestamp: new Date().toISOString()
    };

    // If this is an underage attempt, also log the specific event
    if (eventData.is_underage) {
      await this.logEvent(COMPLIANCE_EVENTS.UNDERAGE_ATTEMPT, eventData, metadata);
    }

    return await this.logEvent(eventType, eventData, metadata);
  }

  /**
   * Log registration attempt
   * @param {Object} params - Registration parameters
   * @param {string} params.result - 'success' | 'failure'
   * @param {string} params.email - User email (will be hashed)
   * @param {string} params.errorCode - Error code (if failed)
   * @param {string} params.role - User role (traveler/vendor)
   * @param {boolean} params.ageVerificationPassed - Whether age verification passed
   * @param {string} params.userAgent - User agent string
   * @param {string} params.origin - Request origin
   * @returns {Promise<boolean>} Success status
   */
  async logRegistration({
    result,
    email,
    errorCode = null,
    role = 'traveler',
    ageVerificationPassed = false,
    userAgent = 'unknown',
    origin = 'unknown'
  }) {
    const eventType = result === 'success'
      ? COMPLIANCE_EVENTS.REGISTRATION_SUCCESS
      : COMPLIANCE_EVENTS.REGISTRATION_FAILURE;

    const eventData = {
      result,
      email_hash: email ? await this.hashEmail(email) : null,
      error_code: errorCode,
      role,
      age_verification_passed: ageVerificationPassed
    };

    const metadata = {
      user_agent: this.sanitizeUserAgent(userAgent),
      origin: this.sanitizeOrigin(origin),
      timestamp: new Date().toISOString()
    };

    return await this.logEvent(eventType, eventData, metadata);
  }

  /**
   * Log encryption/decryption failures
   * @param {string} operation - 'encryption' | 'decryption'
   * @param {string} errorMessage - Error message
   * @param {Object} context - Additional context
   * @returns {Promise<boolean>} Success status
   */
  async logEncryptionEvent(operation, errorMessage, context = {}) {
    const eventType = operation === 'encryption'
      ? COMPLIANCE_EVENTS.ENCRYPTION_FAILURE
      : COMPLIANCE_EVENTS.DECRYPTION_FAILURE;

    const eventData = {
      operation,
      error_message: errorMessage,
      context
    };

    return await this.logEvent(eventType, eventData);
  }

  /**
   * Get compliance metrics
   * @param {Date} startDate - Start date for metrics
   * @param {Date} endDate - End date for metrics
   * @returns {Promise<Object>} Compliance metrics
   */
  async getComplianceMetrics(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('compliance_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      return this.calculateMetrics(data);
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      return null;
    }
  }

  /**
   * Creates a structured log entry
   * @private
   */
  createLogEntry(eventType, eventData, metadata) {
    return {
      event_type: eventType,
      event_data: eventData,
      metadata: metadata,
      created_at: new Date().toISOString(),
      session_id: this.getSessionId()
    };
  }

  /**
   * Checks if event is critical and should be logged immediately
   * @private
   */
  isCriticalEvent(eventType) {
    const criticalEvents = [
      COMPLIANCE_EVENTS.UNDERAGE_ATTEMPT,
      COMPLIANCE_EVENTS.ENCRYPTION_FAILURE,
      COMPLIANCE_EVENTS.DECRYPTION_FAILURE
    ];
    return criticalEvents.includes(eventType);
  }

  /**
   * Adds log entry to batch
   * @private
   */
  addToBatch(logEntry) {
    this.pendingLogs.push(logEntry);

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.batchTimeout);
    }

    // Flush if batch is full
    if (this.pendingLogs.length >= this.batchSize) {
      this.flushBatch();
    }
  }

  /**
   * Flushes pending logs to database
   * @private
   */
  async flushBatch() {
    if (this.pendingLogs.length === 0) {
      return;
    }

    const logsToFlush = [...this.pendingLogs];
    this.pendingLogs = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await this.insertLogEntries(logsToFlush);
    } catch (error) {
      console.error('Failed to flush compliance logs:', error);
      // Could implement retry logic here
    }
  }

  /**
   * Inserts a single log entry
   * @private
   */
  async insertLogEntry(logEntry) {
    try {
      const { error } = await supabase
        .from('compliance_logs')
        .insert([logEntry]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to insert compliance log:', error);
      return false;
    }
  }

  /**
   * Inserts multiple log entries
   * @private
   */
  async insertLogEntries(logEntries) {
    const { error } = await supabase
      .from('compliance_logs')
      .insert(logEntries);

    if (error) throw error;
  }

  /**
   * Hashes email for privacy
   * @private
   */
  async hashEmail(email) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(email.toLowerCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Email hashing failed:', error);
      return 'hash_failed';
    }
  }

  /**
   * Sanitizes user agent string
   * @private
   */
  sanitizeUserAgent(userAgent) {
    if (!userAgent || userAgent === 'unknown') {
      return 'unknown';
    }
    // Remove potentially sensitive information but keep browser/OS info
    return userAgent.substring(0, 200); // Limit length
  }

  /**
   * Sanitizes origin string
   * @private
   */
  sanitizeOrigin(origin) {
    if (!origin || origin === 'unknown') {
      return 'unknown';
    }
    try {
      const url = new URL(origin);
      return url.origin; // This removes any path/query parameters
    } catch {
      return 'invalid_origin';
    }
  }

  /**
   * Gets or creates session ID
   * @private
   */
  getSessionId() {
    // Use existing session ID or create a new one
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('compliance_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('compliance_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  /**
   * Calculates compliance metrics from log data
   * @private
   */
  calculateMetrics(logs) {
    const metrics = {
      totalAttempts: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      underageAttempts: 0,
      registrationAttempts: 0,
      successfulRegistrations: 0,
      encryptionFailures: 0,
      decryptionFailures: 0,
      topErrorCodes: {},
      hourlyDistribution: {},
      userAgentStats: {}
    };

    logs.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      metrics.hourlyDistribution[hour] = (metrics.hourlyDistribution[hour] || 0) + 1;

      switch (log.event_type) {
        case COMPLIANCE_EVENTS.AGE_VERIFICATION_ATTEMPT:
          metrics.totalAttempts++;
          break;
        case COMPLIANCE_EVENTS.AGE_VERIFICATION_SUCCESS:
          metrics.successfulVerifications++;
          break;
        case COMPLIANCE_EVENTS.AGE_VERIFICATION_FAILURE:
          metrics.failedVerifications++;
          if (log.event_data?.error_code) {
            metrics.topErrorCodes[log.event_data.error_code] =
              (metrics.topErrorCodes[log.event_data.error_code] || 0) + 1;
          }
          break;
        case COMPLIANCE_EVENTS.UNDERAGE_ATTEMPT:
          metrics.underageAttempts++;
          break;
        case COMPLIANCE_EVENTS.REGISTRATION_ATTEMPT:
          metrics.registrationAttempts++;
          break;
        case COMPLIANCE_EVENTS.REGISTRATION_SUCCESS:
          metrics.successfulRegistrations++;
          break;
        case COMPLIANCE_EVENTS.ENCRYPTION_FAILURE:
          metrics.encryptionFailures++;
          break;
        case COMPLIANCE_EVENTS.DECRYPTION_FAILURE:
          metrics.decryptionFailures++;
          break;
      }

      // Track user agent stats (browser families)
      if (log.metadata?.user_agent) {
        const browser = this.extractBrowser(log.metadata.user_agent);
        metrics.userAgentStats[browser] = (metrics.userAgentStats[browser] || 0) + 1;
      }
    });

    return metrics;
  }

  /**
   * Extracts browser family from user agent
   * @private
   */
  extractBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Other';
  }

  /**
   * Disable compliance logging (for testing)
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Enable compliance logging
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Cleanup - flush any pending logs
   */
  async cleanup() {
    await this.flushBatch();
  }
}

// Create singleton instance
const complianceLogger = new ComplianceLogger();

// Export convenience functions
export const logAgeVerification = (params) => complianceLogger.logAgeVerification(params);
export const logRegistration = (params) => complianceLogger.logRegistration(params);
export const logEncryptionEvent = (operation, errorMessage, context) =>
  complianceLogger.logEncryptionEvent(operation, errorMessage, context);
export const getComplianceMetrics = (startDate, endDate) =>
  complianceLogger.getComplianceMetrics(startDate, endDate);

// Export class and instance
export { complianceLogger };
export default complianceLogger;
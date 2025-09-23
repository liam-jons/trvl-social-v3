/**
 * CORS Monitoring Service
 * Centralized monitoring and alerting for CORS violations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

/**
 * CORS violation severity levels
 */
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Rate limiting for violation tracking
 */
class ViolationRateTracker {
  constructor() {
    this.violations = new Map(); // origin -> { count, firstSeen, lastSeen }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Track a violation for an origin
   */
  track(origin) {
    const now = Date.now();
    const existing = this.violations.get(origin);

    if (existing) {
      existing.count++;
      existing.lastSeen = now;
    } else {
      this.violations.set(origin, {
        count: 1,
        firstSeen: now,
        lastSeen: now
      });
    }

    return this.violations.get(origin);
  }

  /**
   * Get violation count for an origin
   */
  getCount(origin) {
    return this.violations.get(origin)?.count || 0;
  }

  /**
   * Cleanup old violations (older than 1 hour)
   */
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [origin, data] of this.violations.entries()) {
      if (data.lastSeen < oneHourAgo) {
        this.violations.delete(origin);
      }
    }
  }

  /**
   * Destroy the tracker
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate tracker instance
const violationTracker = new ViolationRateTracker();

/**
 * Determine violation severity based on origin and frequency
 */
function determineSeverity(origin, violationData, endpoint) {
  // Critical: Known malicious patterns
  const maliciousPatterns = [
    /evil\.com$/,
    /malicious/i,
    /hack/i,
    /exploit/i,
    /attack/i
  ];

  if (maliciousPatterns.some(pattern => pattern.test(origin))) {
    return SEVERITY_LEVELS.CRITICAL;
  }

  // High: Many violations in short time
  if (violationData.count > 10) {
    return SEVERITY_LEVELS.HIGH;
  }

  // Medium: Payment or sensitive endpoints
  const sensitiveEndpoints = [
    '/api/stripe/',
    '/api/payment',
    '/functions/v1/verify-age'
  ];

  if (sensitiveEndpoints.some(path => endpoint.includes(path))) {
    return SEVERITY_LEVELS.MEDIUM;
  }

  // Low: General violations
  return SEVERITY_LEVELS.LOW;
}

/**
 * Log CORS violation to Supabase
 */
async function logViolationToDatabase(violationData) {
  try {
    const { error } = await supabase
      .from('cors_violations')
      .insert([violationData]);

    if (error) {
      console.error('Failed to log CORS violation to database:', error);
    }
  } catch (error) {
    console.error('Database logging error:', error);
  }
}

/**
 * Send alert for high-severity violations
 */
async function sendAlert(violation) {
  if (violation.severity === SEVERITY_LEVELS.CRITICAL || violation.severity === SEVERITY_LEVELS.HIGH) {
    // In production, integrate with alerting service (Slack, PagerDuty, etc.)
    console.error('🚨 HIGH SEVERITY CORS VIOLATION DETECTED:', {
      origin: violation.origin,
      endpoint: violation.endpoint,
      severity: violation.severity,
      count: violation.count,
      userAgent: violation.userAgent
    });

    // Example: Send to monitoring service
    if (process.env.WEBHOOK_URL) {
      try {
        await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CORS Security Alert: ${violation.origin} attempted unauthorized access to ${violation.endpoint}`,
            severity: violation.severity,
            details: violation
          })
        });
      } catch (error) {
        console.error('Failed to send alert webhook:', error);
      }
    }
  }
}

/**
 * Enhanced CORS violation logging with monitoring
 */
export async function logCorsViolation(origin, endpoint, method, additionalData = {}) {
  const timestamp = new Date().toISOString();
  const violationData = violationTracker.track(origin);
  const severity = determineSeverity(origin, violationData, endpoint);

  const violation = {
    id: crypto.randomUUID(),
    timestamp,
    origin,
    endpoint,
    method,
    severity,
    count: violationData.count,
    firstSeen: new Date(violationData.firstSeen).toISOString(),
    lastSeen: new Date(violationData.lastSeen).toISOString(),
    userAgent: additionalData.userAgent || null,
    ipAddress: additionalData.ipAddress || null,
    referer: additionalData.referer || null,
    sessionId: additionalData.sessionId || null,
    ...additionalData
  };

  // Console logging with structured format
  console.warn('CORS Violation Detected:', JSON.stringify(violation, null, 2));

  // Log to database
  await logViolationToDatabase(violation);

  // Send alerts for high-severity violations
  await sendAlert(violation);

  return violation;
}

/**
 * Get CORS violation statistics
 */
export async function getCorsViolationStats(timeframe = '24h') {
  try {
    const hours = timeframe === '24h' ? 24 : timeframe === '1h' ? 1 : 168; // Default to 7 days
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();

    const { data, error } = await supabase
      .from('cors_violations')
      .select('*')
      .gte('timestamp', since)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Aggregate statistics
    const stats = {
      total: data.length,
      byOrigin: {},
      bySeverity: {},
      byEndpoint: {},
      timeline: [],
      topOffenders: []
    };

    data.forEach(violation => {
      // By origin
      stats.byOrigin[violation.origin] = (stats.byOrigin[violation.origin] || 0) + 1;

      // By severity
      stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;

      // By endpoint
      stats.byEndpoint[violation.endpoint] = (stats.byEndpoint[violation.endpoint] || 0) + 1;
    });

    // Top offenders (origins with most violations)
    stats.topOffenders = Object.entries(stats.byOrigin)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([origin, count]) => ({ origin, count }));

    return stats;
  } catch (error) {
    console.error('Failed to get CORS violation stats:', error);
    return null;
  }
}

/**
 * Create CORS violations table in Supabase
 */
export async function initializeCorsMonitoring() {
  try {
    // This would typically be done via migration
    const { error } = await supabase.rpc('create_cors_violations_table');

    if (error && !error.message.includes('already exists')) {
      console.error('Failed to initialize CORS monitoring:', error);
    } else {
      console.log('✅ CORS monitoring initialized');
    }
  } catch (error) {
    console.error('CORS monitoring initialization error:', error);
  }
}

/**
 * Middleware to extract request metadata for violation logging
 */
export function extractRequestMetadata(req) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress,
    referer: req.headers.referer,
    sessionId: req.headers['x-session-id'] || req.cookies?.sessionId
  };
}

/**
 * Enhanced CORS middleware with monitoring
 */
export function corsMiddlewareWithMonitoring(secure = false) {
  return (req, res, next) => {
    const origin = req.headers.origin;

    // Apply base CORS logic
    const { corsMiddleware } = require('./cors-config.js');
    const baseCorsHandler = corsMiddleware(secure);

    // Wrap the handler to add monitoring
    const monitoringHandler = (req, res, next) => {
      // Check if origin is allowed
      const { isOriginAllowed } = require('./cors-config.js');

      if (origin && !isOriginAllowed(origin)) {
        // Log the violation with additional metadata
        const metadata = extractRequestMetadata(req);
        logCorsViolation(origin, req.originalUrl || req.url, req.method, metadata);

        // Return 403 with detailed error
        return res.status(403).json({
          error: 'CORS_VIOLATION',
          message: 'Cross-origin request blocked by security policy',
          origin: origin,
          timestamp: new Date().toISOString(),
          violationId: crypto.randomUUID()
        });
      }

      if (next) next();
    };

    // Apply base CORS handling first
    baseCorsHandler(req, res, () => {
      // Then apply monitoring
      monitoringHandler(req, res, next);
    });
  };
}

export {
  SEVERITY_LEVELS,
  ViolationRateTracker
};
/**
 * Production-grade rate limiter for API requests
 * Implements token bucket algorithm with configurable limits per endpoint,
 * DDoS protection, and comprehensive monitoring for production environments.
 */

import logger from '../utils/logger.js';

class RateLimiter {
  constructor() {
    this.buckets = new Map();
    this.ipBuckets = new Map();
    this.userBuckets = new Map();
    this.globalBucket = null;
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();
    this.isProduction = process.env.NODE_ENV === 'production';

    // Load production configuration from environment
    this.config = {
      // Production limits per endpoint type (from environment variables)
      endpoints: {
        auth: {
          capacity: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
          refillRate: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
          windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '300000') // 5 minutes
        },
        payment: {
          capacity: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '10'),
          refillRate: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '10'),
          windowMs: parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW || '3600000') // 1 hour
        },
        search: { capacity: 30, refillRate: 30, windowMs: 60000 },
        write: { capacity: 20, refillRate: 20, windowMs: 60000 },
        read: { capacity: 60, refillRate: 60, windowMs: 60000 },
        upload: { capacity: 5, refillRate: 5, windowMs: 60000 },
        ai: { capacity: 10, refillRate: 10, windowMs: 60000 },
        default: {
          capacity: parseInt(process.env.RATE_LIMIT_MAX || '100'),
          refillRate: parseInt(process.env.RATE_LIMIT_MAX || '100'),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000') // 15 minutes
        }
      },
      // Global rate limit (all endpoints combined)
      global: {
        capacity: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        refillRate: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000')
      },
      // DDoS protection settings
      ddosProtection: {
        enabled: process.env.ENABLE_DDOS_PROTECTION !== 'false',
        suspiciousThreshold: 200, // requests per minute
        blockThreshold: 500, // requests per minute
        blockDuration: 3600000, // 1 hour
        whitelist: (process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(Boolean)
      },
      // Retry configuration
      retry: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
      }
    };

    this.initializeGlobalBucket();
    this.initializeMonitoring();
    this.initializeDDoSProtection();
  }

  initializeGlobalBucket() {
    this.globalBucket = this.createBucket(this.config.global);
  }

  /**
   * Initialize monitoring and metrics collection
   */
  initializeMonitoring() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivity: 0,
      lastReset: Date.now()
    };

    // Reset metrics every hour
    setInterval(() => {
      this.resetMetrics();
    }, 3600000);
  }

  /**
   * Initialize DDoS protection
   */
  initializeDDoSProtection() {
    if (!this.config.ddosProtection.enabled) return;

    // Clean up blocked IPs periodically
    setInterval(() => {
      this.cleanupBlockedIPs();
    }, 300000); // Every 5 minutes

    logger.info('DDoS protection initialized', {
      suspiciousThreshold: this.config.ddosProtection.suspiciousThreshold,
      blockThreshold: this.config.ddosProtection.blockThreshold,
      blockDuration: this.config.ddosProtection.blockDuration
    });
  }

  /**
   * Clean up expired IP blocks
   */
  cleanupBlockedIPs() {
    const now = Date.now();
    const expiredIPs = [];

    for (const [ip, blockInfo] of this.blockedIPs.entries()) {
      if (typeof blockInfo === 'object' && now > blockInfo.expiresAt) {
        expiredIPs.push(ip);
      }
    }

    expiredIPs.forEach(ip => {
      this.blockedIPs.delete(ip);
      logger.info('IP unblocked after timeout', { ip });
    });
  }

  /**
   * Reset monitoring metrics
   */
  resetMetrics() {
    const previousMetrics = { ...this.metrics };
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivity: 0,
      lastReset: Date.now()
    };

    if (this.isProduction) {
      logger.info('Rate limiter metrics reset', {
        previousHour: previousMetrics,
        category: 'monitoring'
      });
    }
  }

  /**
   * Check if IP is whitelisted
   */
  isWhitelisted(ip) {
    return this.config.ddosProtection.whitelist.includes(ip);
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    if (!ip || this.isWhitelisted(ip)) return false;

    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;

    if (typeof blockInfo === 'object' && Date.now() > blockInfo.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * Block IP for DDoS protection
   */
  blockIP(ip, reason = 'Rate limit exceeded') {
    if (this.isWhitelisted(ip)) return;

    const expiresAt = Date.now() + this.config.ddosProtection.blockDuration;
    this.blockedIPs.set(ip, { blockedAt: Date.now(), expiresAt, reason });

    logger.security('IP blocked for DDoS protection', 'high', {
      ip,
      reason,
      expiresAt: new Date(expiresAt).toISOString(),
      blockDuration: this.config.ddosProtection.blockDuration
    });

    this.metrics.blockedRequests++;
  }

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity(ip) {
    if (!this.config.ddosProtection.enabled || this.isWhitelisted(ip)) return;

    const ipBucket = this.getIPBucket(ip);
    const requestsPerMinute = this.calculateRequestsPerMinute(ipBucket);

    if (requestsPerMinute > this.config.ddosProtection.blockThreshold) {
      this.blockIP(ip, 'Excessive request rate detected');
      return true;
    }

    if (requestsPerMinute > this.config.ddosProtection.suspiciousThreshold) {
      if (!this.suspiciousIPs.has(ip)) {
        this.suspiciousIPs.add(ip);
        this.metrics.suspiciousActivity++;

        logger.security('Suspicious activity detected', 'medium', {
          ip,
          requestsPerMinute,
          threshold: this.config.ddosProtection.suspiciousThreshold
        });
      }
    }

    return false;
  }

  /**
   * Get IP-specific bucket
   */
  getIPBucket(ip) {
    if (!this.ipBuckets.has(ip)) {
      this.ipBuckets.set(ip, this.createBucket({
        capacity: this.config.ddosProtection.blockThreshold,
        refillRate: this.config.ddosProtection.suspiciousThreshold,
        windowMs: 60000 // 1 minute
      }));
    }
    return this.ipBuckets.get(ip);
  }

  /**
   * Calculate requests per minute for an IP
   */
  calculateRequestsPerMinute(bucket) {
    const now = Date.now();
    const timeSinceLastRefill = now - bucket.lastRefill;
    const tokensUsed = bucket.capacity - bucket.tokens;

    // Estimate requests per minute based on tokens used
    if (timeSinceLastRefill < 60000) {
      return (tokensUsed / timeSinceLastRefill) * 60000;
    }

    return tokensUsed;
  }

  createBucket(config) {
    return {
      tokens: config.capacity,
      capacity: config.capacity,
      refillRate: config.refillRate,
      windowMs: config.windowMs,
      lastRefill: Date.now()
    };
  }

  getBucket(endpoint) {
    if (!this.buckets.has(endpoint)) {
      const config = this.getEndpointConfig(endpoint);
      this.buckets.set(endpoint, this.createBucket(config));
    }
    return this.buckets.get(endpoint);
  }

  getEndpointConfig(endpoint) {
    // Categorize endpoints based on URL patterns
    if (endpoint.includes('/auth/') || endpoint.includes('/login') || endpoint.includes('/register')) {
      return this.config.endpoints.auth;
    }
    if (endpoint.includes('/search') || endpoint.includes('/filter')) {
      return this.config.endpoints.search;
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].some(method => endpoint.startsWith(method))) {
      return this.config.endpoints.write;
    }
    if (endpoint.includes('/upload') || endpoint.includes('/media')) {
      return this.config.endpoints.upload;
    }
    if (endpoint.includes('/ai/') || endpoint.includes('/generate')) {
      return this.config.endpoints.ai;
    }
    if (endpoint.startsWith('GET')) {
      return this.config.endpoints.read;
    }
    return this.config.endpoints.default;
  }

  refillTokens(bucket) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / bucket.windowMs) * bucket.refillRate;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  async acquire(endpoint = 'default', tokensRequired = 1, clientIP = null, userId = null) {
    this.metrics.totalRequests++;

    // Check if IP is blocked
    if (clientIP && this.isBlocked(clientIP)) {
      this.metrics.blockedRequests++;
      throw new RateLimitError(
        'IP temporarily blocked due to suspicious activity',
        this.config.ddosProtection.blockDuration,
        endpoint,
        429,
        clientIP
      );
    }

    // Check for suspicious activity
    if (clientIP && this.checkSuspiciousActivity(clientIP)) {
      this.metrics.blockedRequests++;
      throw new RateLimitError(
        'IP blocked due to excessive request rate',
        this.config.ddosProtection.blockDuration,
        endpoint,
        429,
        clientIP
      );
    }

    const bucket = this.getBucket(endpoint);
    this.refillTokens(bucket);
    this.refillTokens(this.globalBucket);

    // Update IP bucket if provided
    if (clientIP) {
      const ipBucket = this.getIPBucket(clientIP);
      this.refillTokens(ipBucket);
      ipBucket.tokens = Math.max(0, ipBucket.tokens - 1);
    }

    // Check both endpoint and global limits
    if (bucket.tokens < tokensRequired || this.globalBucket.tokens < tokensRequired) {
      const waitTime = this.calculateWaitTime(bucket, tokensRequired);

      // Log rate limit violation
      logger.warn('Rate limit exceeded', {
        endpoint,
        clientIP,
        userId,
        tokensRequired,
        bucketTokens: bucket.tokens,
        globalTokens: this.globalBucket.tokens,
        waitTime
      });

      throw new RateLimitError(
        `Rate limit exceeded for ${endpoint}. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        waitTime,
        endpoint,
        429,
        clientIP
      );
    }

    // Consume tokens
    bucket.tokens -= tokensRequired;
    this.globalBucket.tokens -= tokensRequired;

    // Log successful request in production
    if (this.isProduction && Math.random() < 0.01) { // Sample 1% of requests
      logger.debug('Rate limit check passed', {
        endpoint,
        clientIP,
        userId,
        remaining: Math.floor(bucket.tokens),
        category: 'rate_limiting'
      });
    }

    return {
      remaining: Math.floor(bucket.tokens),
      reset: new Date(bucket.lastRefill + bucket.windowMs),
      limit: bucket.capacity,
      globalRemaining: Math.floor(this.globalBucket.tokens)
    };
  }

  calculateWaitTime(bucket, tokensRequired) {
    const tokensNeeded = tokensRequired - bucket.tokens;
    const waitTime = (tokensNeeded / bucket.refillRate) * bucket.windowMs;
    return Math.max(0, waitTime);
  }

  async executeWithRetry(fn, endpoint = 'default', options = {}) {
    const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
      ...this.config.retry,
      ...options
    };

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.acquire(endpoint);
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;

        if (error instanceof RateLimitError) {
          if (attempt < maxRetries) {
            const waitTime = Math.min(error.waitTime || delay, maxDelay);
            await this.sleep(waitTime);
            delay = Math.min(delay * backoffMultiplier, maxDelay);
            continue;
          }
        }

        // For non-rate-limit errors or if we've exhausted retries
        throw error;
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRateLimitInfo(endpoint = 'default') {
    const bucket = this.getBucket(endpoint);
    this.refillTokens(bucket);

    return {
      endpoint,
      available: Math.floor(bucket.tokens),
      limit: bucket.capacity,
      reset: new Date(bucket.lastRefill + bucket.windowMs),
      globalAvailable: Math.floor(this.globalBucket.tokens),
      globalLimit: this.globalBucket.capacity
    };
  }

  reset(endpoint) {
    if (endpoint) {
      const config = this.getEndpointConfig(endpoint);
      this.buckets.set(endpoint, this.createBucket(config));
    } else {
      // Reset all buckets
      this.buckets.clear();
      this.initializeGlobalBucket();
    }
  }

  // Update configuration for specific endpoints
  updateConfig(endpoint, newConfig) {
    if (endpoint === 'global') {
      this.config.global = { ...this.config.global, ...newConfig };
      this.initializeGlobalBucket();
    } else {
      this.config.endpoints[endpoint] = {
        ...this.config.endpoints[endpoint],
        ...newConfig
      };
      // Reset bucket with new config if it exists
      if (this.buckets.has(endpoint)) {
        this.buckets.set(endpoint, this.createBucket(this.config.endpoints[endpoint]));
      }
    }
  }
}

  /**
   * Get comprehensive monitoring metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeBuckets: this.buckets.size,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      uptime: Date.now() - this.metrics.lastReset,
      ddosProtectionEnabled: this.config.ddosProtection.enabled
    };
  }

  /**
   * Get detailed status for monitoring dashboard
   */
  getDetailedStatus() {
    const metrics = this.getMetrics();
    const now = Date.now();

    return {
      ...metrics,
      buckets: Array.from(this.buckets.entries()).map(([endpoint, bucket]) => ({
        endpoint,
        available: Math.floor(bucket.tokens),
        capacity: bucket.capacity,
        lastRefill: new Date(bucket.lastRefill).toISOString(),
        utilizationPercent: ((bucket.capacity - bucket.tokens) / bucket.capacity * 100).toFixed(2)
      })),
      blockedIPsList: Array.from(this.blockedIPs.entries()).map(([ip, blockInfo]) => ({
        ip,
        reason: blockInfo.reason,
        blockedAt: new Date(blockInfo.blockedAt).toISOString(),
        expiresAt: new Date(blockInfo.expiresAt).toISOString(),
        timeRemaining: Math.max(0, blockInfo.expiresAt - now)
      })),
      suspiciousIPsList: Array.from(this.suspiciousIPs),
      config: {
        ddosProtection: this.config.ddosProtection,
        endpoints: this.config.endpoints
      }
    };
  }

  /**
   * Manual IP management for administrators
   */
  adminUnblockIP(ip) {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip);
      this.suspiciousIPs.delete(ip);
      logger.info('IP manually unblocked by administrator', { ip });
      return true;
    }
    return false;
  }

  /**
   * Manual IP blocking for administrators
   */
  adminBlockIP(ip, reason = 'Manually blocked by administrator', duration = null) {
    const blockDuration = duration || this.config.ddosProtection.blockDuration;
    const expiresAt = Date.now() + blockDuration;

    this.blockedIPs.set(ip, {
      blockedAt: Date.now(),
      expiresAt,
      reason
    });

    logger.security('IP manually blocked by administrator', 'high', {
      ip,
      reason,
      duration: blockDuration
    });
  }

  /**
   * Health check for rate limiter
   */
  healthCheck() {
    const metrics = this.getMetrics();
    const issues = [];

    // Check for excessive blocked requests
    const blockRate = metrics.totalRequests > 0 ?
      (metrics.blockedRequests / metrics.totalRequests) : 0;

    if (blockRate > 0.1) { // More than 10% blocked
      issues.push({
        severity: 'warning',
        message: `High block rate: ${(blockRate * 100).toFixed(2)}%`
      });
    }

    // Check for too many suspicious IPs
    if (metrics.suspiciousIPs > 100) {
      issues.push({
        severity: 'warning',
        message: `Many suspicious IPs detected: ${metrics.suspiciousIPs}`
      });
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      metrics
    };
  }
}

// Custom error class for rate limit errors
class RateLimitError extends Error {
  constructor(message, waitTime, endpoint, statusCode = 429, clientIP = null) {
    super(message);
    this.name = 'RateLimitError';
    this.waitTime = waitTime;
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    this.clientIP = clientIP;
    this.retryAfter = new Date(Date.now() + waitTime);
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Middleware function for fetch requests
export const withRateLimit = async (url, options = {}, endpointType = null) => {
  const method = options.method || 'GET';
  const endpoint = endpointType || `${method} ${url}`;

  return rateLimiter.executeWithRetry(
    async () => {
      const response = await fetch(url, options);

      // Check for server-side rate limit headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        throw new RateLimitError(
          'Server rate limit exceeded',
          waitTime,
          endpoint
        );
      }

      return response;
    },
    endpoint
  );
};

// Note: React hook for rate limit info is exported from hooks/useRateLimitedAPI.js
// to avoid importing React in a service file

export { rateLimiter, RateLimitError };
export default rateLimiter;
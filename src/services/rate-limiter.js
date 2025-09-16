/**
 * Client-side rate limiter for API requests
 * Implements token bucket algorithm with configurable limits per endpoint
 */

class RateLimiter {
  constructor() {
    this.buckets = new Map();
    this.globalBucket = null;
    this.config = {
      // Default limits per endpoint type (requests per minute)
      endpoints: {
        auth: { capacity: 10, refillRate: 10, windowMs: 60000 },
        search: { capacity: 30, refillRate: 30, windowMs: 60000 },
        write: { capacity: 20, refillRate: 20, windowMs: 60000 },
        read: { capacity: 60, refillRate: 60, windowMs: 60000 },
        upload: { capacity: 5, refillRate: 5, windowMs: 60000 },
        ai: { capacity: 10, refillRate: 10, windowMs: 60000 },
        default: { capacity: 40, refillRate: 40, windowMs: 60000 }
      },
      // Global rate limit (all endpoints combined)
      global: { capacity: 100, refillRate: 100, windowMs: 60000 },
      // Retry configuration
      retry: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
      }
    };
    this.initializeGlobalBucket();
  }

  initializeGlobalBucket() {
    this.globalBucket = this.createBucket(this.config.global);
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

  async acquire(endpoint = 'default', tokensRequired = 1) {
    const bucket = this.getBucket(endpoint);
    this.refillTokens(bucket);
    this.refillTokens(this.globalBucket);

    // Check both endpoint and global limits
    if (bucket.tokens < tokensRequired || this.globalBucket.tokens < tokensRequired) {
      const waitTime = this.calculateWaitTime(bucket, tokensRequired);
      throw new RateLimitError(
        `Rate limit exceeded for ${endpoint}. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        waitTime,
        endpoint
      );
    }

    // Consume tokens
    bucket.tokens -= tokensRequired;
    this.globalBucket.tokens -= tokensRequired;

    return {
      remaining: Math.floor(bucket.tokens),
      reset: new Date(bucket.lastRefill + bucket.windowMs),
      limit: bucket.capacity
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
            console.warn(`Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
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

// Custom error class for rate limit errors
class RateLimitError extends Error {
  constructor(message, waitTime, endpoint) {
    super(message);
    this.name = 'RateLimitError';
    this.waitTime = waitTime;
    this.endpoint = endpoint;
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
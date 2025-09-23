/**
 * Redis Cache Service for Compatibility Scores
 * High-performance caching layer for frequently accessed compatibility calculations
 */
import Redis from 'ioredis';
class RedisCacheService {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.fallbackCache = new Map();
    this.maxFallbackSize = 1000;
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      operations: 0
    };
    this.initializeRedis();
  }
  async initializeRedis() {
    try {
      // Initialize Redis with connection pooling and retry logic
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxLoadingTimeout: 5000,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        keyPrefix: 'trvl:compat:',
        // Connection pool settings
        maxRetryCount: 5,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
      });
      // Event handlers
      this.redis.on('connect', () => {
        this.connected = true;
      });
      this.redis.on('ready', () => {
      });
      this.redis.on('error', (err) => {
        this.connected = false;
        this.metrics.errors++;
      });
      this.redis.on('close', () => {
        this.connected = false;
      });
      // Attempt connection
      await this.redis.connect();
    } catch (error) {
      this.connected = false;
    }
  }
  /**
   * Generate cache key for compatibility score
   */
  generateCompatibilityKey(user1Id, user2Id, groupId = null, version = 'v1') {
    // Ensure consistent ordering for pairwise scores
    const [id1, id2] = [user1Id, user2Id].sort();
    const groupPart = groupId ? `:group:${groupId}` : '';
    return `score:${version}:${id1}:${id2}${groupPart}`;
  }
  /**
   * Generate cache key for group analysis
   */
  generateGroupAnalysisKey(userIds, algorithmId = 'default', version = 'v1') {
    const sortedIds = [...userIds].sort().join(',');
    return `analysis:${version}:${algorithmId}:${Buffer.from(sortedIds).toString('base64')}`;
  }
  /**
   * Generate cache key for bulk calculations
   */
  generateBulkKey(userIds, options = {}) {
    const sortedIds = [...userIds].sort().join(',');
    const optionsHash = Buffer.from(JSON.stringify(options)).toString('base64');
    return `bulk:v1:${Buffer.from(sortedIds).toString('base64')}:${optionsHash}`;
  }
  /**
   * Cache compatibility score with TTL
   */
  async cacheCompatibilityScore(user1Id, user2Id, score, options = {}) {
    try {
      this.metrics.operations++;
      const key = this.generateCompatibilityKey(
        user1Id,
        user2Id,
        options.groupId,
        options.version
      );
      const data = {
        ...score,
        cachedAt: new Date().toISOString(),
        ttl: options.ttl || 3600 // 1 hour default
      };
      if (this.connected && this.redis) {
        // Use Redis with compression for large objects
        const serialized = JSON.stringify(data);
        const compressed = this.compressData(serialized);
        await this.redis.setex(key, options.ttl || 3600, compressed);
        // Also cache quick lookup for exists checks
        await this.redis.setex(`exists:${key}`, options.ttl || 3600, '1');
      } else {
        // Fallback to memory cache
        this.manageFallbackCacheSize();
        this.fallbackCache.set(key, {
          data,
          expiresAt: Date.now() + ((options.ttl || 3600) * 1000)
        });
      }
      return true;
    } catch (error) {
      this.metrics.errors++;
      return false;
    }
  }
  /**
   * Get cached compatibility score
   */
  async getCachedCompatibilityScore(user1Id, user2Id, options = {}) {
    try {
      this.metrics.operations++;
      const key = this.generateCompatibilityKey(
        user1Id,
        user2Id,
        options.groupId,
        options.version
      );
      let result = null;
      if (this.connected && this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          const decompressed = this.decompressData(cached);
          result = JSON.parse(decompressed);
        }
      } else {
        // Check fallback cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          result = cached.data;
        } else if (cached) {
          // Expired, remove it
          this.fallbackCache.delete(key);
        }
      }
      if (result) {
        this.metrics.hits++;
        return {
          ...result,
          fromCache: true,
          cacheHit: true
        };
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      return null;
    }
  }
  /**
   * Cache group compatibility analysis
   */
  async cacheGroupAnalysis(userIds, analysis, algorithmId = 'default', ttl = 7200) {
    try {
      this.metrics.operations++;
      const key = this.generateGroupAnalysisKey(userIds, algorithmId);
      const data = {
        ...analysis,
        cachedAt: new Date().toISOString(),
        userIds: [...userIds].sort(),
        algorithmId
      };
      if (this.connected && this.redis) {
        const serialized = JSON.stringify(data);
        const compressed = this.compressData(serialized);
        await this.redis.setex(key, ttl, compressed);
      } else {
        this.manageFallbackCacheSize();
        this.fallbackCache.set(key, {
          data,
          expiresAt: Date.now() + (ttl * 1000)
        });
      }
      return true;
    } catch (error) {
      this.metrics.errors++;
      return false;
    }
  }
  /**
   * Get cached group analysis
   */
  async getCachedGroupAnalysis(userIds, algorithmId = 'default') {
    try {
      this.metrics.operations++;
      const key = this.generateGroupAnalysisKey(userIds, algorithmId);
      let result = null;
      if (this.connected && this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          const decompressed = this.decompressData(cached);
          result = JSON.parse(decompressed);
        }
      } else {
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          result = cached.data;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
      }
      if (result) {
        this.metrics.hits++;
        return result;
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      return null;
    }
  }
  /**
   * Cache bulk calculation results
   */
  async cacheBulkResults(userIds, results, options = {}, ttl = 3600) {
    try {
      this.metrics.operations++;
      const key = this.generateBulkKey(userIds, options);
      const data = {
        results,
        cachedAt: new Date().toISOString(),
        userIds: [...userIds].sort(),
        options
      };
      if (this.connected && this.redis) {
        const serialized = JSON.stringify(data);
        const compressed = this.compressData(serialized);
        await this.redis.setex(key, ttl, compressed);
      } else {
        this.manageFallbackCacheSize();
        this.fallbackCache.set(key, {
          data,
          expiresAt: Date.now() + (ttl * 1000)
        });
      }
      return true;
    } catch (error) {
      this.metrics.errors++;
      return false;
    }
  }
  /**
   * Get cached bulk results
   */
  async getCachedBulkResults(userIds, options = {}) {
    try {
      this.metrics.operations++;
      const key = this.generateBulkKey(userIds, options);
      let result = null;
      if (this.connected && this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          const decompressed = this.decompressData(cached);
          result = JSON.parse(decompressed);
        }
      } else {
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          result = cached.data;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
      }
      if (result) {
        this.metrics.hits++;
        return result.results;
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      return null;
    }
  }
  /**
   * Invalidate cache entries
   */
  async invalidateCache(pattern = '*') {
    try {
      this.metrics.operations++;
      if (this.connected && this.redis) {
        const keys = await this.redis.keys(`trvl:compat:${pattern}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      // Clear fallback cache if pattern is wildcard
      if (pattern === '*') {
        this.fallbackCache.clear();
      } else {
        // Remove matching keys from fallback cache
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            this.fallbackCache.delete(key);
          }
        }
      }
      return true;
    } catch (error) {
      this.metrics.errors++;
      return false;
    }
  }
  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId) {
    return this.invalidateCache(`*:${userId}:*`);
  }
  /**
   * Invalidate group-specific cache
   */
  async invalidateGroupCache(groupId) {
    return this.invalidateCache(`*:group:${groupId}*`);
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hitRate = this.metrics.operations > 0
      ? (this.metrics.hits / this.metrics.operations * 100).toFixed(2)
      : '0.00';
    return {
      connected: this.connected,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      errors: this.metrics.errors,
      operations: this.metrics.operations,
      hitRate: `${hitRate}%`,
      fallbackCacheSize: this.fallbackCache.size,
      redisAvailable: this.connected && this.redis !== null
    };
  }
  /**
   * Manage fallback cache size to prevent memory issues
   */
  manageFallbackCacheSize() {
    if (this.fallbackCache.size >= this.maxFallbackSize) {
      // Remove oldest 25% of entries
      const entries = Array.from(this.fallbackCache.entries());
      const toRemove = Math.floor(entries.length * 0.25);
      entries
        .sort((a, b) => (a[1].expiresAt || 0) - (b[1].expiresAt || 0))
        .slice(0, toRemove)
        .forEach(([key]) => this.fallbackCache.delete(key));
    }
  }
  /**
   * Simple compression for cache data
   */
  compressData(data) {
    // In production, use proper compression like gzip
    // For now, just return the data
    return data;
  }
  /**
   * Simple decompression for cache data
   */
  decompressData(data) {
    // In production, use proper decompression
    // For now, just return the data
    return data;
  }
  /**
   * Health check for Redis connection
   */
  async healthCheck() {
    try {
      if (this.connected && this.redis) {
        await this.redis.ping();
        return {
          status: 'healthy',
          connected: true,
          latency: 'low'
        };
      } else {
        return {
          status: 'degraded',
          connected: false,
          fallback: 'memory'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }
  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.connected = false;
    }
  }
}
// Export singleton instance
export const redisCacheService = new RedisCacheService();
export default RedisCacheService;
/**
 * Supabase client wrapper with rate limiting
 * Provides rate-limited access to Supabase operations
 */

import { supabase } from '../lib/supabase';
import rateLimiter from './rate-limiter';

class SupabaseRateLimited {
  constructor(client) {
    this.client = client;
  }

  // Wrap Supabase query with rate limiting
  async executeWithRateLimit(operation, endpoint = 'read') {
    return rateLimiter.executeWithRetry(
      async () => {
        const result = await operation();

        // Check for Supabase errors
        if (result.error) {
          // Handle rate limit errors from Supabase
          if (result.error.code === 'rate_limit_exceeded' ||
              result.error.message?.includes('rate limit')) {
            const error = new Error(result.error.message);
            error.name = 'RateLimitError';
            error.waitTime = 60000; // Default to 1 minute
            throw error;
          }
          throw result.error;
        }

        return result;
      },
      endpoint
    );
  }

  // Categorize operation for rate limiting
  categorizeOperation(table, operation) {
    // Auth operations
    if (table === 'auth' || operation.includes('signIn') || operation.includes('signUp')) {
      return 'auth';
    }

    // Write operations
    if (['insert', 'update', 'upsert', 'delete'].includes(operation)) {
      return 'write';
    }

    // Search operations
    if (operation.includes('textSearch') || operation.includes('filter')) {
      return 'search';
    }

    // Storage operations
    if (table === 'storage') {
      return 'upload';
    }

    // Read operations
    return 'read';
  }

  // Create rate-limited table proxy
  from(table) {
    const self = this;
    const query = this.client.from(table);

    return new Proxy(query, {
      get(target, prop) {
        const original = target[prop];

        // If it's a function, wrap it with rate limiting
        if (typeof original === 'function') {
          return function(...args) {
            const result = original.apply(target, args);

            // Terminal operations that execute the query
            const terminalOps = ['single', 'maybeSingle', 'csv', 'then'];

            if (terminalOps.includes(prop)) {
              const endpoint = self.categorizeOperation(table, prop);
              return self.executeWithRateLimit(() => result, endpoint);
            }

            // Chain operations - return proxy
            return new Proxy(result, this);
          };
        }

        return original;
      }
    });
  }

  // Rate-limited auth operations
  auth = {
    signUp: async (credentials) => {
      return this.executeWithRateLimit(
        () => this.client.auth.signUp(credentials),
        'auth'
      );
    },

    signInWithPassword: async (credentials) => {
      return this.executeWithRateLimit(
        () => this.client.auth.signInWithPassword(credentials),
        'auth'
      );
    },

    signInWithOAuth: async (options) => {
      return this.executeWithRateLimit(
        () => this.client.auth.signInWithOAuth(options),
        'auth'
      );
    },

    signOut: async () => {
      return this.executeWithRateLimit(
        () => this.client.auth.signOut(),
        'auth'
      );
    },

    resetPasswordForEmail: async (email, options) => {
      return this.executeWithRateLimit(
        () => this.client.auth.resetPasswordForEmail(email, options),
        'auth'
      );
    },

    updateUser: async (attributes) => {
      return this.executeWithRateLimit(
        () => this.client.auth.updateUser(attributes),
        'write'
      );
    },

    getSession: () => this.client.auth.getSession(),
    getUser: () => this.client.auth.getUser(),
    onAuthStateChange: (...args) => this.client.auth.onAuthStateChange(...args),
  };

  // Rate-limited storage operations
  storage = {
    from: (bucket) => {
      const storage = this.client.storage.from(bucket);
      const self = this;

      return {
        upload: async (path, file, options) => {
          return self.executeWithRateLimit(
            () => storage.upload(path, file, options),
            'upload'
          );
        },

        download: async (path) => {
          return self.executeWithRateLimit(
            () => storage.download(path),
            'read'
          );
        },

        remove: async (paths) => {
          return self.executeWithRateLimit(
            () => storage.remove(paths),
            'write'
          );
        },

        list: async (path, options) => {
          return self.executeWithRateLimit(
            () => storage.list(path, options),
            'read'
          );
        },

        getPublicUrl: (path) => storage.getPublicUrl(path),
      };
    }
  };

  // Rate-limited RPC calls
  async rpc(fn, args, options) {
    const endpoint = fn.includes('search') ? 'search' : 'read';
    return this.executeWithRateLimit(
      () => this.client.rpc(fn, args, options),
      endpoint
    );
  }

  // Rate-limited realtime subscriptions
  channel(...args) {
    // Realtime doesn't need rate limiting as it's a persistent connection
    return this.client.channel(...args);
  }

  // Get rate limit info
  getRateLimitInfo(operation = 'read') {
    return rateLimiter.getRateLimitInfo(operation);
  }
}

// Create rate-limited Supabase client
const supabaseRL = new SupabaseRateLimited(supabase);

// Export both the class and the instance
export { SupabaseRateLimited };
export default supabaseRL;
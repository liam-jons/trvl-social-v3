/**
 * Compatibility API Router and Index
 * Exports all compatibility-related API endpoints
 */

// Core calculation endpoints
export {
  calculateCompatibility,
  calculateCompatibilityHandler,
  supabaseEdgeFunctionHandler
} from './calculate';

export {
  calculateBulkCompatibility,
  bulkCalculateCompatibilityHandler,
  supabaseBulkEdgeFunctionHandler
} from './bulk';

// Configuration management endpoints
export {
  getAlgorithmConfig,
  updateAlgorithmConfig,
  getAlgorithmConfigHandler,
  updateAlgorithmConfigHandler,
  supabaseGetConfigHandler,
  supabaseUpdateConfigHandler
} from './config';

// Cache management endpoints
export {
  getCachedScore,
  invalidateCompatibilityCache,
  getCacheStats,
  getCachedScoreHandler,
  invalidateCacheHandler,
  getCacheStatsHandler,
  supabaseGetCachedScoreHandler,
  supabaseInvalidateCacheHandler,
  supabaseGetCacheStatsHandler
} from './cache';

// Express.js route setup example
export const setupExpressRoutes = (app: any) => {
  const {
    calculateCompatibilityHandler,
    bulkCalculateCompatibilityHandler,
    getAlgorithmConfigHandler,
    updateAlgorithmConfigHandler,
    getCachedScoreHandler,
    invalidateCacheHandler,
    getCacheStatsHandler
  } = require('./index');

  // Core compatibility endpoints
  app.post('/api/compatibility/calculate', calculateCompatibilityHandler);
  app.post('/api/compatibility/bulk', bulkCalculateCompatibilityHandler);

  // Configuration endpoints
  app.get('/api/compatibility/config/:algorithmId?', getAlgorithmConfigHandler);
  app.put('/api/compatibility/config/:algorithmId', updateAlgorithmConfigHandler);

  // Cache management endpoints
  app.get('/api/compatibility/cache/stats', getCacheStatsHandler);
  app.get('/api/compatibility/cache/:groupId/:userId', getCachedScoreHandler);
  app.delete('/api/compatibility/cache/:groupId?', invalidateCacheHandler);
};

// API endpoint documentation
export const API_ENDPOINTS = {
  calculate: {
    method: 'POST',
    path: '/api/compatibility/calculate',
    description: 'Calculate compatibility between two users',
    requestBody: {
      user1Id: 'string (required)',
      user2Id: 'string (required)',
      groupId: 'string (optional)',
      algorithmId: 'string (optional)',
      options: {
        includeExplanation: 'boolean (default: true)',
        cacheResult: 'boolean (default: true)',
        forceRecalculation: 'boolean (default: false)'
      }
    },
    responseSchema: 'CalculateCompatibilityResponse'
  },

  bulk: {
    method: 'POST',
    path: '/api/compatibility/bulk',
    description: 'Calculate compatibility for multiple users in a group',
    requestBody: {
      groupId: 'string (required)',
      userIds: 'string[] (required, 2-50 users)',
      algorithmId: 'string (optional)',
      options: {
        includeMatrix: 'boolean (default: false)',
        includeAnalysis: 'boolean (default: false)',
        cacheResults: 'boolean (default: true)'
      }
    },
    responseSchema: 'BulkCalculateResponse'
  },

  getConfig: {
    method: 'GET',
    path: '/api/compatibility/config/:algorithmId?',
    description: 'Get algorithm configuration',
    parameters: {
      algorithmId: 'string (optional) - specific algorithm ID'
    },
    responseSchema: 'AlgorithmConfigResponse'
  },

  updateConfig: {
    method: 'PUT',
    path: '/api/compatibility/config/:algorithmId',
    description: 'Update algorithm configuration',
    parameters: {
      algorithmId: 'string (required)'
    },
    requestBody: {
      updates: 'Partial<ScoringParameters>'
    },
    responseSchema: 'AlgorithmConfigResponse'
  },

  getCachedScore: {
    method: 'GET',
    path: '/api/compatibility/cache/:groupId/:userId',
    description: 'Get cached compatibility score',
    parameters: {
      groupId: 'string (required)',
      userId: 'string (required)',
      otherUserId: 'string (optional query param)'
    }
  },

  invalidateCache: {
    method: 'DELETE',
    path: '/api/compatibility/cache/:groupId?',
    description: 'Invalidate compatibility cache',
    parameters: {
      groupId: 'string (optional)',
      userId: 'string (optional query param)'
    }
  },

  getCacheStats: {
    method: 'GET',
    path: '/api/compatibility/cache/stats',
    description: 'Get cache statistics'
  }
} as const;

// Client-side helper functions
export const createCompatibilityClient = (baseUrl: string, authToken?: string) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` })
  };

  return {
    async calculateCompatibility(request: any) {
      const response = await fetch(`${baseUrl}/api/compatibility/calculate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      return response.json();
    },

    async calculateBulkCompatibility(request: any) {
      const response = await fetch(`${baseUrl}/api/compatibility/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      return response.json();
    },

    async getAlgorithmConfig(algorithmId?: string) {
      const url = algorithmId
        ? `${baseUrl}/api/compatibility/config/${algorithmId}`
        : `${baseUrl}/api/compatibility/config`;
      const response = await fetch(url, { headers });
      return response.json();
    },

    async updateAlgorithmConfig(algorithmId: string, updates: any) {
      const response = await fetch(`${baseUrl}/api/compatibility/config/${algorithmId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ updates })
      });
      return response.json();
    },

    async getCachedScore(groupId: string, userId: string, otherUserId?: string) {
      const url = new URL(`${baseUrl}/api/compatibility/cache/${groupId}/${userId}`);
      if (otherUserId) {
        url.searchParams.append('otherUserId', otherUserId);
      }
      const response = await fetch(url.toString(), { headers });
      return response.json();
    },

    async invalidateCache(groupId?: string, userId?: string) {
      const url = new URL(`${baseUrl}/api/compatibility/cache/${groupId || ''}`);
      if (userId) {
        url.searchParams.append('userId', userId);
      }
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers
      });
      return response.json();
    },

    async getCacheStats() {
      const response = await fetch(`${baseUrl}/api/compatibility/cache/stats`, { headers });
      return response.json();
    }
  };
};
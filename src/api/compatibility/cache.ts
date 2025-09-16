/**
 * API endpoints for compatibility score cache management
 * GET/DELETE /api/compatibility/cache
 */
import { compatibilityService } from '../../services/compatibility-service';
import {
  CompatibilityScore
} from '../../types/compatibility';
/**
 * Get cached compatibility score
 * GET /api/compatibility/cache/:groupId/:userId
 */
export async function getCachedScore(
  groupId: string,
  userId: string,
  otherUserId?: string
): Promise<{
  success: boolean;
  data?: CompatibilityScore | CompatibilityScore[];
  error?: { code: string; message: string };
}> {
  try {
    if (otherUserId) {
      // Get specific pair score
      const score = await compatibilityService.getCachedScore(userId, otherUserId, groupId);
      return {
        success: true,
        data: score || undefined
      };
    } else {
      // Get all scores for user in group (would need additional implementation)
      return {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Getting all scores for user not yet implemented'
        }
      };
    }
  } catch (error) {
    console.error('Error getting cached score:', error);
    return {
      success: false,
      error: {
        code: 'CACHE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get cached score'
      }
    };
  }
}
/**
 * Invalidate compatibility cache
 * DELETE /api/compatibility/cache/:groupId?userId=...
 */
export async function invalidateCompatibilityCache(
  groupId?: string,
  userId?: string
): Promise<{
  success: boolean;
  message: string;
  error?: { code: string; message: string };
}> {
  try {
    compatibilityService.invalidateCache(userId, groupId);
    let message = 'Cache invalidated successfully';
    if (userId && groupId) {
      message = `Cache invalidated for user ${userId} in group ${groupId}`;
    } else if (userId) {
      message = `Cache invalidated for user ${userId}`;
    } else if (groupId) {
      message = `Cache invalidated for group ${groupId}`;
    } else {
      message = 'Entire compatibility cache cleared';
    }
    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return {
      success: false,
      message: 'Failed to invalidate cache',
      error: {
        code: 'CACHE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
}
/**
 * Get cache statistics
 * GET /api/compatibility/cache/stats
 */
export async function getCacheStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    valid: number;
    expired: number;
    hitRate: string | number;
  };
  error?: { code: string; message: string };
}> {
  try {
    const stats = compatibilityService.getCacheStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      success: false,
      error: {
        code: 'CACHE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get cache statistics'
      }
    };
  }
}
// Express.js handlers
export const getCachedScoreHandler = async (req: any, res: any) => {
  try {
    const { groupId, userId } = req.params;
    const { otherUserId } = req.query;
    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'groupId and userId are required'
        }
      });
    }
    const response = await getCachedScore(groupId, userId, otherUserId);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error('Express handler error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};
export const invalidateCacheHandler = async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;
    const response = await invalidateCompatibilityCache(groupId, userId);
    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error('Express handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};
export const getCacheStatsHandler = async (req: any, res: any) => {
  try {
    const response = await getCacheStats();
    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    console.error('Express handler error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};
// Supabase Edge Function handlers
export const supabaseGetCachedScoreHandler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const groupId = pathParts[pathParts.length - 2];
    const userId = pathParts[pathParts.length - 1];
    const otherUserId = url.searchParams.get('otherUserId') || undefined;
    if (!groupId || !userId) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'groupId and userId are required'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const response = await getCachedScore(groupId, userId, otherUserId);
    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Supabase Edge Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
export const supabaseInvalidateCacheHandler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const groupId = pathParts[pathParts.length - 1];
    const userId = url.searchParams.get('userId') || undefined;
    const response = await invalidateCompatibilityCache(groupId, userId);
    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Supabase Edge Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
export const supabaseGetCacheStatsHandler = async (req: Request): Promise<Response> => {
  try {
    const response = await getCacheStats();
    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Supabase Edge Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
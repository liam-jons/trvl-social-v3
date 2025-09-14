/**
 * API endpoint for bulk compatibility calculations
 * POST /api/compatibility/bulk
 */

import { compatibilityService } from '../../services/compatibility-service';
import {
  BulkCalculateRequest,
  BulkCalculateResponse
} from '../../types/compatibility';

export async function calculateBulkCompatibility(
  request: BulkCalculateRequest
): Promise<BulkCalculateResponse> {
  // Validate request
  if (!request.groupId) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'groupId is required for bulk compatibility calculation'
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    };
  }

  if (!request.userIds || !Array.isArray(request.userIds) || request.userIds.length < 2) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'At least 2 user IDs are required'
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    };
  }

  if (request.userIds.length > 50) {
    return {
      success: false,
      error: {
        code: 'REQUEST_TOO_LARGE',
        message: 'Maximum 50 users allowed per bulk calculation'
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    };
  }

  // Check for duplicate user IDs
  const uniqueUserIds = [...new Set(request.userIds)];
  if (uniqueUserIds.length !== request.userIds.length) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Duplicate user IDs are not allowed'
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    };
  }

  try {
    const response = await compatibilityService.calculateBulkCompatibility(request);
    return response;
  } catch (error) {
    console.error('API: Bulk compatibility calculation error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error occurred'
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    };
  }
}

// Express.js handler
export const bulkCalculateCompatibilityHandler = async (req: any, res: any) => {
  try {
    const request: BulkCalculateRequest = {
      groupId: req.body.groupId,
      userIds: req.body.userIds,
      algorithmId: req.body.algorithmId,
      options: {
        includeMatrix: req.body.includeMatrix ?? false,
        includeAnalysis: req.body.includeAnalysis ?? false,
        cacheResults: req.body.cacheResults ?? true
      }
    };

    const response = await calculateBulkCompatibility(request);

    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error('Express handler error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    });
  }
};

// Supabase Edge Function handler
export const supabaseBulkEdgeFunctionHandler = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();

    const request: BulkCalculateRequest = {
      groupId: body.groupId,
      userIds: body.userIds,
      algorithmId: body.algorithmId,
      options: {
        includeMatrix: body.includeMatrix ?? false,
        includeAnalysis: body.includeAnalysis ?? false,
        cacheResults: body.cacheResults ?? true
      }
    };

    const response = await calculateBulkCompatibility(request);

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      },
      meta: {
        totalPairs: 0,
        calculationTime: 0,
        cacheHitRate: 0,
        algorithmVersion: 'unknown'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
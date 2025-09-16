/**
 * API endpoint for calculating compatibility between users
 * POST /api/compatibility/calculate
 */
import { compatibilityService } from '../../services/compatibility-service';
import {
  CalculateCompatibilityRequest,
  CalculateCompatibilityResponse
} from '../../types/compatibility';
export async function calculateCompatibility(
  request: CalculateCompatibilityRequest
): Promise<CalculateCompatibilityResponse> {
  // Validate request
  if (!request.user1Id || !request.user2Id) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Both user1Id and user2Id are required'
      },
      meta: {
        calculationTime: 0,
        cacheHit: false,
        algorithmVersion: 'unknown'
      }
    };
  }
  if (request.user1Id === request.user2Id) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Cannot calculate compatibility with self'
      },
      meta: {
        calculationTime: 0,
        cacheHit: false,
        algorithmVersion: 'unknown'
      }
    };
  }
  try {
    const response = await compatibilityService.calculateCompatibility(request);
    return response;
  } catch (error) {
    console.error('API: Compatibility calculation error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error occurred'
      },
      meta: {
        calculationTime: 0,
        cacheHit: false,
        algorithmVersion: 'unknown'
      }
    };
  }
}
// Express.js handler example (if using Express)
export const calculateCompatibilityHandler = async (req: any, res: any) => {
  try {
    const request: CalculateCompatibilityRequest = {
      user1Id: req.body.user1Id,
      user2Id: req.body.user2Id,
      groupId: req.body.groupId,
      algorithmId: req.body.algorithmId,
      options: {
        includeExplanation: req.body.includeExplanation ?? true,
        cacheResult: req.body.cacheResult ?? true,
        forceRecalculation: req.body.forceRecalculation ?? false
      }
    };
    const response = await calculateCompatibility(request);
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
        calculationTime: 0,
        cacheHit: false,
        algorithmVersion: 'unknown'
      }
    });
  }
};
// Supabase Edge Function handler example
export const supabaseEdgeFunctionHandler = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const request: CalculateCompatibilityRequest = {
      user1Id: body.user1Id,
      user2Id: body.user2Id,
      groupId: body.groupId,
      algorithmId: body.algorithmId,
      options: {
        includeExplanation: body.includeExplanation ?? true,
        cacheResult: body.cacheResult ?? true,
        forceRecalculation: body.forceRecalculation ?? false
      }
    };
    const response = await calculateCompatibility(request);
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
        calculationTime: 0,
        cacheHit: false,
        algorithmVersion: 'unknown'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
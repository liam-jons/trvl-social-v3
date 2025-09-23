/**
 * API endpoint for calculating compatibility between users
 * POST /api/compatibility/calculate
 */
import { compatibilityService } from '../../services/compatibility-service';
import {
  CalculateCompatibilityRequest,
  CalculateCompatibilityResponse
} from '../../types/compatibility';
import { createCorsResponse } from '../../utils/cors-config';
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
    return createCorsResponse(response, req, {
      status: response.success ? 200 : 400
    });
  } catch (error) {
    return createCorsResponse({
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
    }, req, { status: 500 });
  }
};
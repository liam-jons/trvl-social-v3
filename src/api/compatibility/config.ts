/**
 * API endpoints for managing compatibility algorithm configuration
 * GET/PUT /api/compatibility/config
 */
import { compatibilityService } from '../../services/compatibility-service';
import {
  AlgorithmConfigResponse,
  UpdateAlgorithmConfigRequest,
  ScoringParameters
} from '../../types/compatibility';
import { createCorsResponse } from '../../utils/cors-config';
/**
 * Get current algorithm configuration
 * GET /api/compatibility/config
 */
export async function getAlgorithmConfig(
  algorithmId?: string
): Promise<AlgorithmConfigResponse> {
  try {
    const parameters = await compatibilityService.getAlgorithmParameters(algorithmId);
    // Convert parameters back to CompatibilityAlgorithm format
    const algorithm = {
      id: parameters.algorithmId,
      name: parameters.formula.name,
      description: parameters.formula.description,
      weight_personality: parameters.formula.weights.personality_traits,
      weight_interests: parameters.formula.weights.travel_preferences,
      weight_style: parameters.formula.weights.activity_preferences,
      is_active: parameters.formula.isActive,
      created_at: parameters.formula.createdAt,
      updated_at: parameters.formula.updatedAt,
      parameters,
      cacheStrategy: {
        enabled: true,
        ttl: 86400,
        maxSize: 10000,
        invalidationRules: {
          onProfileUpdate: true,
          onGroupChange: true,
          onAlgorithmUpdate: true
        },
        warmupStrategy: 'lazy' as const,
        compressionEnabled: true
      }
    };
    return {
      success: true,
      data: algorithm
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get algorithm configuration'
      }
    };
  }
}
/**
 * Update algorithm configuration
 * PUT /api/compatibility/config
 */
export async function updateAlgorithmConfig(
  request: UpdateAlgorithmConfigRequest
): Promise<AlgorithmConfigResponse> {
  // Validate request
  if (!request.algorithmId) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'algorithmId is required'
      }
    };
  }
  if (!request.updates || Object.keys(request.updates).length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'No updates provided'
      }
    };
  }
  // Validate weight values if provided
  if (request.updates.personalityWeights) {
    const weights = Object.values(request.updates.personalityWeights);
    if (weights.some(w => w < 0 || w > 1)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WEIGHTS',
          message: 'All weights must be between 0 and 1'
        }
      };
    }
  }
  if (request.updates.travelPreferenceWeights) {
    const weights = Object.values(request.updates.travelPreferenceWeights);
    if (weights.some(w => w < 0 || w > 1)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WEIGHTS',
          message: 'All weights must be between 0 and 1'
        }
      };
    }
  }
  try {
    const response = await compatibilityService.updateAlgorithmConfig(
      request.algorithmId,
      request.updates
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update algorithm configuration'
      }
    };
  }
}
// Express.js handlers
export const getAlgorithmConfigHandler = async (req: any, res: any) => {
  try {
    const algorithmId = req.params.algorithmId || req.query.algorithmId;
    const response = await getAlgorithmConfig(algorithmId);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};
export const updateAlgorithmConfigHandler = async (req: any, res: any) => {
  try {
    const request: UpdateAlgorithmConfigRequest = {
      algorithmId: req.params.algorithmId || req.body.algorithmId,
      updates: req.body.updates || req.body
    };
    const response = await updateAlgorithmConfig(request);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
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
export const supabaseGetConfigHandler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const algorithmId = url.searchParams.get('algorithmId') || undefined;
    const response = await getAlgorithmConfig(algorithmId);
    return createCorsResponse(response, req, {
      status: response.success ? 200 : 400
    });
  } catch (error) {
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
export const supabaseUpdateConfigHandler = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const algorithmId = url.searchParams.get('algorithmId') || body.algorithmId;
    const request: UpdateAlgorithmConfigRequest = {
      algorithmId,
      updates: body.updates || body
    };
    const response = await updateAlgorithmConfig(request);
    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
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
/**
 * Personality Assessment Service
 * Handles database operations for personality assessment data persistence
 */

import { supabase } from '../lib/supabase.js';
import {
  validateAssessmentInput,
  validateAssessmentQuery,
  validateAssessmentUpdate,
  PersonalityAssessmentDBSchema,
  AssessmentGetResponseSchema
} from '../schemas/personality-assessment.js';
import {
  createAssessmentData,
  reconstructCalculatorProfile
} from '../utils/personality-mapping.js';

// Configuration
const SERVICE_CONFIG = {
  timeout: 15000, // 15 seconds for database operations
  maxRetries: 3,
  retryDelay: 1000, // 1 second, with exponential backoff
  batchSize: 100, // Maximum records per batch operation
  realTimeChannelPrefix: 'personality_assessment_',
};

// Error classes
class AssessmentServiceError extends Error {
  constructor(message, code = 'ASSESSMENT_ERROR', details = null) {
    super(message);
    this.name = 'AssessmentServiceError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends AssessmentServiceError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends AssessmentServiceError {
  constructor(message, details = null) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createTimeout(ms, operationName) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AssessmentServiceError(
        `Operation '${operationName}' timed out after ${ms}ms`,
        'TIMEOUT_ERROR'
      ));
    }, ms);
  });
}

async function withTimeout(promise, ms, operationName) {
  return Promise.race([
    promise,
    createTimeout(ms, operationName)
  ]);
}

async function withRetry(operation, context = 'operation', maxRetries = SERVICE_CONFIG.maxRetries) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry validation errors or certain database constraints
      if (error instanceof ValidationError ||
          error.code === '23505' || // unique_violation
          error.code === '23503' || // foreign_key_violation
          error.code === '23514') { // check_violation
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = SERVICE_CONFIG.retryDelay * Math.pow(2, attempt);
        console.warn(`${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
        await sleep(delay);
      }
    }
  }

  throw new DatabaseError(`${context} failed after ${maxRetries + 1} attempts`, {
    originalError: lastError
  });
}

// Core database operations
export class AssessmentService {
  constructor() {
    this.activeSubscriptions = new Map();
  }

  /**
   * Save a complete personality assessment to the database
   * @param {Object} assessmentInput - Assessment data from calculator
   * @returns {Promise<Object>} Saved assessment data with ID
   */
  async saveAssessment(assessmentInput) {
    // Validate input data
    const validation = validateAssessmentInput(assessmentInput);
    if (!validation.isValid) {
      throw new ValidationError('Invalid assessment input data', validation.errors);
    }

    const { data: validatedInput } = validation;

    try {
      // Create assessment data for database
      const { assessmentData, assessmentResponses, metadata } = createAssessmentData(validatedInput);

      // Validate database format
      const dbValidation = PersonalityAssessmentDBSchema.safeParse(assessmentData);
      if (!dbValidation.success) {
        throw new ValidationError('Invalid database format', dbValidation.error.errors);
      }

      // Begin transaction
      const result = await withTimeout(
        withRetry(async () => {
          // Use upsert to handle unique constraint on user_id
          const { data: assessment, error: assessmentError } = await supabase
            .from('personality_assessments')
            .upsert(assessmentData, {
              onConflict: 'user_id',
              ignoreDuplicates: false,
            })
            .select()
            .single();

          if (assessmentError) {
            throw new DatabaseError('Failed to save assessment', assessmentError);
          }

          // Save individual responses
          if (assessmentResponses.length > 0) {
            // Delete existing responses for this user first
            await supabase
              .from('assessment_responses')
              .delete()
              .eq('user_id', validatedInput.userId);

            // Insert new responses
            const { error: responsesError } = await supabase
              .from('assessment_responses')
              .insert(assessmentResponses);

            if (responsesError) {
              console.warn('Failed to save assessment responses:', responsesError);
              // Don't fail the entire operation for response storage issues
            }
          }

          return assessment;
        }, 'saveAssessment'),
        SERVICE_CONFIG.timeout,
        'saveAssessment'
      );

      console.log('Assessment saved successfully:', result.id);
      return {
        ...result,
        metadata,
        calculatorProfile: reconstructCalculatorProfile(result),
      };

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving assessment', error);
    }
  }

  /**
   * Get assessment by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Assessment data or null if not found
   */
  async getAssessmentByUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    try {
      const result = await withTimeout(
        withRetry(async () => {
          const { data: assessment, error } = await supabase
            .from('personality_assessments')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') { // No rows found
              return null;
            }
            throw new DatabaseError('Failed to fetch assessment', error);
          }

          return assessment;
        }, 'getAssessmentByUserId'),
        SERVICE_CONFIG.timeout,
        'getAssessmentByUserId'
      );

      if (!result) {
        return null;
      }

      // Add calculator profile for convenience
      return {
        ...result,
        calculatorProfile: reconstructCalculatorProfile(result),
      };

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching assessment', error);
    }
  }

  /**
   * Get assessment by assessment ID
   * @param {string} assessmentId - Assessment UUID
   * @returns {Promise<Object|null>} Assessment data or null if not found
   */
  async getAssessmentById(assessmentId) {
    if (!assessmentId || typeof assessmentId !== 'string') {
      throw new ValidationError('Valid assessment ID is required');
    }

    try {
      const result = await withTimeout(
        withRetry(async () => {
          const { data: assessment, error } = await supabase
            .from('personality_assessments')
            .select('*')
            .eq('id', assessmentId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') { // No rows found
              return null;
            }
            throw new DatabaseError('Failed to fetch assessment', error);
          }

          return assessment;
        }, 'getAssessmentById'),
        SERVICE_CONFIG.timeout,
        'getAssessmentById'
      );

      if (!result) {
        return null;
      }

      return {
        ...result,
        calculatorProfile: reconstructCalculatorProfile(result),
      };

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching assessment', error);
    }
  }

  /**
   * Get assessment responses for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of assessment responses
   */
  async getAssessmentResponses(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    try {
      const result = await withTimeout(
        withRetry(async () => {
          const { data: responses, error } = await supabase
            .from('assessment_responses')
            .select('*')
            .eq('user_id', userId)
            .order('question_id');

          if (error) {
            throw new DatabaseError('Failed to fetch assessment responses', error);
          }

          return responses || [];
        }, 'getAssessmentResponses'),
        SERVICE_CONFIG.timeout,
        'getAssessmentResponses'
      );

      return result;

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching responses', error);
    }
  }

  /**
   * Update an existing assessment
   * @param {string} userId - User UUID
   * @param {Object} updates - Assessment updates
   * @returns {Promise<Object>} Updated assessment data
   */
  async updateAssessment(userId, updates) {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    const validation = validateAssessmentUpdate(updates);
    if (!validation.isValid) {
      throw new ValidationError('Invalid update data', validation.errors);
    }

    try {
      const result = await withTimeout(
        withRetry(async () => {
          const updateData = {
            ...validation.data,
            updated_at: new Date(),
          };

          const { data: assessment, error } = await supabase
            .from('personality_assessments')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) {
            if (error.code === 'PGRST116') { // No rows found
              throw new ValidationError('Assessment not found for user');
            }
            throw new DatabaseError('Failed to update assessment', error);
          }

          return assessment;
        }, 'updateAssessment'),
        SERVICE_CONFIG.timeout,
        'updateAssessment'
      );

      console.log('Assessment updated successfully:', result.id);
      return {
        ...result,
        calculatorProfile: reconstructCalculatorProfile(result),
      };

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating assessment', error);
    }
  }

  /**
   * Delete an assessment
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteAssessment(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    try {
      const result = await withTimeout(
        withRetry(async () => {
          // Delete responses first due to foreign key
          await supabase
            .from('assessment_responses')
            .delete()
            .eq('user_id', userId);

          // Delete assessment
          const { error } = await supabase
            .from('personality_assessments')
            .delete()
            .eq('user_id', userId);

          if (error) {
            throw new DatabaseError('Failed to delete assessment', error);
          }

          return true;
        }, 'deleteAssessment'),
        SERVICE_CONFIG.timeout,
        'deleteAssessment'
      );

      console.log('Assessment deleted successfully for user:', userId);
      return result;

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error deleting assessment', error);
    }
  }

  /**
   * Query assessments with filters
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} Paginated assessment results
   */
  async queryAssessments(queryParams = {}) {
    const validation = validateAssessmentQuery(queryParams);
    if (!validation.isValid) {
      throw new ValidationError('Invalid query parameters', validation.errors);
    }

    const { data: params } = validation;

    try {
      const result = await withTimeout(
        withRetry(async () => {
          let query = supabase
            .from('personality_assessments')
            .select('*', { count: 'exact' });

          // Apply filters
          if (params.userId) {
            query = query.eq('user_id', params.userId);
          }

          if (params.startDate) {
            query = query.gte('completed_at', params.startDate.toISOString());
          }

          if (params.endDate) {
            query = query.lte('completed_at', params.endDate.toISOString());
          }

          // Apply pagination
          query = query
            .range(params.offset, params.offset + params.limit - 1)
            .order('completed_at', { ascending: false });

          const { data: assessments, error, count } = await query;

          if (error) {
            throw new DatabaseError('Failed to query assessments', error);
          }

          const hasMore = count > (params.offset + params.limit);
          const nextOffset = hasMore ? params.offset + params.limit : null;

          return {
            data: (assessments || []).map(assessment => ({
              ...assessment,
              calculatorProfile: reconstructCalculatorProfile(assessment),
            })),
            count: count || 0,
            hasMore,
            nextOffset,
          };
        }, 'queryAssessments'),
        SERVICE_CONFIG.timeout,
        'queryAssessments'
      );

      return result;

    } catch (error) {
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error querying assessments', error);
    }
  }

  /**
   * Subscribe to real-time assessment changes
   * @param {Object} options - Subscription options
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToAssessmentChanges(options = {}, callback) {
    if (typeof callback !== 'function') {
      throw new ValidationError('Callback function is required for subscription');
    }

    const subscriptionId = `${SERVICE_CONFIG.realTimeChannelPrefix}${Date.now()}_${Math.random()}`;

    try {
      const channel = supabase
        .channel(subscriptionId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'personality_assessments',
            filter: options.userId ? `user_id=eq.${options.userId}` : undefined,
          },
          (payload) => {
            try {
              const enrichedPayload = {
                ...payload,
                calculatorProfile: payload.new ? reconstructCalculatorProfile(payload.new) : null,
              };
              callback(enrichedPayload);
            } catch (error) {
              console.error('Error processing real-time assessment change:', error);
              callback({ error: error.message, originalPayload: payload });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Assessment subscription active: ${subscriptionId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Assessment subscription error: ${subscriptionId}`);
            callback({ error: 'Subscription channel error', status });
          } else if (status === 'TIMED_OUT') {
            console.warn(`Assessment subscription timeout: ${subscriptionId}`);
            callback({ error: 'Subscription timed out', status });
          }
        });

      // Store subscription for cleanup
      this.activeSubscriptions.set(subscriptionId, channel);

      // Return subscription control object
      return {
        subscriptionId,
        unsubscribe: () => {
          channel.unsubscribe();
          this.activeSubscriptions.delete(subscriptionId);
          console.log(`Assessment subscription closed: ${subscriptionId}`);
        },
        status: () => channel.state,
      };

    } catch (error) {
      throw new AssessmentServiceError('Failed to create subscription', 'SUBSCRIPTION_ERROR', error);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll() {
    const subscriptionIds = Array.from(this.activeSubscriptions.keys());

    subscriptionIds.forEach(id => {
      const channel = this.activeSubscriptions.get(id);
      if (channel) {
        channel.unsubscribe();
        this.activeSubscriptions.delete(id);
      }
    });

    console.log(`Closed ${subscriptionIds.length} assessment subscriptions`);
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} Service health information
   */
  async getHealthStatus() {
    try {
      const start = Date.now();

      const { data, error } = await supabase
        .from('personality_assessments')
        .select('count(*)')
        .limit(1);

      const responseTime = Date.now() - start;

      if (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        responseTime,
        activeSubscriptions: this.activeSubscriptions.size,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create singleton instance
export const assessmentService = new AssessmentService();

// Export error classes for error handling
export {
  AssessmentServiceError,
  ValidationError,
  DatabaseError
};

// Export main service class and instance
export default assessmentService;
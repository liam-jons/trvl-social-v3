/**
 * Lazy Assessment Service Wrapper
 * Provides assessment functionality while lazy loading ML dependencies
 */

import { loadMLServices, preloadMLServices, isTensorFlowSupported } from './ml/lazy-ml-loader.js';

let assessmentServiceCache = null;
let personalityCalculatorCache = null;

/**
 * Lazy load assessment service
 */
async function loadAssessmentService() {
  if (assessmentServiceCache) {
    return assessmentServiceCache;
  }

  try {
    const [assessmentModule, calculatorModule] = await Promise.all([
      import('./assessment-service.js'),
      import('../utils/personality-calculator.js')
    ]);

    assessmentServiceCache = assessmentModule.default;
    personalityCalculatorCache = calculatorModule;

    return assessmentServiceCache;
  } catch (error) {
    console.error('Failed to load assessment service:', error);
    throw new Error('Unable to load assessment service');
  }
}

/**
 * Lazy Assessment Service Proxy
 * Provides same API as original service but with lazy loading
 */
class LazyAssessmentService {
  constructor() {
    this.isMLRequired = false;
    this.loadingPromise = null;
  }

  /**
   * Initialize assessment service (light version without ML)
   */
  async initializeLite() {
    return await loadAssessmentService();
  }

  /**
   * Initialize full assessment service with ML capabilities
   */
  async initializeFull() {
    const [assessmentService] = await Promise.all([
      loadAssessmentService(),
      loadMLServices()
    ]);
    this.isMLRequired = true;
    return assessmentService;
  }

  /**
   * Create assessment - basic version without ML processing
   */
  async createAssessment(assessmentData) {
    const service = await this.initializeLite();
    return service.createAssessment(assessmentData);
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(userId, assessmentId) {
    const service = await this.initializeLite();
    return service.getAssessment(userId, assessmentId);
  }

  /**
   * Get user assessments
   */
  async getUserAssessments(userId, filters = {}) {
    const service = await this.initializeLite();
    return service.getUserAssessments(userId, filters);
  }

  /**
   * Update assessment
   */
  async updateAssessment(userId, assessmentId, updates) {
    const service = await this.initializeLite();
    return service.updateAssessment(userId, assessmentId, updates);
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(userId, assessmentId) {
    const service = await this.initializeLite();
    return service.deleteAssessment(userId, assessmentId);
  }

  /**
   * Calculate personality profile - requires ML
   */
  async calculatePersonalityProfile(responses) {
    // This requires ML, so we load the full service
    const service = await this.initializeFull();

    if (!isTensorFlowSupported()) {
      console.warn('TensorFlow.js not supported, using fallback personality calculation');
      // Use basic personality calculator without ML
      const { calculatePersonalityProfile } = personalityCalculatorCache;
      return calculatePersonalityProfile(responses);
    }

    // Use ML-enhanced personality calculation
    const mlServices = await loadMLServices();
    const mlService = await mlServices.MLService.initialize();

    return mlService.calculatePersonalityProfile(responses);
  }

  /**
   * Process assessment with ML insights - requires ML
   */
  async processAssessmentWithML(assessmentId) {
    const service = await this.initializeFull();
    const mlServices = await loadMLServices();

    if (!isTensorFlowSupported()) {
      throw new Error('ML processing not supported in this environment');
    }

    const mlService = await mlServices.MLService.initialize();
    return mlService.processAssessment(assessmentId);
  }

  /**
   * Generate compatibility scores - requires ML
   */
  async generateCompatibilityScores(userProfile, candidateProfiles) {
    if (!isTensorFlowSupported()) {
      // Use basic compatibility scoring without ML
      const { calculateBasicCompatibility } = personalityCalculatorCache;
      return candidateProfiles.map(candidate => ({
        userId: candidate.userId,
        score: calculateBasicCompatibility(userProfile, candidate.profile),
        method: 'basic'
      }));
    }

    const mlServices = await loadMLServices();
    const mlService = await mlServices.MLService.initialize();

    return mlService.calculateCompatibilityScores(userProfile, candidateProfiles);
  }

  /**
   * Preload ML services for better UX
   */
  preloadML() {
    preloadMLServices();
  }

  /**
   * Check if ML features are available
   */
  isMLAvailable() {
    return isTensorFlowSupported();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isMLRequired: this.isMLRequired,
      isMLAvailable: this.isMLAvailable(),
      tfSupported: isTensorFlowSupported(),
      serviceLoaded: assessmentServiceCache !== null
    };
  }

  /**
   * Subscribe to real-time updates
   */
  async subscribeToUpdates(userId, callback) {
    const service = await this.initializeLite();
    return service.subscribeToUpdates(userId, callback);
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribeFromUpdates(userId) {
    const service = await this.initializeLite();
    return service.unsubscribeFromUpdates(userId);
  }

  /**
   * Get assessment statistics
   */
  async getAssessmentStats(userId, timeRange) {
    const service = await this.initializeLite();
    return service.getAssessmentStats(userId, timeRange);
  }

  /**
   * Bulk operations
   */
  async bulkCreateAssessments(assessments) {
    const service = await this.initializeLite();
    return service.bulkCreateAssessments(assessments);
  }

  async bulkUpdateAssessments(updates) {
    const service = await this.initializeLite();
    return service.bulkUpdateAssessments(updates);
  }

  async bulkDeleteAssessments(assessmentIds) {
    const service = await this.initializeLite();
    return service.bulkDeleteAssessments(assessmentIds);
  }
}

// Create singleton instance
const lazyAssessmentService = new LazyAssessmentService();

export default lazyAssessmentService;

// Named exports for convenience
export {
  LazyAssessmentService,
  loadAssessmentService,
  preloadMLServices as preloadAssessmentML
};
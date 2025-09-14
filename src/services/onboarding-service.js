/**
 * Onboarding Service
 * Manages new user onboarding flow, progress tracking, and first-time user detection
 */

import { supabase } from '../lib/supabase.js';
import { assessmentService } from './assessment-service.js';

// Onboarding steps
export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PERSONALITY_QUIZ: 'personality_quiz',
  QUIZ_RESULTS: 'quiz_results',
  WELCOME_PERSONALIZED: 'welcome_personalized',
  COMPLETE: 'complete'
};

// Analytics events
const ANALYTICS_EVENTS = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  QUIZ_SKIPPED: 'quiz_skipped',
  QUIZ_TAKEN: 'quiz_taken',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned'
};

// Local storage keys
const STORAGE_KEYS = {
  ONBOARDING_PROGRESS: 'onboarding_progress',
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  QUIZ_SKIPPED: 'quiz_skipped'
};

// Error handling
class OnboardingServiceError extends Error {
  constructor(message, code = 'ONBOARDING_ERROR', details = null) {
    super(message);
    this.name = 'OnboardingServiceError';
    this.code = code;
    this.details = details;
  }
}

class OnboardingService {
  constructor() {
    this.currentUser = null;
    this.onboardingProgress = null;
  }

  /**
   * Check if user is a first-time user who needs onboarding
   * @param {Object} user - Current authenticated user
   * @returns {Promise<boolean>} True if user needs onboarding
   */
  async isFirstTimeUser(user) {
    if (!user) return false;

    try {
      // Check localStorage first (fast check)
      const hasCompleted = localStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
      if (hasCompleted === 'true') {
        return false;
      }

      // Check user profile in database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, created_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Error checking onboarding status:', error);
        return true; // Default to showing onboarding if we can't check
      }

      const isFirstTime = !profile?.onboarding_completed;

      // Update localStorage if already completed
      if (!isFirstTime) {
        localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');
      }

      return isFirstTime;

    } catch (error) {
      console.error('Error checking first-time user status:', error);
      return true; // Default to showing onboarding
    }
  }

  /**
   * Initialize onboarding for a user
   * @param {Object} user - Current authenticated user
   * @returns {Promise<Object>} Onboarding progress object
   */
  async initializeOnboarding(user) {
    if (!user) {
      throw new OnboardingServiceError('User is required to initialize onboarding');
    }

    this.currentUser = user;

    // Check for existing progress
    const savedProgress = this.loadProgress();

    const initialProgress = savedProgress || {
      userId: user.id,
      currentStep: ONBOARDING_STEPS.WELCOME,
      startedAt: new Date().toISOString(),
      completedSteps: [],
      data: {},
      isComplete: false
    };

    this.onboardingProgress = initialProgress;
    this.saveProgress();

    // Track analytics
    this.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED, {
      userId: user.id,
      isReturning: !!savedProgress
    });

    return this.onboardingProgress;
  }

  /**
   * Get current onboarding progress
   * @returns {Object|null} Current progress or null if not initialized
   */
  getCurrentProgress() {
    return this.onboardingProgress || this.loadProgress();
  }

  /**
   * Advance to the next onboarding step
   * @param {string} currentStep - Current step being completed
   * @param {Object} stepData - Data collected from the current step
   * @returns {Promise<Object>} Updated progress
   */
  async completeStep(currentStep, stepData = {}) {
    if (!this.onboardingProgress) {
      throw new OnboardingServiceError('Onboarding not initialized');
    }

    // Validate step
    if (!Object.values(ONBOARDING_STEPS).includes(currentStep)) {
      throw new OnboardingServiceError(`Invalid step: ${currentStep}`);
    }

    // Update progress
    this.onboardingProgress.completedSteps.push(currentStep);
    this.onboardingProgress.data = { ...this.onboardingProgress.data, ...stepData };
    this.onboardingProgress.lastUpdated = new Date().toISOString();

    // Determine next step
    const nextStep = this.getNextStep(currentStep, stepData);
    this.onboardingProgress.currentStep = nextStep;

    // Check if complete
    if (nextStep === ONBOARDING_STEPS.COMPLETE) {
      await this.completeOnboarding();
    } else {
      this.saveProgress();
    }

    // Track analytics
    this.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
      userId: this.currentUser?.id,
      step: currentStep,
      nextStep
    });

    return this.onboardingProgress;
  }

  /**
   * Skip the personality quiz
   * @returns {Promise<Object>} Updated progress
   */
  async skipQuiz() {
    if (!this.onboardingProgress) {
      throw new OnboardingServiceError('Onboarding not initialized');
    }

    // Mark quiz as skipped
    this.onboardingProgress.data.quizSkipped = true;
    this.onboardingProgress.data.quizSkippedAt = new Date().toISOString();

    // Store skip flag for later prompting
    localStorage.setItem(STORAGE_KEYS.QUIZ_SKIPPED, 'true');

    // Advance to completion or personalized welcome if quiz was already taken
    const hasAssessment = await this.checkForExistingAssessment();
    const nextStep = hasAssessment ? ONBOARDING_STEPS.WELCOME_PERSONALIZED : ONBOARDING_STEPS.COMPLETE;

    this.onboardingProgress.currentStep = nextStep;
    this.onboardingProgress.completedSteps.push(ONBOARDING_STEPS.PERSONALITY_QUIZ);

    if (nextStep === ONBOARDING_STEPS.COMPLETE) {
      await this.completeOnboarding();
    } else {
      this.saveProgress();
    }

    // Track analytics
    this.trackEvent(ANALYTICS_EVENTS.QUIZ_SKIPPED, {
      userId: this.currentUser?.id,
      step: ONBOARDING_STEPS.PERSONALITY_QUIZ
    });

    return this.onboardingProgress;
  }

  /**
   * Handle quiz completion during onboarding
   * @param {Object} quizResults - Results from the personality quiz
   * @returns {Promise<Object>} Updated progress
   */
  async completeQuiz(quizResults) {
    if (!this.onboardingProgress) {
      throw new OnboardingServiceError('Onboarding not initialized');
    }

    // Store quiz results
    this.onboardingProgress.data.quizResults = quizResults;
    this.onboardingProgress.data.quizCompletedAt = new Date().toISOString();

    // Remove skip flag if it exists
    localStorage.removeItem(STORAGE_KEYS.QUIZ_SKIPPED);

    // Advance to results step
    await this.completeStep(ONBOARDING_STEPS.PERSONALITY_QUIZ, {
      quizResults,
      quizCompleted: true
    });

    // Track analytics
    this.trackEvent(ANALYTICS_EVENTS.QUIZ_TAKEN, {
      userId: this.currentUser?.id,
      personalityType: quizResults?.personalityType
    });

    return this.onboardingProgress;
  }

  /**
   * Complete the entire onboarding process
   * @returns {Promise<void>}
   */
  async completeOnboarding() {
    if (!this.currentUser) {
      throw new OnboardingServiceError('No user found for onboarding completion');
    }

    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id);

      if (error) {
        throw new OnboardingServiceError('Failed to update profile', 'DATABASE_ERROR', error);
      }

      // Update localStorage
      localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');

      // Mark progress as complete
      this.onboardingProgress.isComplete = true;
      this.onboardingProgress.completedAt = new Date().toISOString();
      this.onboardingProgress.currentStep = ONBOARDING_STEPS.COMPLETE;

      // Clear progress from storage (no longer needed)
      this.clearProgress();

      // Track analytics
      this.trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        userId: this.currentUser.id,
        completedSteps: this.onboardingProgress.completedSteps,
        duration: this.calculateDuration()
      });

    } catch (error) {
      throw new OnboardingServiceError('Failed to complete onboarding', 'COMPLETION_ERROR', error);
    }
  }

  /**
   * Check if user should be prompted to take quiz later
   * @param {Object} user - Current user
   * @returns {Promise<boolean>} True if user should be prompted
   */
  async shouldPromptQuizLater(user) {
    if (!user) return false;

    try {
      // Check if quiz was skipped
      const wasSkipped = localStorage.getItem(STORAGE_KEYS.QUIZ_SKIPPED) === 'true';
      if (!wasSkipped) return false;

      // Check if user has taken quiz since skipping
      const hasAssessment = await this.checkForExistingAssessment();

      // Prompt if quiz was skipped and no assessment exists
      return wasSkipped && !hasAssessment;

    } catch (error) {
      console.error('Error checking quiz prompt status:', error);
      return false;
    }
  }

  /**
   * Mark quiz prompt as completed (user took quiz outside of onboarding)
   * @returns {void}
   */
  completeQuizPrompt() {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_SKIPPED);
  }

  /**
   * Get personalized onboarding data based on user's personality assessment
   * @returns {Promise<Object|null>} Personalized data or null
   */
  async getPersonalizedData() {
    if (!this.currentUser) return null;

    try {
      const assessment = await assessmentService.getAssessmentByUserId(this.currentUser.id);
      return assessment ? {
        personalityType: assessment.personality_type,
        personalityTraits: {
          energyLevel: assessment.energy_level,
          socialPreference: assessment.social_preference,
          adventureStyle: assessment.adventure_style,
          riskTolerance: assessment.risk_tolerance
        },
        calculatorProfile: assessment.calculatorProfile
      } : null;
    } catch (error) {
      console.error('Error getting personalized data:', error);
      return null;
    }
  }

  // Private methods

  /**
   * Determine the next step in the onboarding flow
   * @param {string} currentStep - Current step
   * @param {Object} stepData - Data from current step
   * @returns {string} Next step
   */
  getNextStep(currentStep, stepData) {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return ONBOARDING_STEPS.PERSONALITY_QUIZ;

      case ONBOARDING_STEPS.PERSONALITY_QUIZ:
        return ONBOARDING_STEPS.QUIZ_RESULTS;

      case ONBOARDING_STEPS.QUIZ_RESULTS:
        return ONBOARDING_STEPS.WELCOME_PERSONALIZED;

      case ONBOARDING_STEPS.WELCOME_PERSONALIZED:
        return ONBOARDING_STEPS.COMPLETE;

      default:
        return ONBOARDING_STEPS.COMPLETE;
    }
  }

  /**
   * Check if user has an existing personality assessment
   * @returns {Promise<boolean>}
   */
  async checkForExistingAssessment() {
    if (!this.currentUser) return false;

    try {
      const assessment = await assessmentService.getAssessmentByUserId(this.currentUser.id);
      return !!assessment;
    } catch (error) {
      console.error('Error checking for existing assessment:', error);
      return false;
    }
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    if (!this.onboardingProgress) return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.ONBOARDING_PROGRESS,
        JSON.stringify(this.onboardingProgress)
      );
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }

  /**
   * Load progress from localStorage
   * @returns {Object|null} Saved progress or null
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
      return null;
    }
  }

  /**
   * Clear progress from localStorage
   */
  clearProgress() {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
  }

  /**
   * Calculate onboarding duration
   * @returns {number} Duration in minutes
   */
  calculateDuration() {
    if (!this.onboardingProgress?.startedAt) return 0;

    const start = new Date(this.onboardingProgress.startedAt);
    const end = new Date();
    return Math.round((end - start) / (1000 * 60)); // minutes
  }

  /**
   * Track analytics event
   * @param {string} event - Event name
   * @param {Object} properties - Event properties
   */
  trackEvent(event, properties = {}) {
    try {
      // Use gtag if available (Google Analytics)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, {
          event_category: 'onboarding',
          ...properties
        });
      }

      // Could also integrate with other analytics services
      console.log('Analytics event:', event, properties);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }
}

// Create singleton instance
export const onboardingService = new OnboardingService();

// Export constants and error classes
export { OnboardingServiceError, ANALYTICS_EVENTS, STORAGE_KEYS };

// Export main service
export default onboardingService;
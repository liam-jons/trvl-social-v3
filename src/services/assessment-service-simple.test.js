/**
 * Simplified unit tests for Assessment Service focusing on core functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateAssessmentInput } from '../schemas/personality-assessment.js';
import { mapCalculatorToBigFive, createAssessmentData } from '../utils/personality-mapping.js';

// Test data
const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

const mockCalculatorTraits = {
  energyLevel: 75,
  socialPreference: 60,
  adventureStyle: 80,
  riskTolerance: 50,
};

const mockAssessmentInput = {
  userId: mockUserId,
  calculatorTraits: mockCalculatorTraits,
  personalityType: 'The Adventurer',
  traitDescriptions: {
    energyLevel: 'You thrive on high-energy activities',
    socialPreference: 'You enjoy both social and personal time',
    adventureStyle: 'You seek unique experiences',
    riskTolerance: 'You enjoy moderate thrills',
  },
  answers: [
    {
      questionId: 1,
      optionId: 'option-a',
      traitScores: { energyLevel: 10, adventureStyle: 5 },
    },
  ],
};

describe('Assessment Service Core Functionality', () => {
  describe('Input validation', () => {
    it('should validate correct assessment input', () => {
      const result = validateAssessmentInput(mockAssessmentInput);
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid user ID', () => {
      const invalidInput = { ...mockAssessmentInput, userId: 'invalid-uuid' };
      const result = validateAssessmentInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject missing required fields', () => {
      const invalidInput = { ...mockAssessmentInput };
      delete invalidInput.calculatorTraits;

      const result = validateAssessmentInput(invalidInput);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid trait scores', () => {
      const invalidInput = {
        ...mockAssessmentInput,
        calculatorTraits: {
          ...mockCalculatorTraits,
          energyLevel: 150, // Invalid: > 100
        },
      };

      const result = validateAssessmentInput(invalidInput);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Personality mapping', () => {
    it('should map calculator traits to Big Five', () => {
      const bigFive = mapCalculatorToBigFive(mockCalculatorTraits);

      expect(bigFive).toBeDefined();
      expect(typeof bigFive.openness).toBe('number');
      expect(typeof bigFive.conscientiousness).toBe('number');
      expect(typeof bigFive.extraversion).toBe('number');
      expect(typeof bigFive.agreeableness).toBe('number');
      expect(typeof bigFive.neuroticism).toBe('number');

      // Validate all values are between 0 and 1
      Object.values(bigFive).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should create complete assessment data', () => {
      const result = createAssessmentData(mockAssessmentInput);

      expect(result.assessmentData).toBeDefined();
      expect(result.assessmentResponses).toBeDefined();
      expect(result.metadata).toBeDefined();

      expect(result.assessmentData.user_id).toBe(mockUserId);
      expect(result.assessmentData.openness).toBeDefined();
      expect(result.assessmentData.adventure_style).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid calculator traits gracefully', () => {
      const invalidTraits = {
        energyLevel: -10,
        socialPreference: 200,
        adventureStyle: 'invalid',
        riskTolerance: null,
      };

      expect(() => mapCalculatorToBigFive(invalidTraits)).toThrow();
    });
  });
});
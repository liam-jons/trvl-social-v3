import { describe, it, expect } from 'vitest';
import {
  calculatePersonalityProfile,
  validateAnswers,
  calculateCompletionPercentage
} from './personality-calculator';

describe('personality-calculator', () => {
  describe('calculatePersonalityProfile', () => {
    it('should calculate profile from valid answers', () => {
      const answers = [
        {
          questionId: 1,
          optionId: '1a',
          traitScores: { energyLevel: 90, adventureStyle: 80, riskTolerance: 60 }
        },
        {
          questionId: 2,
          optionId: '2b',
          traitScores: { socialPreference: 10, adventureStyle: 80, riskTolerance: 70 }
        },
        {
          questionId: 3,
          optionId: '3c',
          traitScores: { adventureStyle: 70, socialPreference: 80, riskTolerance: 50 }
        }
      ];

      const profile = calculatePersonalityProfile(answers);

      expect(profile).toHaveProperty('energyLevel');
      expect(profile).toHaveProperty('socialPreference');
      expect(profile).toHaveProperty('adventureStyle');
      expect(profile).toHaveProperty('riskTolerance');
      expect(profile).toHaveProperty('personalityType');
      expect(profile).toHaveProperty('traitDescriptions');
      expect(profile).toHaveProperty('calculatedAt');

      expect(profile.energyLevel).toBeGreaterThanOrEqual(0);
      expect(profile.energyLevel).toBeLessThanOrEqual(100);
      expect(profile.socialPreference).toBeGreaterThanOrEqual(0);
      expect(profile.socialPreference).toBeLessThanOrEqual(100);
      expect(profile.adventureStyle).toBeGreaterThanOrEqual(0);
      expect(profile.adventureStyle).toBeLessThanOrEqual(100);
      expect(profile.riskTolerance).toBeGreaterThanOrEqual(0);
      expect(profile.riskTolerance).toBeLessThanOrEqual(100);
    });

    it('should handle answers with missing trait scores gracefully', () => {
      const answers = [
        {
          questionId: 1,
          optionId: '1a',
          traitScores: { energyLevel: 90 }
        },
        {
          questionId: 2,
          optionId: '2b',
          traitScores: { socialPreference: 50 }
        }
      ];

      const profile = calculatePersonalityProfile(answers);

      expect(profile.energyLevel).toBeGreaterThan(0);
      expect(profile.socialPreference).toBeGreaterThan(0);
      // Traits not in answers should default to middle values due to weighting
      expect(profile.adventureStyle).toBeCloseTo(50, 0);
      expect(profile.riskTolerance).toBeCloseTo(50, 0);
    });

    it('should classify personality types correctly', () => {
      // Test "The Thrill Seeker" profile
      const thrillSeekerAnswers = [
        {
          questionId: 1,
          optionId: '1a',
          traitScores: { energyLevel: 95, socialPreference: 80, adventureStyle: 90, riskTolerance: 85 }
        },
        {
          questionId: 2,
          optionId: '2a',
          traitScores: { energyLevel: 85, socialPreference: 90, adventureStyle: 80, riskTolerance: 75 }
        },
        {
          questionId: 3,
          optionId: '3b',
          traitScores: { energyLevel: 90, socialPreference: 75, adventureStyle: 95, riskTolerance: 90 }
        }
      ];

      const profile = calculatePersonalityProfile(thrillSeekerAnswers);
      expect(profile.personalityType).toBe('The Thrill Seeker');
    });

    it('should generate appropriate trait descriptions', () => {
      const answers = [
        {
          questionId: 1,
          optionId: '1a',
          traitScores: { energyLevel: 90, adventureStyle: 80, riskTolerance: 85 }
        }
      ];

      const profile = calculatePersonalityProfile(answers);

      expect(profile.traitDescriptions).toHaveProperty('energyLevel');
      expect(profile.traitDescriptions).toHaveProperty('socialPreference');
      expect(profile.traitDescriptions).toHaveProperty('adventureStyle');
      expect(profile.traitDescriptions).toHaveProperty('riskTolerance');

      expect(profile.traitDescriptions.energyLevel).toContain('high-energy');
    });

    it('should throw error for empty answers', () => {
      expect(() => calculatePersonalityProfile([])).toThrow('No answers provided');
      expect(() => calculatePersonalityProfile(null)).toThrow('No answers provided');
      expect(() => calculatePersonalityProfile(undefined)).toThrow('No answers provided');
    });
  });

  describe('validateAnswers', () => {
    it('should validate correct answer format', () => {
      const validAnswers = [
        {
          questionId: 1,
          optionId: '1a',
          traitScores: { energyLevel: 90 }
        }
      ];

      expect(validateAnswers(validAnswers)).toBe(true);
    });

    it('should reject invalid answer formats', () => {
      expect(validateAnswers(null)).toBe(false);
      expect(validateAnswers('not an array')).toBe(false);
      expect(validateAnswers([{ questionId: 'not a number' }])).toBe(false);
      expect(validateAnswers([{ questionId: 1, optionId: 123 }])).toBe(false);
      expect(validateAnswers([{ questionId: 1, optionId: '1a' }])).toBe(false); // missing traitScores
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate correct completion percentage', () => {
      const answers = [
        { questionId: 1, optionId: '1a', traitScores: { energyLevel: 90 } },
        { questionId: 2, optionId: '2a', traitScores: { socialPreference: 70 } },
        { questionId: 3, optionId: '3a', traitScores: { adventureStyle: 80 } }
      ];

      expect(calculateCompletionPercentage(answers, 10)).toBe(30);
      expect(calculateCompletionPercentage(answers, 3)).toBe(100);
    });

    it('should handle edge cases', () => {
      expect(calculateCompletionPercentage([], 10)).toBe(0);
      expect(calculateCompletionPercentage(null, 10)).toBe(0);
      expect(calculateCompletionPercentage([{}, {}, {}], 0)).toBe(0);
    });
  });
});
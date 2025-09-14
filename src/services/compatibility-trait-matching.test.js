/**
 * Test suite for personality trait matching logic and compatibility matrices
 * Tests the enhanced TraitCompatibilityMatrix and PersonalityDimensionHandler
 */

import { TraitCompatibilityMatrix, PersonalityDimensionHandler } from './compatibility-scoring-engine.ts';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TraitCompatibilityMatrix', () => {
  describe('Social compatibility matrix', () => {
    it('should return perfect match for identical social preferences', () => {
      const score = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 75, 75);
      expect(score).toBe(1.0);
    });

    it('should return high compatibility for similar social preferences', () => {
      const score = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 70, 75);
      expect(score).toBe(0.85);
    });

    it('should return low compatibility for extreme differences', () => {
      const score = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 10, 90);
      expect(score).toBe(0.2);
    });

    it('should handle introvert/extrovert edge cases', () => {
      const introvertScore = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 15, 20);
      const extrovertScore = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 85, 90);

      expect(introvertScore).toBe(1.0); // Both introverts - perfect match
      expect(extrovertScore).toBe(1.0); // Both extroverts - perfect match
    });
  });

  describe('Adventure compatibility matrix', () => {
    it('should reward slight differences over identical matches', () => {
      const identicalScore = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 50, 50);
      const slightlyDifferentScore = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 45, 55);

      expect(slightlyDifferentScore).toBeGreaterThan(identicalScore);
      expect(slightlyDifferentScore).toBe(0.9);
    });

    it('should penalize extreme adventure differences', () => {
      const extremeScore = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 10, 90);
      expect(extremeScore).toBe(0.25);
    });

    it('should provide moderate scores for balanced differences', () => {
      const moderateScore = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 30, 60);
      expect(moderateScore).toBe(0.75);
    });
  });

  describe('Planning compatibility matrix', () => {
    it('should reward complementary planning differences', () => {
      const complementaryScore = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 40, 55);
      const identicalScore = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 50, 50);

      expect(complementaryScore).toBeGreaterThan(identicalScore);
      expect(complementaryScore).toBe(0.9);
    });

    it('should penalize extreme planning conflicts', () => {
      const conflictScore = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 5, 95);
      expect(conflictScore).toBe(0.2);
    });
  });

  describe('Risk compatibility with adventure type weighting', () => {
    it('should apply higher weighting for extreme sports', () => {
      const baseScore = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85);
      const extremeSportsScore = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'extreme-sports');

      expect(extremeSportsScore).toBeGreaterThan(baseScore);
    });

    it('should apply lower weighting for wellness retreats', () => {
      const baseScore = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85);
      const wellnessScore = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'wellness-retreat');

      expect(wellnessScore).toBeLessThan(baseScore);
    });

    it('should maintain base score for unknown adventure types', () => {
      const baseScore = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 70, 75);
      const unknownScore = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 70, 75, 'unknown-type');

      expect(unknownScore).toBe(baseScore);
    });
  });
});

describe('PersonalityDimensionHandler', () => {
  let handler: PersonalityDimensionHandler;
  let mockParameters: ScoringParameters;

  beforeEach(() => {
    handler = new PersonalityDimensionHandler();
    mockParameters = {
      algorithmId: 'test',
      formula: {
        id: 'test-formula',
        name: 'Test Formula',
        weights: {
          personality_traits: 0.35,
          travel_preferences: 0.25,
          experience_level: 0.15,
          budget_range: 0.15,
          activity_preferences: 0.10
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      thresholds: { excellent: 80, good: 60, fair: 40, poor: 0 },
      personalityWeights: {
        energyLevel: 0.2,
        socialPreference: 0.2,
        adventureStyle: 0.2,
        riskTolerance: 0.2,
        planningStyle: 0.2
      },
      travelPreferenceWeights: {
        adventureStyle: 0.3,
        budgetPreference: 0.25,
        planningStyle: 0.25,
        groupPreference: 0.2
      },
      adjustments: {
        experienceLevelTolerance: 0.2,
        budgetFlexibilityFactor: 0.15,
        activityOverlapBonus: 0.1
      }
    };
  });

  const createMockProfile = (personalityOverrides: Partial<PersonalityProfile> = {}): UserCompatibilityProfile => {
    const defaultPersonality: PersonalityProfile = {
      energyLevel: 70,
      socialPreference: 65,
      adventureStyle: 75,
      riskTolerance: 60,
      calculatedAt: new Date()
    };

    return {
      userId: 'test-user',
      personalityProfile: { ...defaultPersonality, ...personalityOverrides },
      travelPreferences: {
        adventureStyle: 'explorer',
        budgetPreference: 'moderate',
        planningStyle: 'flexible',
        groupPreference: 'small_group'
      },
      experienceLevel: { overall: 3, categories: {} },
      budgetRange: { min: 1000, max: 5000, currency: 'USD', flexibility: 0.2 },
      activityPreferences: { preferred: [], disliked: [], mustHave: [], dealBreakers: [] },
      lastUpdated: new Date()
    };
  };

  describe('Adventure type detection', () => {
    it('should detect extreme sports for high risk/adventure profiles', async () => {
      const user1 = createMockProfile({ riskTolerance: 85, adventureStyle: 90 });
      const user2 = createMockProfile({ riskTolerance: 80, adventureStyle: 85 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.adventureType).toBe('extreme-sports');
    });

    it('should detect luxury travel for luxury budget preferences', async () => {
      const user1 = createMockProfile();
      user1.travelPreferences.budgetPreference = 'luxury';
      const user2 = createMockProfile();

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.adventureType).toBe('luxury-travel');
    });

    it('should detect family-friendly for low risk/adventure profiles', async () => {
      const user1 = createMockProfile({ riskTolerance: 25, adventureStyle: 30 });
      const user2 = createMockProfile({ riskTolerance: 20, adventureStyle: 35 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.adventureType).toBe('family-friendly');
    });

    it('should default to cultural-immersion for moderate profiles', async () => {
      const user1 = createMockProfile({ riskTolerance: 50, adventureStyle: 55 });
      const user2 = createMockProfile({ riskTolerance: 45, adventureStyle: 50 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.adventureType).toBe('cultural-immersion');
    });
  });

  describe('Conflict detection', () => {
    it('should detect extreme social mismatch', async () => {
      const user1 = createMockProfile({ socialPreference: 10 }); // Extreme introvert
      const user2 = createMockProfile({ socialPreference: 90 }); // Extreme extrovert

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.hasConflicts).toBe(true);
      expect(result.metadata?.conflicts).toContain('extreme_social_mismatch');
      expect(result.score).toBe(15); // Low score due to conflicts
    });

    it('should detect planning/adventure conflicts', async () => {
      const user1 = createMockProfile({ adventureStyle: 80, riskTolerance: 15 });
      const user2 = createMockProfile({ adventureStyle: 75, riskTolerance: 95 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.hasConflicts).toBe(true);
      expect(result.metadata?.conflicts).toContain('planning_adventure_conflict');
    });

    it('should detect risk/adventure conflicts', async () => {
      const user1 = createMockProfile({ riskTolerance: 10, adventureStyle: 70 });
      const user2 = createMockProfile({ riskTolerance: 90, adventureStyle: 65 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.hasConflicts).toBe(true);
      expect(result.metadata?.conflicts).toContain('risk_adventure_conflict');
    });

    it('should not detect conflicts for compatible profiles', async () => {
      const user1 = createMockProfile({ socialPreference: 60, riskTolerance: 55, adventureStyle: 65 });
      const user2 = createMockProfile({ socialPreference: 70, riskTolerance: 65, adventureStyle: 60 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.hasConflicts).toBeFalsy();
      expect(result.metadata?.conflicts).toBe(0);
    });
  });

  describe('Adventure-adjusted weighting', () => {
    it('should increase risk tolerance weight for extreme sports', async () => {
      const user1 = createMockProfile({ riskTolerance: 85, adventureStyle: 90 });
      const user2 = createMockProfile({ riskTolerance: 80, adventureStyle: 85 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      const adjustedWeights = result.metadata?.adjustedWeights;

      expect(adjustedWeights.riskTolerance).toBeGreaterThan(mockParameters.personalityWeights.riskTolerance);
      expect(adjustedWeights.adventureStyle).toBeGreaterThan(mockParameters.personalityWeights.adventureStyle);
    });

    it('should increase planning weight for luxury travel', async () => {
      const user1 = createMockProfile();
      user1.travelPreferences.budgetPreference = 'luxury';
      const user2 = createMockProfile();

      const result = await handler.calculateScore(user1, user2, mockParameters);
      const adjustedWeights = result.metadata?.adjustedWeights;

      expect(adjustedWeights.planningStyle).toBeGreaterThan(mockParameters.personalityWeights.planningStyle);
      expect(adjustedWeights.riskTolerance).toBeLessThan(mockParameters.personalityWeights.riskTolerance);
    });

    it('should increase social weight for cultural immersion', async () => {
      const user1 = createMockProfile({ riskTolerance: 50, adventureStyle: 55 });
      const user2 = createMockProfile({ riskTolerance: 45, adventureStyle: 50 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      const adjustedWeights = result.metadata?.adjustedWeights;

      expect(adjustedWeights.socialPreference).toBeGreaterThan(mockParameters.personalityWeights.socialPreference);
      expect(adjustedWeights.planningStyle).toBeGreaterThan(mockParameters.personalityWeights.planningStyle);
    });
  });

  describe('Confidence calculation', () => {
    it('should reduce confidence for extreme personality values', async () => {
      const user1 = createMockProfile({ energyLevel: 2, socialPreference: 98 }); // Extreme values
      const user2 = createMockProfile({ energyLevel: 1, socialPreference: 99 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.confidence).toBeLessThan(1.0);
    });

    it('should reduce confidence for old profiles', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200); // 200 days ago

      const user1 = createMockProfile({ calculatedAt: oldDate });
      const user2 = createMockProfile();

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.confidence).toBeLessThan(0.9);
    });

    it('should maintain high confidence for recent, moderate profiles', async () => {
      const user1 = createMockProfile({ energyLevel: 60, socialPreference: 65 });
      const user2 = createMockProfile({ energyLevel: 70, socialPreference: 55 });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.metadata?.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('Overall compatibility scoring', () => {
    it('should calculate high scores for well-matched profiles', async () => {
      const user1 = createMockProfile({
        energyLevel: 70,
        socialPreference: 65,
        adventureStyle: 60,
        riskTolerance: 55
      });
      const user2 = createMockProfile({
        energyLevel: 75,
        socialPreference: 70,
        adventureStyle: 65,
        riskTolerance: 60
      });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.score).toBeGreaterThan(70);
      expect(result.name).toBe('Personality Compatibility');
      expect(result.weight).toBe(0.35);
    });

    it('should calculate low scores for poorly matched profiles', async () => {
      const user1 = createMockProfile({
        energyLevel: 90,
        socialPreference: 10,
        adventureStyle: 85,
        riskTolerance: 20
      });
      const user2 = createMockProfile({
        energyLevel: 20,
        socialPreference: 90,
        adventureStyle: 15,
        riskTolerance: 80
      });

      const result = await handler.calculateScore(user1, user2, mockParameters);
      expect(result.score).toBeLessThan(40);
    });

    it('should provide detailed breakdown in metadata', async () => {
      const user1 = createMockProfile();
      const user2 = createMockProfile();

      const result = await handler.calculateScore(user1, user2, mockParameters);

      expect(result.metadata?.breakdown).toBeDefined();
      expect(result.metadata?.breakdown.socialPreference).toBeDefined();
      expect(result.metadata?.breakdown.adventureStyle).toBeDefined();
      expect(result.metadata?.breakdown.planningStyle).toBeDefined();
      expect(result.metadata?.breakdown.riskTolerance).toBeDefined();
      expect(result.metadata?.breakdown.energyLevel).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should throw error for missing personality profiles', async () => {
      const user1 = createMockProfile();
      const user2 = createMockProfile();
      user2.personalityProfile = null as any;

      await expect(handler.calculateScore(user1, user2, mockParameters))
        .rejects.toThrow('Personality profiles required for personality dimension scoring');
    });
  });
});
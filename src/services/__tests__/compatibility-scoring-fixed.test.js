import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupBuilderService } from '../group-builder-service.js';

/**
 * Unit tests for compatibility scoring functions (fixed version)
 * Testing the actual functions available in group-builder-service
 */

describe('Compatibility Scoring Functions', () => {
  const mockPersonality1 = {
    energy_level: 80,
    social_preference: 70,
    adventure_style: 60,
    risk_tolerance: 75,
    planning_style: 65,
    communication_style: 80,
    experience_level: 70,
    leadership_style: 60,
    age: 28
  };

  const mockPersonality2 = {
    energy_level: 75,
    social_preference: 65,
    adventure_style: 70,
    risk_tolerance: 80,
    planning_style: 60,
    communication_style: 75,
    experience_level: 75,
    leadership_style: 65,
    age: 32
  };

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Basic Compatibility Scoring', () => {
    it('should calculate compatibility scores between similar personalities', async () => {
      const score = await groupBuilderService.calculateCompatibilityScore(mockPersonality1, mockPersonality2);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    it('should calculate lower compatibility for opposite personalities', async () => {
      const oppositePersonality1 = {
        energy_level: 90,
        social_preference: 85,
        risk_tolerance: 90,
        planning_style: 20,
        communication_style: 85
      };

      const oppositePersonality2 = {
        energy_level: 10,
        social_preference: 15,
        risk_tolerance: 10,
        planning_style: 85,
        communication_style: 20
      };

      const score = await groupBuilderService.calculateCompatibilityScore(oppositePersonality1, oppositePersonality2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(70); // Should be lower for opposite personalities
    });

    it('should handle missing personality data gracefully', async () => {
      const incompletePersonality = {};

      const score = await groupBuilderService.calculateCompatibilityScore(incompletePersonality, mockPersonality2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Advanced Compatibility Scoring', () => {
    it('should calculate advanced compatibility with multiple factors', async () => {
      const score = await groupBuilderService.calculateAdvancedCompatibilityScore(mockPersonality1, mockPersonality2);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    it('should weight different personality traits correctly', async () => {
      const highEnergyPerson = {
        ...mockPersonality1,
        energy_level: 95
      };

      const lowEnergyPerson = {
        ...mockPersonality2,
        energy_level: 5
      };

      const score = await groupBuilderService.calculateAdvancedCompatibilityScore(highEnergyPerson, lowEnergyPerson);
      expect(score).toBeLessThan(60); // Energy mismatch should significantly impact score
    });
  });

  describe('Age Compatibility', () => {
    it('should calculate age-based compatibility', async () => {
      const ageScore = await groupBuilderService.calculateAgeCompatibility(mockPersonality1, mockPersonality2);
      expect(ageScore).toBeGreaterThanOrEqual(0);
      expect(ageScore).toBeLessThanOrEqual(100);
    });

    it('should penalize large age gaps', async () => {
      const youngPersonality = { ...mockPersonality1, age: 22 };
      const olderPersonality = { ...mockPersonality2, age: 55 };

      const ageGapScore = await groupBuilderService.calculateAgeCompatibility(youngPersonality, olderPersonality);
      const similarAgeScore = await groupBuilderService.calculateAgeCompatibility(mockPersonality1, mockPersonality2);

      expect(ageGapScore).toBeLessThan(similarAgeScore);
    });
  });

  describe('Experience Level Compatibility', () => {
    it('should calculate experience compatibility', async () => {
      const experienceScore = await groupBuilderService.calculateExperienceCompatibility(mockPersonality1, mockPersonality2);
      expect(experienceScore).toBeGreaterThanOrEqual(0);
      expect(experienceScore).toBeLessThanOrEqual(100);
    });

    it('should favor similar experience levels', async () => {
      const beginnerPersonality = { ...mockPersonality1, experience_level: 20 };
      const expertPersonality = { ...mockPersonality2, experience_level: 90 };

      const experienceGap = await groupBuilderService.calculateExperienceCompatibility(beginnerPersonality, expertPersonality);
      const similarExperience = await groupBuilderService.calculateExperienceCompatibility(mockPersonality1, mockPersonality2);

      expect(experienceGap).toBeLessThan(similarExperience);
    });
  });

  describe('Leadership Compatibility', () => {
    it('should calculate leadership compatibility', async () => {
      const leadershipScore = await groupBuilderService.calculateLeadershipCompatibility(mockPersonality1, mockPersonality2);
      expect(leadershipScore).toBeGreaterThanOrEqual(0);
      expect(leadershipScore).toBeLessThanOrEqual(100);
    });

    it('should detect potential leadership conflicts', async () => {
      const strongLeader1 = { ...mockPersonality1, leadership_style: 90 };
      const strongLeader2 = { ...mockPersonality2, leadership_style: 85 };
      const follower = { ...mockPersonality2, leadership_style: 20 };

      const leaderConflictScore = await groupBuilderService.calculateLeadershipCompatibility(strongLeader1, strongLeader2);
      const leaderFollowerScore = await groupBuilderService.calculateLeadershipCompatibility(strongLeader1, follower);

      expect(leaderFollowerScore).toBeGreaterThan(leaderConflictScore);
    });
  });

  describe('Group Compatibility Analysis', () => {
    it('should analyze group compatibility for multiple participants', async () => {
      const participants = [
        { id: 1, personality: mockPersonality1 },
        { id: 2, personality: mockPersonality2 },
        { id: 3, personality: { ...mockPersonality1, energy_level: 85 } },
        { id: 4, personality: { ...mockPersonality2, social_preference: 90 } }
      ];

      const groupCompatibility = await groupBuilderService.calculateGroupCompatibility(participants);

      expect(groupCompatibility).toBeDefined();
      expect(groupCompatibility.averageScore).toBeGreaterThanOrEqual(0);
      expect(groupCompatibility.averageScore).toBeLessThanOrEqual(100);
      expect(groupCompatibility.pairScores).toBeInstanceOf(Array);
    });

    it('should identify compatible and incompatible pairs', async () => {
      const participants = [
        { id: 1, personality: { ...mockPersonality1, energy_level: 80, social_preference: 75 } },
        { id: 2, personality: { ...mockPersonality2, energy_level: 75, social_preference: 80 } },
        { id: 3, personality: { energy_level: 10, social_preference: 15, risk_tolerance: 20 } } // Very different
      ];

      const groupCompatibility = await groupBuilderService.calculateGroupCompatibility(participants);

      expect(groupCompatibility.pairScores).toHaveLength(3); // 3 pairs for 3 participants

      // Should have varying compatibility scores
      const scores = groupCompatibility.pairScores.map(pair => pair.score);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      expect(maxScore - minScore).toBeGreaterThan(10); // Should have some variation
    });
  });

  describe('Performance Requirements', () => {
    it('should calculate compatibility scores within performance limits', async () => {
      const startTime = performance.now();

      // Calculate 100 compatibility scores
      for (let i = 0; i < 100; i++) {
        await groupBuilderService.calculateCompatibilityScore(mockPersonality1, mockPersonality2);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;

      // Should average less than 5ms per calculation
      expect(averageTime).toBeLessThan(5);
    });

    it('should handle concurrent compatibility calculations', async () => {
      const promises = [];

      // Create 20 concurrent calculations
      for (let i = 0; i < 20; i++) {
        const personality = { ...mockPersonality1, energy_level: 50 + i };
        promises.push(groupBuilderService.calculateCompatibilityScore(personality, mockPersonality2));
      }

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(20);
      expect(results.every(score => score >= 0 && score <= 100)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // All should complete within 1 second
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null personality data', async () => {
      expect(async () => {
        const score = await groupBuilderService.calculateCompatibilityScore(null, mockPersonality2);
        expect(score).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    it('should handle undefined personality data', async () => {
      expect(async () => {
        const score = await groupBuilderService.calculateCompatibilityScore(undefined, mockPersonality2);
        expect(score).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    it('should handle extreme personality values', async () => {
      const extremePersonality1 = {
        energy_level: 0,
        social_preference: 0,
        adventure_style: 0,
        risk_tolerance: 0,
        planning_style: 0,
        communication_style: 0,
        experience_level: 0,
        leadership_style: 0,
        age: 18
      };

      const extremePersonality2 = {
        energy_level: 100,
        social_preference: 100,
        adventure_style: 100,
        risk_tolerance: 100,
        planning_style: 100,
        communication_style: 100,
        experience_level: 100,
        leadership_style: 100,
        age: 65
      };

      const score = await groupBuilderService.calculateCompatibilityScore(extremePersonality1, extremePersonality2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle invalid personality values gracefully', async () => {
      const invalidPersonality = {
        energy_level: -10,
        social_preference: 110,
        adventure_style: 'invalid',
        risk_tolerance: null,
        planning_style: undefined,
        communication_style: 50,
        experience_level: NaN,
        leadership_style: 60,
        age: 'not a number'
      };

      expect(async () => {
        const score = await groupBuilderService.calculateCompatibilityScore(invalidPersonality, mockPersonality2);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }).not.toThrow();
    });

    it('should handle empty personality objects', async () => {
      const emptyPersonality = {};

      const score = await groupBuilderService.calculateCompatibilityScore(emptyPersonality, mockPersonality2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Consistency and Reproducibility', () => {
    it('should produce consistent results for identical inputs', async () => {
      const scores = [];

      // Calculate the same compatibility score multiple times
      for (let i = 0; i < 10; i++) {
        const score = await groupBuilderService.calculateCompatibilityScore(mockPersonality1, mockPersonality2);
        scores.push(score);
      }

      // All scores should be identical
      const firstScore = scores[0];
      expect(scores.every(score => Math.abs(score - firstScore) < 0.01)).toBe(true);
    });

    it('should be symmetric for personality pairs', async () => {
      const scoreAB = await groupBuilderService.calculateCompatibilityScore(mockPersonality1, mockPersonality2);
      const scoreBA = await groupBuilderService.calculateCompatibilityScore(mockPersonality2, mockPersonality1);

      // Compatibility should be symmetric (A->B = B->A)
      expect(Math.abs(scoreAB - scoreBA)).toBeLessThan(0.01);
    });

    it('should have perfect self-compatibility', async () => {
      const selfScore = await groupBuilderService.calculateCompatibilityScore(mockPersonality1, mockPersonality1);

      // Self-compatibility should be very high
      expect(selfScore).toBeGreaterThan(90);
    });
  });
});
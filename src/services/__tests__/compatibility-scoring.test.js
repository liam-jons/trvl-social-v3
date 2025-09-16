import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupBuilderService } from '../group-builder-service.js';

/**
 * Unit tests for individual compatibility scoring functions
 * Testing personality, adventure preferences, and travel style scoring
 */

describe('Compatibility Scoring Functions', () => {
  const mockParticipant1 = {
    id: 1,
    profile: { full_name: 'Alice', age: 28 },
    personality: {
      energy_level: 80,
      social_preference: 70,
      adventure_style: 60,
      risk_tolerance: 75,
      planning_style: 65,
      communication_style: 80,
      experience_level: 70,
      leadership_style: 60,
      age: 28
    }
  };

  const mockParticipant2 = {
    id: 2,
    profile: { full_name: 'Bob', age: 32 },
    personality: {
      energy_level: 75,
      social_preference: 65,
      adventure_style: 70,
      risk_tolerance: 80,
      planning_style: 60,
      communication_style: 75,
      experience_level: 75,
      leadership_style: 65,
      age: 32
    }
  };

  describe('Personality Compatibility Scoring', () => {
    it('should calculate high compatibility for similar personalities', () => {
      const participant1 = { ...mockParticipant1 };
      const participant2 = {
        ...mockParticipant2,
        personality: { ...mockParticipant1.personality, age: 30 }
      };

      const score = groupBuilderService.calculatePersonalityCompatibility(participant1, participant2);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate low compatibility for opposite personalities', () => {
      const participant1 = {
        ...mockParticipant1,
        personality: {
          energy_level: 90,
          social_preference: 85,
          risk_tolerance: 90,
          planning_style: 20,
          communication_style: 85
        }
      };

      const participant2 = {
        ...mockParticipant2,
        personality: {
          energy_level: 10,
          social_preference: 15,
          risk_tolerance: 10,
          planning_style: 85,
          communication_style: 20
        }
      };

      const score = groupBuilderService.calculatePersonalityCompatibility(participant1, participant2);
      expect(score).toBeLessThan(40);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing personality data gracefully', () => {
      const participant1 = { ...mockParticipant1, personality: null };
      const participant2 = { ...mockParticipant2 };

      const score = groupBuilderService.calculatePersonalityCompatibility(participant1, participant2);
      expect(score).toBe(0);
    });

    it('should weight different personality traits correctly', () => {
      // Energy level difference should have significant impact
      const highEnergyPerson = {
        ...mockParticipant1,
        personality: { ...mockParticipant1.personality, energy_level: 95 }
      };

      const lowEnergyPerson = {
        ...mockParticipant2,
        personality: { ...mockParticipant2.personality, energy_level: 5 }
      };

      const score = groupBuilderService.calculatePersonalityCompatibility(highEnergyPerson, lowEnergyPerson);
      expect(score).toBeLessThan(60); // Energy mismatch should significantly impact score
    });
  });

  describe('Adventure Style Compatibility', () => {
    it('should calculate compatibility based on adventure preferences', () => {
      const adventureScore = groupBuilderService.calculateAdventureCompatibility(mockParticipant1, mockParticipant2);
      expect(adventureScore).toBeGreaterThanOrEqual(0);
      expect(adventureScore).toBeLessThanOrEqual(100);
    });

    it('should favor similar risk tolerance levels', () => {
      const riskTaker1 = {
        ...mockParticipant1,
        personality: { ...mockParticipant1.personality, risk_tolerance: 90 }
      };

      const riskTaker2 = {
        ...mockParticipant2,
        personality: { ...mockParticipant2.personality, risk_tolerance: 85 }
      };

      const riskAverse1 = {
        ...mockParticipant1,
        personality: { ...mockParticipant1.personality, risk_tolerance: 20 }
      };

      const riskAverse2 = {
        ...mockParticipant2,
        personality: { ...mockParticipant2.personality, risk_tolerance: 25 }
      };

      const similarRiskScore = groupBuilderService.calculateAdventureCompatibility(riskTaker1, riskTaker2);
      const differentRiskScore = groupBuilderService.calculateAdventureCompatibility(riskTaker1, riskAverse1);

      expect(similarRiskScore).toBeGreaterThan(differentRiskScore);
    });
  });

  describe('Travel Style Compatibility', () => {
    it('should calculate travel style compatibility', () => {
      const travelScore = groupBuilderService.calculateTravelStyleCompatibility(mockParticipant1, mockParticipant2);
      expect(travelScore).toBeGreaterThanOrEqual(0);
      expect(travelScore).toBeLessThanOrEqual(100);
    });

    it('should consider planning style differences', () => {
      const plannedPerson = {
        ...mockParticipant1,
        personality: { ...mockParticipant1.personality, planning_style: 90 }
      };

      const spontaneousPerson = {
        ...mockParticipant2,
        personality: { ...mockParticipant2.personality, planning_style: 10 }
      };

      const score = groupBuilderService.calculateTravelStyleCompatibility(plannedPerson, spontaneousPerson);
      expect(score).toBeLessThan(70); // Should show moderate incompatibility
    });
  });

  describe('Age Compatibility', () => {
    it('should calculate age-based compatibility', () => {
      const ageScore = groupBuilderService.calculateAgeCompatibility(mockParticipant1, mockParticipant2);
      expect(ageScore).toBeGreaterThanOrEqual(0);
      expect(ageScore).toBeLessThanOrEqual(100);
    });

    it('should penalize large age gaps', () => {
      const youngPerson = { ...mockParticipant1, personality: { ...mockParticipant1.personality, age: 22 } };
      const olderPerson = { ...mockParticipant2, personality: { ...mockParticipant2.personality, age: 55 } };

      const ageGapScore = groupBuilderService.calculateAgeCompatibility(youngPerson, olderPerson);
      const similarAgeScore = groupBuilderService.calculateAgeCompatibility(mockParticipant1, mockParticipant2);

      expect(ageGapScore).toBeLessThan(similarAgeScore);
    });
  });

  describe('Overall Compatibility Score', () => {
    it('should combine all compatibility factors', () => {
      const overallScore = groupBuilderService.calculateOverallCompatibility(mockParticipant1, mockParticipant2);
      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(100);
    });

    it('should weight personality compatibility most heavily', () => {
      // Mock the individual scoring functions to test weighting
      const originalPersonalityCalc = groupBuilderService.calculatePersonalityCompatibility;
      const originalAdventureCalc = groupBuilderService.calculateAdventureCompatibility;
      const originalTravelCalc = groupBuilderService.calculateTravelStyleCompatibility;
      const originalAgeCalc = groupBuilderService.calculateAgeCompatibility;

      groupBuilderService.calculatePersonalityCompatibility = vi.fn(() => 90);
      groupBuilderService.calculateAdventureCompatibility = vi.fn(() => 30);
      groupBuilderService.calculateTravelStyleCompatibility = vi.fn(() => 30);
      groupBuilderService.calculateAgeCompatibility = vi.fn(() => 30);

      const score = groupBuilderService.calculateOverallCompatibility(mockParticipant1, mockParticipant2);

      // With high personality score and low others, overall should still be reasonably high
      expect(score).toBeGreaterThan(50);

      // Restore original functions
      groupBuilderService.calculatePersonalityCompatibility = originalPersonalityCalc;
      groupBuilderService.calculateAdventureCompatibility = originalAdventureCalc;
      groupBuilderService.calculateTravelStyleCompatibility = originalTravelCalc;
      groupBuilderService.calculateAgeCompatibility = originalAgeCalc;
    });
  });

  describe('Performance Requirements', () => {
    it('should calculate compatibility scores within performance limits', () => {
      const startTime = performance.now();

      // Calculate 100 compatibility scores
      for (let i = 0; i < 100; i++) {
        groupBuilderService.calculateOverallCompatibility(mockParticipant1, mockParticipant2);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;

      // Should average less than 1ms per calculation
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle participants with null/undefined personality data', () => {
      const participant1 = { ...mockParticipant1, personality: null };
      const participant2 = { ...mockParticipant2, personality: undefined };

      expect(() => {
        groupBuilderService.calculateOverallCompatibility(participant1, participant2);
      }).not.toThrow();
    });

    it('should handle extreme personality values', () => {
      const extremeParticipant1 = {
        ...mockParticipant1,
        personality: {
          energy_level: 0,
          social_preference: 0,
          adventure_style: 0,
          risk_tolerance: 0,
          planning_style: 0,
          communication_style: 0,
          experience_level: 0,
          leadership_style: 0,
          age: 18
        }
      };

      const extremeParticipant2 = {
        ...mockParticipant2,
        personality: {
          energy_level: 100,
          social_preference: 100,
          adventure_style: 100,
          risk_tolerance: 100,
          planning_style: 100,
          communication_style: 100,
          experience_level: 100,
          leadership_style: 100,
          age: 65
        }
      };

      const score = groupBuilderService.calculateOverallCompatibility(extremeParticipant1, extremeParticipant2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle invalid personality values gracefully', () => {
      const invalidParticipant = {
        ...mockParticipant1,
        personality: {
          energy_level: -10,
          social_preference: 110,
          adventure_style: 'invalid',
          risk_tolerance: null,
          planning_style: undefined,
          communication_style: 50,
          experience_level: NaN,
          leadership_style: 60,
          age: 'not a number'
        }
      };

      expect(() => {
        groupBuilderService.calculateOverallCompatibility(invalidParticipant, mockParticipant2);
      }).not.toThrow();
    });
  });
});
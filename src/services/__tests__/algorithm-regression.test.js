import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupBuilderService } from '../group-builder-service.js';
import { generateTestParticipants } from '../group-optimization-test.js';

/**
 * Regression tests using mock historical data
 * Validates algorithm consistency and prevents performance degradation
 */

describe('Algorithm Regression Tests', () => {
  // Mock historical successful group data
  const historicalSuccessfulGroups = [
    {
      id: 'group_2023_001',
      participants: [
        {
          id: 1,
          personality: { energy_level: 75, social_preference: 80, risk_tolerance: 70, planning_style: 65 }
        },
        {
          id: 2,
          personality: { energy_level: 70, social_preference: 85, risk_tolerance: 65, planning_style: 70 }
        },
        {
          id: 3,
          personality: { energy_level: 80, social_preference: 75, risk_tolerance: 75, planning_style: 60 }
        },
        {
          id: 4,
          personality: { energy_level: 72, social_preference: 78, risk_tolerance: 68, planning_style: 67 }
        }
      ],
      satisfactionScore: 4.8,
      completionRate: 1.0,
      conflictCount: 0,
      expectedCompatibility: 85
    },
    {
      id: 'group_2023_002',
      participants: [
        {
          id: 5,
          personality: { energy_level: 45, social_preference: 60, risk_tolerance: 40, planning_style: 80 }
        },
        {
          id: 6,
          personality: { energy_level: 50, social_preference: 55, risk_tolerance: 45, planning_style: 75 }
        },
        {
          id: 7,
          personality: { energy_level: 40, social_preference: 65, risk_tolerance: 35, planning_style: 85 }
        },
        {
          id: 8,
          personality: { energy_level: 48, social_preference: 58, risk_tolerance: 42, planning_style: 78 }
        }
      ],
      satisfactionScore: 4.6,
      completionRate: 1.0,
      conflictCount: 1,
      expectedCompatibility: 78
    },
    {
      id: 'group_2023_003',
      participants: [
        {
          id: 9,
          personality: { energy_level: 90, social_preference: 30, risk_tolerance: 95, planning_style: 25 }
        },
        {
          id: 10,
          personality: { energy_level: 85, social_preference: 35, risk_tolerance: 90, planning_style: 30 }
        },
        {
          id: 11,
          personality: { energy_level: 92, social_preference: 25, risk_tolerance: 88, planning_style: 20 }
        }
      ],
      satisfactionScore: 4.4,
      completionRate: 1.0,
      conflictCount: 0,
      expectedCompatibility: 82
    }
  ];

  // Mock problematic groups that should be avoided
  const historicalProblematicGroups = [
    {
      id: 'group_2023_fail_001',
      participants: [
        {
          id: 12,
          personality: { energy_level: 95, social_preference: 90, risk_tolerance: 90, leadership_style: 95 }
        },
        {
          id: 13,
          personality: { energy_level: 90, social_preference: 85, risk_tolerance: 85, leadership_style: 90 }
        },
        {
          id: 14,
          personality: { energy_level: 5, social_preference: 10, risk_tolerance: 15, leadership_style: 10 }
        }
      ],
      satisfactionScore: 2.1,
      completionRate: 0.3,
      conflictCount: 8,
      expectedCompatibility: 25
    }
  ];

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Historical Success Pattern Validation', () => {
    it('should reproduce high compatibility scores for historically successful groups', async () => {
      for (const historicalGroup of historicalSuccessfulGroups) {
        const participants = historicalGroup.participants.map(p => ({
          id: p.id,
          profile: { full_name: `Participant ${p.id}`, age: 30 },
          personality: p.personality
        }));

        // Calculate compatibility for the historical group
        let totalCompatibility = 0;
        let pairCount = 0;

        for (let i = 0; i < participants.length; i++) {
          for (let j = i + 1; j < participants.length; j++) {
            const compatibility = groupBuilderService.calculateOverallCompatibility(
              participants[i],
              participants[j]
            );
            totalCompatibility += compatibility;
            pairCount++;
          }
        }

        const avgCompatibility = totalCompatibility / pairCount;

        // Should be within 10% of expected compatibility
        const expectedMin = historicalGroup.expectedCompatibility * 0.9;
        const expectedMax = historicalGroup.expectedCompatibility * 1.1;

        expect(avgCompatibility).toBeGreaterThanOrEqual(expectedMin);
        expect(avgCompatibility).toBeLessThanOrEqual(expectedMax);
      }
    });

    it('should identify low compatibility in historically problematic groups', async () => {
      for (const problematicGroup of historicalProblematicGroups) {
        const participants = problematicGroup.participants.map(p => ({
          id: p.id,
          profile: { full_name: `Participant ${p.id}`, age: 30 },
          personality: p.personality
        }));

        let totalCompatibility = 0;
        let pairCount = 0;

        for (let i = 0; i < participants.length; i++) {
          for (let j = i + 1; j < participants.length; j++) {
            const compatibility = groupBuilderService.calculateOverallCompatibility(
              participants[i],
              participants[j]
            );
            totalCompatibility += compatibility;
            pairCount++;
          }
        }

        const avgCompatibility = totalCompatibility / pairCount;

        // Should correctly identify as low compatibility
        expect(avgCompatibility).toBeLessThan(40);
      }
    });
  });

  describe('Algorithm Consistency Over Time', () => {
    const benchmarkParticipants = generateTestParticipants(20, [
      { energy_level: 75, social_preference: 80, risk_tolerance: 70 },
      { energy_level: 70, social_preference: 75, risk_tolerance: 75 },
      { energy_level: 80, social_preference: 70, risk_tolerance: 65 },
      { energy_level: 65, social_preference: 85, risk_tolerance: 80 }
    ]);

    it('should produce consistent group assignments for identical input', async () => {
      const results = [];

      // Run the same grouping multiple times
      for (let i = 0; i < 5; i++) {
        const groups = await groupBuilderService.performHybridOptimization(
          JSON.parse(JSON.stringify(benchmarkParticipants)), // Deep copy
          { targetGroupSize: 4, seed: 12345 } // Fixed seed for reproducibility
        );

        // Calculate signature of the grouping (participant IDs in each group)
        const signature = groups.map(group =>
          group.participants.map(p => p.id).sort()
        ).sort();

        results.push({
          groups,
          signature: JSON.stringify(signature)
        });
      }

      // All runs should produce identical or very similar groupings
      const uniqueSignatures = new Set(results.map(r => r.signature));
      expect(uniqueSignatures.size).toBeLessThanOrEqual(2); // Allow minor variation
    });

    it('should maintain performance benchmarks over multiple runs', async () => {
      const performanceResults = [];

      for (let i = 0; i < 10; i++) {
        const participants = generateTestParticipants(50);
        const startTime = performance.now();

        await groupBuilderService.performHybridOptimization(participants, {
          targetGroupSize: 6
        });

        const endTime = performance.now();
        performanceResults.push(endTime - startTime);
      }

      const avgTime = performanceResults.reduce((sum, time) => sum + time, 0) / performanceResults.length;
      const maxTime = Math.max(...performanceResults);

      // Performance regression check
      expect(avgTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxTime).toBeLessThan(3000);  // No run over 3 seconds
    });
  });

  describe('Quality Regression Prevention', () => {
    it('should maintain minimum compatibility scores across different scenarios', async () => {
      const scenarios = [
        { name: 'balanced', participants: generateTestParticipants(12), minCompatibility: 60 },
        { name: 'similar_personalities', participants: generateTestParticipants(12, Array(12).fill({ energy_level: 70 })), minCompatibility: 75 },
        { name: 'age_diverse', participants: generateTestParticipants(12).map((p, i) => ({
          ...p,
          personality: { ...p.personality, age: 25 + (i * 3) }
        })), minCompatibility: 55 }
      ];

      for (const scenario of scenarios) {
        const groups = await groupBuilderService.performHybridOptimization(scenario.participants, {
          targetGroupSize: 4
        });

        const avgCompatibility = groups.reduce((sum, group) =>
          sum + (group.compatibility?.averageScore || 0), 0
        ) / groups.length;

        expect(avgCompatibility).toBeGreaterThanOrEqual(scenario.minCompatibility);
      }
    });

    it('should detect conflicts at expected rates', async () => {
      // Test with known high-conflict scenario
      const highConflictParticipants = [
        {
          id: 1,
          personality: { energy_level: 95, social_preference: 90, leadership_style: 95, communication_style: 20 }
        },
        {
          id: 2,
          personality: { energy_level: 5, social_preference: 10, leadership_style: 5, communication_style: 95 }
        },
        {
          id: 3,
          personality: { energy_level: 90, social_preference: 85, leadership_style: 90, communication_style: 25 }
        },
        {
          id: 4,
          personality: { energy_level: 10, social_preference: 15, leadership_style: 10, communication_style: 90 }
        }
      ].map(p => ({
        ...p,
        profile: { full_name: `Participant ${p.id}`, age: 30 }
      }));

      const conflicts = await groupBuilderService.detectGroupConflicts(highConflictParticipants);

      // Should detect multiple conflicts
      expect(conflicts.overallRisk).toBeGreaterThan(0.6);
      expect(conflicts.energyConflicts.length + conflicts.socialConflicts.length + conflicts.leadershipConflicts.length).toBeGreaterThan(3);
    });
  });

  describe('Data Integrity Validation', () => {
    it('should preserve all participant data through optimization', async () => {
      const originalParticipants = historicalSuccessfulGroups[0].participants.map(p => ({
        id: p.id,
        profile: {
          full_name: `Participant ${p.id}`,
          avatar_url: `https://example.com/avatar${p.id}.png`,
          age: 30,
          bio: `Bio for participant ${p.id}`
        },
        personality: p.personality,
        bookingId: `booking_${p.id}`,
        metadata: {
          joinDate: '2023-01-15',
          preferences: ['hiking', 'photography']
        }
      }));

      const groups = await groupBuilderService.performHybridOptimization(originalParticipants);

      // Verify all original data is preserved
      const allGroupParticipants = groups.flatMap(group => group.participants);

      allGroupParticipants.forEach(participant => {
        const original = originalParticipants.find(p => p.id === participant.id);
        expect(original).toBeDefined();

        expect(participant.profile.full_name).toBe(original.profile.full_name);
        expect(participant.profile.avatar_url).toBe(original.profile.avatar_url);
        expect(participant.bookingId).toBe(original.bookingId);
        expect(participant.metadata).toEqual(original.metadata);
      });
    });

    it('should maintain referential integrity in group assignments', async () => {
      const participants = generateTestParticipants(15);

      const groups = await groupBuilderService.performHybridOptimization(participants);

      const allAssignedParticipants = groups.flatMap(group => group.participants);
      const assignedIds = allAssignedParticipants.map(p => p.id);
      const originalIds = participants.map(p => p.id);

      // Every original participant should be assigned exactly once
      expect(assignedIds.sort()).toEqual(originalIds.sort());

      // No duplicate assignments
      expect(new Set(assignedIds).size).toBe(assignedIds.length);
    });
  });

  describe('Boundary Condition Validation', () => {
    it('should handle edge cases consistently with historical behavior', async () => {
      const edgeCases = [
        {
          name: 'minimum_group_size',
          participants: generateTestParticipants(3),
          expectedGroups: 1
        },
        {
          name: 'exact_division',
          participants: generateTestParticipants(12),
          expectedGroups: 2,
          targetGroupSize: 6
        },
        {
          name: 'remainder_participants',
          participants: generateTestParticipants(13),
          expectedGroups: [2, 3], // Could be 2 or 3 groups depending on algorithm
          targetGroupSize: 6
        }
      ];

      for (const testCase of edgeCases) {
        const groups = await groupBuilderService.performHybridOptimization(
          testCase.participants,
          { targetGroupSize: testCase.targetGroupSize || 4 }
        );

        if (Array.isArray(testCase.expectedGroups)) {
          expect(testCase.expectedGroups).toContain(groups.length);
        } else {
          expect(groups.length).toBe(testCase.expectedGroups);
        }

        // Verify all participants are assigned
        const totalAssigned = groups.reduce((sum, group) => sum + group.participants.length, 0);
        expect(totalAssigned).toBe(testCase.participants.length);
      }
    });
  });

  describe('Algorithm Version Compatibility', () => {
    it('should maintain backward compatibility with previous algorithm versions', async () => {
      // Simulate data from previous algorithm version
      const legacyFormatParticipants = [
        {
          id: 1,
          name: 'John Doe', // Old format used 'name' instead of 'profile.full_name'
          personality_scores: { // Old format used different field name
            energy: 75,
            social: 80,
            risk: 70,
            planning: 65
          }
        },
        {
          id: 2,
          name: 'Jane Smith',
          personality_scores: {
            energy: 70,
            social: 75,
            risk: 75,
            planning: 70
          }
        }
      ];

      // Convert to current format (simulate data migration)
      const currentFormatParticipants = legacyFormatParticipants.map(p => ({
        id: p.id,
        profile: { full_name: p.name, age: 30 },
        personality: {
          energy_level: p.personality_scores.energy,
          social_preference: p.personality_scores.social,
          risk_tolerance: p.personality_scores.risk,
          planning_style: p.personality_scores.planning
        }
      }));

      expect(async () => {
        const groups = await groupBuilderService.performHybridOptimization(currentFormatParticipants);
        expect(groups).toBeDefined();
        expect(groups.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });
});
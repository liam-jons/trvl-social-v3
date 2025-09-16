import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groupBuilderService } from '../group-builder-service.js';
import { generateTestParticipants, testScenarios } from '../group-optimization-test.js';

/**
 * Integration tests for the full group optimization pipeline
 * Testing end-to-end group formation, scoring, and conflict detection
 */

describe('Group Optimization Integration Tests', () => {
  beforeEach(() => {
    // Mock external dependencies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Group Formation', () => {
    it('should create balanced groups from diverse participants', async () => {
      const participants = testScenarios.smallDiverse;
      const targetGroupSize = 4;

      const groups = await groupBuilderService.performHybridOptimization(participants, {
        targetGroupSize,
        numGroups: 2
      });

      expect(groups).toHaveLength(2);
      expect(groups[0].participants).toHaveLength(4);
      expect(groups[1].participants).toHaveLength(4);

      // Verify each group has compatibility scores
      groups.forEach(group => {
        expect(group.compatibility).toBeDefined();
        expect(group.compatibility.averageScore).toBeGreaterThanOrEqual(0);
        expect(group.compatibility.averageScore).toBeLessThanOrEqual(100);
      });
    });

    it('should handle large participant groups efficiently', async () => {
      const largeParticipantGroup = generateTestParticipants(50);
      const startTime = performance.now();

      const groups = await groupBuilderService.performHybridOptimization(largeParticipantGroup, {
        targetGroupSize: 6
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete within 2 seconds for 50 participants
      expect(processingTime).toBeLessThan(2000);
      expect(groups.length).toBeGreaterThan(0);

      // Verify all participants are assigned
      const totalAssigned = groups.reduce((sum, group) => sum + group.participants.length, 0);
      expect(totalAssigned).toBe(50);
    });

    it('should optimize for high compatibility scores', async () => {
      const participants = testScenarios.largeHomogeneous; // Similar personalities should group well

      const groups = await groupBuilderService.performHybridOptimization(participants, {
        targetGroupSize: 6
      });

      const avgCompatibility = groups.reduce((sum, group) =>
        sum + (group.compatibility?.averageScore || 0), 0
      ) / groups.length;

      // Homogeneous groups should have high compatibility
      expect(avgCompatibility).toBeGreaterThan(70);
    });

    it('should minimize conflicts in group assignments', async () => {
      const participants = testScenarios.highConflict;

      const groups = await groupBuilderService.performHybridOptimization(participants, {
        targetGroupSize: 4
      });

      // Check conflicts for each group
      const conflictPromises = groups.map(group =>
        groupBuilderService.detectGroupConflicts(group.participants)
      );

      const conflicts = await Promise.all(conflictPromises);

      // Total critical conflicts should be minimized
      const totalCriticalConflicts = conflicts.reduce((sum, conflict) =>
        sum + conflict.severityBreakdown.critical, 0
      );

      expect(totalCriticalConflicts).toBeLessThan(5); // Should minimize critical conflicts
    });
  });

  describe('Algorithm Performance Comparison', () => {
    const algorithms = ['kmeans', 'hierarchical', 'hybrid'];
    const testSizes = [12, 24, 48];

    algorithms.forEach(algorithm => {
      describe(`${algorithm} algorithm`, () => {
        testSizes.forEach(size => {
          it(`should handle ${size} participants efficiently`, async () => {
            const participants = generateTestParticipants(size);
            const startTime = performance.now();

            let groups;
            const options = { targetGroupSize: 6, numGroups: Math.ceil(size / 6) };

            try {
              switch (algorithm) {
                case 'kmeans':
                  groups = await groupBuilderService.performKMeansGrouping(
                    participants,
                    options.numGroups,
                    options
                  );
                  break;
                case 'hierarchical':
                  groups = await groupBuilderService.performHierarchicalGrouping(
                    participants,
                    options.targetGroupSize,
                    options
                  );
                  break;
                case 'hybrid':
                  groups = await groupBuilderService.performHybridOptimization(
                    participants,
                    options
                  );
                  break;
              }

              const endTime = performance.now();
              const duration = endTime - startTime;

              expect(groups).toBeDefined();
              expect(groups.length).toBeGreaterThan(0);

              // Performance requirement: should complete within reasonable time
              const maxTime = size < 25 ? 1000 : size < 50 ? 2000 : 5000;
              expect(duration).toBeLessThan(maxTime);

              // Quality check: groups should have compatibility scores
              groups.forEach(group => {
                expect(group.compatibility).toBeDefined();
                if (group.compatibility.averageScore !== undefined) {
                  expect(group.compatibility.averageScore).toBeGreaterThanOrEqual(0);
                  expect(group.compatibility.averageScore).toBeLessThanOrEqual(100);
                }
              });

            } catch (error) {
              // Algorithm should not fail for valid inputs
              expect(error).toBeNull();
            }
          });
        });
      });
    });
  });

  describe('Conflict Detection Integration', () => {
    it('should detect and quantify group conflicts accurately', async () => {
      // Create a group with known conflicts
      const conflictGroup = [
        {
          id: 1,
          personality: {
            energy_level: 95,
            social_preference: 90,
            leadership_style: 90,
            communication_style: 20
          }
        },
        {
          id: 2,
          personality: {
            energy_level: 5,
            social_preference: 10,
            leadership_style: 10,
            communication_style: 90
          }
        },
        {
          id: 3,
          personality: {
            energy_level: 90,
            social_preference: 85,
            leadership_style: 85,
            communication_style: 25
          }
        }
      ];

      const conflicts = await groupBuilderService.detectGroupConflicts(conflictGroup);

      expect(conflicts.overallRisk).toBeGreaterThan(0.5); // Should detect high risk
      expect(conflicts.energyConflicts.length).toBeGreaterThan(0);
      expect(conflicts.socialConflicts.length).toBeGreaterThan(0);
      expect(conflicts.leadershipConflicts.length).toBeGreaterThan(0);
    });

    it('should integrate conflict detection with group optimization', async () => {
      const participants = testScenarios.highConflict;

      const groups = await groupBuilderService.performHybridOptimization(participants, {
        targetGroupSize: 3,
        avoidConflicts: true
      });

      // Check that optimization considered conflicts
      const conflictChecks = await Promise.all(
        groups.map(group => groupBuilderService.detectGroupConflicts(group.participants))
      );

      const avgRisk = conflictChecks.reduce((sum, conflict) =>
        sum + conflict.overallRisk, 0
      ) / conflictChecks.length;

      // With conflict avoidance, average risk should be lower
      expect(avgRisk).toBeLessThan(0.7);
    });
  });

  describe('Data Pipeline Integration', () => {
    it('should handle realistic participant data structure', async () => {
      const realisticParticipants = [
        {
          id: 1,
          bookingId: 'booking_1',
          userId: 'user_1',
          profile: {
            full_name: 'John Doe',
            avatar_url: 'https://example.com/avatar1.png',
            age: 28
          },
          personality: {
            energy_level: 75,
            social_preference: 80,
            adventure_style: 70,
            risk_tolerance: 65,
            planning_style: 60,
            communication_style: 85,
            experience_level: 70,
            leadership_style: 55
          }
        },
        {
          id: 2,
          bookingId: 'booking_2',
          userId: 'user_2',
          profile: {
            full_name: 'Jane Smith',
            avatar_url: 'https://example.com/avatar2.png',
            age: 32
          },
          personality: {
            energy_level: 70,
            social_preference: 75,
            adventure_style: 80,
            risk_tolerance: 70,
            planning_style: 65,
            communication_style: 80,
            experience_level: 75,
            leadership_style: 60
          }
        }
      ];

      const groups = await groupBuilderService.performHybridOptimization(realisticParticipants);

      expect(groups).toBeDefined();
      expect(groups.length).toBeGreaterThan(0);

      // Verify data integrity through pipeline
      groups.forEach(group => {
        group.participants.forEach(participant => {
          expect(participant.id).toBeDefined();
          expect(participant.profile).toBeDefined();
          expect(participant.profile.full_name).toBeDefined();
        });
      });
    });

    it('should preserve participant metadata through optimization', async () => {
      const participantsWithMetadata = generateTestParticipants(8).map(p => ({
        ...p,
        bookingDate: '2024-01-15',
        specialRequirements: ['vegetarian', 'early_riser'],
        preferences: {
          roomType: 'shared',
          activityLevel: 'high'
        }
      }));

      const groups = await groupBuilderService.performHybridOptimization(participantsWithMetadata);

      // Verify metadata is preserved
      groups.forEach(group => {
        group.participants.forEach(participant => {
          expect(participant.bookingDate).toBe('2024-01-15');
          expect(participant.specialRequirements).toBeDefined();
          expect(participant.preferences).toBeDefined();
        });
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle participants with incomplete data gracefully', async () => {
      const incompleteParticipants = [
        { id: 1, profile: { full_name: 'Test 1' }, personality: null },
        { id: 2, profile: null, personality: { energy_level: 50 } },
        { id: 3, profile: { full_name: 'Test 3' }, personality: { energy_level: 75 } },
        { id: 4, profile: { full_name: 'Test 4' }, personality: { energy_level: 60 } }
      ];

      expect(async () => {
        const groups = await groupBuilderService.performHybridOptimization(incompleteParticipants);
        expect(groups).toBeDefined();
        expect(groups.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should fallback gracefully when primary algorithm fails', async () => {
      const participants = generateTestParticipants(6);

      // Mock a failure in one algorithm
      const originalKMeans = groupBuilderService.performKMeansGrouping;
      groupBuilderService.performKMeansGrouping = vi.fn().mockRejectedValue(new Error('KMeans failed'));

      const groups = await groupBuilderService.performHybridOptimization(participants, {
        fallbackToHierarchical: true
      });

      expect(groups).toBeDefined();
      expect(groups.length).toBeGreaterThan(0);

      // Restore original function
      groupBuilderService.performKMeansGrouping = originalKMeans;
    });
  });

  describe('Scalability and Memory Management', () => {
    it('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage();

      // Process multiple large groups
      for (let i = 0; i < 5; i++) {
        const participants = generateTestParticipants(100);
        await groupBuilderService.performHybridOptimization(participants, {
          targetGroupSize: 8
        });

        // Force garbage collection if available
        if (global.gc) global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB

      // Memory increase should be reasonable (less than 100MB for test)
      expect(memoryIncrease).toBeLessThan(100);
    });

    it('should maintain consistent performance across multiple runs', async () => {
      const participants = generateTestParticipants(30);
      const times = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await groupBuilderService.performHybridOptimization(participants);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variation = maxTime - minTime;

      // Performance should be consistent
      expect(variation).toBeLessThan(avgTime); // Variation less than average time
      expect(avgTime).toBeLessThan(1000); // Average under 1 second
    });
  });
});
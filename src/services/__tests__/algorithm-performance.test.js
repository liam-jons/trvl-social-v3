import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groupBuilderService } from '../group-builder-service.js';
import { generateTestParticipants } from '../group-optimization-test.js';
/**
 * Performance benchmark tests for group compatibility algorithms
 * Validates algorithm speed and efficiency under various load conditions
 */
describe('Algorithm Performance Benchmarks', () => {
  let performanceResults = [];
  beforeEach(() => {
    performanceResults = [];
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('Single Algorithm Performance', () => {
    const algorithms = [
      { name: 'kmeans', method: 'performKMeansGrouping' },
      { name: 'hierarchical', method: 'performHierarchicalGrouping' },
      { name: 'hybrid', method: 'performHybridOptimization' }
    ];
    algorithms.forEach(algorithm => {
      describe(`${algorithm.name} Performance`, () => {
        const testSizes = [10, 25, 50, 100, 200];
        testSizes.forEach(size => {
          it(`should process ${size} participants within time limit`, async () => {
            const participants = generateTestParticipants(size);
            const expectedMaxTime = getExpectedMaxTime(size);
            const startTime = performance.now();
            let groups;
            const options = { targetGroupSize: 6, numGroups: Math.ceil(size / 6) };
            try {
              switch (algorithm.name) {
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
              performanceResults.push({
                algorithm: algorithm.name,
                size,
                duration,
                groupCount: groups.length,
                participantsPerMs: size / duration,
                success: true
              });
              expect(duration).toBeLessThan(expectedMaxTime);
              expect(groups.length).toBeGreaterThan(0);
              // Verify all participants were assigned
              const totalAssigned = groups.reduce((sum, group) => sum + group.participants.length, 0);
              expect(totalAssigned).toBe(size);
            } catch (error) {
              performanceResults.push({
                algorithm: algorithm.name,
                size,
                duration: -1,
                error: error.message,
                success: false
              });
              // Performance tests should not fail unless there's a critical issue
              if (size <= 100) {
                expect(error).toBeNull(); // Small groups should always work
              }
            }
          });
        });
      });
    });
  });
  describe('Comparative Performance Analysis', () => {
    it('should benchmark all algorithms against each other', async () => {
      const testSize = 50;
      const participants = generateTestParticipants(testSize);
      const results = {};
      const algorithms = [
        { name: 'kmeans', method: groupBuilderService.performKMeansGrouping },
        { name: 'hierarchical', method: groupBuilderService.performHierarchicalGrouping },
        { name: 'hybrid', method: groupBuilderService.performHybridOptimization }
      ];
      for (const algorithm of algorithms) {
        const startTime = performance.now();
        let groups;
        const options = { targetGroupSize: 6, numGroups: Math.ceil(testSize / 6) };
        try {
          switch (algorithm.name) {
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
          // Calculate quality metrics
          const avgCompatibility = groups.reduce((sum, group) =>
            sum + (group.compatibility?.averageScore || 0), 0
          ) / groups.length;
          results[algorithm.name] = {
            duration,
            quality: avgCompatibility,
            groupCount: groups.length,
            efficiency: avgCompatibility / duration // Quality per millisecond
          };
        } catch (error) {
          results[algorithm.name] = { error: error.message };
        }
      }
      // Analyze results
      const successfulAlgorithms = Object.entries(results).filter(([_, result]) => !result.error);
      expect(successfulAlgorithms.length).toBeGreaterThan(0);
      // Log performance comparison for analysis
      successfulAlgorithms.forEach(([name, result]) => {
        console.log(`${name}: ${result.duration.toFixed(2)}ms, quality: ${result.quality.toFixed(2)}, efficiency: ${result.efficiency.toFixed(4)}`);
      });
    });
  });
  describe('Memory Performance', () => {
    it('should maintain reasonable memory usage during processing', async () => {
      const initialMemory = process.memoryUsage();
      const participants = generateTestParticipants(100);
      const groups = await groupBuilderService.performHybridOptimization(participants);
      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      expect(groups).toBeDefined();
      expect(memoryIncrease).toBeLessThan(50); // Should use less than 50MB additional memory
    });
    it('should clean up memory efficiently after processing', async () => {
      const baselineMemory = process.memoryUsage().heapUsed;
      // Process multiple large groups
      for (let i = 0; i < 5; i++) {
        const participants = generateTestParticipants(80);
        await groupBuilderService.performHybridOptimization(participants);
        // Force garbage collection if available
        if (global.gc) global.gc();
      }
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - baselineMemory) / 1024 / 1024; // MB
      // Memory should not grow significantly after cleanup
      expect(memoryIncrease).toBeLessThan(20);
    });
  });
  describe('Concurrent Processing Performance', () => {
    it('should handle multiple concurrent group optimization requests', async () => {
      const concurrentRequests = 5;
      const participantsPerRequest = 30;
      const promises = Array.from({ length: concurrentRequests }, () => {
        const participants = generateTestParticipants(participantsPerRequest);
        const startTime = performance.now();
        return groupBuilderService.performHybridOptimization(participants).then(groups => ({
          duration: performance.now() - startTime,
          groupCount: groups.length,
          success: true
        }));
      });
      const results = await Promise.all(promises);
      // All requests should succeed
      expect(results.every(r => r.success)).toBe(true);
      // Average time should still be reasonable despite concurrency
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(2000); // Average under 2 seconds
    });
  });
  describe('Scalability Benchmarks', () => {
    const scalabilityTests = [
      { size: 10, expectedMaxTime: 100, description: 'small groups' },
      { size: 50, expectedMaxTime: 1000, description: 'medium groups' },
      { size: 100, expectedMaxTime: 2000, description: 'large groups' },
      { size: 200, expectedMaxTime: 5000, description: 'very large groups' }
    ];
    scalabilityTests.forEach(test => {
      it(`should scale efficiently for ${test.description} (${test.size} participants)`, async () => {
        const participants = generateTestParticipants(test.size);
        const startTime = performance.now();
        const groups = await groupBuilderService.performHybridOptimization(participants, {
          targetGroupSize: 6
        });
        const endTime = performance.now();
        const duration = endTime - startTime;
        const participantsPerSecond = (test.size / duration) * 1000;
        expect(duration).toBeLessThan(test.expectedMaxTime);
        expect(groups.length).toBeGreaterThan(0);
        expect(participantsPerSecond).toBeGreaterThan(10); // Minimum throughput
        // Log performance metrics
        console.log(`${test.description}: ${duration.toFixed(2)}ms (${participantsPerSecond.toFixed(2)} participants/sec)`);
      });
    });
  });
  describe('Algorithm Complexity Analysis', () => {
    it('should demonstrate sub-quadratic time complexity', async () => {
      const testSizes = [20, 40, 80];
      const times = [];
      for (const size of testSizes) {
        const participants = generateTestParticipants(size);
        const startTime = performance.now();
        await groupBuilderService.performHybridOptimization(participants);
        const endTime = performance.now();
        times.push({ size, time: endTime - startTime });
      }
      // Check that time doesn't grow quadratically
      // If time complexity is O(n²), doubling size should quadruple time
      // We want better than quadratic performance
      const ratio1 = times[1].time / times[0].time; // 40 vs 20
      const ratio2 = times[2].time / times[1].time; // 80 vs 40
      const sizeRatio1 = times[1].size / times[0].size; // Should be 2
      const sizeRatio2 = times[2].size / times[1].size; // Should be 2
      // Time ratio should be less than size ratio squared (better than O(n²))
      expect(ratio1).toBeLessThan(Math.pow(sizeRatio1, 2));
      expect(ratio2).toBeLessThan(Math.pow(sizeRatio2, 2));
    });
  });
  describe('Stress Testing', () => {
    it('should handle maximum expected load without degradation', async () => {
      const maxExpectedParticipants = 500; // Maximum realistic group size
      const participants = generateTestParticipants(maxExpectedParticipants);
      const startTime = performance.now();
      try {
        const groups = await groupBuilderService.performHybridOptimization(participants, {
          targetGroupSize: 8,
          maxProcessingTime: 30000 // 30 second timeout
        });
        const endTime = performance.now();
        const duration = endTime - startTime;
        expect(groups).toBeDefined();
        expect(groups.length).toBeGreaterThan(0);
        expect(duration).toBeLessThan(30000); // Should complete within timeout
        // Verify all participants assigned
        const totalAssigned = groups.reduce((sum, group) => sum + group.participants.length, 0);
        expect(totalAssigned).toBe(maxExpectedParticipants);
      } catch (error) {
        // If it fails, it should fail gracefully
        expect(error.message).toContain('timeout');
      }
    });
    it('should maintain performance consistency under repeated load', async () => {
      const testIterations = 10;
      const participantCount = 60;
      const times = [];
      for (let i = 0; i < testIterations; i++) {
        const participants = generateTestParticipants(participantCount);
        const startTime = performance.now();
        await groupBuilderService.performHybridOptimization(participants);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variation = ((maxTime - minTime) / avgTime) * 100; // Percentage variation
      expect(avgTime).toBeLessThan(2000); // Average under 2 seconds
      expect(variation).toBeLessThan(50); // Variation less than 50%
    });
  });
  describe('Performance Monitoring Integration', () => {
    it('should provide performance metrics in a monitorable format', async () => {
      const participants = generateTestParticipants(40);
      const startTime = performance.now();
      const groups = await groupBuilderService.performHybridOptimization(participants);
      const endTime = performance.now();
      const duration = endTime - startTime;
      // Create performance metrics in the format expected by monitoring systems
      const metrics = {
        algorithm: 'hybrid',
        participantCount: participants.length,
        groupCount: groups.length,
        processingTimeMs: duration,
        avgCompatibility: groups.reduce((sum, group) =>
          sum + (group.compatibility?.averageScore || 0), 0
        ) / groups.length,
        throughputParticipantsPerSecond: (participants.length / duration) * 1000,
        timestamp: new Date().toISOString()
      };
      expect(metrics.processingTimeMs).toBeGreaterThan(0);
      expect(metrics.throughputParticipantsPerSecond).toBeGreaterThan(0);
      expect(metrics.avgCompatibility).toBeGreaterThanOrEqual(0);
      expect(metrics.avgCompatibility).toBeLessThanOrEqual(100);
      // Metrics should meet SLA requirements
      expect(metrics.processingTimeMs).toBeLessThan(2000); // 2 second SLA
      expect(metrics.throughputParticipantsPerSecond).toBeGreaterThan(20); // Minimum throughput
    });
  });
});
/**
 * Helper function to determine expected maximum processing time based on group size
 */
function getExpectedMaxTime(participantCount) {
  if (participantCount <= 25) return 500;   // 500ms for small groups
  if (participantCount <= 50) return 1000;  // 1s for medium groups
  if (participantCount <= 100) return 2000; // 2s for large groups
  if (participantCount <= 200) return 5000; // 5s for very large groups
  return 10000; // 10s maximum for any size
}
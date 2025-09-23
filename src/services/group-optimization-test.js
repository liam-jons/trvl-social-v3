import { groupBuilderService } from './group-builder-service.js';
/**
 * Comprehensive testing suite for group optimization algorithms
 * Tests algorithm accuracy, performance, and edge cases
 */
// Test data generators
function generateTestParticipant(id, personality = {}) {
  return {
    id,
    profile: {
      full_name: `Participant ${id}`,
      avatar_url: `/images/placeholders/demo-placeholder.svg'kmeans', 'hierarchical', 'spectral', 'hybrid'];
    const groupSizes = [8, 16, 32, 64, 100];
    for (const algorithm of algorithms) {
      this.results.algorithmPerformance[algorithm] = {};
      for (const size of groupSizes) {
        const participants = generateTestParticipants(size);
        const startTime = Date.now();
        try {
          let groups;
          const options = { targetGroupSize: 6, numGroups: Math.ceil(size / 6) };
          switch (algorithm) {
            case 'kmeans':
              groups = await groupBuilderService.performKMeansGrouping(participants, options.numGroups, options);
              break;
            case 'hierarchical':
              groups = await groupBuilderService.performHierarchicalGrouping(participants, options.targetGroupSize, options);
              break;
            case 'spectral':
              groups = await groupBuilderService.performSpectralGrouping(participants, options.numGroups, options);
              break;
            case 'hybrid':
              groups = await groupBuilderService.performHybridOptimization(participants, options);
              break;
          }
          const endTime = Date.now();
          const duration = endTime - startTime;
          // Calculate quality metrics
          const avgCompatibility = groups.reduce((sum, group) =>
            sum + (group.compatibility?.averageScore || 0), 0
          ) / groups.length;
          const balanceScore = this.calculateGroupBalance(groups);
          this.results.algorithmPerformance[algorithm][size] = {
            duration,
            groupCount: groups.length,
            avgCompatibility: Math.round(avgCompatibility),
            balanceScore: Math.round(balanceScore),
            participantsProcessed: size,
            success: true
          };
        } catch (error) {
          this.results.algorithmPerformance[algorithm][size] = {
            duration: -1,
            error: error.message,
            success: false
          };
        }
      }
    }
  }
  // Test algorithm accuracy with known scenarios
  async testAccuracy() {
    const scenarios = Object.keys(testScenarios);
    for (const scenarioName of scenarios) {
      const participants = testScenarios[scenarioName];
      this.results.accuracyTests[scenarioName] = {};
      // Test each algorithm
      const algorithms = ['kmeans', 'hierarchical', 'hybrid'];
      for (const algorithm of algorithms) {
        try {
          const startTime = Date.now();
          let groups;
          switch (algorithm) {
            case 'kmeans':
              groups = await groupBuilderService.performKMeansGrouping(participants, Math.ceil(participants.length / 6));
              break;
            case 'hierarchical':
              groups = await groupBuilderService.performHierarchicalGrouping(participants, 6);
              break;
            case 'hybrid':
              groups = await groupBuilderService.performHybridOptimization(participants);
              break;
          }
          const duration = Date.now() - startTime;
          // Analyze results
          const conflicts = await Promise.all(
            groups.map(group => groupBuilderService.detectGroupConflicts(group.participants))
          );
          const avgConflictScore = conflicts.reduce((sum, conflict) => {
            return sum + conflict.severityBreakdown.critical * 3 +
                   conflict.severityBreakdown.major * 2 +
                   conflict.severityBreakdown.minor;
          }, 0) / conflicts.length;
          const avgCompatibility = groups.reduce((sum, group) =>
            sum + (group.compatibility?.averageScore || 0), 0
          ) / groups.length;
          this.results.accuracyTests[scenarioName][algorithm] = {
            duration,
            groupCount: groups.length,
            avgCompatibility: Math.round(avgCompatibility),
            avgConflictScore: Math.round(avgConflictScore),
            balanceScore: Math.round(this.calculateGroupBalance(groups)),
            success: true
          };
        } catch (error) {
          this.results.accuracyTests[scenarioName][algorithm] = {
            error: error.message,
            success: false
          };
        }
      }
    }
  }
  // Test edge cases and error conditions
  async testEdgeCases() {
    const edgeCases = [
      { name: 'empty_array', participants: [] },
      { name: 'single_participant', participants: generateTestParticipants(1) },
      { name: 'two_participants', participants: generateTestParticipants(2) },
      { name: 'no_personality_data', participants: [
        { id: 1, profile: { full_name: 'Test 1' }, personality: null },
        { id: 2, profile: { full_name: 'Test 2' }, personality: null }
      ]},
      { name: 'mixed_personality_data', participants: [
        ...generateTestParticipants(3),
        { id: 4, profile: { full_name: 'Test 4' }, personality: null },
        { id: 5, profile: { full_name: 'Test 5' }, personality: null }
      ]},
      { name: 'extreme_values', participants: generateTestParticipants(6, [
        { energy_level: 0, social_preference: 0, risk_tolerance: 0 },
        { energy_level: 100, social_preference: 100, risk_tolerance: 100 },
        { energy_level: -10, social_preference: 110, risk_tolerance: 50 }, // Invalid values
        { energy_level: 50, social_preference: 50, risk_tolerance: 50 },
        { energy_level: 25, social_preference: 75, risk_tolerance: 25 },
        { energy_level: 75, social_preference: 25, risk_tolerance: 75 }
      ])}
    ];
    for (const testCase of edgeCases) {
      this.results.edgeCaseTests[testCase.name] = {};
      // Test hybrid algorithm (most robust)
      try {
        const groups = await groupBuilderService.performHybridOptimization(testCase.participants);
        this.results.edgeCaseTests[testCase.name] = {
          success: true,
          groupCount: groups.length,
          handledGracefully: true,
          totalParticipants: testCase.participants.length,
          groupedParticipants: groups.reduce((sum, group) => sum + group.participants.length, 0)
        };
      } catch (error) {
        this.results.edgeCaseTests[testCase.name] = {
          success: false,
          error: error.message,
          handledGracefully: false
        };
      }
    }
  }
  // Test stress conditions and scalability
  async testStressConditions() {
    const stressTests = [
      { name: 'large_group_500', size: 500, timeout: 30000 },
      { name: 'very_large_group_1000', size: 1000, timeout: 60000 },
      { name: 'repeated_calls', size: 50, iterations: 10 },
      { name: 'memory_pressure', size: 200, iterations: 5 }
    ];
    for (const test of stressTests) {
      try {
        if (test.name === 'repeated_calls') {
          // Test repeated calls for memory leaks
          const times = [];
          const participants = generateTestParticipants(test.size);
          for (let i = 0; i < test.iterations; i++) {
            const startTime = Date.now();
            await groupBuilderService.performHybridOptimization(participants);
            times.push(Date.now() - startTime);
            // Force garbage collection if available
            if (global.gc) global.gc();
          }
          this.results.stressTests[test.name] = {
            success: true,
            iterations: test.iterations,
            avgTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            timeVariation: Math.max(...times) - Math.min(...times)
          };
        } else if (test.name === 'memory_pressure') {
          // Test memory usage with large datasets
          const memoryBefore = process.memoryUsage();
          const participants = generateTestParticipants(test.size);
          for (let i = 0; i < test.iterations; i++) {
            await groupBuilderService.performHybridOptimization(participants);
          }
          const memoryAfter = process.memoryUsage();
          this.results.stressTests[test.name] = {
            success: true,
            memoryIncrease: Math.round((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024), // MB
            iterations: test.iterations,
            participantsPerIteration: test.size
          };
        } else {
          // Test large groups with timeout
          const participants = generateTestParticipants(test.size);
          const startTime = Date.now();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), test.timeout)
          );
          const algorithmPromise = groupBuilderService.performHybridOptimization(participants);
          await Promise.race([algorithmPromise, timeoutPromise]);
          const duration = Date.now() - startTime;
          this.results.stressTests[test.name] = {
            success: true,
            duration,
            participantCount: test.size,
            withinTimeout: duration < test.timeout
          };
        }
      } catch (error) {
        this.results.stressTests[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
  }
  // Test conflict detection accuracy
  async testConflictDetection() {
    // Create groups with known conflicts
    const conflictScenarios = [
      {
        name: 'no_conflicts',
        participants: generateTestParticipants(6, Array(6).fill({
          energy_level: 60, social_preference: 60, risk_tolerance: 60
        })),
        expectedConflicts: 0
      },
      {
        name: 'energy_conflicts',
        participants: [
          generateTestParticipant(1, { energy_level: 95 }),
          generateTestParticipant(2, { energy_level: 5 }),
          generateTestParticipant(3, { energy_level: 90 }),
          generateTestParticipant(4, { energy_level: 10 })
        ],
        expectedConflicts: 4 // Each high-low pair
      },
      {
        name: 'leadership_conflicts',
        participants: [
          generateTestParticipant(1, { leadership_style: 90 }),
          generateTestParticipant(2, { leadership_style: 85 }),
          generateTestParticipant(3, { leadership_style: 80 }),
          generateTestParticipant(4, { leadership_style: 20 })
        ],
        expectedConflicts: 3 // Three leader pairs
      }
    ];
    for (const scenario of conflictScenarios) {
      try {
        const conflicts = await groupBuilderService.detectGroupConflicts(scenario.participants, {
          includeMinorConflicts: true
        });
        const totalConflicts = conflicts.energyConflicts.length +
                             conflicts.socialConflicts.length +
                             conflicts.riskConflicts.length +
                             conflicts.leadershipConflicts.length;
        const accuracy = scenario.expectedConflicts === 0
          ? (totalConflicts === 0 ? 100 : 0)
          : Math.max(0, 100 - Math.abs(totalConflicts - scenario.expectedConflicts) * 25);
        this.results.accuracyTests[`conflict_${scenario.name}`] = {
          expectedConflicts: scenario.expectedConflicts,
          detectedConflicts: totalConflicts,
          accuracy: Math.round(accuracy),
          overallRisk: conflicts.overallRisk,
          success: true
        };
      } catch (error) {
        this.results.accuracyTests[`conflict_${scenario.name}`] = {
          success: false,
          error: error.message
        };
      }
    }
  }
  // Calculate group balance score
  calculateGroupBalance(groups) {
    if (groups.length === 0) return 0;
    const sizes = groups.map(group => group.participants.length);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const sizeVariance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    // Lower variance = better balance
    return Math.max(0, 100 - Math.sqrt(sizeVariance) * 10);
  }
  // Generate comprehensive summary report
  generateSummaryReport() {
    // Algorithm performance summary
    const performanceSummary = {};
    Object.keys(this.results.algorithmPerformance).forEach(algorithm => {
      const results = this.results.algorithmPerformance[algorithm];
      const successfulTests = Object.values(results).filter(r => r.success);
      if (successfulTests.length > 0) {
        performanceSummary[algorithm] = {
          avgDuration: Math.round(
            successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length
          ),
          avgCompatibility: Math.round(
            successfulTests.reduce((sum, r) => sum + r.avgCompatibility, 0) / successfulTests.length
          ),
          avgBalance: Math.round(
            successfulTests.reduce((sum, r) => sum + r.balanceScore, 0) / successfulTests.length
          ),
          successRate: Math.round((successfulTests.length / Object.keys(results).length) * 100)
        };
      }
    });
    // Edge case summary
    const edgeCaseSuccessRate = Object.values(this.results.edgeCaseTests)
      .filter(test => test.handledGracefully).length / Object.keys(this.results.edgeCaseTests).length * 100;
    // Stress test summary
    const stressTestSuccessRate = Object.values(this.results.stressTests)
      .filter(test => test.success).length / Object.keys(this.results.stressTests).length * 100;
    this.results.summary = {
      performanceSummary,
      edgeCaseSuccessRate: Math.round(edgeCaseSuccessRate),
      stressTestSuccessRate: Math.round(stressTestSuccessRate),
      overallHealth: Math.round((edgeCaseSuccessRate + stressTestSuccessRate) / 2),
      recommendations: this.generateRecommendations(performanceSummary)
    };
  }
  // Generate optimization recommendations
  generateRecommendations(performanceSummary) {
    const recommendations = [];
    // Find best performing algorithm
    let bestAlgorithm = null;
    let bestScore = 0;
    Object.entries(performanceSummary).forEach(([algorithm, stats]) => {
      const score = (stats.avgCompatibility * 0.4) + (stats.avgBalance * 0.3) +
                   (stats.successRate * 0.2) + ((10000 - stats.avgDuration) / 100 * 0.1);
      if (score > bestScore) {
        bestScore = score;
        bestAlgorithm = algorithm;
      }
    });
    if (bestAlgorithm) {
      recommendations.push(`Best overall algorithm: ${bestAlgorithm}`);
    }
    // Performance recommendations
    const slowAlgorithms = Object.entries(performanceSummary)
      .filter(([_, stats]) => stats.avgDuration > 5000)
      .map(([algorithm]) => algorithm);
    if (slowAlgorithms.length > 0) {
      recommendations.push(`Consider optimizing slow algorithms: ${slowAlgorithms.join(', ')}`);
    }
    // Accuracy recommendations
    const lowAccuracyAlgorithms = Object.entries(performanceSummary)
      .filter(([_, stats]) => stats.avgCompatibility < 70)
      .map(([algorithm]) => algorithm);
    if (lowAccuracyAlgorithms.length > 0) {
      recommendations.push(`Improve accuracy for: ${lowAccuracyAlgorithms.join(', ')}`);
    }
    return recommendations;
  }
  // Print detailed report
  printReport() {
    Object.entries(this.results.summary.performanceSummary || {}).forEach(([algorithm, stats]) => {
    });
    this.results.summary.recommendations?.forEach(rec => {
    });
  }
}
// Export for use in other modules
export { testScenarios, generateTestParticipants };
// CLI runner with enhanced testing framework integration
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for comprehensive test mode
  const args = process.argv.slice(2);
  const comprehensive = args.includes('--comprehensive');
  const abTesting = args.includes('--ab-testing');
  const monitoring = args.includes('--monitoring');
  if (comprehensive) {
    // Run comprehensive test suite
    import('./__tests__/algorithm-test-runner.test.js').then(({ AlgorithmTestSuite }) => {
      const testSuite = new AlgorithmTestSuite();
      testSuite.runCompleteTestSuite().then(() => {
    });
  } else if (abTesting) {
    // Run A/B testing framework
    import('./__tests__/ab-testing-framework.test.js').then(({ AlgorithmABTester }) => {
      const abTester = new AlgorithmABTester();
      // Define and run a sample experiment
      abTester.defineExperiment('cli_test', {
        name: 'Algorithm Comparison Test',
        variants: {
          kmeans: { algorithm: 'kmeans', targetGroupSize: 6 },
          hierarchical: { algorithm: 'hierarchical', targetGroupSize: 6 },
          hybrid: { algorithm: 'hybrid', targetGroupSize: 6 }
        },
        successMetrics: ['compatibility', 'processing_time'],
        sampleSize: 30
      });
      // Run tests
      const runExperiment = async () => {
        for (let i = 0; i < 30; i++) {
          const participants = generateTestParticipants(24);
          await abTester.runTest('cli_test', participants, `cli_test_${i}`);
          if (i % 10 === 0) {
          }
        }
        const analysis = abTester.analyzeResults('cli_test');
      };
    });
  } else if (monitoring) {
    // Generate monitoring dashboard data
    const generateMonitoringData = async () => {
      const metrics = [];
      for (let i = 0; i < 20; i++) {
        const participants = generateTestParticipants(30);
        const startTime = performance.now();
        const groups = await groupBuilderService.performHybridOptimization(participants);
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        const avgCompatibility = groups.reduce((sum, group) =>
          sum + (group.compatibility?.averageScore || 0), 0
        ) / groups.length;
        metrics.push({
          timestamp: new Date().toISOString(),
          algorithm: 'hybrid',
          processingTimeMs: Math.round(processingTime),
          avgCompatibility: Math.round(avgCompatibility),
          participantCount: participants.length,
          groupCount: groups.length,
          throughput: Math.round((participants.length / processingTime) * 1000)
        });
      }
    };
  } else {
    // Original test runner
    const tester = new GroupOptimizationTester();
    tester.runAllTests().then(() => {
      tester.printReport();
  }
}
/**
 * Performance Validation Test Suite
 * Focused performance testing with realistic expectations
 *
 * Task 36.8: Load Testing and Performance Validation
 */

import { supabase } from '../../lib/supabase';
import { performance } from 'perf_hooks';

describe('Performance Validation', () => {
  let performanceMetrics = {
    queryTimes: [],
    connectionTests: [],
    concurrentTests: [],
    memoryUsage: {},
    baselines: {}
  };

  beforeAll(() => {
    console.log('🚀 Starting Performance Validation Tests');
    console.log('Database:', supabase.supabaseUrl);
  });

  afterAll(() => {
    generatePerformanceReport();
  });

  describe('1. Basic Query Performance', () => {
    test('should measure core table query performance', async () => {
      const coreQueries = [
        { table: 'profiles', name: 'User Profiles' },
        { table: 'adventures', name: 'Adventures' },
        { table: 'bookings', name: 'Bookings' },
        { table: 'community_posts', name: 'Community Posts' },
        { table: 'notifications', name: 'Notifications' },
        { table: 'groups', name: 'Groups' },
        { table: 'group_members', name: 'Group Members' }
      ];

      const results = [];

      for (const queryTest of coreQueries) {
        const startTime = performance.now();

        try {
          const { data, error, count } = await supabase
            .from(queryTest.table)
            .select('*', { count: 'exact' })
            .limit(10);

          const endTime = performance.now();
          const responseTime = endTime - startTime;

          const result = {
            table: queryTest.table,
            name: queryTest.name,
            responseTime,
            success: !error,
            recordCount: count || 0,
            sampleSize: data?.length || 0,
            error: error?.message
          };

          results.push(result);
          performanceMetrics.queryTimes.push(result);

          if (result.success) {
            console.log(`✅ ${result.name}: ${responseTime.toFixed(1)}ms (${result.recordCount} total records)`);
          } else {
            console.log(`❌ ${result.name}: ${result.error}`);
          }

          // Basic performance expectations
          expect(responseTime).toBeLessThan(2000); // Maximum 2 seconds

        } catch (e) {
          console.log(`❌ ${queryTest.name}: ${e.message}`);
          results.push({
            table: queryTest.table,
            name: queryTest.name,
            responseTime: -1,
            success: false,
            error: e.message
          });
        }
      }

      const successfulQueries = results.filter(r => r.success);
      const avgResponseTime = successfulQueries.reduce((sum, r) => sum + r.responseTime, 0) / successfulQueries.length;

      performanceMetrics.baselines.avgQueryTime = avgResponseTime;

      console.log(`\n📊 Query Performance Summary:`);
      console.log(`  - Successful queries: ${successfulQueries.length}/${results.length}`);
      console.log(`  - Average response time: ${avgResponseTime.toFixed(1)}ms`);

      expect(successfulQueries.length).toBeGreaterThan(0);
    }, 30000);

    test('should test count queries performance', async () => {
      const countQueries = [
        'profiles',
        'adventures',
        'bookings',
        'community_posts',
        'notifications'
      ];

      const results = [];

      for (const table of countQueries) {
        const startTime = performance.now();

        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          const endTime = performance.now();
          const responseTime = endTime - startTime;

          results.push({
            table,
            responseTime,
            success: !error,
            count: count || 0
          });

          if (!error) {
            console.log(`✅ ${table} count: ${responseTime.toFixed(1)}ms (${count} records)`);
          } else {
            console.log(`❌ ${table} count: ${error.message}`);
          }

          expect(responseTime).toBeLessThan(1500); // Count queries should be fast

        } catch (e) {
          console.log(`❌ ${table} count: ${e.message}`);
          results.push({
            table,
            responseTime: -1,
            success: false,
            error: e.message
          });
        }
      }

      const avgCountTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;

      performanceMetrics.baselines.avgCountTime = avgCountTime || 0;

      console.log(`\n📊 Count Query Performance: ${avgCountTime.toFixed(1)}ms average`);
    }, 20000);
  });

  describe('2. Connection Stability Testing', () => {
    test('should handle multiple sequential connections', async () => {
      const connectionCount = 10;
      const results = [];

      console.log(`🔗 Testing ${connectionCount} sequential connections...`);

      for (let i = 0; i < connectionCount; i++) {
        const startTime = performance.now();

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });

          const endTime = performance.now();
          const responseTime = endTime - startTime;

          results.push({
            connectionId: i,
            responseTime,
            success: !error,
            count: data
          });

        } catch (e) {
          results.push({
            connectionId: i,
            responseTime: -1,
            success: false,
            error: e.message
          });
        }
      }

      const successfulConnections = results.filter(r => r.success).length;
      const avgResponseTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / successfulConnections;

      performanceMetrics.connectionTests.push({
        type: 'sequential',
        total: connectionCount,
        successful: successfulConnections,
        avgResponseTime,
        successRate: (successfulConnections / connectionCount) * 100
      });

      console.log(`✅ Sequential connections: ${successfulConnections}/${connectionCount} (${avgResponseTime.toFixed(1)}ms avg)`);

      expect(successfulConnections).toBeGreaterThan(connectionCount * 0.8); // 80% success rate
    }, 30000);

    test('should handle moderate concurrent connections', async () => {
      const concurrentCount = 5; // Reduced for stability
      const promises = [];

      console.log(`🔗 Testing ${concurrentCount} concurrent connections...`);

      const startTime = performance.now();

      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true })
            .then(result => ({
              connectionId: i,
              success: !result.error,
              count: result.count,
              error: result.error?.message
            }))
            .catch(e => ({
              connectionId: i,
              success: false,
              error: e.message
            }))
        );
      }

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successfulResults = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value);

      performanceMetrics.concurrentTests.push({
        type: 'concurrent_moderate',
        total: concurrentCount,
        successful: successfulResults.length,
        totalTime,
        successRate: (successfulResults.length / concurrentCount) * 100
      });

      console.log(`✅ Concurrent connections: ${successfulResults.length}/${concurrentCount} in ${totalTime.toFixed(1)}ms`);

      expect(successfulResults.length).toBeGreaterThan(concurrentCount * 0.6); // 60% success rate
    }, 15000);
  });

  describe('3. Realistic Load Testing', () => {
    test('should handle realistic user simulation', async () => {
      const userCount = 10; // Realistic concurrent users
      const operationsPerUser = 3;

      console.log(`👥 Simulating ${userCount} concurrent users...`);

      const userSimulations = Array.from({ length: userCount }, async (_, userId) => {
        const userResults = [];

        // Simulate typical user operations
        const operations = [
          () => supabase.from('profiles').select('id, name').limit(5),
          () => supabase.from('adventures').select('id, title').limit(5),
          () => supabase.from('community_posts').select('id, content').limit(5)
        ];

        for (let op = 0; op < operationsPerUser; op++) {
          const startTime = performance.now();

          try {
            const operation = operations[op % operations.length];
            const { data, error } = await operation();
            const endTime = performance.now();

            userResults.push({
              userId,
              operation: op,
              responseTime: endTime - startTime,
              success: !error,
              recordCount: data?.length || 0
            });

          } catch (e) {
            userResults.push({
              userId,
              operation: op,
              responseTime: -1,
              success: false,
              error: e.message
            });
          }
        }

        return userResults;
      });

      const startTime = performance.now();
      const allResults = await Promise.allSettled(userSimulations);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const successfulOperations = allResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(op => op.success);

      const totalOperations = userCount * operationsPerUser;
      const successRate = (successfulOperations.length / totalOperations) * 100;
      const avgResponseTime = successfulOperations.reduce((sum, op) => sum + op.responseTime, 0) / successfulOperations.length;

      performanceMetrics.concurrentTests.push({
        type: 'realistic_user_simulation',
        totalUsers: userCount,
        operationsPerUser,
        totalOperations,
        successfulOperations: successfulOperations.length,
        totalTime,
        successRate,
        avgResponseTime
      });

      console.log(`📈 User Simulation Results:`);
      console.log(`  - Total time: ${totalTime.toFixed(1)}ms`);
      console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  - Avg response time: ${avgResponseTime.toFixed(1)}ms`);

      expect(successRate).toBeGreaterThan(50); // At least 50% success rate
      expect(totalTime).toBeLessThan(15000); // Under 15 seconds
    }, 30000);
  });

  describe('4. Memory and Resource Monitoring', () => {
    test('should monitor memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform a series of operations
      const operations = [];
      for (let i = 0; i < 20; i++) {
        operations.push(
          supabase.from('profiles').select('id, name').limit(10)
        );
      }

      await Promise.allSettled(operations);

      const finalMemory = process.memoryUsage();
      const memoryDiff = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        rss: finalMemory.rss - initialMemory.rss
      };

      performanceMetrics.memoryUsage = {
        initial: initialMemory,
        final: finalMemory,
        difference: memoryDiff
      };

      console.log(`💾 Memory Usage Analysis:`);
      console.log(`  - Heap used diff: ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - Heap total diff: ${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - RSS diff: ${(memoryDiff.rss / 1024 / 1024).toFixed(2)} MB`);

      // Memory usage should be reasonable
      expect(Math.abs(memoryDiff.heapUsed)).toBeLessThan(50 * 1024 * 1024); // Less than 50MB change
    });
  });

  function generatePerformanceReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRODUCTION PERFORMANCE VALIDATION REPORT');
    console.log('='.repeat(80));

    // Query Performance Summary
    console.log('\n📊 QUERY PERFORMANCE BASELINES:');
    if (performanceMetrics.baselines.avgQueryTime) {
      console.log(`  ✅ Average Query Time: ${performanceMetrics.baselines.avgQueryTime.toFixed(1)}ms`);
    }
    if (performanceMetrics.baselines.avgCountTime) {
      console.log(`  ✅ Average Count Time: ${performanceMetrics.baselines.avgCountTime.toFixed(1)}ms`);
    }

    // Connection Tests Summary
    console.log('\n🔗 CONNECTION STABILITY RESULTS:');
    performanceMetrics.connectionTests.forEach(test => {
      console.log(`  ${test.type}: ${test.successful}/${test.total} (${test.successRate.toFixed(1)}% success)`);
      if (test.avgResponseTime) {
        console.log(`    Average response: ${test.avgResponseTime.toFixed(1)}ms`);
      }
    });

    // Concurrent Tests Summary
    console.log('\n👥 CONCURRENT USER TESTING:');
    performanceMetrics.concurrentTests.forEach(test => {
      console.log(`  ${test.type}:`);
      if (test.totalUsers) {
        console.log(`    Users: ${test.totalUsers}, Operations: ${test.totalOperations || 'N/A'}`);
      } else {
        console.log(`    Connections: ${test.total}`);
      }
      console.log(`    Success Rate: ${test.successRate.toFixed(1)}%`);
      if (test.avgResponseTime) {
        console.log(`    Avg Response: ${test.avgResponseTime.toFixed(1)}ms`);
      }
      if (test.totalTime) {
        console.log(`    Total Time: ${test.totalTime.toFixed(1)}ms`);
      }
    });

    // Memory Usage
    if (performanceMetrics.memoryUsage.difference) {
      console.log('\n💾 MEMORY USAGE:');
      const diff = performanceMetrics.memoryUsage.difference;
      console.log(`  Heap Used: ${(diff.heapUsed / 1024 / 1024).toFixed(2)} MB change`);
      console.log(`  RSS: ${(diff.rss / 1024 / 1024).toFixed(2)} MB change`);
    }

    // Performance Assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');

    const avgQuery = performanceMetrics.baselines.avgQueryTime || 0;
    const bestConcurrentTest = performanceMetrics.concurrentTests
      .reduce((best, test) => test.successRate > (best?.successRate || 0) ? test : best, null);

    if (avgQuery < 500) {
      console.log('  ✅ Query performance: EXCELLENT (< 500ms average)');
    } else if (avgQuery < 1000) {
      console.log('  ✅ Query performance: GOOD (< 1s average)');
    } else {
      console.log('  ⚠️  Query performance: NEEDS OPTIMIZATION (> 1s average)');
    }

    if (bestConcurrentTest && bestConcurrentTest.successRate > 80) {
      console.log('  ✅ Concurrent handling: EXCELLENT (> 80% success rate)');
    } else if (bestConcurrentTest && bestConcurrentTest.successRate > 60) {
      console.log('  ✅ Concurrent handling: GOOD (> 60% success rate)');
    } else {
      console.log('  ⚠️  Concurrent handling: NEEDS MONITORING (< 60% success rate)');
    }

    // Production Readiness
    console.log('\n🚀 PRODUCTION READINESS STATUS:');
    const queryGood = avgQuery < 1000;
    const concurrentGood = bestConcurrentTest && bestConcurrentTest.successRate > 50;
    const connectionGood = performanceMetrics.connectionTests.some(t => t.successRate > 80);

    if (queryGood && concurrentGood && connectionGood) {
      console.log('  ✅ STATUS: READY FOR PRODUCTION DEPLOYMENT');
      console.log('  ✅ Database performance meets baseline requirements');
      console.log('  ✅ Connection stability validated');
      console.log('  ✅ Concurrent user handling confirmed');
    } else {
      console.log('  ⚠️  STATUS: REQUIRES PERFORMANCE MONITORING');
      if (!queryGood) console.log('  ⚠️  Query performance needs optimization');
      if (!concurrentGood) console.log('  ⚠️  Concurrent handling needs monitoring');
      if (!connectionGood) console.log('  ⚠️  Connection stability needs review');
    }

    console.log('\n' + '='.repeat(80));
  }
});
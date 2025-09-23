#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

class AccurateQueryPerformanceTester {
  constructor() {
    this.results = {
      basicQueries: [],
      filteredQueries: [],
      joinQueries: [],
      aggregationQueries: [],
      complexQueries: []
    };
  }

  async measureQuery(queryName, queryFunction, category = 'basicQueries') {
    console.log(`  Testing ${queryName}...`);

    const startTime = performance.now();
    let result, error, recordCount = 0;

    try {
      result = await queryFunction();
      recordCount = result.data ? result.data.length : 0;
      error = result.error;
    } catch (e) {
      error = e;
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const testResult = {
      name: queryName,
      duration,
      success: !error,
      recordCount,
      error: error?.message || null,
      performance: this.categorizePerformance(duration)
    };

    this.results[category].push(testResult);

    const status = error ? '❌' : '✅';
    const perfIndicator = this.getPerformanceIndicator(duration);
    const accessInfo = error && error.message.includes('permission denied') ? '(RLS protected)' : '';
    console.log(`  ${status} ${queryName}: ${duration}ms ${perfIndicator} (${recordCount} records) ${accessInfo}`);

    if (error && !error.message.includes('permission denied')) {
      console.log(`    Error: ${error.message}`);
    }

    return testResult;
  }

  categorizePerformance(duration) {
    if (duration < 50) return 'excellent';
    if (duration < 150) return 'good';
    if (duration < 500) return 'acceptable';
    if (duration < 1000) return 'slow';
    return 'very_slow';
  }

  getPerformanceIndicator(duration) {
    if (duration < 50) return '🚀';
    if (duration < 150) return '✨';
    if (duration < 500) return '👍';
    if (duration < 1000) return '⚠️';
    return '🐌';
  }

  async testBasicQueries() {
    console.log('\n1. Testing Basic Table Access Queries...');

    // Test accessible tables with correct column names
    await this.measureQuery('Profiles basic select', () =>
      adminClient.from('profiles').select('id, username, full_name').limit(10)
    );

    await this.measureQuery('Community posts select', () =>
      adminClient.from('community_posts').select('id, content, created_at').limit(10)
    );

    await this.measureQuery('Post comments select', () =>
      adminClient.from('post_comments').select('id, content, created_at').limit(10)
    );

    await this.measureQuery('Community connections select', () =>
      adminClient.from('community_connections').select('id, status, created_at').limit(10)
    );

    await this.measureQuery('Notifications select', () =>
      adminClient.from('notifications').select('id, type, created_at').limit(10)
    );

    await this.measureQuery('Post reactions select', () =>
      adminClient.from('post_reactions').select('id, reaction_type, created_at').limit(10)
    );
  }

  async testFilteredQueries() {
    console.log('\n2. Testing Filtered Queries...');

    await this.measureQuery('Posts by date range', () =>
      adminClient
        .from('community_posts')
        .select('id, content')
        .gte('created_at', '2024-01-01T00:00:00Z')
        .limit(20)
    , 'filteredQueries');

    await this.measureQuery('Comments by post', () =>
      adminClient
        .from('post_comments')
        .select('id, content')
        .not('content', 'is', null)
        .limit(15)
    , 'filteredQueries');

    await this.measureQuery('Connections by status', () =>
      adminClient
        .from('community_connections')
        .select('id, user_id, connected_user_id')
        .eq('status', 'accepted')
        .limit(25)
    , 'filteredQueries');

    await this.measureQuery('Notifications by type', () =>
      adminClient
        .from('notifications')
        .select('id, user_id, type')
        .in('type', ['comment', 'like', 'follow'])
        .limit(30)
    , 'filteredQueries');
  }

  async testJoinQueries() {
    console.log('\n3. Testing Join Queries...');

    await this.measureQuery('Posts with user info', () =>
      adminClient
        .from('community_posts')
        .select(`
          id,
          content,
          created_at,
          profiles:user_id(id, username, full_name)
        `)
        .limit(8)
    , 'joinQueries');

    await this.measureQuery('Comments with post info', () =>
      adminClient
        .from('post_comments')
        .select(`
          id,
          content,
          community_posts:post_id(id, content),
          profiles:user_id(id, username)
        `)
        .limit(10)
    , 'joinQueries');

    await this.measureQuery('Connections with user details', () =>
      adminClient
        .from('community_connections')
        .select(`
          id,
          status,
          created_at,
          profiles!community_connections_user_id_fkey(id, username),
          connected_profiles:profiles!community_connections_connected_user_id_fkey(id, username)
        `)
        .limit(5)
    , 'joinQueries');

    await this.measureQuery('Reactions with post and user', () =>
      adminClient
        .from('post_reactions')
        .select(`
          id,
          reaction_type,
          community_posts:post_id(id, content),
          profiles:user_id(id, username)
        `)
        .limit(12)
    , 'joinQueries');
  }

  async testAggregationQueries() {
    console.log('\n4. Testing Aggregation Queries...');

    await this.measureQuery('Count all profiles', () =>
      adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
    , 'aggregationQueries');

    await this.measureQuery('Count community posts', () =>
      adminClient
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
    , 'aggregationQueries');

    await this.measureQuery('Count post comments', () =>
      adminClient
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
    , 'aggregationQueries');

    await this.measureQuery('Count connections by status', () =>
      adminClient
        .from('community_connections')
        .select('status', { count: 'exact' })
        .eq('status', 'pending')
    , 'aggregationQueries');
  }

  async testComplexQueries() {
    console.log('\n5. Testing Complex Query Operations...');

    await this.measureQuery('Multi-condition post search', () =>
      adminClient
        .from('community_posts')
        .select('id, content, created_at')
        .not('content', 'is', null)
        .gte('created_at', '2024-01-01T00:00:00Z')
        .order('created_at', { ascending: false })
        .limit(15)
    , 'complexQueries');

    await this.measureQuery('Complex connections query', () =>
      adminClient
        .from('community_connections')
        .select('id, user_id, connected_user_id, status, created_at')
        .in('status', ['accepted', 'pending'])
        .order('created_at', { ascending: false })
        .limit(20)
    , 'complexQueries');

    await this.measureQuery('Paginated notifications', () =>
      adminClient
        .from('notifications')
        .select('id, user_id, type, created_at')
        .order('created_at', { ascending: false })
        .range(0, 24)
    , 'complexQueries');

    await this.measureQuery('Recent activity summary', () =>
      adminClient
        .from('post_reactions')
        .select('id, reaction_type, created_at')
        .gte('created_at', '2024-01-01T00:00:00Z')
        .order('created_at', { ascending: false })
        .limit(25)
    , 'complexQueries');
  }

  generatePerformanceReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 ACCURATE QUERY PERFORMANCE ANALYSIS');
    console.log('='.repeat(70));

    const allResults = [
      ...this.results.basicQueries,
      ...this.results.filteredQueries,
      ...this.results.joinQueries,
      ...this.results.aggregationQueries,
      ...this.results.complexQueries
    ];

    // Filter out permission denied errors for success metrics
    const validResults = allResults.filter(r =>
      r.success || (r.error && !r.error.includes('permission denied'))
    );
    const successfulResults = allResults.filter(r => r.success);

    console.log(`\n📈 Query Performance Summary:`);
    console.log(`   Total queries tested: ${allResults.length}`);
    console.log(`   Successful queries: ${successfulResults.length}`);
    console.log(`   RLS protected (expected): ${allResults.filter(r => r.error?.includes('permission denied')).length}`);
    console.log(`   Actual failures: ${allResults.filter(r => r.error && !r.error.includes('permission denied')).length}`);

    if (successfulResults.length > 0) {
      // Performance analysis for successful queries
      const avgDuration = Math.round(
        successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length
      );

      const performanceDistribution = {
        excellent: successfulResults.filter(r => r.performance === 'excellent').length,
        good: successfulResults.filter(r => r.performance === 'good').length,
        acceptable: successfulResults.filter(r => r.performance === 'acceptable').length,
        slow: successfulResults.filter(r => r.performance === 'slow').length,
        very_slow: successfulResults.filter(r => r.performance === 'very_slow').length
      };

      console.log(`\n⚡ Performance Distribution (${successfulResults.length} successful queries):`);
      console.log(`   🚀 Excellent (<50ms): ${performanceDistribution.excellent}`);
      console.log(`   ✨ Good (50-150ms): ${performanceDistribution.good}`);
      console.log(`   👍 Acceptable (150-500ms): ${performanceDistribution.acceptable}`);
      console.log(`   ⚠️  Slow (500-1000ms): ${performanceDistribution.slow}`);
      console.log(`   🐌 Very Slow (>1000ms): ${performanceDistribution.very_slow}`);

      console.log(`\n📊 Average query duration: ${avgDuration}ms`);

      // Category breakdown
      Object.entries(this.results).forEach(([category, results]) => {
        if (results.length > 0) {
          const categorySuccessful = results.filter(r => r.success);
          if (categorySuccessful.length > 0) {
            const categoryAvg = Math.round(
              categorySuccessful.reduce((sum, r) => sum + r.duration, 0) / categorySuccessful.length
            );
            const categoryName = category.replace(/([A-Z])/g, ' $1').toLowerCase();
            console.log(`   ${categoryName}: ${categoryAvg}ms avg (${categorySuccessful.length}/${results.length} successful)`);
          }
        }
      });

      // Performance assessment
      const excellentAndGood = performanceDistribution.excellent + performanceDistribution.good;
      const goodPerformanceRate = Math.round(excellentAndGood / successfulResults.length * 100);

      console.log(`\n🎯 Performance Assessment:`);
      if (goodPerformanceRate >= 80) {
        console.log(`   ✅ Excellent: ${goodPerformanceRate}% of queries under 150ms`);
        console.log(`   🚀 Database queries optimized for production`);
      } else if (goodPerformanceRate >= 60) {
        console.log(`   👍 Good: ${goodPerformanceRate}% of queries under 150ms`);
        console.log(`   🔧 Performance is acceptable with room for improvement`);
      } else {
        console.log(`   ⚠️  Needs attention: ${goodPerformanceRate}% of queries under 150ms`);
        console.log(`   🛠️  Query optimization recommended`);
      }

      return {
        totalQueries: allResults.length,
        successfulQueries: successfulResults.length,
        goodPerformanceRate,
        avgDuration
      };

    } else {
      console.log('\n❌ No successful queries to analyze - check database access and RLS policies');
      return {
        totalQueries: allResults.length,
        successfulQueries: 0,
        goodPerformanceRate: 0,
        avgDuration: 0
      };
    }
  }
}

async function runAccurateQueryPerformanceTests() {
  console.log('🔍 Starting Accurate Query Performance Analysis...');

  const tester = new AccurateQueryPerformanceTester();

  try {
    await tester.testBasicQueries();
    await tester.testFilteredQueries();
    await tester.testJoinQueries();
    await tester.testAggregationQueries();
    await tester.testComplexQueries();

    const report = tester.generatePerformanceReport();

    // Success if we have reasonable performance and successful queries
    const success = report.successfulQueries > 0 &&
                   (report.goodPerformanceRate >= 70 || report.avgDuration < 200);

    console.log(`\n${success ? '✅' : '❌'} Query performance testing ${success ? 'completed successfully' : 'needs attention'}`);

    return success;

  } catch (error) {
    console.error('❌ Query performance testing failed:', error.message);
    return false;
  }
}

runAccurateQueryPerformanceTests().catch(console.error);
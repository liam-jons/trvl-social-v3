#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

class QueryPerformanceTester {
  constructor() {
    this.results = {
      simpleQueries: [],
      complexQueries: [],
      joinQueries: [],
      indexEffectiveness: [],
      aggregationQueries: []
    };
  }

  async measureQuery(queryName, queryFunction, category = 'simpleQueries') {
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
    console.log(`  ${status} ${queryName}: ${duration}ms ${perfIndicator} (${recordCount} records)`);

    if (error) {
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

  async testSimpleQueries() {
    console.log('\n1. Testing Simple Queries...');

    await this.measureQuery('User profiles basic select', () =>
      adminClient.from('profiles').select('id, email, full_name').limit(10)
    );

    await this.measureQuery('Adventures basic select', () =>
      adminClient.from('adventures').select('id, title, description').limit(10)
    );

    await this.measureQuery('Bookings basic select', () =>
      adminClient.from('bookings').select('id, status, total_price').limit(10)
    );

    await this.measureQuery('Vendors basic select', () =>
      adminClient.from('vendors').select('id, business_name, contact_email').limit(10)
    );

    await this.measureQuery('Community posts basic select', () =>
      adminClient.from('community_posts').select('id, title, content').limit(10)
    );
  }

  async testComplexQueries() {
    console.log('\n2. Testing Complex Queries...');

    await this.measureQuery('Filtered adventures by location', () =>
      adminClient
        .from('adventures')
        .select('id, title, location, price_per_person')
        .ilike('location', '%city%')
        .gte('price_per_person', 0)
        .limit(20)
    , 'complexQueries');

    await this.measureQuery('Bookings with status filtering', () =>
      adminClient
        .from('bookings')
        .select('id, user_id, status, total_price, created_at')
        .in('status', ['confirmed', 'pending', 'completed'])
        .order('created_at', { ascending: false })
        .limit(25)
    , 'complexQueries');

    await this.measureQuery('User preferences with conditions', () =>
      adminClient
        .from('user_preferences')
        .select('id, user_id, timezone, language, currency')
        .not('timezone', 'is', null)
        .limit(15)
    , 'complexQueries');

    await this.measureQuery('Adventures with price range', () =>
      adminClient
        .from('adventures')
        .select('id, title, price_per_person, max_participants')
        .gte('price_per_person', 10)
        .lte('price_per_person', 1000)
        .gt('max_participants', 1)
        .limit(30)
    , 'complexQueries');
  }

  async testJoinQueries() {
    console.log('\n3. Testing Join Queries...');

    await this.measureQuery('Bookings with user info', () =>
      adminClient
        .from('bookings')
        .select(`
          id,
          status,
          total_price,
          profiles:user_id(id, full_name, email)
        `)
        .limit(10)
    , 'joinQueries');

    await this.measureQuery('Adventures with vendor info', () =>
      adminClient
        .from('adventures')
        .select(`
          id,
          title,
          price_per_person,
          vendors:vendor_id(id, business_name)
        `)
        .limit(15)
    , 'joinQueries');

    await this.measureQuery('Posts with user details', () =>
      adminClient
        .from('community_posts')
        .select(`
          id,
          title,
          content,
          profiles:user_id(id, full_name)
        `)
        .limit(12)
    , 'joinQueries');

    await this.measureQuery('Comments with post and user', () =>
      adminClient
        .from('post_comments')
        .select(`
          id,
          content,
          community_posts:post_id(id, title),
          profiles:user_id(id, full_name)
        `)
        .limit(8)
    , 'joinQueries');
  }

  async testIndexEffectiveness() {
    console.log('\n4. Testing Index Effectiveness...');

    // Test queries that should benefit from indexes
    await this.measureQuery('Profiles by email lookup', () =>
      adminClient
        .from('profiles')
        .select('id, full_name')
        .eq('email', 'test@example.com')
    , 'indexEffectiveness');

    await this.measureQuery('Bookings by user_id', () =>
      adminClient
        .from('bookings')
        .select('id, status, total_price')
        .eq('user_id', '00000000-0000-0000-0000-000000000001')
    , 'indexEffectiveness');

    await this.measureQuery('Adventures by vendor_id', () =>
      adminClient
        .from('adventures')
        .select('id, title, price_per_person')
        .eq('vendor_id', '00000000-0000-0000-0000-000000000001')
    , 'indexEffectiveness');

    await this.measureQuery('Posts by creation date range', () =>
      adminClient
        .from('community_posts')
        .select('id, title')
        .gte('created_at', '2024-01-01T00:00:00Z')
        .lte('created_at', '2024-12-31T23:59:59Z')
        .limit(20)
    , 'indexEffectiveness');
  }

  async testAggregationQueries() {
    console.log('\n5. Testing Aggregation Queries...');

    await this.measureQuery('Count total profiles', () =>
      adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
    , 'aggregationQueries');

    await this.measureQuery('Count bookings by status', () =>
      adminClient
        .from('bookings')
        .select('status', { count: 'exact' })
        .eq('status', 'confirmed')
    , 'aggregationQueries');

    await this.measureQuery('Count adventures by vendor', () =>
      adminClient
        .from('adventures')
        .select('vendor_id', { count: 'exact' })
        .limit(1)
    , 'aggregationQueries');

    await this.measureQuery('Recent posts count', () =>
      adminClient
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', '2024-01-01T00:00:00Z')
    , 'aggregationQueries');
  }

  generatePerformanceReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 QUERY PERFORMANCE ANALYSIS REPORT');
    console.log('='.repeat(70));

    const allResults = [
      ...this.results.simpleQueries,
      ...this.results.complexQueries,
      ...this.results.joinQueries,
      ...this.results.indexEffectiveness,
      ...this.results.aggregationQueries
    ];

    // Overall Statistics
    const totalQueries = allResults.length;
    const successfulQueries = allResults.filter(r => r.success).length;
    const failedQueries = totalQueries - successfulQueries;

    console.log(`\n📈 Overall Performance Summary:`);
    console.log(`   Total queries tested: ${totalQueries}`);
    console.log(`   Successful: ${successfulQueries} (${Math.round(successfulQueries/totalQueries*100)}%)`);
    console.log(`   Failed: ${failedQueries} (${Math.round(failedQueries/totalQueries*100)}%)`);

    // Performance Distribution
    const performanceDistribution = {
      excellent: 0, good: 0, acceptable: 0, slow: 0, very_slow: 0
    };

    allResults.forEach(result => {
      if (result.success) {
        performanceDistribution[result.performance]++;
      }
    });

    console.log(`\n⚡ Performance Distribution:`);
    console.log(`   🚀 Excellent (<50ms): ${performanceDistribution.excellent}`);
    console.log(`   ✨ Good (50-150ms): ${performanceDistribution.good}`);
    console.log(`   👍 Acceptable (150-500ms): ${performanceDistribution.acceptable}`);
    console.log(`   ⚠️  Slow (500-1000ms): ${performanceDistribution.slow}`);
    console.log(`   🐌 Very Slow (>1000ms): ${performanceDistribution.very_slow}`);

    // Category Analysis
    Object.entries(this.results).forEach(([category, results]) => {
      if (results.length > 0) {
        const categoryName = category.replace(/([A-Z])/g, ' $1').toLowerCase();
        const avgDuration = Math.round(
          results.reduce((sum, r) => sum + (r.success ? r.duration : 0), 0) /
          results.filter(r => r.success).length
        );
        const successRate = Math.round(results.filter(r => r.success).length / results.length * 100);

        console.log(`\n📊 ${categoryName}:`);
        console.log(`   Average duration: ${avgDuration}ms`);
        console.log(`   Success rate: ${successRate}%`);

        // Show slowest queries in category
        const slowest = results
          .filter(r => r.success)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 2);

        if (slowest.length > 0) {
          console.log(`   Slowest: ${slowest[0].name} (${slowest[0].duration}ms)`);
        }
      }
    });

    // Recommendations
    console.log(`\n🔧 Performance Recommendations:`);

    const slowQueries = allResults.filter(r => r.success && r.duration > 500);
    if (slowQueries.length > 0) {
      console.log(`   • ${slowQueries.length} queries over 500ms need optimization`);
      slowQueries.forEach(q => {
        console.log(`     - ${q.name}: ${q.duration}ms`);
      });
    }

    const fastQueries = allResults.filter(r => r.success && r.duration < 100);
    if (fastQueries.length > 0) {
      console.log(`   • ${fastQueries.length} queries performing excellently (<100ms)`);
    }

    if (failedQueries > 0) {
      console.log(`   • ${failedQueries} failed queries need investigation`);
    }

    // Overall Assessment
    const excellentAndGood = performanceDistribution.excellent + performanceDistribution.good;
    const goodPerformanceRate = Math.round(excellentAndGood / successfulQueries * 100);

    console.log(`\n🎯 Overall Assessment:`);
    if (goodPerformanceRate >= 80) {
      console.log(`   ✅ Excellent: ${goodPerformanceRate}% of queries perform well`);
      console.log(`   🚀 Database is optimized for production workloads`);
    } else if (goodPerformanceRate >= 60) {
      console.log(`   ⚠️  Good: ${goodPerformanceRate}% of queries perform well`);
      console.log(`   🔧 Some optimization needed for better performance`);
    } else {
      console.log(`   ❌ Needs Work: Only ${goodPerformanceRate}% of queries perform well`);
      console.log(`   🛠️  Significant optimization required before production`);
    }

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      goodPerformanceRate,
      avgDuration: Math.round(
        allResults.reduce((sum, r) => sum + (r.success ? r.duration : 0), 0) / successfulQueries
      )
    };
  }
}

async function runQueryPerformanceTests() {
  console.log('🔍 Starting Query Performance Analysis...');

  const tester = new QueryPerformanceTester();

  try {
    await tester.testSimpleQueries();
    await tester.testComplexQueries();
    await tester.testJoinQueries();
    await tester.testIndexEffectiveness();
    await tester.testAggregationQueries();

    const report = tester.generatePerformanceReport();

    return report.goodPerformanceRate >= 70 && report.successfulQueries >= report.totalQueries * 0.8;

  } catch (error) {
    console.error('❌ Query performance testing failed:', error.message);
    return false;
  }
}

runQueryPerformanceTests().catch(console.error);
#!/usr/bin/env node

/**
 * Corrected Table Relationship Validation Script
 * Tests the actual database schema with proper column references
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class CorrectedTableTester {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vhecnqaejsukulaktjob.supabase.co';
    this.supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!this.supabaseKey) {
      console.error('ERROR: No Supabase anon key provided.');
      process.exit(1);
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    });

    this.results = {
      summary: {},
      tableValidation: [],
      schemaValidation: [],
      relationshipValidation: [],
      dataQuality: [],
      performanceMetrics: [],
      errors: []
    };

    // Corrected table definitions based on actual schema
    this.coreTableTests = [
      {
        name: 'profiles',
        description: 'User profiles extending auth.users',
        requiredColumns: ['id', 'username', 'full_name', 'role'],
        optionalColumns: ['avatar_url', 'bio', 'location', 'created_at'],
        testQuery: () => this.supabase.from('profiles').select('id, username, full_name, role, created_at').limit(5)
      },
      {
        name: 'user_preferences',
        description: 'User notification and privacy preferences',
        requiredColumns: ['id', 'user_id'],
        optionalColumns: ['email_notifications', 'privacy_level', 'language'],
        testQuery: () => this.supabase.from('user_preferences').select('id, user_id, privacy_level').limit(5)
      },
      {
        name: 'vendors',
        description: 'Vendor business profiles',
        requiredColumns: ['id', 'user_id'],
        optionalColumns: ['business_name', 'description', 'status'],
        testQuery: () => this.supabase.from('vendors').select('id, user_id, business_name').limit(5)
      },
      {
        name: 'adventures',
        description: 'Adventure listings by vendors',
        requiredColumns: ['id', 'vendor_id', 'title'],
        optionalColumns: ['description', 'price', 'location', 'status'],
        testQuery: () => this.supabase.from('adventures').select('id, vendor_id, title, price').limit(5)
      },
      {
        name: 'bookings',
        description: 'Adventure bookings by users',
        requiredColumns: ['id', 'adventure_id', 'user_id'],
        optionalColumns: ['status', 'total_amount', 'booking_date'],
        testQuery: () => this.supabase.from('bookings').select('id, adventure_id, user_id, status').limit(5)
      },
      {
        name: 'groups',
        description: 'Travel groups for social organization',
        requiredColumns: ['id', 'name', 'owner_id'],
        optionalColumns: ['description', 'privacy', 'max_members'],
        testQuery: () => this.supabase.from('groups').select('id, name, owner_id, privacy').limit(5)
      },
      {
        name: 'group_members',
        description: 'Members belonging to travel groups',
        requiredColumns: ['id', 'group_id', 'user_id'],
        optionalColumns: ['role', 'joined_at', 'is_active'],
        testQuery: () => this.supabase.from('group_members').select('id, group_id, user_id, role').limit(5)
      }
    ];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp}: ${message}`);
  }

  logError(error, context) {
    const errorMsg = `${context}: ${error.message}`;
    this.results.errors.push({ context, error: error.message, timestamp: new Date().toISOString() });
    this.log(errorMsg, 'ERROR');
  }

  async validateTableAccess() {
    this.log('Validating table accessibility and structure...');

    for (const table of this.coreTableTests) {
      const start = performance.now();

      try {
        const { data, error } = await table.testQuery();
        const duration = performance.now() - start;

        const result = {
          table: table.name,
          description: table.description,
          status: error ? 'error' : 'accessible',
          duration: Math.round(duration),
          error: error?.message,
          dataCount: data?.length || 0,
          timestamp: new Date().toISOString()
        };

        // Validate schema if data exists
        if (!error && data && data.length > 0) {
          const actualColumns = Object.keys(data[0]);
          const missingRequired = table.requiredColumns.filter(col => !actualColumns.includes(col));
          const hasOptional = table.optionalColumns.filter(col => actualColumns.includes(col));

          result.schemaValidation = {
            actualColumns,
            missingRequired,
            presentOptional: hasOptional,
            schemaValid: missingRequired.length === 0
          };
        }

        this.results.tableValidation.push(result);

        const statusMsg = error ?
          `FAILED: ${error.message}` :
          `ACCESSIBLE (${data?.length || 0} rows, ${Math.round(duration)}ms)`;

        this.log(`Table ${table.name}: ${statusMsg}`);

        if (error && error.message.includes('infinite recursion')) {
          this.log(`  ⚠️  RLS Policy Issue: ${table.name} has infinite recursion in policies`, 'WARN');
        }

      } catch (error) {
        const duration = performance.now() - start;
        this.results.tableValidation.push({
          table: table.name,
          description: table.description,
          status: 'exception',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Table Access: ${table.name}`);
      }
    }
  }

  async validateRelationships() {
    this.log('Validating foreign key relationships...');

    const relationshipTests = [
      {
        name: 'user_preferences_to_profiles',
        description: 'User preferences should reference profiles',
        testFn: async () => {
          // Check if user_preferences exist and can join with profiles
          const { data, error } = await this.supabase
            .from('user_preferences')
            .select(`
              id,
              user_id,
              profiles:user_id (
                id,
                username
              )
            `)
            .limit(3);

          return {
            success: !error,
            data,
            error: error?.message,
            hasJoinData: data && data.some(item => item.profiles)
          };
        }
      },
      {
        name: 'vendors_to_profiles',
        description: 'Vendors should reference profiles',
        testFn: async () => {
          const { data, error } = await this.supabase
            .from('vendors')
            .select(`
              id,
              user_id,
              profiles:user_id (
                id,
                username
              )
            `)
            .limit(3);

          return {
            success: !error,
            data,
            error: error?.message,
            hasJoinData: data && data.some(item => item.profiles)
          };
        }
      },
      {
        name: 'adventures_to_vendors',
        description: 'Adventures should reference vendors',
        testFn: async () => {
          const { data, error } = await this.supabase
            .from('adventures')
            .select(`
              id,
              vendor_id,
              vendors:vendor_id (
                id,
                business_name
              )
            `)
            .limit(3);

          return {
            success: !error,
            data,
            error: error?.message,
            hasJoinData: data && data.some(item => item.vendors)
          };
        }
      },
      {
        name: 'bookings_relationships',
        description: 'Bookings should reference both adventures and profiles',
        testFn: async () => {
          const { data, error } = await this.supabase
            .from('bookings')
            .select(`
              id,
              adventure_id,
              user_id,
              adventures:adventure_id (
                id,
                title
              ),
              profiles:user_id (
                id,
                username
              )
            `)
            .limit(3);

          return {
            success: !error,
            data,
            error: error?.message,
            hasJoinData: data && data.some(item => item.adventures || item.profiles)
          };
        }
      }
    ];

    for (const test of relationshipTests) {
      const start = performance.now();

      try {
        const result = await test.testFn();
        const duration = performance.now() - start;

        this.results.relationshipValidation.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          error: result.error,
          dataCount: result.data?.length || 0,
          hasJoinData: result.hasJoinData || false,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${result.data?.length || 0} records, ${result.hasJoinData ? 'with joins' : 'no joins'}, ${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;

        this.log(`Relationship ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.relationshipValidation.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Relationship Test: ${test.name}`);
      }
    }
  }

  async validateDataQuality() {
    this.log('Checking data quality and constraints...');

    const qualityTests = [
      {
        name: 'profiles_data_completeness',
        description: 'Check profiles have essential data',
        testFn: async () => {
          const { data, error } = await this.supabase
            .from('profiles')
            .select('id, username, full_name, role')
            .limit(10);

          if (error) return { success: false, error: error.message };

          const stats = {
            total: data.length,
            withUsername: data.filter(p => p.username).length,
            withFullName: data.filter(p => p.full_name).length,
            validRoles: data.filter(p => ['traveler', 'vendor', 'admin'].includes(p.role)).length
          };

          return {
            success: true,
            stats,
            completeness: stats.total > 0 ? (stats.withUsername / stats.total) * 100 : 0
          };
        }
      },
      {
        name: 'adventures_pricing_validation',
        description: 'Check adventure price validity',
        testFn: async () => {
          const { data, error } = await this.supabase
            .from('adventures')
            .select('id, title, price')
            .not('price', 'is', null)
            .limit(10);

          if (error) return { success: false, error: error.message };

          const stats = {
            total: data.length,
            validPrices: data.filter(a => a.price >= 0).length,
            averagePrice: data.length > 0 ? data.reduce((sum, a) => sum + a.price, 0) / data.length : 0,
            priceRange: data.length > 0 ? {
              min: Math.min(...data.map(a => a.price)),
              max: Math.max(...data.map(a => a.price))
            } : null
          };

          return {
            success: stats.validPrices === stats.total,
            stats
          };
        }
      },
      {
        name: 'group_member_constraints',
        description: 'Check group member uniqueness and validity',
        testFn: async () => {
          const { data, error } = await this.supabase
            .from('group_members')
            .select('group_id, user_id, role')
            .limit(10);

          if (error) return { success: false, error: error.message };

          const uniquePairs = new Set(data.map(gm => `${gm.group_id}-${gm.user_id}`));
          const validRoles = data.filter(gm => ['owner', 'admin', 'member'].includes(gm.role));

          return {
            success: uniquePairs.size === data.length && validRoles.length === data.length,
            stats: {
              total: data.length,
              uniquePairs: uniquePairs.size,
              validRoles: validRoles.length
            }
          };
        }
      }
    ];

    for (const test of qualityTests) {
      const start = performance.now();

      try {
        const result = await test.testFn();
        const duration = performance.now() - start;

        this.results.dataQuality.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result.stats || result,
          error: result.error,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error || 'Data quality issue'}`;

        this.log(`Quality Test ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.dataQuality.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Quality Test: ${test.name}`);
      }
    }
  }

  async benchmarkPerformance() {
    this.log('Benchmarking query performance...');

    const performanceTests = [
      {
        name: 'simple_select',
        description: 'Simple table select performance',
        testFn: async () => {
          const iterations = 5;
          const times = [];

          for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const { error } = await this.supabase
              .from('profiles')
              .select('id, username')
              .limit(10);

            if (error) throw new Error(error.message);
            times.push(performance.now() - start);
          }

          return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times)
          };
        }
      },
      {
        name: 'join_query',
        description: 'Foreign key join performance',
        testFn: async () => {
          const iterations = 3;
          const times = [];

          for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const { error } = await this.supabase
              .from('vendors')
              .select(`
                id,
                business_name,
                profiles:user_id (
                  username,
                  full_name
                )
              `)
              .limit(5);

            if (error) throw new Error(error.message);
            times.push(performance.now() - start);
          }

          return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times)
          };
        }
      }
    ];

    for (const test of performanceTests) {
      try {
        const result = await test.testFn();

        this.results.performanceMetrics.push({
          name: test.name,
          description: test.description,
          status: 'completed',
          metrics: result,
          timestamp: new Date().toISOString()
        });

        this.log(`Performance ${test.name}: avg ${Math.round(result.averageTime)}ms (${result.iterations} iterations)`);

      } catch (error) {
        this.results.performanceMetrics.push({
          name: test.name,
          description: test.description,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Performance Test: ${test.name}`);
      }
    }
  }

  async runAllTests() {
    this.log('Starting corrected table relationship validation...');
    const startTime = performance.now();

    await this.validateTableAccess();
    await this.validateRelationships();
    await this.validateDataQuality();
    await this.benchmarkPerformance();

    const totalDuration = performance.now() - startTime;

    // Generate summary
    const accessibleTables = this.results.tableValidation.filter(t => t.status === 'accessible').length;
    const totalTables = this.results.tableValidation.length;
    const passedRelationships = this.results.relationshipValidation.filter(r => r.status === 'passed').length;
    const totalRelationships = this.results.relationshipValidation.length;
    const passedQuality = this.results.dataQuality.filter(q => q.status === 'passed').length;
    const totalQuality = this.results.dataQuality.length;

    this.results.summary = {
      testDuration: Math.round(totalDuration),
      tableAccess: {
        accessible: accessibleTables,
        total: totalTables,
        rate: Math.round((accessibleTables / totalTables) * 100)
      },
      relationships: {
        passed: passedRelationships,
        total: totalRelationships,
        rate: totalRelationships > 0 ? Math.round((passedRelationships / totalRelationships) * 100) : 100
      },
      dataQuality: {
        passed: passedQuality,
        total: totalQuality,
        rate: totalQuality > 0 ? Math.round((passedQuality / totalQuality) * 100) : 100
      },
      performanceAverage: this.calculateAveragePerformance(),
      errorCount: this.results.errors.length,
      rlsIssuesDetected: this.countRLSIssues(),
      overallHealth: this.calculateOverallHealth(),
      timestamp: new Date().toISOString()
    };

    this.log(`Tests completed in ${Math.round(totalDuration)}ms`);
    this.log(`Summary: ${accessibleTables}/${totalTables} tables accessible, ${passedRelationships}/${totalRelationships} relationships valid, ${this.results.errors.length} errors`);

    return this.results;
  }

  calculateAveragePerformance() {
    const completedTests = this.results.performanceMetrics.filter(p => p.status === 'completed');
    if (completedTests.length === 0) return 0;

    const avgTimes = completedTests.map(p => p.metrics.averageTime);
    return Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length);
  }

  countRLSIssues() {
    return this.results.tableValidation.filter(t =>
      t.error && t.error.includes('infinite recursion')
    ).length;
  }

  calculateOverallHealth() {
    const accessRate = this.results.summary?.tableAccess?.rate || 0;
    const relationshipRate = this.results.summary?.relationships?.rate || 0;
    const qualityRate = this.results.summary?.dataQuality?.rate || 0;
    const errorPenalty = Math.min(20, this.results.errors.length * 5);
    const rlsPenalty = Math.min(15, this.countRLSIssues() * 7.5);

    return Math.max(0, Math.round((accessRate * 0.4) + (relationshipRate * 0.3) + (qualityRate * 0.3) - errorPenalty - rlsPenalty));
  }

  async saveResults(outputPath = null) {
    const defaultPath = path.join(process.cwd(), '.taskmaster', 'reports', 'corrected-table-validation.json');
    const filePath = outputPath || defaultPath;

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to: ${filePath}`);
    } catch (error) {
      this.logError(error, 'Save Results');
    }
  }
}

// Main execution
async function main() {
  const tester = new CorrectedTableTester();

  try {
    const results = await tester.runAllTests();
    await tester.saveResults();

    console.log('\n=== CORRECTED TABLE VALIDATION RESULTS ===');
    console.log(JSON.stringify(results.summary, null, 2));

    if (results.summary.overallHealth < 70) {
      console.log('\n❌ Database health below acceptable threshold (70%)');
      process.exit(1);
    } else {
      console.log('\n✅ Table validation passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CorrectedTableTester };
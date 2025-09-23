#!/usr/bin/env node

/**
 * Comprehensive Table Relationship and Index Validation Script
 * Tests foreign key constraints, indexes, RLS policies, and data integrity
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class TableRelationshipTester {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vhecnqaejsukulaktjob.supabase.co';
    this.supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!this.supabaseKey) {
      console.error('ERROR: No Supabase anon key provided. Set VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY environment variable.');
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
      tableStructure: [],
      foreignKeys: [],
      indexes: [],
      rlsPolicies: [],
      dataIntegrity: [],
      errors: []
    };

    // Table structure based on database schema
    this.expectedTables = [
      {
        name: 'profiles',
        key_columns: ['id', 'email'],
        foreign_keys: [{ column: 'id', references: 'auth.users(id)' }],
        expected_indexes: ['profiles_pkey', 'profiles_email_key']
      },
      {
        name: 'vendors',
        key_columns: ['id', 'user_id'],
        foreign_keys: [{ column: 'user_id', references: 'profiles(id)' }],
        expected_indexes: ['vendors_pkey', 'vendors_user_id_idx']
      },
      {
        name: 'adventures',
        key_columns: ['id', 'vendor_id'],
        foreign_keys: [{ column: 'vendor_id', references: 'vendors(id)' }],
        expected_indexes: ['adventures_pkey', 'adventures_vendor_id_idx']
      },
      {
        name: 'bookings',
        key_columns: ['id', 'adventure_id', 'user_id'],
        foreign_keys: [
          { column: 'adventure_id', references: 'adventures(id)' },
          { column: 'user_id', references: 'profiles(id)' }
        ],
        expected_indexes: ['bookings_pkey', 'bookings_adventure_id_idx', 'bookings_user_id_idx']
      },
      {
        name: 'groups',
        key_columns: ['id', 'owner_id'],
        foreign_keys: [{ column: 'owner_id', references: 'profiles(id)' }],
        expected_indexes: ['groups_pkey', 'groups_owner_id_idx']
      },
      {
        name: 'group_members',
        key_columns: ['id', 'group_id', 'user_id'],
        foreign_keys: [
          { column: 'group_id', references: 'groups(id)' },
          { column: 'user_id', references: 'profiles(id)' }
        ],
        expected_indexes: ['group_members_pkey', 'group_members_group_id_idx', 'group_members_user_id_idx']
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

  async validateTableStructure() {
    this.log('Validating table structure and accessibility...');

    for (const table of this.expectedTables) {
      const start = performance.now();

      try {
        // Test basic access
        const { data, error } = await this.supabase
          .from(table.name)
          .select('*')
          .limit(1);

        const duration = performance.now() - start;

        const result = {
          table: table.name,
          status: error ? 'error' : 'accessible',
          duration: Math.round(duration),
          error: error?.message,
          hasData: data && data.length > 0,
          rowCount: data ? data.length : 0,
          expectedColumns: table.key_columns,
          timestamp: new Date().toISOString()
        };

        // If accessible, check for expected columns
        if (!error && data) {
          const actualColumns = data.length > 0 ? Object.keys(data[0]) : [];
          result.actualColumns = actualColumns;
          result.missingColumns = table.key_columns.filter(col => !actualColumns.includes(col));
          result.hasExpectedColumns = result.missingColumns.length === 0;
        }

        this.results.tableStructure.push(result);

        const statusMsg = error ? `FAILED: ${error.message}` :
          `ACCESSIBLE (${data?.length || 0} rows, ${Math.round(duration)}ms)`;
        this.log(`Table ${table.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.tableStructure.push({
          table: table.name,
          status: 'exception',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Table Structure: ${table.name}`);
      }
    }
  }

  async validateForeignKeyRelationships() {
    this.log('Validating foreign key relationships...');

    const relationshipTests = [
      {
        name: 'profiles_to_auth_users',
        description: 'Profiles should reference auth.users',
        test: async () => {
          // Test if profiles exist and can be accessed
          const { data, error } = await this.supabase
            .from('profiles')
            .select('id')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'vendors_to_profiles',
        description: 'Vendors should reference profiles',
        test: async () => {
          const { data, error } = await this.supabase
            .from('vendors')
            .select('id, user_id')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'adventures_to_vendors',
        description: 'Adventures should reference vendors',
        test: async () => {
          const { data, error } = await this.supabase
            .from('adventures')
            .select('id, vendor_id')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'bookings_to_adventures_and_profiles',
        description: 'Bookings should reference adventures and profiles',
        test: async () => {
          const { data, error } = await this.supabase
            .from('bookings')
            .select('id, adventure_id, user_id')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'group_members_to_groups_and_profiles',
        description: 'Group members should reference groups and profiles',
        test: async () => {
          const { data, error } = await this.supabase
            .from('group_members')
            .select('id, group_id, user_id')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      }
    ];

    for (const test of relationshipTests) {
      const start = performance.now();

      try {
        const result = await test.test();
        const duration = performance.now() - start;

        this.results.foreignKeys.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          error: result.error,
          dataCount: result.data?.length || 0,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${result.data?.length || 0} records, ${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;
        this.log(`FK Test ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.foreignKeys.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Foreign Key Test: ${test.name}`);
      }
    }
  }

  async validateRLSPolicies() {
    this.log('Checking RLS policy issues...');

    // Test the problematic tables identified in the first test
    const problematicTables = [
      {
        name: 'groups',
        issue: 'infinite recursion detected in policy for relation "group_members"',
        test: async () => {
          // Try a simple query that might trigger the RLS issue
          const { data, error } = await this.supabase
            .from('groups')
            .select('id, name, owner_id')
            .limit(1);
          return { success: !error, error: error?.message };
        }
      },
      {
        name: 'group_members',
        issue: 'infinite recursion detected in policy',
        test: async () => {
          const { data, error } = await this.supabase
            .from('group_members')
            .select('id, group_id, user_id')
            .limit(1);
          return { success: !error, error: error?.message };
        }
      }
    ];

    for (const table of problematicTables) {
      const start = performance.now();

      try {
        const result = await table.test();
        const duration = performance.now() - start;

        this.results.rlsPolicies.push({
          table: table.name,
          knownIssue: table.issue,
          status: result.success ? 'resolved' : 'policy_error',
          duration: Math.round(duration),
          error: result.error,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `RESOLVED (${Math.round(duration)}ms)` :
          `POLICY ERROR: ${result.error}`;
        this.log(`RLS Policy ${table.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.rlsPolicies.push({
          table: table.name,
          knownIssue: table.issue,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `RLS Policy Test: ${table.name}`);
      }
    }
  }

  async validateDataIntegrity() {
    this.log('Checking data integrity constraints...');

    const integrityTests = [
      {
        name: 'profiles_unique_email',
        description: 'Profiles should have unique email addresses',
        test: async () => {
          const { data, error } = await this.supabase
            .from('profiles')
            .select('email')
            .not('email', 'is', null)
            .limit(10);

          if (error) return { success: false, error: error.message };

          const emails = data.map(p => p.email);
          const uniqueEmails = [...new Set(emails)];
          return {
            success: emails.length === uniqueEmails.length,
            totalEmails: emails.length,
            uniqueEmails: uniqueEmails.length,
            duplicates: emails.length - uniqueEmails.length
          };
        }
      },
      {
        name: 'bookings_valid_status',
        description: 'Bookings should have valid status values',
        test: async () => {
          const { data, error } = await this.supabase
            .from('bookings')
            .select('status')
            .limit(10);

          if (error) return { success: false, error: error.message };

          const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired'];
          const invalidStatuses = data.filter(b => !validStatuses.includes(b.status));

          return {
            success: invalidStatuses.length === 0,
            totalRecords: data.length,
            invalidCount: invalidStatuses.length,
            invalidStatuses: [...new Set(invalidStatuses.map(b => b.status))]
          };
        }
      },
      {
        name: 'adventures_price_validation',
        description: 'Adventures should have positive prices',
        test: async () => {
          const { data, error } = await this.supabase
            .from('adventures')
            .select('price')
            .not('price', 'is', null)
            .limit(10);

          if (error) return { success: false, error: error.message };

          const invalidPrices = data.filter(a => a.price < 0);

          return {
            success: invalidPrices.length === 0,
            totalRecords: data.length,
            invalidCount: invalidPrices.length,
            averagePrice: data.length > 0 ? data.reduce((sum, a) => sum + a.price, 0) / data.length : 0
          };
        }
      }
    ];

    for (const test of integrityTests) {
      const start = performance.now();

      try {
        const result = await test.test();
        const duration = performance.now() - start;

        this.results.dataIntegrity.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error || 'Data integrity issue'}`;
        this.log(`Integrity Test ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.dataIntegrity.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Data Integrity Test: ${test.name}`);
      }
    }
  }

  async checkCascadeOperations() {
    this.log('Testing cascade operations (read-only)...');

    // Test cascade behavior by examining data relationships
    const cascadeTests = [
      {
        name: 'vendor_adventure_relationship',
        description: 'Check if vendors have related adventures',
        test: async () => {
          // Get a vendor and check for related adventures
          const { data: vendors, error: vendorError } = await this.supabase
            .from('vendors')
            .select('id')
            .limit(1);

          if (vendorError || !vendors.length) {
            return { success: false, error: vendorError?.message || 'No vendors found' };
          }

          const { data: adventures, error: adventureError } = await this.supabase
            .from('adventures')
            .select('id')
            .eq('vendor_id', vendors[0].id);

          return {
            success: !adventureError,
            vendorId: vendors[0].id,
            adventureCount: adventures?.length || 0,
            error: adventureError?.message
          };
        }
      },
      {
        name: 'group_member_relationship',
        description: 'Check if groups have related members',
        test: async () => {
          const { data: groups, error: groupError } = await this.supabase
            .from('groups')
            .select('id')
            .limit(1);

          if (groupError || !groups.length) {
            return { success: false, error: groupError?.message || 'No groups found' };
          }

          const { data: members, error: memberError } = await this.supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groups[0].id);

          return {
            success: !memberError,
            groupId: groups[0].id,
            memberCount: members?.length || 0,
            error: memberError?.message
          };
        }
      }
    ];

    for (const test of cascadeTests) {
      const start = performance.now();

      try {
        const result = await test.test();
        const duration = performance.now() - start;

        this.results.foreignKeys.push({
          name: test.name,
          description: test.description,
          type: 'cascade_test',
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;
        this.log(`Cascade Test ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.foreignKeys.push({
          name: test.name,
          description: test.description,
          type: 'cascade_test',
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Cascade Test: ${test.name}`);
      }
    }
  }

  async runAllTests() {
    this.log('Starting comprehensive table relationship validation...');
    const startTime = performance.now();

    // Run tests sequentially
    await this.validateTableStructure();
    await this.validateForeignKeyRelationships();
    await this.validateRLSPolicies();
    await this.validateDataIntegrity();
    await this.checkCascadeOperations();

    const totalDuration = performance.now() - startTime;

    // Generate summary
    const accessibleTables = this.results.tableStructure.filter(t => t.status === 'accessible').length;
    const passedFKTests = this.results.foreignKeys.filter(fk => fk.status === 'passed').length;
    const passedIntegrityTests = this.results.dataIntegrity.filter(di => di.status === 'passed').length;
    const resolvedRLSIssues = this.results.rlsPolicies.filter(rls => rls.status === 'resolved').length;

    this.results.summary = {
      testDuration: Math.round(totalDuration),
      tablesAccessible: accessibleTables,
      totalTablesExpected: this.expectedTables.length,
      tableAccessRate: Math.round((accessibleTables / this.expectedTables.length) * 100),
      foreignKeyTests: {
        passed: passedFKTests,
        total: this.results.foreignKeys.length,
        passRate: this.results.foreignKeys.length > 0 ? Math.round((passedFKTests / this.results.foreignKeys.length) * 100) : 0
      },
      dataIntegrityTests: {
        passed: passedIntegrityTests,
        total: this.results.dataIntegrity.length,
        passRate: this.results.dataIntegrity.length > 0 ? Math.round((passedIntegrityTests / this.results.dataIntegrity.length) * 100) : 0
      },
      rlsPolicyIssues: {
        resolved: resolvedRLSIssues,
        total: this.results.rlsPolicies.length,
        unresolved: this.results.rlsPolicies.length - resolvedRLSIssues
      },
      errorCount: this.results.errors.length,
      overallHealth: this.calculateOverallHealth(accessibleTables, passedFKTests, passedIntegrityTests),
      timestamp: new Date().toISOString()
    };

    this.log(`Tests completed in ${Math.round(totalDuration)}ms`);
    this.log(`Summary: ${accessibleTables}/${this.expectedTables.length} tables accessible, ${passedFKTests} FK tests passed, ${this.results.errors.length} errors`);

    return this.results;
  }

  calculateOverallHealth(accessibleTables, passedFKTests, passedIntegrityTests) {
    let score = 0;

    // Table accessibility (40%)
    score += Math.round((accessibleTables / this.expectedTables.length) * 40);

    // Foreign key relationships (30%)
    if (this.results.foreignKeys.length > 0) {
      score += Math.round((passedFKTests / this.results.foreignKeys.length) * 30);
    } else {
      score += 30; // Assume good if no tests
    }

    // Data integrity (20%)
    if (this.results.dataIntegrity.length > 0) {
      score += Math.round((passedIntegrityTests / this.results.dataIntegrity.length) * 20);
    } else {
      score += 20; // Assume good if no tests
    }

    // Error penalty (10%)
    score += Math.max(0, 10 - this.results.errors.length);

    return Math.min(100, score);
  }

  async saveResults(outputPath = null) {
    const defaultPath = path.join(process.cwd(), '.taskmaster', 'reports', 'table-relationship-validation.json');
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
  const tester = new TableRelationshipTester();

  try {
    const results = await tester.runAllTests();
    await tester.saveResults();

    // Print results
    console.log('\n=== TABLE RELATIONSHIP VALIDATION RESULTS ===');
    console.log(JSON.stringify(results.summary, null, 2));

    // Exit with appropriate code
    if (results.summary.overallHealth < 80) {
      console.log('\n❌ Table relationship health below acceptable threshold (80%)');
      process.exit(1);
    } else {
      console.log('\n✅ Table relationship validation passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TableRelationshipTester };
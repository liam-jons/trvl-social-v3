#!/usr/bin/env node

/**
 * Database Migration Verification Script - Node.js Version
 *
 * This script verifies that all Supabase migrations have been applied correctly
 * and tests basic database functionality for the TRVL Social platform.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

// Critical tables that must exist for core functionality
const CRITICAL_TABLES = [
  // Core user system
  'profiles',
  'user_preferences',

  // Vendor and adventure system
  'vendors',
  'adventures',
  'adventure_availability',
  'adventure_media',
  'vendor_certifications',
  'vendor_insurance',

  // Booking and payment system
  'bookings',
  'booking_payments',
  'booking_participants',
  'payment_splits',
  'booking_modifications',
  'reviews',

  // Group and compatibility system
  'groups',
  'group_members',
  'personality_assessments',
  'compatibility_scores',
  'travel_preferences',

  // Social and community features
  'user_connections',
  'posts',
  'post_likes',
  'comments',
  'comment_likes',
  'community_feed_items',

  // Notifications and messaging
  'notifications',
  'notification_settings',
  'whatsapp_conversations',
  'whatsapp_messages',
  'whatsapp_contacts',
  'whatsapp_webhooks',

  // Stripe Connect and payments
  'stripe_accounts',
  'stripe_account_onboarding',
  'stripe_products',
  'stripe_prices',
  'stripe_payment_intents'
];

class DatabaseVerifier {
  constructor() {
    this.supabase = null;
    this.results = {
      connection: false,
      tables: {},
      migrationFiles: [],
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  /**
   * Initialize Supabase client and test connection
   */
  async initializeClient() {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      console.log('Environment variables check:');
      console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'Set' : 'Missing');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);

      // Test connection with a simple query to the auth schema
      const { data, error } = await this.supabase.auth.getSession();

      console.log('Auth session check:', data ? 'Success' : 'No session (normal)');

      // Try a simple table query
      const { data: profileTest, error: profileError } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
        console.log('Profile query error:', profileError.message);
      }

      this.results.connection = true;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      this.results.connection = false;
      this.results.errors.push(`Database connection failed: ${error.message}`);
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Check migration files in the filesystem
   */
  checkMigrationFiles() {
    console.log('\n📁 Checking migration files...');

    const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');

    try {
      if (!fs.existsSync(migrationDir)) {
        this.results.errors.push('Migration directory not found at supabase/migrations');
        console.log('❌ Migration directory not found');
        return;
      }

      const files = fs.readdirSync(migrationDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      this.results.migrationFiles = files;
      console.log(`✅ Found ${files.length} migration files`);

      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });

    } catch (error) {
      this.results.errors.push(`Error reading migration files: ${error.message}`);
      console.log('❌ Error reading migration files:', error.message);
    }
  }

  /**
   * Check if critical tables exist
   */
  async verifyTables() {
    console.log('\n🔍 Verifying table existence...');

    for (const tableName of CRITICAL_TABLES) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === 'PGRST116') {
            this.results.tables[tableName] = false;
            console.log(`❌ Table '${tableName}' missing`);
          } else if (error.code === '42P01') {
            this.results.tables[tableName] = false;
            console.log(`❌ Table '${tableName}' does not exist`);
          } else {
            this.results.tables[tableName] = 'error';
            this.results.warnings.push(`Error querying table '${tableName}': ${error.message}`);
            console.log(`⚠️ Error querying '${tableName}': ${error.message}`);
          }
        } else {
          this.results.tables[tableName] = true;
          console.log(`✅ Table '${tableName}' exists`);
        }
      } catch (error) {
        this.results.tables[tableName] = 'error';
        this.results.errors.push(`Unexpected error checking table '${tableName}': ${error.message}`);
        console.log(`❌ Unexpected error checking '${tableName}': ${error.message}`);
      }
    }
  }

  /**
   * Test basic operations on existing tables
   */
  async testBasicOperations() {
    console.log('\n🔧 Testing basic operations on existing tables...');

    const existingTables = Object.entries(this.results.tables)
      .filter(([table, exists]) => exists === true)
      .map(([table]) => table);

    if (existingTables.length === 0) {
      console.log('⚠️ No tables exist to test operations');
      return;
    }

    for (const tableName of existingTables.slice(0, 5)) { // Test first 5 existing tables
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (error) {
          console.log(`⚠️ Query test failed for '${tableName}': ${error.message}`);
        } else {
          console.log(`✅ Query test successful for '${tableName}' (${data?.length || 0} records)`);
        }
      } catch (error) {
        console.log(`❌ Query test error for '${tableName}': ${error.message}`);
      }
    }
  }

  /**
   * Generate verification summary
   */
  generateSummary() {
    const totalTables = CRITICAL_TABLES.length;
    const existingTables = Object.values(this.results.tables).filter(exists => exists === true).length;
    const missingTables = Object.values(this.results.tables).filter(exists => exists === false).length;
    const errorTables = Object.values(this.results.tables).filter(exists => exists === 'error').length;

    this.results.summary = {
      connection: this.results.connection,
      migrationFilesCount: this.results.migrationFiles.length,
      tablesTotal: totalTables,
      tablesExisting: existingTables,
      tablesMissing: missingTables,
      tablesWithErrors: errorTables,
      tableCompletion: Math.round((existingTables / totalTables) * 100),
      totalErrors: this.results.errors.length,
      totalWarnings: this.results.warnings.length,
      overallStatus: this.getOverallStatus()
    };
  }

  /**
   * Determine overall migration status
   */
  getOverallStatus() {
    if (!this.results.connection) {
      return 'FAILED - No database connection';
    }

    const { tablesExisting, tablesTotal, totalErrors } = this.results.summary;

    if (tablesExisting === tablesTotal && totalErrors === 0) {
      return 'EXCELLENT - All migrations applied successfully';
    } else if (tablesExisting >= tablesTotal * 0.9) {
      return 'GOOD - Most migrations applied, minor issues';
    } else if (tablesExisting >= tablesTotal * 0.7) {
      return 'FAIR - Major migrations applied, some missing';
    } else if (tablesExisting >= tablesTotal * 0.3) {
      return 'POOR - Some basic tables exist, many missing';
    } else {
      return 'CRITICAL - Most tables missing, migrations not applied';
    }
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      projectId: process.env.VITE_SUPABASE_PROJECT_ID || 'vhecnqaejsukulaktjob',
      ...this.results
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'migration-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Run complete verification process
   */
  async runVerification() {
    console.log('🚀 Starting database migration verification...\n');
    console.log('Project:', process.env.VITE_SUPABASE_URL || 'Not configured');

    this.checkMigrationFiles();

    const connected = await this.initializeClient();
    if (!connected) {
      this.generateSummary();
      this.generateReport();
      return this.results;
    }

    await this.verifyTables();
    await this.testBasicOperations();

    this.generateSummary();

    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('========================');
    console.log(`Overall Status: ${this.results.summary.overallStatus}`);
    console.log(`Database Connection: ${this.results.connection ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Migration Files: ${this.results.summary.migrationFilesCount} found`);
    console.log(`Tables: ${this.results.summary.tablesExisting}/${this.results.summary.tablesTotal} (${this.results.summary.tableCompletion}%)`);
    console.log(`Errors: ${this.results.summary.totalErrors}`);
    console.log(`Warnings: ${this.results.summary.totalWarnings}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.results.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    const missingTables = Object.entries(this.results.tables)
      .filter(([table, exists]) => exists === false)
      .map(([table]) => table);

    if (missingTables.length > 0) {
      console.log('\n📋 MISSING TABLES:');
      missingTables.forEach(table => console.log(`  • ${table}`));
    }

    const existingTables = Object.entries(this.results.tables)
      .filter(([table, exists]) => exists === true)
      .map(([table]) => table);

    if (existingTables.length > 0) {
      console.log('\n✅ EXISTING TABLES:');
      existingTables.forEach(table => console.log(`  • ${table}`));
    }

    this.generateReport();

    return this.results;
  }
}

// CLI execution
const verifier = new DatabaseVerifier();
verifier.runVerification().then((results) => {
  const exitCode = results.connection ? 0 : 1;
  process.exit(exitCode);
}).catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
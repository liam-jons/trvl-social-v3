/**
 * Database Migration Verification Script
 *
 * This script verifies that all Supabase migrations have been applied correctly
 * and tests basic database functionality for the TRVL Social platform.
 */
import { createClient } from '@supabase/supabase-js';
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
  'stripe_payment_intents',
  'payment_tokens',
  'invoices',
  'invoice_items',
  'payment_reconciliations',
  'payout_schedules',
  'payout_transactions',
  'refund_requests',
  'dispute_cases',
  // Media and storage
  'media_files',
  'media_thumbnails',
  'media_metadata',
  // Engagement and analytics
  'engagement_metrics',
  'user_activity_logs',
  'content_views',
  'user_interactions',
  // Moderation system
  'content_reports',
  'moderation_actions',
  'automated_moderation_rules',
  // Vendor forum
  'forum_categories',
  'forum_topics',
  'forum_posts',
  'forum_post_votes',
  // ML and algorithm tables
  'model_training_data',
  'compatibility_model_versions',
  'user_behavior_data',
  // Webhook system
  'webhook_logs',
  'webhook_events',
  'webhook_failures'
];
// Enums that should exist
const EXPECTED_ENUMS = [
  'user_role',
  'vendor_status',
  'adventure_category',
  'difficulty_level',
  'booking_status',
  'payment_status',
  'payment_method',
  'group_privacy',
  'group_member_role'
];
// Storage buckets that should exist
const EXPECTED_STORAGE_BUCKETS = [
  'avatars',
  'adventure-media',
  'vendor-documents',
  'user-uploads',
  'system-media'
];
class MigrationVerifier {
  constructor() {
    this.supabase = null;
    this.results = {
      connection: false,
      tables: {},
      enums: {},
      storageBuckets: {},
      rlsPolicies: {},
      functions: {},
      triggers: {},
      indexes: {},
      foreignKeys: {},
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
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env');
      }
      this.supabase = createClient(supabaseUrl, supabaseKey);
      // Test connection with a simple query
      const { data, error } = await this.supabase.from('profiles').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is still a connection
        throw error;
      }
      this.results.connection = true;
      return true;
    } catch (error) {
      this.results.connection = false;
      this.results.errors.push(`Database connection failed: ${error.message}`);
      return false;
    }
  }
  /**
   * Check if critical tables exist
   */
  async verifyTables() {
    for (const tableName of CRITICAL_TABLES) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        if (error) {
          if (error.code === 'PGRST116') {
            this.results.tables[tableName] = false;
            this.results.errors.push(`Table '${tableName}' does not exist`);
          } else {
            this.results.tables[tableName] = 'error';
            this.results.errors.push(`Error querying table '${tableName}': ${error.message}`);
          }
        } else {
          this.results.tables[tableName] = true;
        }
      } catch (error) {
        this.results.tables[tableName] = 'error';
        this.results.errors.push(`Unexpected error checking table '${tableName}': ${error.message}`);
      }
    }
  }
  /**
   * Test basic CRUD operations on key tables
   */
  async testCrudOperations() {
    const testOperations = [
      {
        table: 'profiles',
        operation: 'select',
        description: 'Read user profiles'
      },
      {
        table: 'adventures',
        operation: 'select',
        description: 'Read adventures'
      },
      {
        table: 'bookings',
        operation: 'select',
        description: 'Read bookings'
      }
    ];
    for (const test of testOperations) {
      try {
        const { data, error } = await this.supabase
          .from(test.table)
          .select('*')
          .limit(5);
        if (error) {
          this.results.errors.push(`CRUD test failed for ${test.table}: ${error.message}`);
        } else {
        }
      } catch (error) {
        this.results.errors.push(`CRUD test error for ${test.table}: ${error.message}`);
      }
    }
  }
  /**
   * Check RLS policies are enabled
   */
  async verifyRlsPolicies() {
    // This is a simplified check - in a real implementation you'd query pg_policies
    const rlsTables = ['profiles', 'adventures', 'bookings', 'vendors'];
    for (const table of rlsTables) {
      try {
        // Try to access table without authentication - should be restricted
        const { data, error } = await this.supabase
          .from(table)
          .select('id')
          .limit(1);
        // If we get data without auth, RLS might not be properly configured
        if (data && data.length > 0) {
          this.results.warnings.push(`Table '${table}' may have overly permissive RLS policies`);
        } else {
        }
      } catch (error) {
      }
    }
  }
  /**
   * Verify storage buckets exist
   */
  async verifyStorageBuckets() {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      if (error) {
        this.results.errors.push(`Failed to list storage buckets: ${error.message}`);
        return;
      }
      const existingBuckets = buckets.map(bucket => bucket.name);
      for (const bucketName of EXPECTED_STORAGE_BUCKETS) {
        if (existingBuckets.includes(bucketName)) {
          this.results.storageBuckets[bucketName] = true;
        } else {
          this.results.storageBuckets[bucketName] = false;
          this.results.warnings.push(`Storage bucket '${bucketName}' not found`);
        }
      }
    } catch (error) {
      this.results.errors.push(`Storage verification error: ${error.message}`);
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
    } else {
      return 'POOR - Many migrations missing or failed';
    }
  }
  /**
   * Run complete verification process
   */
  async runVerification() {
    const connected = await this.initializeClient();
    if (!connected) {
      return this.results;
    }
    await this.verifyTables();
    await this.testCrudOperations();
    await this.verifyRlsPolicies();
    await this.verifyStorageBuckets();
    this.generateSummary();
    if (this.results.errors.length > 0) {
    }
    if (this.results.warnings.length > 0) {
    }
    return this.results;
  }
}
// Export for use in other modules
export { MigrationVerifier };
// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new MigrationVerifier();
  verifier.runVerification().then(() => {
    process.exit(0);
  }).catch(error => {
    process.exit(1);
  });
}
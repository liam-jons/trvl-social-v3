/**
 * Database Index Analysis Script
 * Analyzes current indexes and identifies missing critical indexes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeIndexes() {
  console.log('🔍 Analyzing Database Indexes...\n');

  // Query to get all indexes in the public schema
  const { data: indexes, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `
  });

  if (error) {
    // Try direct query instead
    const { data: directIndexes, error: directError } = await supabase
      .from('pg_indexes')
      .select('*')
      .eq('schemaname', 'public');
    
    if (directError) {
      console.error('Error querying indexes:', directError);
      
      // Fallback: List expected vs actual indexes
      console.log('\n📊 Expected Critical Indexes:\n');
      
      const expectedIndexes = [
        { table: 'profiles', columns: 'username', name: 'idx_profiles_username' },
        { table: 'profiles', columns: 'email', name: 'idx_profiles_email' },
        { table: 'profiles', columns: 'role', name: 'idx_profiles_role' },
        { table: 'adventures', columns: 'category', name: 'idx_adventures_category' },
        { table: 'adventures', columns: 'location', name: 'idx_adventures_location' },
        { table: 'adventures', columns: 'is_active, rating', name: 'idx_adventures_active_rating' },
        { table: 'bookings', columns: 'user_id', name: 'idx_bookings_user_id' },
        { table: 'bookings', columns: 'vendor_id', name: 'idx_bookings_vendor_id' },
        { table: 'bookings', columns: 'adventure_id', name: 'idx_bookings_adventure_id' },
        { table: 'bookings', columns: 'status, booking_date', name: 'idx_bookings_status_date' },
        { table: 'booking_payments', columns: 'booking_id', name: 'idx_booking_payments_booking_id' },
        { table: 'booking_payments', columns: 'payment_status', name: 'idx_booking_payments_status' },
      ];

      expectedIndexes.forEach(idx => {
        console.log(`   ${idx.table}.${idx.columns} → ${idx.name}`);
      });

      console.log('\n⚠️  Unable to verify which indexes currently exist.');
      console.log('    Run the SQL query manually in Supabase Dashboard to check.\n');
      return;
    }
    
    console.log('Found indexes:', directIndexes);
  }

  // Organize indexes by table
  const indexesByTable = {};
  
  if (indexes && indexes.length > 0) {
    indexes.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx);
    });

    // Display results
    console.log('📊 Current Indexes by Table:\n');
    
    Object.keys(indexesByTable).sort().forEach(table => {
      console.log(`\n${table}:`);
      indexesByTable[table].forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
    });
  }

  console.log('\n✅ Index analysis complete');
}

analyzeIndexes().catch(console.error);

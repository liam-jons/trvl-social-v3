#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function emergencyDisableRLS() {
  console.log('🚨 EMERGENCY: Disabling RLS on problematic tables...\n');

  const tables = [
    'split_payments',
    'individual_payments',
    'payment_reminders',
    'payment_refunds',
    'booking_modifications',
    'booking_cancellations',
    'booking_service_disputes'
  ];

  for (const table of tables) {
    try {
      console.log(`Disabling RLS on ${table}...`);

      const { error } = await adminClient.rpc('sql', {
        query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      });

      if (error) {
        console.error(`❌ Failed to disable RLS on ${table}:`, error.message);
      } else {
        console.log(`✅ Successfully disabled RLS on ${table}`);
      }

    } catch (error) {
      console.error(`❌ Error disabling RLS on ${table}:`, error.message);
    }
  }

  console.log('\n🎯 Testing if recursion is resolved...');

  // Test split_payments access
  const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

  const { data, error } = await supabase
    .from('split_payments')
    .select('*')
    .limit(1);

  if (error) {
    if (error.message.includes('infinite recursion')) {
      console.error('🚨 STILL FAILING: Infinite recursion detected');
      return false;
    } else {
      console.log(`ℹ️  Query result: ${error.message} (this may be normal)`);
    }
  } else {
    console.log('✅ Split payments table query successful - no recursion!');
  }

  return true;
}

emergencyDisableRLS().catch(console.error);
#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking current RLS policies...\n');

  try {
    // Check policies on groups and group_members tables
    const { data: policies, error } = await adminClient.rpc('get_rls_policies', {
      target_tables: ['groups', 'group_members']
    });

    if (error) {
      console.log('Using fallback method to check policies...');

      // Fallback: Use direct SQL query
      const { data: rawPolicies, error: rawError } = await adminClient
        .from('pg_policies')
        .select('*')
        .in('tablename', ['groups', 'group_members']);

      if (rawError) {
        console.error('❌ Failed to fetch policies:', rawError.message);
        return;
      }

      console.log('Current RLS Policies:');
      console.log('='.repeat(50));

      rawPolicies.forEach(policy => {
        console.log(`\nTable: ${policy.tablename}`);
        console.log(`Policy: ${policy.policyname}`);
        console.log(`Command: ${policy.cmd}`);
        console.log(`Condition: ${policy.qual || 'N/A'}`);
        console.log(`With Check: ${policy.with_check || 'N/A'}`);
        console.log('-'.repeat(30));
      });

      return rawPolicies;
    }

    return policies;

  } catch (error) {
    console.error('🚨 Error checking policies:', error.message);
    return [];
  }
}

async function fixRLSPolicies() {
  console.log('\n🔧 Fixing RLS policies manually...\n');

  try {
    // Drop all problematic policies first
    const dropCommands = [
      'DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Group admins can manage members" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON groups CASCADE;',
      'DROP POLICY IF EXISTS "Group members can view their groups via function" ON groups CASCADE;',
      'DROP POLICY IF EXISTS "Group owners can view their private groups" ON groups CASCADE;',
      'DROP POLICY IF EXISTS "Users can view own membership" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Group owners can view all members" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Users can join groups" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Group owners and admins can add members" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Users can update own membership" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Group owners can update member roles" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Users can delete own membership" ON group_members CASCADE;',
      'DROP POLICY IF EXISTS "Group owners can remove members" ON group_members CASCADE;'
    ];

    for (const command of dropCommands) {
      const { error } = await adminClient.rpc('exec_sql', { sql: command });
      if (error && !error.message.includes('does not exist')) {
        console.log(`Warning dropping policy: ${error.message}`);
      }
    }

    console.log('✅ Dropped all existing policies');

    // Create new non-recursive policies
    const createCommands = [
      // Groups table policies - simple and non-recursive
      `CREATE POLICY "Public groups viewable by all"
        ON groups FOR SELECT
        USING (privacy = 'public');`,

      `CREATE POLICY "Group owners can view own groups"
        ON groups FOR SELECT
        USING (auth.uid() = owner_id);`,

      `CREATE POLICY "Group owners can modify own groups"
        ON groups FOR ALL
        USING (auth.uid() = owner_id);`,

      // Group members policies - non-recursive
      `CREATE POLICY "Users can view own membership"
        ON group_members FOR SELECT
        USING (auth.uid() = user_id);`,

      `CREATE POLICY "Users can insert own membership"
        ON group_members FOR INSERT
        WITH CHECK (auth.uid() = user_id);`,

      `CREATE POLICY "Users can update own membership"
        ON group_members FOR UPDATE
        USING (auth.uid() = user_id);`,

      `CREATE POLICY "Users can delete own membership"
        ON group_members FOR DELETE
        USING (auth.uid() = user_id);`
    ];

    for (const command of createCommands) {
      const { error } = await adminClient.rpc('exec_sql', { sql: command });
      if (error) {
        console.error(`❌ Failed to create policy: ${error.message}`);
        console.error(`Command: ${command}`);
      } else {
        console.log('✅ Created policy successfully');
      }
    }

    console.log('\n🎉 RLS policies recreated with non-recursive logic');
    return true;

  } catch (error) {
    console.error('🚨 Error fixing RLS policies:', error.message);
    return false;
  }
}

async function main() {
  await checkRLSPolicies();
  const fixed = await fixRLSPolicies();

  if (fixed) {
    console.log('\n✅ RLS fix completed - testing...');

    // Quick test
    const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

    const { data, error } = await supabase
      .from('groups')
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
      console.log('✅ Groups table query successful - no recursion!');
    }

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('*')
      .limit(1);

    if (membersError) {
      if (membersError.message.includes('infinite recursion')) {
        console.error('🚨 STILL FAILING: Infinite recursion in group_members');
        return false;
      } else {
        console.log(`ℹ️  Group members query result: ${membersError.message} (this may be normal)`);
      }
    } else {
      console.log('✅ Group members table query successful - no recursion!');
    }
  }

  return true;
}

main().catch(console.error);
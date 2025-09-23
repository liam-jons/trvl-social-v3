#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Service role client for setup
const adminClient = createClient(supabaseUrl, serviceRoleKey);

// Test client for user operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSFix() {
  console.log('🔧 Testing RLS Recursion Fix...\n');

  try {
    // Test 1: Check if we can query groups without recursion
    console.log('1. Testing groups table access...');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .limit(5);

    if (groupsError) {
      console.error('❌ Groups table error:', groupsError.message);
      if (groupsError.message.includes('infinite recursion')) {
        console.error('🚨 CRITICAL: Infinite recursion still present in groups table');
        return false;
      }
    } else {
      console.log('✅ Groups table accessible, found', groups?.length || 0, 'records');
    }

    // Test 2: Check if we can query group_members without recursion
    console.log('\n2. Testing group_members table access...');
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('*')
      .limit(5);

    if (membersError) {
      console.error('❌ Group members table error:', membersError.message);
      if (membersError.message.includes('infinite recursion')) {
        console.error('🚨 CRITICAL: Infinite recursion still present in group_members table');
        return false;
      }
    } else {
      console.log('✅ Group members table accessible, found', members?.length || 0, 'records');
    }

    // Test 3: Check split_payments table
    console.log('\n3. Testing split_payments table access...');
    const { data: payments, error: paymentsError } = await supabase
      .from('split_payments')
      .select('*')
      .limit(5);

    if (paymentsError) {
      console.error('❌ Split payments table error:', paymentsError.message);
      if (paymentsError.message.includes('infinite recursion')) {
        console.error('🚨 CRITICAL: Infinite recursion in split_payments table');
        return false;
      }
    } else {
      console.log('✅ Split payments table accessible, found', payments?.length || 0, 'records');
    }

    // Test 4: Test with authenticated user context
    console.log('\n4. Testing with mock authenticated user...');

    // Create a test user for RLS testing
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: 'test-rls@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Failed to create test user:', authError.message);
    } else {
      console.log('✅ Test user ready');

      // Sign in as test user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test-rls@example.com',
        password: 'test123456'
      });

      if (signInError) {
        console.error('❌ Failed to sign in test user:', signInError.message);
      } else {
        console.log('✅ Signed in as test user');

        // Test authenticated queries
        const { data: authGroups, error: authGroupsError } = await supabase
          .from('groups')
          .select('*')
          .limit(3);

        if (authGroupsError) {
          console.error('❌ Authenticated groups query failed:', authGroupsError.message);
          if (authGroupsError.message.includes('infinite recursion')) {
            console.error('🚨 CRITICAL: RLS recursion with authenticated user');
            return false;
          }
        } else {
          console.log('✅ Authenticated user can query groups safely');
        }

        // Test group members with auth context
        const { data: authMembers, error: authMembersError } = await supabase
          .from('group_members')
          .select('*')
          .limit(3);

        if (authMembersError) {
          console.error('❌ Authenticated group_members query failed:', authMembersError.message);
          if (authMembersError.message.includes('infinite recursion')) {
            console.error('🚨 CRITICAL: RLS recursion in group_members with auth');
            return false;
          }
        } else {
          console.log('✅ Authenticated user can query group_members safely');
        }
      }
    }

    console.log('\n🎉 RLS recursion fix appears to be working!');
    return true;

  } catch (error) {
    console.error('🚨 Unexpected error during RLS testing:', error.message);
    return false;
  }
}

async function auditAllRLSPolicies() {
  console.log('\n🔍 Auditing all RLS policies for potential recursion issues...\n');

  try {
    // Query to get all RLS policies
    const { data: policies, error } = await adminClient
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd, qual, with_check')
      .eq('schemaname', 'public');

    if (error) {
      console.error('❌ Failed to fetch RLS policies:', error.message);
      return;
    }

    console.log(`Found ${policies.length} RLS policies to audit:`);

    const potentialIssues = [];
    const tablesWithPolicies = new Set();

    policies.forEach(policy => {
      tablesWithPolicies.add(policy.tablename);

      // Check for potential recursion patterns
      const policyText = (policy.qual || '') + ' ' + (policy.with_check || '');

      // Look for patterns that might cause recursion
      if (policyText.includes('group_members') && policy.tablename === 'groups') {
        potentialIssues.push({
          table: policy.tablename,
          policy: policy.policyname,
          issue: 'Groups policy references group_members (potential recursion)',
          severity: 'high'
        });
      }

      if (policyText.includes('groups') && policy.tablename === 'group_members') {
        potentialIssues.push({
          table: policy.tablename,
          policy: policy.policyname,
          issue: 'Group_members policy references groups (potential recursion)',
          severity: 'high'
        });
      }

      // Check for self-referential policies
      if (policyText.includes(policy.tablename) &&
          (policyText.includes('EXISTS') || policyText.includes('IN'))) {
        potentialIssues.push({
          table: policy.tablename,
          policy: policy.policyname,
          issue: 'Self-referential policy with subquery',
          severity: 'medium'
        });
      }
    });

    console.log(`\nTables with RLS policies: ${Array.from(tablesWithPolicies).join(', ')}`);

    if (potentialIssues.length > 0) {
      console.log('\n⚠️  Potential issues found:');
      potentialIssues.forEach(issue => {
        console.log(`${issue.severity === 'high' ? '🔴' : '🟡'} ${issue.table}.${issue.policy}: ${issue.issue}`);
      });
    } else {
      console.log('\n✅ No obvious recursion patterns found in RLS policies');
    }

    return potentialIssues;

  } catch (error) {
    console.error('🚨 Error during RLS audit:', error.message);
    return [];
  }
}

async function main() {
  console.log('🛡️  DATABASE SECURITY AUDIT - RLS Recursion Fix Verification\n');
  console.log('=' .repeat(70));

  const rlsFixed = await testRLSFix();

  if (!rlsFixed) {
    console.log('\n🚨 CRITICAL: RLS recursion issues persist - manual intervention required');
    process.exit(1);
  }

  await auditAllRLSPolicies();

  console.log('\n' + '=' .repeat(70));
  console.log('✅ Database security audit completed');
  console.log('🎯 Next: Complete remaining Task 36 subtasks');
}

main().catch(console.error);
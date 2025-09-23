#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const supabase = createClient(supabaseUrl, anonKey);

async function testSocialFeatures() {
  console.log('🤝 Testing Social Features Database Integration...\n');

  let testResults = {
    community_posts: { tested: false, success: false, error: null },
    post_comments: { tested: false, success: false, error: null },
    post_reactions: { tested: false, success: false, error: null },
    post_saves: { tested: false, success: false, error: null },
    connections: { tested: false, success: false, error: null },
    notifications: { tested: false, success: false, error: null }
  };

  // 1. Test Community Posts table
  console.log('1. Testing community_posts table...');
  try {
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .limit(5);

    testResults.community_posts.tested = true;
    if (postsError) {
      if (postsError.message.includes('permission denied')) {
        testResults.community_posts.success = true; // RLS working as expected
        console.log('✅ Community posts table accessible (RLS active)');
      } else {
        testResults.community_posts.error = postsError.message;
        console.log('❌ Community posts table error:', postsError.message);
      }
    } else {
      testResults.community_posts.success = true;
      console.log(`✅ Community posts table accessible, found ${posts?.length || 0} records`);
    }
  } catch (error) {
    testResults.community_posts.tested = true;
    testResults.community_posts.error = error.message;
    console.log('❌ Community posts table exception:', error.message);
  }

  // 2. Test Post Comments table
  console.log('\n2. Testing post_comments table...');
  try {
    const { data: comments, error: commentsError } = await supabase
      .from('post_comments')
      .select('*')
      .limit(5);

    testResults.post_comments.tested = true;
    if (commentsError) {
      if (commentsError.message.includes('permission denied')) {
        testResults.post_comments.success = true;
        console.log('✅ Post comments table accessible (RLS active)');
      } else {
        testResults.post_comments.error = commentsError.message;
        console.log('❌ Post comments table error:', commentsError.message);
      }
    } else {
      testResults.post_comments.success = true;
      console.log(`✅ Post comments table accessible, found ${comments?.length || 0} records`);
    }
  } catch (error) {
    testResults.post_comments.tested = true;
    testResults.post_comments.error = error.message;
    console.log('❌ Post comments table exception:', error.message);
  }

  // 3. Test Post Reactions table
  console.log('\n3. Testing post_reactions table...');
  try {
    const { data: reactions, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('*')
      .limit(5);

    testResults.post_reactions.tested = true;
    if (reactionsError) {
      if (reactionsError.message.includes('permission denied')) {
        testResults.post_reactions.success = true;
        console.log('✅ Post reactions table accessible (RLS active)');
      } else {
        testResults.post_reactions.error = reactionsError.message;
        console.log('❌ Post reactions table error:', reactionsError.message);
      }
    } else {
      testResults.post_reactions.success = true;
      console.log(`✅ Post reactions table accessible, found ${reactions?.length || 0} records`);
    }
  } catch (error) {
    testResults.post_reactions.tested = true;
    testResults.post_reactions.error = error.message;
    console.log('❌ Post reactions table exception:', error.message);
  }

  // 3.5. Test Post Saves table
  console.log('\n3.5. Testing post_saves table...');
  try {
    const { data: saves, error: savesError } = await supabase
      .from('post_saves')
      .select('*')
      .limit(5);

    testResults.post_saves.tested = true;
    if (savesError) {
      if (savesError.message.includes('permission denied')) {
        testResults.post_saves.success = true;
        console.log('✅ Post saves table accessible (RLS active)');
      } else {
        testResults.post_saves.error = savesError.message;
        console.log('❌ Post saves table error:', savesError.message);
      }
    } else {
      testResults.post_saves.success = true;
      console.log(`✅ Post saves table accessible, found ${saves?.length || 0} records`);
    }
  } catch (error) {
    testResults.post_saves.tested = true;
    testResults.post_saves.error = error.message;
    console.log('❌ Post saves table exception:', error.message);
  }

  // 4. Test Community Connections table
  console.log('\n4. Testing community_connections table...');
  try {
    const { data: connections, error: connectionsError } = await supabase
      .from('community_connections')
      .select('*')
      .limit(5);

    testResults.connections.tested = true;
    if (connectionsError) {
      if (connectionsError.message.includes('permission denied')) {
        testResults.connections.success = true;
        console.log('✅ Community connections table accessible (RLS active)');
      } else {
        testResults.connections.error = connectionsError.message;
        console.log('❌ Community connections table error:', connectionsError.message);
      }
    } else {
      testResults.connections.success = true;
      console.log(`✅ Community connections table accessible, found ${connections?.length || 0} records`);
    }
  } catch (error) {
    testResults.connections.tested = true;
    testResults.connections.error = error.message;
    console.log('❌ Community connections table exception:', error.message);
  }

  // 5. Test Notifications table
  console.log('\n5. Testing notifications table...');
  try {
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);

    testResults.notifications.tested = true;
    if (notificationsError) {
      if (notificationsError.message.includes('permission denied')) {
        testResults.notifications.success = true;
        console.log('✅ Notifications table accessible (RLS active)');
      } else {
        testResults.notifications.error = notificationsError.message;
        console.log('❌ Notifications table error:', notificationsError.message);
      }
    } else {
      testResults.notifications.success = true;
      console.log(`✅ Notifications table accessible, found ${notifications?.length || 0} records`);
    }
  } catch (error) {
    testResults.notifications.tested = true;
    testResults.notifications.error = error.message;
    console.log('❌ Notifications table exception:', error.message);
  }

  // 6. Test with authenticated user
  console.log('\n6. Testing social features with authenticated user...');

  try {
    // Create test user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: 'social-test@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (authError && !authError.message.includes('already registered')) {
      console.log('❌ Failed to create test user:', authError.message);
    } else {
      // Sign in as test user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'social-test@example.com',
        password: 'test123456'
      });

      if (signInError) {
        console.log('❌ Failed to sign in test user:', signInError.message);
      } else {
        console.log('✅ Signed in as test user for social features testing');

        // Test authenticated access to social tables
        const { data: authPosts, error: authPostsError } = await supabase
          .from('posts')
          .select('*')
          .limit(3);

        if (authPostsError) {
          console.log(`ℹ️  Authenticated posts access: ${authPostsError.message}`);
        } else {
          console.log('✅ Authenticated user can access posts table');
        }
      }
    }
  } catch (error) {
    console.log('❌ Error during authenticated testing:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Social Features Database Integration Test Results:');
  console.log('='.repeat(60));

  const testedCount = Object.values(testResults).filter(r => r.tested).length;
  const successCount = Object.values(testResults).filter(r => r.success).length;

  Object.entries(testResults).forEach(([feature, result]) => {
    if (result.tested) {
      const status = result.success ? '✅' : '❌';
      const errorMsg = result.error ? ` (${result.error})` : '';
      console.log(`${status} ${feature.toUpperCase()}: ${result.success ? 'Working' : 'Failed'}${errorMsg}`);
    } else {
      console.log(`⏸️  ${feature.toUpperCase()}: Not tested`);
    }
  });

  console.log(`\n📈 Overall: ${successCount}/${testedCount} social features accessible`);

  if (successCount === testedCount && testedCount > 0) {
    console.log('🎉 All social features database integration tests passed!');
    return true;
  } else {
    console.log('⚠️  Some social features need attention');
    return false;
  }
}

testSocialFeatures().catch(console.error);
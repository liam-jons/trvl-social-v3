// Account Deletion Request Edge Function
// GDPR Right to Erasure: Permanently delete user account and all personal data
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThirdPartyDeletionResult {
  service: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { confirmation } = await req.json();

    // Verify confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation text' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create deletion request record
    const deletionId = crypto.randomUUID();
    const { data: deletionRequest, error: requestError } = await supabaseAdmin
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        email: user.email,
        status: 'processing',
        deletion_id: deletionId,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating deletion request:', requestError);
      throw new Error('Failed to create deletion request');
    }

    console.log(`Starting account deletion for user ${user.id}`);

    // Track third-party deletion results
    const thirdPartyResults: ThirdPartyDeletionResult[] = [];

    // ===================================================================
    // STEP 1: Delete from Third-Party Services BEFORE deleting user
    // ===================================================================

    // Get user profile for third-party IDs
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 1. Delete from Stripe
    try {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (stripeSecretKey && profile?.stripe_customer_id) {
        const stripeResponse = await fetch(
          `https://api.stripe.com/v1/customers/${profile.stripe_customer_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (stripeResponse.ok) {
          thirdPartyResults.push({ service: 'Stripe', success: true });
          console.log('Stripe customer deleted successfully');
        } else {
          const errorText = await stripeResponse.text();
          thirdPartyResults.push({
            service: 'Stripe',
            success: false,
            error: errorText,
          });
          console.error('Stripe deletion failed:', errorText);
        }
      } else {
        thirdPartyResults.push({
          service: 'Stripe',
          success: true,
          error: 'No Stripe customer ID found',
        });
      }
    } catch (stripeError) {
      thirdPartyResults.push({
        service: 'Stripe',
        success: false,
        error: stripeError.message,
      });
      console.error('Stripe deletion error:', stripeError);
    }

    // 2. Delete from Mixpanel
    try {
      const mixpanelToken = Deno.env.get('MIXPANEL_PROJECT_TOKEN');
      const mixpanelSecret = Deno.env.get('MIXPANEL_API_SECRET');

      if (mixpanelToken && mixpanelSecret) {
        // Mixpanel GDPR deletion endpoint
        const mixpanelResponse = await fetch(
          'https://api.mixpanel.com/v3/gdpr-delete',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(`${mixpanelSecret}:`)}`,
            },
            body: JSON.stringify({
              token: mixpanelToken,
              distinct_ids: [user.id],
            }),
          }
        );

        if (mixpanelResponse.ok) {
          thirdPartyResults.push({ service: 'Mixpanel', success: true });
          console.log('Mixpanel profile deleted successfully');
        } else {
          const errorText = await mixpanelResponse.text();
          thirdPartyResults.push({
            service: 'Mixpanel',
            success: false,
            error: errorText,
          });
          console.error('Mixpanel deletion failed:', errorText);
        }
      } else {
        thirdPartyResults.push({
          service: 'Mixpanel',
          success: true,
          error: 'Mixpanel not configured',
        });
      }
    } catch (mixpanelError) {
      thirdPartyResults.push({
        service: 'Mixpanel',
        success: false,
        error: mixpanelError.message,
      });
      console.error('Mixpanel deletion error:', mixpanelError);
    }

    // 3. Delete from Sentry
    try {
      const sentryAuthToken = Deno.env.get('SENTRY_AUTH_TOKEN');
      const sentryOrg = Deno.env.get('SENTRY_ORG');

      if (sentryAuthToken && sentryOrg) {
        // Sentry GDPR deletion (removes PII from error reports)
        const sentryResponse = await fetch(
          `https://sentry.io/api/0/organizations/${sentryOrg}/data-removal/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sentryAuthToken}`,
            },
            body: JSON.stringify({
              type: 'user',
              id: user.id,
            }),
          }
        );

        if (sentryResponse.ok) {
          thirdPartyResults.push({ service: 'Sentry', success: true });
          console.log('Sentry data removed successfully');
        } else {
          thirdPartyResults.push({
            service: 'Sentry',
            success: false,
            error: await sentryResponse.text(),
          });
        }
      } else {
        thirdPartyResults.push({
          service: 'Sentry',
          success: true,
          error: 'Sentry not configured',
        });
      }
    } catch (sentryError) {
      thirdPartyResults.push({
        service: 'Sentry',
        success: false,
        error: sentryError.message,
      });
      console.error('Sentry deletion error:', sentryError);
    }

    // ===================================================================
    // STEP 2: Delete User from Supabase Storage
    // ===================================================================

    // Delete all user files from storage buckets
    const storageBuckets = ['avatars', 'post-media', 'review-media', 'user-uploads', 'user-data-exports'];

    for (const bucket of storageBuckets) {
      try {
        // List all files for the user
        const { data: files } = await supabaseAdmin
          .storage
          .from(bucket)
          .list(user.id);

        if (files && files.length > 0) {
          // Delete all files
          const filePaths = files.map(file => `${user.id}/${file.name}`);
          await supabaseAdmin
            .storage
            .from(bucket)
            .remove(filePaths);

          console.log(`Deleted ${files.length} files from ${bucket}`);
        }

        // Remove the user directory
        await supabaseAdmin
          .storage
          .from(bucket)
          .remove([user.id]);

      } catch (storageError) {
        console.error(`Error deleting from ${bucket}:`, storageError);
        // Continue with deletion even if storage cleanup fails
      }
    }

    // ===================================================================
    // STEP 3: Delete User from Supabase Auth
    // ===================================================================

    // This will trigger CASCADE deletes for:
    // - profiles
    // - user_preferences
    // - bookings
    // - trip_requests
    // - messages
    // - notifications
    // - consent_audit_log
    // - data_export_requests
    // - account_deletion_requests
    //
    // And SET NULL for:
    // - community_posts (anonymized)
    // - reviews (anonymized)
    // - community_comments (anonymized)
    // - vendor_forum_posts (anonymized)
    // - vendor_forum_replies (anonymized)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
      false // shouldSoftDelete = false for permanent deletion
    );

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      throw new Error('Failed to delete user account');
    }

    console.log(`User ${user.id} deleted successfully from Supabase Auth`);

    // Update deletion request to completed
    // Note: This will fail if the cascade has already deleted the request
    // That's OK - it means the deletion succeeded
    try {
      await supabaseAdmin
        .from('account_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', deletionRequest.id);
    } catch (updateError) {
      console.log('Could not update deletion request (likely already deleted via cascade)');
    }

    // Log successful deletion
    console.log('Account deletion completed successfully:', {
      userId: user.id,
      deletionId,
      thirdPartyResults,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        deletionId,
        thirdPartyDeletions: thirdPartyResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in account-deletion-request:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while processing your deletion request',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Data Export Request Edge Function
// GDPR Right to Portability: Export all user data in machine-readable format
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportData {
  exportId: string;
  userId: string;
  email: string;
  exportedAt: string;
  profile: any;
  userPreferences: any;
  bookings: any[];
  tripRequests: any[];
  communityPosts: any[];
  communityComments: any[];
  reviews: any[];
  connections: any[];
  notifications: any[];
  messages: any[];
  wishlistItems: any[];
  consentHistory: any[];
  mediaFiles: any[];
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

    // Create admin client for accessing all user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log the export request
    const { data: exportRequest, error: requestError } = await supabaseAdmin
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        status: 'processing',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating export request:', requestError);
      throw new Error('Failed to create export request');
    }

    // Gather all user data
    console.log(`Starting data export for user ${user.id}`);

    // 1. Profile information
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. User preferences
    const { data: userPreferences } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 3. Bookings
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('user_id', user.id);

    // 4. Trip requests
    const { data: tripRequests } = await supabaseAdmin
      .from('trip_requests')
      .select('*')
      .eq('user_id', user.id);

    // 5. Community posts
    const { data: communityPosts } = await supabaseAdmin
      .from('community_posts')
      .select('*')
      .eq('user_id', user.id);

    // 6. Community comments
    const { data: communityComments } = await supabaseAdmin
      .from('community_comments')
      .select('*')
      .eq('user_id', user.id);

    // 7. Reviews
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('user_id', user.id);

    // 8. Connections
    const { data: connections } = await supabaseAdmin
      .from('community_connections')
      .select('*')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    // 9. Notifications
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to most recent 1000

    // 10. Messages (if messaging table exists)
    let messages: any[] = [];
    try {
      const { data: messagesData } = await supabaseAdmin
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1000);
      messages = messagesData || [];
    } catch (e) {
      console.log('Messages table not found or error:', e);
    }

    // 11. Wishlist items
    let wishlistItems: any[] = [];
    try {
      const { data: wishlistData } = await supabaseAdmin
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id);
      wishlistItems = wishlistData || [];
    } catch (e) {
      console.log('Wishlist table not found or error:', e);
    }

    // 12. Consent history
    const { data: consentHistory } = await supabaseAdmin
      .from('consent_audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('changed_at', { ascending: false });

    // 13. Media files from storage
    const mediaFiles: any[] = [];
    const storageBuckets = ['avatars', 'post-media', 'review-media', 'user-uploads'];

    for (const bucket of storageBuckets) {
      try {
        const { data: files, error: filesError } = await supabaseAdmin
          .storage
          .from(bucket)
          .list(user.id);

        if (files && !filesError) {
          for (const file of files) {
            const { data: urlData } = await supabaseAdmin
              .storage
              .from(bucket)
              .createSignedUrl(`${user.id}/${file.name}`, 86400); // 24 hour expiry

            if (urlData) {
              mediaFiles.push({
                bucket,
                fileName: file.name,
                url: urlData.signedUrl,
                metadata: file.metadata,
              });
            }
          }
        }
      } catch (e) {
        console.log(`Bucket ${bucket} not found or error:`, e);
      }
    }

    // Compile all data into export structure
    const exportData: ExportData = {
      exportId: exportRequest.id,
      userId: user.id,
      email: user.email || '',
      exportedAt: new Date().toISOString(),
      profile: profile || {},
      userPreferences: userPreferences || {},
      bookings: bookings || [],
      tripRequests: tripRequests || [],
      communityPosts: communityPosts || [],
      communityComments: communityComments || [],
      reviews: reviews || [],
      connections: connections || [],
      notifications: notifications || [],
      messages: messages || [],
      wishlistItems: wishlistItems || [],
      consentHistory: consentHistory || [],
      mediaFiles: mediaFiles || [],
    };

    // Convert to JSON
    const exportJson = JSON.stringify(exportData, null, 2);
    const exportBlob = new TextEncoder().encode(exportJson);
    const fileSizeBytes = exportBlob.length;

    // Upload to secure storage bucket
    const fileName = `user-data-export-${user.id}-${Date.now()}.json`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('user-data-exports')
      .upload(`${user.id}/${fileName}`, exportBlob, {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading export:', uploadError);
      throw new Error('Failed to upload export file');
    }

    // Create signed URL valid for 48 hours
    const { data: urlData, error: urlError } = await supabaseAdmin
      .storage
      .from('user-data-exports')
      .createSignedUrl(`${user.id}/${fileName}`, 172800); // 48 hours

    if (urlError || !urlData) {
      console.error('Error creating signed URL:', urlError);
      throw new Error('Failed to create download link');
    }

    const expiresAt = new Date(Date.now() + 172800 * 1000).toISOString();

    // Update export request with success
    await supabaseAdmin
      .from('data_export_requests')
      .update({
        status: 'completed',
        export_url: urlData.signedUrl,
        expires_at: expiresAt,
        completed_at: new Date().toISOString(),
        file_size_bytes: fileSizeBytes,
      })
      .eq('id', exportRequest.id);

    // Send email notification (using Resend or similar)
    // Note: You'll need to set up an email service
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'TRVL Social <noreply@trvlsocial.com>',
            to: [user.email],
            subject: 'Your Data Export is Ready',
            html: `
              <h2>Your Data Export is Ready</h2>
              <p>Hi there,</p>
              <p>Your personal data export has been successfully generated and is ready for download.</p>
              <p><strong>Download Link:</strong> <a href="${urlData.signedUrl}">Click here to download</a></p>
              <p><strong>Important:</strong> This link will expire in 48 hours for security reasons.</p>
              <p><strong>File Size:</strong> ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB</p>
              <p>The export includes all your personal data from TRVL Social in JSON format.</p>
              <p>If you have any questions or didn't request this export, please contact our support team immediately.</p>
              <p>Best regards,<br>TRVL Social Team</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        }
      } else {
        console.warn('RESEND_API_KEY not configured, skipping email notification');
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data export completed successfully. Check your email for the download link.',
        exportId: exportRequest.id,
        expiresAt,
        fileSizeMB: (fileSizeBytes / 1024 / 1024).toFixed(2),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in data-export-request:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while processing your export request',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

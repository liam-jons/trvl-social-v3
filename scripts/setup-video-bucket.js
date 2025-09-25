import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

// Try service key first, fallback to anon key with warning
const clientKey = supabaseServiceKey || supabaseAnonKey;
const isServiceRole = !!supabaseServiceKey;

if (!isServiceRole) {
  console.warn('⚠️  Using anonymous key - bucket creation may fail. Please add SUPABASE_SERVICE_ROLE_KEY to .env for full functionality.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, clientKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const VIDEO_BUCKET = 'videos';
const HERO_VIDEO_FILE = 'vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4';
const HERO_VIDEO_PATH = 'hero/tranquil-lake-landscape.mp4';

async function setupVideoBucket() {
  console.log('🚀 Setting up Supabase video storage bucket...');

  try {
    // Check if bucket already exists
    console.log('📋 Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const existingBucket = buckets.find(bucket => bucket.name === VIDEO_BUCKET);

    if (existingBucket) {
      console.log(`✅ Bucket '${VIDEO_BUCKET}' already exists`);
    } else {
      // Create the videos bucket (requires service role key)
      if (!isServiceRole) {
        console.log(`⚠️  Cannot create bucket without service role key.`);
        console.log(`🔧 Please create the '${VIDEO_BUCKET}' bucket manually in Supabase dashboard with these settings:`);
        console.log(`   - Name: ${VIDEO_BUCKET}`);
        console.log(`   - Public: true`);
        console.log(`   - Allowed MIME types: video/mp4, video/webm, video/quicktime`);
        console.log(`   - File size limit: 200MB`);
        console.log(`\n⏭️  Continuing with video upload assuming bucket exists...`);
      } else {
        console.log(`📦 Creating '${VIDEO_BUCKET}' bucket...`);
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(VIDEO_BUCKET, {
          public: true,
          allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          fileSizeLimit: 200 * 1024 * 1024 // 200MB limit for videos
        });

        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          console.log(`🔧 Please create the '${VIDEO_BUCKET}' bucket manually in Supabase dashboard.`);
          return;
        }

        console.log(`✅ Successfully created '${VIDEO_BUCKET}' bucket`);
      }
    }

    // Upload hero video
    await uploadHeroVideo();

    // Test video access
    await testVideoAccess();

    console.log('🎉 Video bucket setup completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function uploadHeroVideo() {
  console.log(`📹 Uploading hero video: ${HERO_VIDEO_FILE}...`);

  try {
    // Read the video file
    const videoPath = join(__dirname, '..', HERO_VIDEO_FILE);
    const videoBuffer = readFileSync(videoPath);

    console.log(`📊 Video file size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from(VIDEO_BUCKET)
      .list('hero', {
        limit: 100,
        offset: 0
      });

    const fileExists = existingFile?.some(file => file.name === 'tranquil-lake-landscape.mp4');

    if (fileExists) {
      console.log('📹 Hero video already exists, updating...');
    }

    // Upload video file
    const { data, error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .upload(HERO_VIDEO_PATH, videoBuffer, {
        cacheControl: '3600',
        upsert: true, // Allow overwrite if exists
        contentType: 'video/mp4'
      });

    if (error) {
      console.error('❌ Error uploading video:', error);
      return;
    }

    console.log(`✅ Successfully uploaded hero video to: ${HERO_VIDEO_PATH}`);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(HERO_VIDEO_PATH);

    console.log(`🌐 Public video URL: ${publicUrl}`);

    return publicUrl;

  } catch (error) {
    console.error('❌ Error in uploadHeroVideo:', error);
  }
}

async function testVideoAccess() {
  console.log('🧪 Testing video accessibility...');

  try {
    const { data: { publicUrl } } = supabase.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(HERO_VIDEO_PATH);

    // Test if URL is accessible (basic check)
    const response = await fetch(publicUrl, { method: 'HEAD' });

    if (response.ok) {
      console.log('✅ Video is publicly accessible');
      console.log(`📏 Content length: ${response.headers.get('content-length')} bytes`);
      console.log(`📋 Content type: ${response.headers.get('content-type')}`);
    } else {
      console.log(`⚠️  Video URL returned status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error testing video access:', error);
  }
}

// Run setup
setupVideoBucket().catch(console.error);
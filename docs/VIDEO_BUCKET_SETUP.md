# Video Bucket Setup Instructions

## Overview
This document provides instructions for setting up the Supabase video storage bucket for the TRVL Social application.

## Quick Start

### Automated Setup (Recommended)
1. Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file
2. Run: `npm run setup:video-bucket`

### Manual Setup
If you don't have the service role key, follow these steps:

#### 1. Create Video Bucket in Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com/project/vhecnqaejsukulaktjob/storage/buckets)
2. Click "New bucket"
3. Configure with these settings:
   - **Name**: `videos`
   - **Public**: ✅ Enable public access
   - **File size limit**: `200MB` (209,715,200 bytes)
   - **Allowed MIME types**:
     - `video/mp4`
     - `video/webm`
     - `video/quicktime`

#### 2. Upload Hero Video
1. In the `videos` bucket, create a folder named `hero`
2. Upload the video file: `vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4`
3. Rename it to: `tranquil-lake-landscape.mp4`
4. Ensure the final path is: `hero/tranquil-lake-landscape.mp4`

#### 3. Verify Setup
Run the setup script to verify: `npm run setup:video-bucket`

## Video Service API

The video service (`src/services/video-service.js`) provides these functions:

### Hero Video
```javascript
import { getHeroVideoUrl } from '../services/video-service';

const videoUrl = getHeroVideoUrl();
// Returns: https://vhecnqaejsukulaktjob.supabase.co/storage/v1/object/public/videos/hero/tranquil-lake-landscape.mp4
```

### Generic Video URLs
```javascript
import { getVideoUrl } from '../services/video-service';

const videoUrl = getVideoUrl('hero/tranquil-lake-landscape.mp4');
```

### Check Video Existence
```javascript
import { videoExists } from '../services/video-service';

const exists = await videoExists('hero/tranquil-lake-landscape.mp4');
```

### List Videos
```javascript
import { listVideos } from '../services/video-service';

const heroVideos = await listVideos('hero');
```

## Technical Details

### Bucket Configuration
- **Bucket Name**: `videos`
- **Access**: Public (required for web playback)
- **Max File Size**: 200MB
- **Supported Formats**: MP4, WebM, QuickTime
- **CORS**: Automatic (public bucket)

### Hero Video Specifications
- **File**: `vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4`
- **Size**: 55.50 MB
- **Storage Path**: `hero/tranquil-lake-landscape.mp4`
- **Usage**: Homepage hero background video

### File Structure
```
videos/
└── hero/
    └── tranquil-lake-landscape.mp4  (55.50 MB)
```

## Troubleshooting

### Error: "Bucket not found"
- Ensure the `videos` bucket exists in Supabase Storage
- Verify bucket name is exactly `videos` (lowercase)
- Check that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set

### Error: "Upload failed"
- Verify file size is under 200MB limit
- Check MIME type is supported
- Ensure bucket has proper permissions

### Video not loading in browser
- Confirm bucket is set to public
- Test direct URL access
- Check CORS configuration

## Files Created

### Scripts
- `scripts/setup-video-bucket.js` - Automated bucket setup and video upload

### Services
- `src/services/video-service.js` - Video URL and metadata management

### Documentation
- `docs/VIDEO_BUCKET_SETUP.md` - This file

## Next Steps

After completing the bucket setup:
1. Update homepage components to use `getHeroVideoUrl()`
2. Implement video preloading for better UX
3. Add video thumbnail fallbacks
4. Consider CDN caching for better performance

## Security Notes

- Public bucket allows direct URL access (required for video playback)
- No authentication required for video access
- Service role key should be kept secure and only used for admin operations
- Consider implementing signed URLs for sensitive video content in the future
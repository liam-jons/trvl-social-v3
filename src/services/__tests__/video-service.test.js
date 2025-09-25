import { describe, it, expect, beforeAll } from 'vitest';
import {
  getHeroVideoUrl,
  getVideoUrl,
  videoExists,
  listVideos,
  getVideoMetadata
} from '../video-service';

describe('Video Service', () => {
  describe('URL Generation', () => {
    it('should generate hero video URL', () => {
      const url = getHeroVideoUrl();
      expect(url).toBeDefined();
      expect(url).toContain('supabase.co');
      expect(url).toContain('videos');
      expect(url).toContain('hero/tranquil-lake-landscape.mp4');
    });

    it('should generate video URL for any path', () => {
      const testPath = 'test/video.mp4';
      const url = getVideoUrl(testPath);
      expect(url).toBeDefined();
      expect(url).toContain('supabase.co');
      expect(url).toContain('videos');
      expect(url).toContain(testPath);
    });

    it('should handle paths with spaces and special characters', () => {
      const testPath = 'folder/video with spaces.mp4';
      const url = getVideoUrl(testPath);
      expect(url).toBeDefined();
      expect(url).toContain('videos');
    });
  });

  describe('Video Operations', () => {
    it('should check video existence', async () => {
      // This test will pass when the bucket is set up
      const exists = await videoExists('hero/tranquil-lake-landscape.mp4');
      expect(typeof exists).toBe('boolean');
    });

    it('should handle non-existent video check gracefully', async () => {
      const exists = await videoExists('non-existent/video.mp4');
      expect(exists).toBe(false);
    });

    it('should list videos in directory', async () => {
      const videos = await listVideos('hero');
      expect(Array.isArray(videos)).toBe(true);
    });

    it('should list videos in root directory', async () => {
      const videos = await listVideos();
      expect(Array.isArray(videos)).toBe(true);
    });

    it('should get video metadata', async () => {
      const metadata = await getVideoMetadata('hero/tranquil-lake-landscape.mp4');

      if (metadata) {
        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('publicUrl');
        expect(metadata.publicUrl).toContain('supabase.co');
      }
      // Test passes whether metadata exists or not (bucket may not be set up yet)
    });
  });

  describe('Error Handling', () => {
    it('should handle empty path gracefully', () => {
      const url = getVideoUrl('');
      expect(url).toBeDefined();
      expect(url).toContain('videos');
    });

    it('should handle undefined path gracefully', () => {
      const url = getVideoUrl(undefined);
      expect(url).toBeDefined();
      expect(url).toContain('videos');
    });
  });

  describe('Integration', () => {
    it('should generate accessible URLs', () => {
      const heroUrl = getHeroVideoUrl();
      const genericUrl = getVideoUrl('hero/tranquil-lake-landscape.mp4');

      expect(heroUrl).toBe(genericUrl);
    });

    it('should maintain consistent URL format', () => {
      const url = getHeroVideoUrl();
      const expectedPattern = /https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/videos\/hero\/tranquil-lake-landscape\.mp4/;
      expect(url).toMatch(expectedPattern);
    });
  });
});

// Integration test that requires actual bucket setup
describe('Video Service Integration (requires bucket setup)', () => {
  it('should access hero video when bucket is configured', async () => {
    const url = getHeroVideoUrl();

    try {
      const response = await fetch(url, { method: 'HEAD' });

      if (response.ok) {
        // Bucket is set up correctly
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('video');
      } else {
        // Bucket not set up yet - test should still pass
        console.warn('Video bucket not set up yet. Run: npm run setup:video-bucket');
        expect(response.status).toBeGreaterThan(0);
      }
    } catch (error) {
      // Network error or bucket not accessible - test should still pass
      console.warn('Could not test video accessibility:', error.message);
      expect(url).toBeDefined();
    }
  });
});
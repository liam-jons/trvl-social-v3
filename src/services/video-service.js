import { supabase } from '../lib/supabase';

const VIDEO_BUCKET = 'videos';

/**
 * Video service for managing site video assets
 * Separate from media-service which handles user-generated content
 */

/**
 * Get the public URL for the hero video
 * @returns {string} Public URL for the hero video
 */
export const getHeroVideoUrl = () => {
  const { data: { publicUrl } } = supabase.storage
    .from(VIDEO_BUCKET)
    .getPublicUrl('hero/vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4');

  return publicUrl;
};

/**
 * Get public URL for any video in the videos bucket
 * @param {string} path - Path to video file within the bucket
 * @returns {string} Public URL for the video
 */
export const getVideoUrl = (path) => {
  // Handle undefined, null, or empty paths
  const safePath = path || '';

  const { data: { publicUrl } } = supabase.storage
    .from(VIDEO_BUCKET)
    .getPublicUrl(safePath);

  return publicUrl;
};

/**
 * Check if a video exists in the bucket
 * @param {string} path - Path to video file within the bucket
 * @returns {Promise<boolean>} True if video exists
 */
export const videoExists = async (path) => {
  try {
    // Handle undefined, null, or empty paths
    if (!path || typeof path !== 'string') {
      return false;
    }

    const pathParts = path.split('/');
    const directory = pathParts.slice(0, -1).join('/');

    const { data, error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .list(directory, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.warn('Error checking video existence:', error);
      return false;
    }

    const fileName = pathParts.pop();
    return data?.some(file => file.name === fileName) || false;
  } catch (error) {
    console.warn('Error in videoExists:', error);
    return false;
  }
};

/**
 * List all videos in a directory
 * @param {string} directory - Directory path within the bucket (optional)
 * @returns {Promise<Array>} List of video files
 */
export const listVideos = async (directory = '') => {
  try {
    const { data, error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .list(directory, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Error listing videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listVideos:', error);
    return [];
  }
};

/**
 * Get video metadata including size and last modified
 * @param {string} path - Path to video file within the bucket
 * @returns {Promise<Object|null>} Video metadata or null if error
 */
export const getVideoMetadata = async (path) => {
  try {
    // Handle undefined, null, or empty paths
    if (!path || typeof path !== 'string') {
      return null;
    }

    const pathParts = path.split('/');
    const directory = pathParts.slice(0, -1).join('/');

    const { data, error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .list(directory, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Error getting video metadata:', error);
      return null;
    }

    const fileName = pathParts.pop();
    const fileData = data?.find(file => file.name === fileName);

    if (!fileData) {
      return null;
    }

    return {
      name: fileData.name,
      size: fileData.metadata?.size || null,
      lastModified: fileData.updated_at,
      publicUrl: getVideoUrl(path)
    };
  } catch (error) {
    console.error('Error in getVideoMetadata:', error);
    return null;
  }
};

export default {
  getHeroVideoUrl,
  getVideoUrl,
  videoExists,
  listVideos,
  getVideoMetadata,
  VIDEO_BUCKET
};
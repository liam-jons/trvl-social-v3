import { supabase } from '../lib/supabase';

const MEDIA_BUCKET = 'community-media';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];

// Image optimization utilities
const resizeImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

const createThumbnail = (file, size = 300) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;

      // Calculate crop dimensions for square thumbnail
      const minDim = Math.min(img.width, img.height);
      const startX = (img.width - minDim) / 2;
      const startY = (img.height - minDim) / 2;

      ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };

    img.src = URL.createObjectURL(file);
  });
};

const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = 300;
      canvas.height = 300;

      video.currentTime = Math.min(1, video.duration / 4); // Get frame at 25% or 1 second
    };

    video.onseeked = () => {
      // Calculate crop for square thumbnail
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 300, 300);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);

      // Cleanup
      URL.revokeObjectURL(video.src);
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// File validation
export const validateFile = (file, type = 'image') => {
  const errors = [];

  if (!file) {
    errors.push('No file selected');
    return errors;
  }

  const supportedFormats = type === 'video' ? SUPPORTED_VIDEO_FORMATS : SUPPORTED_IMAGE_FORMATS;
  const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (!supportedFormats.includes(file.type)) {
    errors.push(`Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`);
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    errors.push(`File size exceeds ${maxSizeMB}MB limit`);
  }

  return errors;
};

// Generate unique file path
const generateFilePath = (userId, fileName, type = 'image') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileExt = fileName.split('.').pop();
  const cleanFileName = `${timestamp}-${randomString}.${fileExt}`;

  return `${type}s/${userId}/${cleanFileName}`;
};

// Upload progress callback wrapper
const createUploadWithProgress = (supabaseUpload, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress?.(Math.round(percentComplete));
      }
    });

    // Fallback to direct supabase upload (progress may not work in all browsers)
    supabaseUpload
      .then(resolve)
      .catch(reject);
  });
};

// Main upload functions
export const uploadImage = async (file, userId, onProgress = null) => {
  try {
    // Validate file
    const validationErrors = validateFile(file, 'image');
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    // Optimize image
    onProgress?.(10);
    const optimizedImage = await resizeImage(file);

    // Create thumbnail
    onProgress?.(20);
    const thumbnail = await createThumbnail(file);

    // Generate file paths
    const imagePath = generateFilePath(userId, file.name, 'image');
    const thumbnailPath = generateFilePath(userId, `thumb_${file.name}`, 'thumbnail');

    // Upload main image
    onProgress?.(40);
    const { error: imageError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(imagePath, optimizedImage, {
        cacheControl: '3600',
        upsert: false,
      });

    if (imageError) throw imageError;

    // Upload thumbnail
    onProgress?.(70);
    const { error: thumbError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(thumbnailPath, thumbnail, {
        cacheControl: '3600',
        upsert: false,
      });

    if (thumbError) throw thumbError;

    // Get public URLs
    onProgress?.(90);
    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(imagePath);

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(thumbnailPath);

    onProgress?.(100);

    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        type: 'image',
        url: imageUrl,
        thumbnailUrl,
        fileName: file.name,
        fileSize: optimizedImage.size,
        filePath: imagePath,
        thumbnailPath,
        uploadedAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const uploadVideo = async (file, userId, onProgress = null) => {
  try {
    // Validate file
    const validationErrors = validateFile(file, 'video');
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    // Generate thumbnail
    onProgress?.(10);
    let thumbnail = null;
    try {
      thumbnail = await generateVideoThumbnail(file);
    } catch (thumbError) {
      console.warn('Failed to generate video thumbnail:', thumbError);
    }

    // Generate file paths
    const videoPath = generateFilePath(userId, file.name, 'video');
    const thumbnailPath = thumbnail ? generateFilePath(userId, `thumb_${file.name}`, 'thumbnail') : null;

    // Upload video
    onProgress?.(30);
    const { error: videoError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(videoPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (videoError) throw videoError;

    // Upload thumbnail if generated
    let thumbnailUrl = null;
    if (thumbnail) {
      onProgress?.(70);
      const { error: thumbError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(thumbnailPath, thumbnail, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!thumbError) {
        const { data: { publicUrl } } = supabase.storage
          .from(MEDIA_BUCKET)
          .getPublicUrl(thumbnailPath);
        thumbnailUrl = publicUrl;
      }
    }

    // Get public URL
    onProgress?.(90);
    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(videoPath);

    onProgress?.(100);

    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        type: 'video',
        url: videoUrl,
        thumbnailUrl,
        fileName: file.name,
        fileSize: file.size,
        filePath: videoPath,
        thumbnailPath,
        uploadedAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete media file
export const deleteMedia = async (filePath, thumbnailPath = null) => {
  try {
    const filesToDelete = [filePath];
    if (thumbnailPath) {
      filesToDelete.push(thumbnailPath);
    }

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(filesToDelete);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get media file info
export const getMediaInfo = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(filePath);

    if (error) throw error;

    return {
      success: true,
      data: {
        url: data.publicUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Batch upload multiple files
export const uploadMultipleFiles = async (files, userId, onProgress = null, onFileComplete = null) => {
  const results = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileProgress = (completed) => {
      const overallProgress = ((i * 100) + completed) / totalFiles;
      onProgress?.(Math.round(overallProgress));
    };

    const isVideo = SUPPORTED_VIDEO_FORMATS.includes(file.type);
    const result = isVideo
      ? await uploadVideo(file, userId, fileProgress)
      : await uploadImage(file, userId, fileProgress);

    results.push({
      file: file.name,
      ...result,
    });

    onFileComplete?.(result, i + 1, totalFiles);
  }

  return results;
};

export default {
  uploadImage,
  uploadVideo,
  deleteMedia,
  getMediaInfo,
  validateFile,
  uploadMultipleFiles,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
};
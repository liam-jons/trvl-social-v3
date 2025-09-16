import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  StarIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import GlassCard from '../../ui/GlassCard';
// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const MediaUpload = ({ data, onChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const images = data.images || [];
  const updateImages = (newImages) => {
    onChange({ images: newImages });
  };
  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `adventures/${fileName}`;
    const { data: uploadData, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (error) {
      throw error;
    }
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    return {
      id: Date.now(),
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      path: filePath
    };
  };
  const handleFiles = async (files) => {
    setUploading(true);
    const newImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('File is not an image:', file.name);
        continue;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.name);
        continue;
      }
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        const uploadedImage = await uploadToSupabase(file);
        newImages.push(uploadedImage);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (error) {
        console.error('Upload failed:', file.name, error);
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }
    updateImages([...images, ...newImages]);
    setUploading(false);
    setUploadProgress({});
  };
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };
  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    updateImages(updatedImages);
  };
  const setFeaturedImage = (imageId) => {
    const updatedImages = images.map(img => ({
      ...img,
      featured: img.id === imageId
    }));
    updateImages(updatedImages);
  };
  const reorderImages = (dragIndex, hoverIndex) => {
    const draggedImage = images[dragIndex];
    const reorderedImages = [...images];
    reorderedImages.splice(dragIndex, 1);
    reorderedImages.splice(hoverIndex, 0, draggedImage);
    updateImages(reorderedImages);
  };
  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Adventure Media
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload high-quality images that showcase your adventure. The first image will be used as the main cover photo.
        </p>
      </div>
      {/* Upload Area */}
      <GlassCard variant="light" padding="lg">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Drop images here or click to upload
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            PNG, JPG, GIF up to 5MB each
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
        {/* Upload Progress */}
        <AnimatePresence>
          {Object.keys(uploadProgress).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {fileName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {progress === -1 ? 'Failed' : `${progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress === -1 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress === -1 ? 100 : progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
      {/* Image Gallery */}
      {images.length > 0 && (
        <GlassCard variant="light" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Adventure Gallery ({images.length} images)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag to reorder • Click star to set as cover photo
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  {/* Image */}
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewImage(image)}
                        className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                        title="Preview"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setFeaturedImage(image.id)}
                        className={`p-2 rounded-full transition-colors ${
                          image.featured || index === 0
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                        title={image.featured || index === 0 ? 'Cover Photo' : 'Set as Cover'}
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => copyImageUrl(image.url)}
                        className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                        title="Copy URL"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                        title="Remove"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {/* Featured Badge */}
                  {(image.featured || index === 0) && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      Cover
                    </div>
                  )}
                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {image.fileName}
                    </p>
                    <p className="text-white/80 text-xs">
                      {(image.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      )}
      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white font-medium">
                  {previewImage.fileName}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MediaUpload;
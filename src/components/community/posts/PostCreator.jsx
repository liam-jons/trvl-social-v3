import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../ui/GlassCard';
import GlassInput from '../../ui/GlassInput';
import GlassButton from '../../ui/GlassButton';
import RichTextEditor from './RichTextEditor';
import PostPreview from './PostPreview';
import MediaUploader from '../../media/MediaUploader';
import MediaGallery from '../../media/MediaGallery';
import DOMPurify from 'dompurify';
const PostCreator = ({ onSubmit, onCancel, initialData = null, userId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    tags: initialData?.tags?.join(', ') || '',
    category: initialData?.category || 'general',
    location_visibility: initialData?.location_visibility || 'public'
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [mediaItems, setMediaItems] = useState(initialData?.mediaItems || []);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  // Auto-save draft to localStorage
  const draftKey = `post-draft-${Date.now()}`;
  const hasDraft = useRef(false);
  useEffect(() => {
    // Load existing draft if no initial data
    if (!initialData) {
      const savedDraft = localStorage.getItem('post-creator-draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(draft);
          hasDraft.current = true;
        } catch (e) {
        }
      }
    }
  }, [initialData]);
  useEffect(() => {
    // Auto-save draft every 30 seconds if form is dirty
    const interval = setInterval(() => {
      if (isDirty && (formData.title || formData.content)) {
        localStorage.setItem('post-creator-draft', JSON.stringify(formData));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, isDirty]);
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be under 200 characters';
    }
    if (!formData.content.trim() || formData.content === '<p></p>') {
      newErrors.content = 'Content is required';
    }
    const tagArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    if (tagArray.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }
    if (tagArray.some(tag => tag.length > 30)) {
      newErrors.tags = 'Each tag must be under 30 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const sanitizeContent = (content) => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ADD_ATTR: ['target'],
      FORBID_ATTR: ['style', 'onerror', 'onload']
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const sanitizedContent = sanitizeContent(formData.content);
      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      const postData = {
        title: formData.title.trim(),
        content: sanitizedContent,
        tags: tagArray,
        category: formData.category,
        location_visibility: formData.location_visibility,
        mediaItems: mediaItems
      };
      await onSubmit(postData);
      // Clear draft after successful submission
      localStorage.removeItem('post-creator-draft');
      setIsDirty(false);
    } catch (error) {
      setErrors({ submit: 'Failed to create post. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCancel = () => {
    if (isDirty) {
      const shouldDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!shouldDiscard) return;
    }
    localStorage.removeItem('post-creator-draft');
    onCancel?.();
    navigate(-1);
  };
  const saveDraft = () => {
    const draftData = { ...formData, mediaItems };
    localStorage.setItem('post-creator-draft', JSON.stringify(draftData));
    setIsDirty(false);
    alert('Draft saved successfully!');
  };
  // Media handling functions
  const handleMediaUploadComplete = (uploadedMedia) => {
    setMediaItems(prev => [...prev, ...uploadedMedia]);
    setShowMediaUploader(false);
    setIsDirty(true);
  };
  const handleMediaDelete = (mediaIds) => {
    setMediaItems(prev => prev.filter(item => !mediaIds.includes(item.id)));
    setIsDirty(true);
  };
  const handleMediaReorder = (fromIndex, toIndex) => {
    setMediaItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
    setIsDirty(true);
  };
  const handleMediaError = (error) => {
    setErrors(prev => ({
      ...prev,
      media: error
    }));
  };
  const categories = [
    { value: 'general', label: 'General Discussion' },
    { value: 'tips', label: 'Travel Tips' },
    { value: 'photos', label: 'Photo Sharing' },
    { value: 'questions', label: 'Questions & Help' },
    { value: 'events', label: 'Events & Meetups' },
    { value: 'reviews', label: 'Reviews & Recommendations' },
    { value: 'stories', label: 'Travel Stories' },
    { value: 'planning', label: 'Trip Planning' }
  ];
  const locationOptions = [
    { value: 'public', label: 'Public - Show my location' },
    { value: 'region', label: 'Regional - Show general area only' },
    { value: 'private', label: 'Private - Hide location' }
  ];
  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Preview Post
          </h2>
          <div className="flex gap-2">
            <GlassButton
              onClick={() => setPreviewMode(false)}
              variant="secondary"
            >
              Edit
            </GlassButton>
            <GlassButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </GlassButton>
          </div>
        </div>
        <PostPreview
          title={formData.title}
          content={formData.content}
          tags={formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)}
          category={categories.find(cat => cat.value === formData.category)?.label}
          mediaItems={mediaItems}
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {initialData ? 'Edit Post' : 'Create New Post'}
        </h2>
        {hasDraft.current && (
          <div className="text-sm text-blue-500">
            Draft loaded
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <GlassCard variant="accent" className="p-4">
            <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
          </GlassCard>
        )}
        {/* Title */}
        <GlassInput
          label="Post Title"
          required
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter your post title..."
          error={errors.title}
          maxLength={200}
        />
        {/* Category */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value} className="bg-white dark:bg-gray-800">
                {category.label}
              </option>
            ))}
          </select>
        </div>
        {/* Content Editor */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => handleInputChange('content', content)}
            placeholder="Share your thoughts, experiences, or ask questions..."
            limit={5000}
          />
          {errors.content && (
            <p className="text-red-500 text-xs mt-1">{errors.content}</p>
          )}
        </div>
        {/* Tags */}
        <GlassInput
          label="Tags (comma-separated)"
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder="travel, tips, photography, adventure..."
          error={errors.tags}
          className="w-full"
        />
        {/* Location Visibility */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location Visibility
          </label>
          <select
            value={formData.location_visibility}
            onChange={(e) => handleInputChange('location_visibility', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
          >
            {locationOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {/* Media Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Media Attachments
            </label>
            {!showMediaUploader && (
              <GlassButton
                type="button"
                onClick={() => setShowMediaUploader(true)}
                variant="secondary"
                size="sm"
                disabled={!userId}
              >
                Add Media
              </GlassButton>
            )}
          </div>
          {errors.media && (
            <p className="text-red-500 text-xs">{errors.media}</p>
          )}
          {/* Media Uploader */}
          {showMediaUploader && (
            <MediaUploader
              userId={userId}
              onUploadComplete={handleMediaUploadComplete}
              onError={handleMediaError}
              maxFiles={5}
              acceptImages={true}
              acceptVideos={true}
            />
          )}
          {/* Media Gallery */}
          {mediaItems.length > 0 && (
            <MediaGallery
              mediaItems={mediaItems}
              onDelete={handleMediaDelete}
              onReorder={handleMediaReorder}
              editable={true}
              maxHeight="300px"
            />
          )}
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <GlassButton
            type="button"
            onClick={saveDraft}
            variant="secondary"
            className="flex-1 sm:flex-initial"
            disabled={!isDirty}
          >
            Save Draft
          </GlassButton>
          <GlassButton
            type="button"
            onClick={() => setPreviewMode(true)}
            variant="secondary"
            className="flex-1 sm:flex-initial"
            disabled={!formData.title || !formData.content}
          >
            Preview
          </GlassButton>
          <div className="flex gap-3 flex-1 sm:flex-initial">
            <GlassButton
              type="button"
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  );
};
export default PostCreator;
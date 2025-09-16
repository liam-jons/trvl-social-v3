import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, FolderIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
const CollectionModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreate(formData.name.trim(), formData.description.trim(), formData.isPrivate);
      // Reset form
      setFormData({
        name: '',
        description: '',
        isPrivate: false
      });
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        isPrivate: false
      });
      onClose();
    }
  };
  return (
    <GlassModal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FolderIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Collection
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Summer Adventures, Dream Destinations"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
              required
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this collection is for..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>
          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Privacy Setting
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={!formData.isPrivate}
                  onChange={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <GlobeAltIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Public</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Others can view and discover this collection
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={formData.isPrivate}
                  onChange={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Private</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Only you can see this collection
                  </div>
                </div>
              </label>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </GlassModal>
  );
};
export default CollectionModal;
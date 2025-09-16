import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import { WishlistService } from '../../services/wishlist-service';
import GlassModal from '../ui/GlassModal';
import {
  XMarkIcon,
  ShareIcon,
  LinkIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
const ShareModal = ({ isOpen, onClose, collection }) => {
  const { addNotification } = useNotification();
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (isOpen && collection) {
      generateShareLink();
    }
  }, [isOpen, collection]);
  const generateShareLink = async () => {
    if (!collection || collection.is_private) return;
    setIsGenerating(true);
    try {
      const { data, error } = await WishlistService.generateShareLink(collection.user_id, collection.id);
      if (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to generate share link'
        });
        return;
      }
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Error generating share link:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate share link'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Share link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to copy link'
      });
    }
  };
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my "${collection?.name}" adventure collection`);
    const body = encodeURIComponent(
      `I thought you might be interested in my adventure collection "${collection?.name}". Check it out here: ${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out my "${collection?.name}" adventure collection!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`);
  };
  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
  };
  if (!collection) return null;
  return (
    <GlassModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ShareIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Share Collection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Collection Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            "{collection.name}"
          </h3>
          {collection.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {collection.description}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {collection.wishlists_count?.length || 0} adventures • Public collection
          </p>
        </div>
        {collection.is_private ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeSlashIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Private Collection
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This collection is private and cannot be shared. Make it public to generate a share link.
            </p>
            <button
              onClick={() => {
                // Handle making collection public
                onClose();
              }}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Make Public
            </button>
          </div>
        ) : (
          <>
            {/* Share Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share Link
              </label>
              {isGenerating ? (
                <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Generating link...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {shareUrl}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
            {/* Social Sharing */}
            {shareUrl && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Share Via
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={shareViaEmail}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <EnvelopeIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Email</span>
                  </button>
                  <button
                    onClick={shareViaTwitter}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-sm font-bold">
                      X
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Twitter</span>
                  </button>
                  <button
                    onClick={shareViaFacebook}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-sm font-bold">
                      f
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Facebook</span>
                  </button>
                </div>
              </div>
            )}
            {/* Share Tips */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Sharing Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Anyone with this link can view your collection</li>
                <li>• They can see all adventures but cannot edit</li>
                <li>• You can make the collection private anytime</li>
                <li>• Link will stop working if collection is deleted</li>
              </ul>
            </div>
          </>
        )}
        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </GlassModal>
  );
};
export default ShareModal;
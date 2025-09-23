import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { WishlistService } from '../../services/wishlist-service';
import GlassCard from '../ui/GlassCard';
import CollectionModal from './CollectionModal';
import ShareModal from './ShareModal';
import {
  FolderIcon,
  FolderPlusIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
const CollectionManager = ({ onCollectionSelect, selectedCollectionId, className = '' }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedShareCollection, setSelectedShareCollection] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  // Load collections
  useEffect(() => {
    const loadCollections = async () => {
      if (!user) return;
      try {
        const { data, error } = await WishlistService.getUserCollections(user.id);
        if (error) {
          return;
        }
        setCollections(data || []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    loadCollections();
  }, [user]);
  const handleCreateCollection = async (name, description, isPrivate) => {
    try {
      const { data, error } = await WishlistService.createCollection(user.id, name, description, isPrivate);
      if (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to create collection'
        });
        return;
      }
      setCollections(prev => [data, ...prev]);
      setShowCreateModal(false);
      addNotification({
        type: 'success',
        title: 'Collection Created',
        message: `"${name}" collection has been created`
      });
    } catch (error) {
    }
  };
  const handleUpdateCollection = async (collectionId, updates) => {
    try {
      const { data, error } = await WishlistService.updateCollection(user.id, collectionId, updates);
      if (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update collection'
        });
        return;
      }
      setCollections(prev => prev.map(c => c.id === collectionId ? data : c));
      setEditingCollection(null);
      addNotification({
        type: 'success',
        title: 'Collection Updated',
        message: 'Collection has been updated successfully'
      });
    } catch (error) {
    }
  };
  const handleDeleteCollection = async (collectionId) => {
    if (!confirm('Are you sure you want to delete this collection? Adventures will be moved to uncategorized.')) {
      return;
    }
    try {
      const { error } = await WishlistService.deleteCollection(user.id, collectionId);
      if (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete collection'
        });
        return;
      }
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      // If currently selected collection was deleted, switch to all
      if (selectedCollectionId === collectionId) {
        onCollectionSelect('all');
      }
      addNotification({
        type: 'success',
        title: 'Collection Deleted',
        message: 'Collection has been deleted successfully'
      });
    } catch (error) {
    }
  };
  const handleShareCollection = (collection) => {
    setSelectedShareCollection(collection);
    setShowShareModal(true);
  };
  const toggleCollectionExpand = (collectionId) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };
  if (loading) {
    return (
      <div className={className}>
        <GlassCard variant="light">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }
  return (
    <div className={className}>
      <GlassCard variant="light">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderIcon className="w-5 h-5" />
            Collections
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Create new collection"
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
        </div>
        {/* All Items */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => onCollectionSelect('all')}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
              selectedCollectionId === 'all'
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderIcon className="w-5 h-5" />
              <span className="font-medium">All Items</span>
            </div>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Collections List */}
        <div className="space-y-2">
          <AnimatePresence>
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`border rounded-lg transition-colors ${
                  selectedCollectionId === collection.id
                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Collection Header */}
                <button
                  onClick={() => onCollectionSelect(collection.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      {collection.is_private ? (
                        <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {collection.name}
                      </div>
                      {collection.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {collection.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {collection.wishlists_count?.length || 0} items
                      </span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </button>
                {/* Collection Actions */}
                {selectedCollectionId === collection.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCollection(collection);
                        }}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit collection"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {!collection.is_private && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareCollection(collection);
                          }}
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Share collection"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete collection"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {collections.length === 0 && (
            <div className="text-center py-8">
              <FolderIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No collections yet
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Create your first collection
              </button>
            </div>
          )}
        </div>
      </GlassCard>
      {/* Create/Edit Collection Modal */}
      <CollectionModal
        isOpen={showCreateModal || !!editingCollection}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCollection(null);
        }}
        onCreate={editingCollection ?
          (name, description, isPrivate) => handleUpdateCollection(editingCollection.id, { name, description, is_private: isPrivate }) :
          handleCreateCollection
        }
        initialData={editingCollection ? {
          name: editingCollection.name,
          description: editingCollection.description,
          isPrivate: editingCollection.is_private
        } : undefined}
        isEdit={!!editingCollection}
      />
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedShareCollection(null);
        }}
        collection={selectedShareCollection}
      />
    </div>
  );
};
export default CollectionManager;
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  StarIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import GlassCard from '../../ui/GlassCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import useVendorDashboardStore from '../../../stores/vendorDashboardStore';
const AdventureListView = ({
  adventures = [],
  viewMode = 'grid',
  selectedAdventures = [],
  onSelectionChange,
  onEditAdventure,
  isLoading = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { deleteAdventure, duplicateAdventure, updateAdventure } = useVendorDashboardStore();
  const handleSelectAdventure = (adventureId) => {
    if (selectedAdventures.includes(adventureId)) {
      onSelectionChange(selectedAdventures.filter(id => id !== adventureId));
    } else {
      onSelectionChange([...selectedAdventures, adventureId]);
    }
  };
  const handleSelectAll = () => {
    if (selectedAdventures.length === adventures.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(adventures.map(a => a.id));
    }
  };
  const handleDeleteAdventure = async (adventureId) => {
    try {
      await deleteAdventure(adventureId);
      setShowDeleteConfirm(null);
    } catch (error) {
    }
  };
  const handleDuplicateAdventure = async (adventure) => {
    try {
      await duplicateAdventure(adventure);
    } catch (error) {
    }
  };
  const handleStatusChange = async (adventureId, newStatus) => {
    try {
      await updateAdventure(adventureId, { status: newStatus });
    } catch (error) {
    }
  };
  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Published' },
      draft: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Draft' },
      archived: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', label: 'Archived' },
      paused: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', label: 'Paused' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };
  const ActionDropdown = ({ adventure }) => (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Menu.Button>
      <Transition
        as="div"
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onEditAdventure(adventure)}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md transition-colors`}
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit Adventure
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleDuplicateAdventure(adventure)}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md transition-colors`}
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Duplicate
                </button>
              )}
            </Menu.Item>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleStatusChange(adventure.id, adventure.status === 'published' ? 'draft' : 'published')}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md transition-colors`}
                >
                  <EyeIcon className="h-4 w-4" />
                  {adventure.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleStatusChange(adventure.id, adventure.status === 'archived' ? 'draft' : 'archived')}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md transition-colors`}
                >
                  {adventure.status === 'archived' ? 'Restore' : 'Archive'}
                </button>
              )}
            </Menu.Item>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setShowDeleteConfirm(adventure.id)}
                  className={`${
                    active ? 'bg-red-50 dark:bg-red-900/20' : ''
                  } flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md transition-colors`}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading adventures..." />;
  }
  if (adventures.length === 0) {
    return (
      <GlassCard variant="light" padding="lg" className="text-center">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No adventures yet
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first adventure to get started with your listings.
        </p>
      </GlassCard>
    );
  }
  return (
    <div className="space-y-4">
      {/* Bulk Selection Header */}
      {selectedAdventures.length > 0 && (
        <GlassCard variant="light" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedAdventures.length === adventures.length}
                onChange={handleSelectAll}
                className="text-blue-500 focus:ring-blue-500 rounded"
              />
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedAdventures.length} of {adventures.length} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  selectedAdventures.forEach(id => handleStatusChange(id, e.target.value));
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-sm"
              >
                <option value="">Change Status...</option>
                <option value="published">Publish</option>
                <option value="draft">Draft</option>
                <option value="archived">Archive</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}
      {/* Adventure Grid/List */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}`}>
        <AnimatePresence>
          {adventures.map((adventure) => (
            <motion.div
              key={adventure.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard
                variant="default"
                padding="none"
                className={`overflow-hidden hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 ${
                  viewMode === 'list' ? 'flex' : 'flex flex-col'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedAdventures.includes(adventure.id)}
                    onChange={() => handleSelectAdventure(adventure.id)}
                    className="text-blue-500 focus:ring-blue-500 rounded bg-white/80 dark:bg-gray-800/80"
                  />
                </div>
                {/* Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'} bg-gray-200 dark:bg-gray-800`}>
                  {adventure.images?.length > 0 ? (
                    <img
                      src={adventure.images[0].url}
                      alt={adventure.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(adventure.status)}
                  </div>
                  {/* Featured Badge */}
                  {adventure.featured && (
                    <div className="absolute bottom-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      Featured
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {adventure.title}
                    </h3>
                    <ActionDropdown adventure={adventure} />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <MapPinIcon className="h-4 w-4" />
                      {adventure.location}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <ClockIcon className="h-4 w-4" />
                      {adventure.duration}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      From ${adventure.basePrice}
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {adventure.bookings || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {adventure.rating || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {adventure.revenue || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => onEditAdventure(adventure)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(
                        adventure.id,
                        adventure.status === 'published' ? 'draft' : 'published'
                      )}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        adventure.status === 'published'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30'
                          : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                      }`}
                    >
                      {adventure.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Adventure
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to permanently delete this adventure? All associated bookings and data will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAdventure(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AdventureListView;
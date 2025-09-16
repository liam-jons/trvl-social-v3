import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  EyeIcon,
  ViewColumnsIcon,
  Bars3Icon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import GlassCard from '../../components/ui/GlassCard';
import AdventureWizard from '../../components/vendor/adventures/AdventureWizard';
import AdventureListView from '../../components/vendor/adventures/AdventureListView';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
const AdventureManagementPage = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [editingAdventure, setEditingAdventure] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAdventures, setSelectedAdventures] = useState([]);
  const { adventures, loadAdventures, isLoading } = useVendorDashboardStore();
  useEffect(() => {
    loadAdventures();
  }, [loadAdventures]);
  const handleCreateNew = () => {
    setEditingAdventure(null);
    setShowWizard(true);
  };
  const handleEditAdventure = (adventure) => {
    setEditingAdventure(adventure);
    setShowWizard(true);
  };
  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingAdventure(null);
  };
  const handleBulkAction = (action) => {
    // Handle bulk operations like publish, unpublish, delete
    console.log(`Bulk ${action} for adventures:`, selectedAdventures);
  };
  const filteredAdventures = adventures?.filter(adventure => {
    const matchesSearch = adventure.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         adventure.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || adventure.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];
  const stats = {
    total: adventures?.length || 0,
    published: adventures?.filter(a => a.status === 'published').length || 0,
    draft: adventures?.filter(a => a.status === 'draft').length || 0,
    archived: adventures?.filter(a => a.status === 'archived').length || 0
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Adventure Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your adventure listings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {viewMode === 'grid' ? <Bars3Icon className="h-5 w-5" /> : <ViewColumnsIcon className="h-5 w-5" />}
          </button>
          {/* Bulk Operations Quick Link */}
          <a
            href="/vendor-portal/bulk-operations"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <Squares2X2Icon className="h-5 w-5" />
            Bulk Operations
          </a>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5" />
            Create Adventure
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Adventures', value: stats.total, color: 'blue' },
          { label: 'Published', value: stats.published, color: 'green' },
          { label: 'Draft', value: stats.draft, color: 'yellow' },
          { label: 'Archived', value: stats.archived, color: 'gray' }
        ].map((stat) => (
          <GlassCard key={stat.label} variant="light" padding="md" className="text-center">
            <div className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stat.label}
            </div>
          </GlassCard>
        ))}
      </div>
      {/* Filters and Search */}
      <GlassCard variant="light" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search adventures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          {/* Bulk Actions */}
          {selectedAdventures.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAdventures.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900/30 transition-colors"
              >
                Archive
              </button>
            </div>
          )}
        </div>
      </GlassCard>
      {/* Adventure List */}
      <AdventureListView
        adventures={filteredAdventures}
        viewMode={viewMode}
        selectedAdventures={selectedAdventures}
        onSelectionChange={setSelectedAdventures}
        onEditAdventure={handleEditAdventure}
        isLoading={isLoading}
      />
      {/* Adventure Creation/Edit Wizard */}
      <AnimatePresence>
        {showWizard && (
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <AdventureWizard
                adventure={editingAdventure}
                onClose={handleCloseWizard}
                onSave={() => {
                  loadAdventures(); // Refresh the list
                  handleCloseWizard();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AdventureManagementPage;
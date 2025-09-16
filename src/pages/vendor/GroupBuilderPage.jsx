import { useEffect, useState } from 'react';
import {
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import useGroupBuilderStore from '../../stores/groupBuilderStore';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ParticipantCard from '../../components/vendor/group-builder/ParticipantCard';
import GroupContainer from '../../components/vendor/group-builder/GroupContainer';

const GroupBuilderPage = () => {
  const { user } = useAuth();
  const { vendor, adventures } = useVendorDashboardStore();
  const {
    participants,
    groups,
    availableParticipants,
    selectedAdventure,
    loading,
    error,
    setSelectedAdventure,
    loadParticipants,
    createGroup,
    addParticipantToGroup,
    removeParticipantFromGroup,
    moveParticipant,
    deleteGroup,
    generateOptimalGroups,
    saveGroupConfiguration,
    getGroupStatistics,
    undo,
    redo,
    canUndo,
    canRedo,
    clearAll
  } = useGroupBuilderStore();

  const [draggedParticipant, setDraggedParticipant] = useState(null);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveConfigName, setSaveConfigName] = useState('');
  const [showOptimizationSettings, setShowOptimizationSettings] = useState(false);

  // Load adventures when vendor data is available
  useEffect(() => {
    if (!vendor || !adventures.length) return;

    // Set first adventure as default if none selected
    if (!selectedAdventure && adventures.length > 0) {
      const defaultAdventure = adventures.find(a => a.is_active) || adventures[0];
      setSelectedAdventure(defaultAdventure);
    }
  }, [vendor, adventures, selectedAdventure, setSelectedAdventure]);

  // Load participants when adventure is selected
  useEffect(() => {
    if (selectedAdventure) {
      loadParticipants(selectedAdventure.id);
    }
  }, [selectedAdventure, loadParticipants]);

  const handleAdventureSelect = (adventure) => {
    setSelectedAdventure(adventure);
    clearAll(); // Clear existing groups when switching adventures
  };

  const handleCreateGroup = () => {
    createGroup();
  };

  const handleParticipantDragStart = (participant, fromGroupId = null) => {
    setDraggedParticipant({
      ...participant,
      fromGroupId
    });
  };

  const handleParticipantDragEnd = () => {
    setDraggedParticipant(null);
    setDragOverGroupId(null);
  };

  const handleGroupDragOver = (groupId) => {
    setDragOverGroupId(groupId);
  };

  const handleGroupDragLeave = () => {
    setDragOverGroupId(null);
  };

  const handleParticipantDrop = async (participant, groupId) => {
    setDragOverGroupId(null);

    if (!participant || !groupId) return;

    try {
      if (participant.fromGroupId) {
        // Moving between groups
        await moveParticipant(participant.id, participant.fromGroupId, groupId);
      } else {
        // Adding to group from available participants
        await addParticipantToGroup(participant.id, groupId);
      }
    } catch (error) {
      console.error('Error dropping participant:', error);
    }

    setDraggedParticipant(null);
  };

  const handleOptimizeGroups = async () => {
    const settings = {
      targetGroupSize: 6,
      maxGroups: 10,
      prioritizeCompatibility: true
    };

    await generateOptimalGroups(settings);
  };

  const handleSaveConfiguration = async () => {
    if (!saveConfigName.trim()) return;

    const result = await saveGroupConfiguration(
      saveConfigName,
      `Group configuration for ${selectedAdventure?.title || 'adventure'}`
    );

    if (result.success) {
      setShowSaveDialog(false);
      setSaveConfigName('');
    }
  };

  const groupStats = getGroupStatistics();

  const getAvailableParticipantsForDisplay = () => {
    return availableParticipants.filter(participant =>
      !groups.some(group =>
        group.participants.some(gp => gp.id === participant.id)
      )
    );
  };

  if (loading.participants) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message="Loading participants..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error}
          onRetry={() => selectedAdventure && loadParticipants(selectedAdventure.id)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Smart Group Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered group formation with compatibility optimization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Undo/Redo buttons */}
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 disabled:opacity-50 transition-all duration-200"
            title="Undo"
          >
            <ArrowPathIcon className="h-5 w-5 scale-x-[-1]" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 disabled:opacity-50 transition-all duration-200"
            title="Redo"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          {/* Auto-optimize button */}
          <GlassButton
            onClick={handleOptimizeGroups}
            disabled={loading.optimization || availableParticipants.length === 0}
            variant="secondary"
            size="md"
            className="flex items-center space-x-2"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Auto-Optimize</span>
          </GlassButton>

          {/* Save configuration */}
          <GlassButton
            onClick={() => setShowSaveDialog(true)}
            disabled={groups.length === 0}
            variant="primary"
            size="md"
            className="flex items-center space-x-2"
          >
            <BookmarkIcon className="h-4 w-4" />
            <span>Save Config</span>
          </GlassButton>
        </div>
      </div>

      {/* Adventure selector */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Adventure
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adventures?.map((adventure) => (
            <button
              key={adventure.id}
              onClick={() => handleAdventureSelect(adventure)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${selectedAdventure?.id === adventure.id
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }
              `}
            >
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {adventure.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {adventure.short_description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Max: {adventure.max_capacity} people</span>
                <span>{adventure.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Statistics */}
      {groups.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard variant="light" padding="sm" className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {groupStats.totalGroups}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Groups</div>
          </GlassCard>

          <GlassCard variant="light" padding="sm" className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {groupStats.totalParticipants}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
          </GlassCard>

          <GlassCard variant="light" padding="sm" className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {groupStats.averageCompatibility}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Compatibility</div>
          </GlassCard>

          <GlassCard variant="light" padding="sm" className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {groupStats.averageGroupSize}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Group Size</div>
          </GlassCard>
        </div>
      )}

      {selectedAdventure && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Available Participants */}
          <div className="lg:col-span-1">
            <GlassCard variant="light" padding="md" className="h-fit max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Participants
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getAvailableParticipantsForDisplay().length} available
                </span>
              </div>

              <div className="space-y-3">
                {getAvailableParticipantsForDisplay().map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    variant="compact"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(participant));
                      e.dataTransfer.effectAllowed = 'copy';
                      handleParticipantDragStart(participant);
                    }}
                    onDragEnd={handleParticipantDragEnd}
                  />
                ))}

                {getAvailableParticipantsForDisplay().length === 0 && (
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {availableParticipants.length === 0
                        ? 'No participants available'
                        : 'All participants are assigned to groups'
                      }
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Groups */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Groups
              </h2>

              <GlassButton
                onClick={handleCreateGroup}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Group</span>
              </GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group) => (
                <GroupContainer
                  key={group.id}
                  group={group}
                  isDragOver={dragOverGroupId === group.id}
                  onParticipantRemove={removeParticipantFromGroup}
                  onGroupDelete={deleteGroup}
                  onDragOver={handleGroupDragOver}
                  onDragLeave={handleGroupDragLeave}
                  onDrop={handleParticipantDrop}
                />
              ))}

              {groups.length === 0 && (
                <div className="md:col-span-2">
                  <GlassCard variant="light" padding="lg" className="text-center">
                    <ChartBarIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Groups Created
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Create your first group to start organizing participants
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <GlassButton
                        onClick={handleCreateGroup}
                        variant="primary"
                        size="md"
                        className="flex items-center space-x-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Create Group</span>
                      </GlassButton>
                      <GlassButton
                        onClick={handleOptimizeGroups}
                        disabled={availableParticipants.length === 0}
                        variant="secondary"
                        size="md"
                        className="flex items-center space-x-2"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        <span>Auto-Optimize</span>
                      </GlassButton>
                    </div>
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Configuration Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <GlassCard variant="light" padding="lg" className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Group Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={saveConfigName}
                  onChange={(e) => setSaveConfigName(e.target.value)}
                  placeholder="Enter configuration name..."
                  className="w-full px-3 py-2 border border-gray-300/20 dark:border-gray-700/50 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <GlassButton
                  onClick={() => setShowSaveDialog(false)}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={handleSaveConfiguration}
                  disabled={!saveConfigName.trim() || loading.saving}
                  variant="primary"
                  size="md"
                >
                  {loading.saving ? 'Saving...' : 'Save'}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default GroupBuilderPage;
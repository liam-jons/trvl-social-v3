import { useState, useEffect, useCallback } from 'react';
import GlassButton from '../ui/GlassButton';
import GlassModal from '../ui/GlassModal';

const ConflictResolver = ({
  conflicts = [],
  onResolveConflict,
  onIgnoreConflict,
  autoResolveStrategy = 'manual', // 'manual', 'latest-wins', 'merge'
  className = ''
}) => {
  const [activeConflict, setActiveConflict] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  // Auto-resolve conflicts based on strategy
  useEffect(() => {
    if (conflicts.length === 0 || autoResolveStrategy === 'manual') return;

    const autoResolve = async () => {
      for (const conflict of conflicts) {
        await resolveConflictAutomatically(conflict);
      }
    };

    autoResolve();
  }, [conflicts, autoResolveStrategy]);

  // Automatically resolve conflict based on strategy
  const resolveConflictAutomatically = async (conflict) => {
    switch (autoResolveStrategy) {
      case 'latest-wins':
        // Always choose the most recent update
        const latestUpdate = conflict.updates.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        );
        await resolveConflict(conflict.id, latestUpdate);
        break;

      case 'merge':
        // Attempt to merge conflicting updates
        const mergedUpdate = await mergeConflictingUpdates(conflict);
        if (mergedUpdate) {
          await resolveConflict(conflict.id, mergedUpdate);
        } else {
          // Fall back to manual resolution
          setActiveConflict(conflict);
        }
        break;

      default:
        break;
    }
  };

  // Merge conflicting updates
  const mergeConflictingUpdates = async (conflict) => {
    try {
      const { updates, resourceType, resourceId } = conflict;

      if (resourceType === 'group_members') {
        return await mergeGroupMemberUpdates(updates, resourceId);
      } else if (resourceType === 'group_settings') {
        return await mergeGroupSettingsUpdates(updates, resourceId);
      }

      return null;
    } catch (error) {
      console.error('Failed to merge conflicting updates:', error);
      return null;
    }
  };

  // Merge group member updates
  const mergeGroupMemberUpdates = async (updates, groupId) => {
    // Separate add and remove operations
    const additions = updates.filter(u => u.operation === 'INSERT');
    const removals = updates.filter(u => u.operation === 'DELETE');
    const modifications = updates.filter(u => u.operation === 'UPDATE');

    // Create merged member list
    let members = new Map();

    // Apply all additions
    additions.forEach(update => {
      if (update.new_record) {
        members.set(update.new_record.user_id, update.new_record);
      }
    });

    // Apply modifications (latest wins for each member)
    modifications.forEach(update => {
      if (update.new_record) {
        const existingTimestamp = members.get(update.new_record.user_id)?.updated_at || 0;
        const updateTimestamp = new Date(update.new_record.updated_at).getTime();

        if (updateTimestamp > existingTimestamp) {
          members.set(update.new_record.user_id, update.new_record);
        }
      }
    });

    // Apply removals
    removals.forEach(update => {
      if (update.old_record) {
        members.delete(update.old_record.user_id);
      }
    });

    return {
      operation: 'MERGE',
      resource_type: 'group_members',
      resource_id: groupId,
      merged_data: Array.from(members.values()),
      source_updates: updates.map(u => u.id),
      timestamp: Date.now()
    };
  };

  // Merge group settings updates
  const mergeGroupSettingsUpdates = async (updates, groupId) => {
    // Start with the oldest update as base
    const sortedUpdates = [...updates].sort((a, b) => a.timestamp - b.timestamp);
    let mergedSettings = { ...sortedUpdates[0].new_record };

    // Apply each subsequent update, field by field
    for (let i = 1; i < sortedUpdates.length; i++) {
      const update = sortedUpdates[i];
      if (update.new_record) {
        // Merge non-conflicting fields
        Object.keys(update.new_record).forEach(field => {
          // Use latest value for each field
          mergedSettings[field] = update.new_record[field];
        });
      }
    }

    return {
      operation: 'MERGE',
      resource_type: 'group_settings',
      resource_id: groupId,
      merged_data: mergedSettings,
      source_updates: updates.map(u => u.id),
      timestamp: Date.now()
    };
  };

  // Resolve a conflict
  const resolveConflict = async (conflictId, resolution) => {
    setIsResolving(true);

    try {
      await onResolveConflict(conflictId, resolution);
      setActiveConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  // Manual conflict resolution interface
  const ManualConflictResolver = ({ conflict }) => {
    const [selectedResolution, setSelectedResolution] = useState(null);
    const [customResolution, setCustomResolution] = useState('');

    const handleResolve = () => {
      if (selectedResolution === 'custom' && customResolution) {
        resolveConflict(conflict.id, {
          operation: 'CUSTOM',
          custom_resolution: customResolution,
          timestamp: Date.now()
        });
      } else if (selectedResolution) {
        resolveConflict(conflict.id, selectedResolution);
      }
    };

    return (
      <GlassModal
        isOpen={true}
        onClose={() => setActiveConflict(null)}
        title="Resolve Data Conflict"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Conflict Details
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Multiple users made changes to {conflict.resourceType} at the same time.
              Please choose how to resolve this conflict.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conflicting Updates:
            </div>

            {conflict.updates.map((update, index) => (
              <div
                key={update.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedResolution === update ?
                    'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20' :
                    'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution(update)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {update.user_name || `User ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(update.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {update.operation}: {JSON.stringify(update.changes, null, 2).slice(0, 100)}...
                    </div>
                  </div>
                  {selectedResolution === update && (
                    <div className="text-primary-600 dark:text-primary-400">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Merge option */}
            <div
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedResolution === 'merge' ?
                  'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' :
                  'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedResolution('merge')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🔄 Auto-merge changes
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Automatically combine non-conflicting changes
                  </div>
                </div>
                {selectedResolution === 'merge' && (
                  <div className="text-green-600 dark:text-green-400">
                    ✓
                  </div>
                )}
              </div>
            </div>

            {/* Custom resolution */}
            <div
              className={`p-3 rounded-lg border ${
                selectedResolution === 'custom' ?
                  'border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/20' :
                  'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                  onClick={() => setSelectedResolution('custom')}
                >
                  ✏️ Custom resolution
                </label>
                {selectedResolution === 'custom' && (
                  <div className="text-purple-600 dark:text-purple-400">
                    ✓
                  </div>
                )}
              </div>
              <textarea
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Describe how you want to resolve this conflict..."
                value={customResolution}
                onChange={(e) => {
                  setCustomResolution(e.target.value);
                  setSelectedResolution('custom');
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <GlassButton
              variant="secondary"
              onClick={() => onIgnoreConflict(conflict.id)}
            >
              Ignore
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleResolve}
              disabled={!selectedResolution || isResolving}
            >
              {isResolving ? 'Resolving...' : 'Resolve Conflict'}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    );
  };

  if (conflicts.length === 0) return null;

  return (
    <div className={className}>
      {/* Conflict notification banner */}
      {conflicts.length > 0 && !activeConflict && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-amber-600 dark:text-amber-400">⚠️</div>
              <div>
                <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Data Conflicts Detected
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
                </div>
              </div>
            </div>
            <GlassButton
              variant="warning"
              size="sm"
              onClick={() => setActiveConflict(conflicts[0])}
            >
              Resolve
            </GlassButton>
          </div>
        </div>
      )}

      {/* Manual conflict resolution modal */}
      {activeConflict && (
        <ManualConflictResolver conflict={activeConflict} />
      )}
    </div>
  );
};

export default ConflictResolver;
import { useEffect, useState, useCallback, useRef } from 'react';
import useRealtimeGroupStore from '../../stores/realtimeGroupStore';
import CompatibilityAnimator, { useCompatibilityAnimation } from './CompatibilityAnimator';
import GroupPreviewCard from './GroupPreviewCard';
import LoadingSpinner from '../common/LoadingSpinner';

const RealtimeGroupUpdates = ({
  groupId,
  group,
  currentUser,
  onGroupUpdate,
  onCompatibilityChange,
  enableAnimations = true,
  className = ''
}) => {
  const {
    subscribeToGroup,
    unsubscribeFromGroup,
    getCompatibilityScores,
    connectionStatus,
    groupUpdates,
    optimisticUpdates,
    pendingOperations,
    addMemberOptimistic,
    removeMemberOptimistic,
    rollbackOptimisticUpdate,
    confirmOptimisticUpdate
  } = useRealtimeGroupStore();

  const [currentGroup, setCurrentGroup] = useState(group);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [lastCompatibilityScore, setLastCompatibilityScore] = useState(null);

  const {
    queueScoreUpdate,
    previousScore,
    setPreviousScore,
    isProcessingQueue
  } = useCompatibilityAnimation(groupId);

  const initializationRef = useRef(false);

  // Initialize real-time subscription
  useEffect(() => {
    if (!groupId || initializationRef.current) return;

    initializationRef.current = true;
    setIsInitializing(true);

    const initialize = async () => {
      try {
        await subscribeToGroup(groupId);

        // Get initial compatibility scores
        const compatibility = getCompatibilityScores(groupId);
        if (compatibility) {
          setLastCompatibilityScore(compatibility.avgScore);
          setPreviousScore(null);
        }

        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize real-time updates:', err);
        setError(err.message);
        setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      unsubscribeFromGroup(groupId);
      initializationRef.current = false;
    };
  }, [groupId, subscribeToGroup, unsubscribeFromGroup, getCompatibilityScores, setPreviousScore]);

  // Listen for group updates
  useEffect(() => {
    const update = groupUpdates.get(groupId);
    if (!update) return;

    console.log('Processing group update:', update);

    if (update.type === 'member_change') {
      // Get updated compatibility scores
      const compatibility = getCompatibilityScores(groupId);
      if (compatibility && compatibility.avgScore !== lastCompatibilityScore) {
        if (enableAnimations) {
          setPreviousScore(lastCompatibilityScore);
          queueScoreUpdate(compatibility.avgScore);
        }
        setLastCompatibilityScore(compatibility.avgScore);
        onCompatibilityChange?.(compatibility);
      }
    }

    onGroupUpdate?.(update);
  }, [
    groupUpdates,
    groupId,
    lastCompatibilityScore,
    enableAnimations,
    getCompatibilityScores,
    onCompatibilityChange,
    onGroupUpdate,
    queueScoreUpdate,
    setPreviousScore
  ]);

  // Listen for compatibility change events
  useEffect(() => {
    const handleCompatibilityChange = (event) => {
      if (event.detail.groupId === groupId) {
        const { oldScore, newScore, change } = event.detail;

        if (enableAnimations) {
          setPreviousScore(oldScore);
          queueScoreUpdate(newScore);
        }

        // Show notification for significant changes
        if (Math.abs(change) > 15) {
          showCompatibilityNotification(change > 0 ? 'improved' : 'decreased', Math.abs(change));
        }
      }
    };

    window.addEventListener('compatibilityChange', handleCompatibilityChange);
    return () => window.removeEventListener('compatibilityChange', handleCompatibilityChange);
  }, [groupId, enableAnimations, setPreviousScore, queueScoreUpdate]);

  // Optimistic member operations
  const handleJoinGroup = useCallback(async (userId) => {
    const operationId = `join-${userId}-${Date.now()}`;

    try {
      // Create optimistic member object
      const optimisticMember = {
        id: userId,
        name: currentUser?.name || 'New Member',
        avatar_url: currentUser?.avatar_url,
        personality_profile: currentUser?.personality_profile,
        is_online: true
      };

      // Apply optimistic update
      addMemberOptimistic(groupId, optimisticMember, operationId);

      // Update UI optimistically
      const updatedGroup = {
        ...currentGroup,
        members: [...(currentGroup.members || []), optimisticMember]
      };
      setCurrentGroup(updatedGroup);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, this would be an actual API call
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        confirmOptimisticUpdate(operationId);
        console.log('Member joined successfully');
      } else {
        throw new Error('Failed to join group');
      }

    } catch (error) {
      console.error('Failed to join group:', error);

      // Rollback optimistic update
      rollbackOptimisticUpdate(operationId);

      // Revert UI
      setCurrentGroup(group);

      // Show error notification
      showErrorNotification('Failed to join group. Please try again.');
    }
  }, [currentGroup, group, groupId, currentUser, addMemberOptimistic, confirmOptimisticUpdate, rollbackOptimisticUpdate]);

  const handleLeaveGroup = useCallback(async (userId) => {
    const operationId = `leave-${userId}-${Date.now()}`;

    try {
      // Apply optimistic update
      removeMemberOptimistic(groupId, userId, operationId);

      // Update UI optimistically
      const updatedGroup = {
        ...currentGroup,
        members: (currentGroup.members || []).filter(member => member.id !== userId)
      };
      setCurrentGroup(updatedGroup);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const success = Math.random() > 0.05; // 95% success rate

      if (success) {
        confirmOptimisticUpdate(operationId);
        console.log('Member left successfully');
      } else {
        throw new Error('Failed to leave group');
      }

    } catch (error) {
      console.error('Failed to leave group:', error);

      // Rollback optimistic update
      rollbackOptimisticUpdate(operationId);

      // Revert UI
      setCurrentGroup(group);

      // Show error notification
      showErrorNotification('Failed to leave group. Please try again.');
    }
  }, [currentGroup, group, groupId, removeMemberOptimistic, confirmOptimisticUpdate, rollbackOptimisticUpdate]);

  // Notification helpers
  const showCompatibilityNotification = (type, magnitude) => {
    // This would integrate with your notification system
    console.log(`Group compatibility ${type} by ${magnitude} points`);
  };

  const showErrorNotification = (message) => {
    // This would integrate with your notification system
    console.error(message);
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Get current compatibility with animations
  const getCurrentCompatibility = () => {
    const compatibility = getCompatibilityScores(groupId, true);
    return compatibility || { avgScore: lastCompatibilityScore || 0 };
  };

  // Render connection status indicator
  const renderConnectionStatus = () => {
    const statusConfig = {
      connecting: { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'Connecting...' },
      connected: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', text: 'Live' },
      disconnected: { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'Offline' },
      error: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', text: 'Error' }
    };

    const config = statusConfig[connectionStatus] || statusConfig.disconnected;

    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
        <span>{config.text}</span>
      </div>
    );
  };

  if (isInitializing) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <LoadingSpinner size="md" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          Initializing real-time updates...
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Connection status */}
      <div className="absolute top-2 right-2 z-10">
        {renderConnectionStatus()}
      </div>

      {/* Error notification */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md text-sm z-20">
          {error}
        </div>
      )}

      {/* Pending operations indicator */}
      {pendingOperations.size > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>Updating...</span>
          </div>
        </div>
      )}

      {/* Main group preview with real-time updates */}
      {enableAnimations ? (
        <CompatibilityAnimator
          currentScore={getCurrentCompatibility().avgScore}
          previousScore={previousScore}
          onAnimationComplete={() => console.log('Compatibility animation complete')}
        >
          {({ score, isAnimating, scoreChange }) => (
            <GroupPreviewCard
              group={{
                ...currentGroup,
                realtime_compatibility_score: score,
                is_updating: isAnimating || pendingOperations.size > 0
              }}
              currentUser={currentUser}
              onJoinGroup={handleJoinGroup}
              onLeaveGroup={handleLeaveGroup}
              showExpandedView={true}
              className={`transition-all duration-300 ${
                isAnimating ? 'ring-2 ring-primary-400 ring-opacity-50' : ''
              } ${
                scoreChange?.magnitude > 20 ? 'shadow-lg shadow-primary-500/20' : ''
              }`}
            />
          )}
        </CompatibilityAnimator>
      ) : (
        <GroupPreviewCard
          group={{
            ...currentGroup,
            realtime_compatibility_score: getCurrentCompatibility().avgScore,
            is_updating: pendingOperations.size > 0
          }}
          currentUser={currentUser}
          onJoinGroup={handleJoinGroup}
          onLeaveGroup={handleLeaveGroup}
          showExpandedView={true}
        />
      )}
    </div>
  );
};

export default RealtimeGroupUpdates;
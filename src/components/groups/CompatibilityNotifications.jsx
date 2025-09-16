import { useState, useEffect, useCallback } from 'react';
import { useSpring, animated, useTransition } from '@react-spring/web';
import GlassButton from '../ui/GlassButton';

const CompatibilityNotifications = ({
  groupId,
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000,
  maxNotifications = 3,
  className = ''
}) => {
  const [notifications, setNotifications] = useState([]);

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  // Add notification
  const addNotification = useCallback((type, data) => {
    const id = `${type}-${Date.now()}-${Math.random()}`;

    const notification = {
      id,
      type,
      data,
      timestamp: Date.now()
    };

    setNotifications(prev => {
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-hide if enabled
    if (autoHide) {
      setTimeout(() => {
        removeNotification(id);
      }, hideDelay);
    }
  }, [autoHide, hideDelay, maxNotifications]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen for compatibility change events
  useEffect(() => {
    const handleCompatibilityChange = (event) => {
      if (!groupId || event.detail.groupId !== groupId) return;

      const { oldScore, newScore, change } = event.detail;

      if (Math.abs(change) >= 10) {
        addNotification('compatibility_change', {
          oldScore,
          newScore,
          change,
          groupName: event.detail.groupName || 'Travel Group'
        });
      }
    };

    const handleMemberJoin = (event) => {
      if (!groupId || event.detail.groupId !== groupId) return;

      addNotification('member_joined', {
        memberName: event.detail.memberName,
        memberAvatar: event.detail.memberAvatar,
        groupName: event.detail.groupName || 'Travel Group'
      });
    };

    const handleMemberLeave = (event) => {
      if (!groupId || event.detail.groupId !== groupId) return;

      addNotification('member_left', {
        memberName: event.detail.memberName,
        memberAvatar: event.detail.memberAvatar,
        groupName: event.detail.groupName || 'Travel Group'
      });
    };

    const handleGroupUpdate = (event) => {
      if (!groupId || event.detail.groupId !== groupId) return;

      addNotification('group_updated', {
        updateType: event.detail.updateType,
        message: event.detail.message,
        groupName: event.detail.groupName || 'Travel Group'
      });
    };

    // Add event listeners
    window.addEventListener('compatibilityChange', handleCompatibilityChange);
    window.addEventListener('memberJoined', handleMemberJoin);
    window.addEventListener('memberLeft', handleMemberLeave);
    window.addEventListener('groupUpdated', handleGroupUpdate);

    return () => {
      window.removeEventListener('compatibilityChange', handleCompatibilityChange);
      window.removeEventListener('memberJoined', handleMemberJoin);
      window.removeEventListener('memberLeft', handleMemberLeave);
      window.removeEventListener('groupUpdated', handleGroupUpdate);
    };
  }, [groupId, addNotification]);

  // Transitions for notifications
  const transitions = useTransition(notifications, {
    from: { transform: 'translateX(100%)', opacity: 0 },
    enter: { transform: 'translateX(0%)', opacity: 1 },
    leave: { transform: 'translateX(100%)', opacity: 0 },
    config: { tension: 300, friction: 30 }
  });

  // Render notification content
  const renderNotificationContent = (notification) => {
    const { type, data } = notification;

    switch (type) {
      case 'compatibility_change':
        return (
          <CompatibilityChangeNotification
            data={data}
            onClose={() => removeNotification(notification.id)}
          />
        );

      case 'member_joined':
        return (
          <MemberJoinedNotification
            data={data}
            onClose={() => removeNotification(notification.id)}
          />
        );

      case 'member_left':
        return (
          <MemberLeftNotification
            data={data}
            onClose={() => removeNotification(notification.id)}
          />
        );

      case 'group_updated':
        return (
          <GroupUpdatedNotification
            data={data}
            onClose={() => removeNotification(notification.id)}
          />
        );

      default:
        return null;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div className="space-y-2">
        {transitions((style, notification) => (
          <animated.div style={style}>
            {renderNotificationContent(notification)}
          </animated.div>
        ))}

        {/* Clear all button */}
        {notifications.length > 1 && (
          <div className="text-center">
            <GlassButton
              variant="ghost"
              size="xs"
              onClick={clearAll}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual notification components
const CompatibilityChangeNotification = ({ data, onClose }) => {
  const { oldScore, newScore, change, groupName } = data;
  const isImprovement = change > 0;

  const icon = isImprovement ? '📈' : '📉';
  const colorClass = isImprovement
    ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
    : 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20';

  return (
    <div className={`glass-card p-4 border ${colorClass} min-w-80 max-w-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isImprovement ? 'Chemistry Improved!' : 'Chemistry Changed'}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {groupName} compatibility {isImprovement ? 'increased' : 'decreased'} by{' '}
              <span className={`font-medium ${isImprovement ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {Math.abs(change)} points
              </span>
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(oldScore)}% → {Math.round(newScore)}%
              </span>
            </div>
          </div>
        </div>
        <GlassButton
          variant="ghost"
          size="xs"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ✕
        </GlassButton>
      </div>
    </div>
  );
};

const MemberJoinedNotification = ({ data, onClose }) => {
  const { memberName, memberAvatar, groupName } = data;

  return (
    <div className="glass-card p-4 border border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20 min-w-80 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">👋</div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              New Member Joined!
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium text-blue-600 dark:text-blue-400">{memberName}</span>{' '}
              joined {groupName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Group compatibility is being recalculated...
            </p>
          </div>
        </div>
        <GlassButton
          variant="ghost"
          size="xs"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ✕
        </GlassButton>
      </div>
    </div>
  );
};

const MemberLeftNotification = ({ data, onClose }) => {
  const { memberName, groupName } = data;

  return (
    <div className="glass-card p-4 border border-amber-300 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20 min-w-80 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">👋</div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Member Left
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium text-amber-600 dark:text-amber-400">{memberName}</span>{' '}
              left {groupName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Group compatibility is being recalculated...
            </p>
          </div>
        </div>
        <GlassButton
          variant="ghost"
          size="xs"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ✕
        </GlassButton>
      </div>
    </div>
  );
};

const GroupUpdatedNotification = ({ data, onClose }) => {
  const { updateType, message, groupName } = data;

  return (
    <div className="glass-card p-4 border border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/20 min-w-80 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">📱</div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Group Updated
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {message || `${groupName} has been updated`}
            </p>
            {updateType && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Update type: {updateType}
              </p>
            )}
          </div>
        </div>
        <GlassButton
          variant="ghost"
          size="xs"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ✕
        </GlassButton>
      </div>
    </div>
  );
};

export default CompatibilityNotifications;
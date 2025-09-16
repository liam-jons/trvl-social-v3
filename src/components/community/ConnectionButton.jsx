/**
 * Connection Button Component
 * Reusable button for managing connection states (connect, pending, connected, blocked)
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import SendConnectionRequest from './SendConnectionRequest';
import {
  UserPlus,
  Clock,
  Check,
  MessageCircle,
  X,
  MoreVertical
} from 'lucide-react';
const ConnectionButton = ({
  userId,
  userProfile,
  className = '',
  size = 'sm',
  variant = 'outline',
  onConnectionChange
}) => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  useEffect(() => {
    if (userId) {
      loadConnectionStatus();
    }
  }, [userId]);
  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === userId) {
        setLoading(false);
        return;
      }
      const status = await connectionService.getConnectionStatus(user.id, userId);
      setConnectionStatus(status);
    } catch (error) {
      console.error('Error loading connection status:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleConnect = () => {
    setShowRequestModal(true);
  };
  const handleConnectionSuccess = () => {
    loadConnectionStatus();
    onConnectionChange?.();
  };
  const handleCancelRequest = async () => {
    if (!connectionStatus?.request) return;
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'cancelled' })
        .eq('id', connectionStatus.request.id);
      if (!error) {
        setConnectionStatus(null);
        onConnectionChange?.();
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };
  const handleDisconnect = async () => {
    if (!connectionStatus?.connection) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Remove mutual connections
      await supabase
        .from('community_connections')
        .delete()
        .or(`and(user_id.eq.${user.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${user.id})`);
      setConnectionStatus(null);
      onConnectionChange?.();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };
  const handleBlock = async () => {
    try {
      const result = await connectionService.blockUser(userId, true);
      if (result.success) {
        setConnectionStatus({ type: 'blocked' });
        onConnectionChange?.();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };
  const handleUnblock = async () => {
    try {
      const result = await connectionService.blockUser(userId, false);
      if (result.success) {
        setConnectionStatus(null);
        onConnectionChange?.();
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };
  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </Button>
    );
  }
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);
  // Don't show button for own profile
  if (currentUser?.id === userId) {
    return null;
  }
  // Handle different connection states
  if (!connectionStatus) {
    // No connection or request - show connect button
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handleConnect}
          className={`flex items-center gap-2 ${className}`}
        >
          <UserPlus className="h-4 w-4" />
          Connect
        </Button>
        <SendConnectionRequest
          recipientId={userId}
          recipientProfile={userProfile}
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSuccess={handleConnectionSuccess}
        />
      </>
    );
  }
  if (connectionStatus.type === 'request') {
    const isRequester = connectionStatus.request.requester_id === currentUser?.id;
    if (isRequester) {
      // User sent the request - show pending with option to cancel
      return (
        <div className="relative">
          <Button
            variant="outline"
            size={size}
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 ${className}`}
          >
            <Clock className="h-4 w-4" />
            Pending
            <MoreVertical className="h-3 w-3" />
          </Button>
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={handleCancelRequest}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      );
    } else {
      // User received the request - this should be handled by ConnectionRequests component
      return (
        <Button variant="outline" size={size} disabled className={className}>
          <Clock className="h-4 w-4" />
          Respond in Requests
        </Button>
      );
    }
  }
  if (connectionStatus.type === 'connected') {
    // Users are connected - show message button with dropdown for more options
    return (
      <div className="relative">
        <Button
          variant="default"
          size={size}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 ${className}`}
        >
          <MessageCircle className="h-4 w-4" />
          Message
          <MoreVertical className="h-3 w-3" />
        </Button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              onClick={() => {/* Handle view profile */}}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              View Profile
            </button>
            <button
              onClick={handleDisconnect}
              className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50"
            >
              Disconnect
            </button>
            <button
              onClick={handleBlock}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
            >
              Block User
            </button>
          </div>
        )}
      </div>
    );
  }
  if (connectionStatus.type === 'blocked') {
    // User is blocked - show unblock option
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleUnblock}
        className={`flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 ${className}`}
      >
        <X className="h-4 w-4" />
        Unblock
      </Button>
    );
  }
  return null;
};
export default ConnectionButton;
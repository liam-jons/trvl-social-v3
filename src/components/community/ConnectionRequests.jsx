/**
 * Connection Requests Component
 * Handle incoming and outgoing connection requests
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import {
  Check,
  X,
  Clock,
  User,
  MapPin,
  Calendar,
  MessageCircle,
  Send
} from 'lucide-react';
const ConnectionRequests = ({ onUpdate }) => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  useEffect(() => {
    loadRequests();
  }, []);
  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Load received requests
      const receivedResult = await connectionService.getPendingRequests(user.id, 'received');
      if (receivedResult.success) {
        setReceivedRequests(receivedResult.data);
      }
      // Load sent requests
      const sentResult = await connectionService.getPendingRequests(user.id, 'sent');
      if (sentResult.success) {
        setSentRequests(sentResult.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleRespondToRequest = async (requestId, response) => {
    try {
      setProcessingRequest(requestId);
      const result = await connectionService.respondToConnectionRequest(requestId, response);
      if (result.success) {
        // Remove from received requests
        setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
        onUpdate?.();
      } else {
      }
    } catch (error) {
    } finally {
      setProcessingRequest(null);
    }
  };
  const handleCancelRequest = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      // Update request status to cancelled
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);
      if (!error) {
        setSentRequests(prev => prev.filter(req => req.id !== requestId));
        onUpdate?.();
      }
    } catch (error) {
    } finally {
      setProcessingRequest(null);
    }
  };
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };
  const ReceivedRequestItem = ({ request }) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <img
          src={request.requester_profile?.avatar_url || '/default-avatar.png'}
          alt={`${request.requester_profile?.first_name} ${request.requester_profile?.last_name}`}
          className="h-12 w-12 rounded-full object-cover"
        />
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">
              {request.requester_profile?.first_name} {request.requester_profile?.last_name}
            </h3>
            <span className="text-sm text-gray-500">{formatTimeAgo(request.created_at)}</span>
          </div>
          {request.requester_profile?.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="h-3 w-3" />
              <span>{request.requester_profile.location}</span>
            </div>
          )}
          {request.message && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700">{request.message}</p>
            </div>
          )}
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleRespondToRequest(request.id, 'accepted')}
              disabled={processingRequest === request.id}
              className="flex items-center gap-2"
              size="sm"
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRespondToRequest(request.id, 'declined')}
              disabled={processingRequest === request.id}
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
  const SentRequestItem = ({ request }) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <img
          src={request.recipient_profile?.avatar_url || '/default-avatar.png'}
          alt={`${request.recipient_profile?.first_name} ${request.recipient_profile?.last_name}`}
          className="h-12 w-12 rounded-full object-cover"
        />
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">
              {request.recipient_profile?.first_name} {request.recipient_profile?.last_name}
            </h3>
            <span className="flex items-center gap-1 text-sm text-yellow-600">
              <Clock className="h-3 w-3" />
              Pending
            </span>
            <span className="text-sm text-gray-500">{formatTimeAgo(request.created_at)}</span>
          </div>
          {request.recipient_profile?.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="h-3 w-3" />
              <span>{request.recipient_profile.location}</span>
            </div>
          )}
          {request.message && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700">{request.message}</p>
            </div>
          )}
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleCancelRequest(request.id)}
              disabled={processingRequest === request.id}
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel Request
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Received
            {receivedRequests.length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {receivedRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
            {sentRequests.length > 0 && (
              <span className="bg-gray-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {sentRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-6">
          {receivedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">No pending requests</h3>
                  <p className="text-gray-600">
                    You don't have any connection requests at the moment.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedRequests.map(request => (
                <ReceivedRequestItem key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          {sentRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Send className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">No sent requests</h3>
                  <p className="text-gray-600">
                    You haven't sent any connection requests yet.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentRequests.map(request => (
                <SentRequestItem key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ConnectionRequests;
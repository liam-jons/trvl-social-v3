import React, { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Trash2,
  Flag,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
const ModerationTools = () => {
  const [activeTab, setActiveTab] = useState('flagged');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [moderationLog, setModerationLog] = useState([]);
  // Mock current user (assuming they have moderation privileges)
  const currentVendor = {
    id: '1',
    business_name: 'ModeratorCorp',
    is_moderator: true
  };
  // Mock flagged content data
  const mockFlaggedContent = [
    {
      id: '1',
      type: 'thread',
      thread_id: '123',
      title: 'Questionable safety practices discussion',
      content: 'Some content that was flagged for potential safety misinformation...',
      vendor: { id: '2', business_name: 'Risky Adventures' },
      flags: [
        {
          id: '1',
          reason: 'misinformation',
          reporter: { business_name: 'Safety First Tours' },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: '2',
          reason: 'unsafe_practices',
          reporter: { business_name: 'Careful Adventures' },
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ],
      status: 'pending',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'reply',
      thread_id: '124',
      reply_id: '456',
      thread_title: 'Marketing strategies for 2024',
      content: 'Reply content that was flagged for spam...',
      vendor: { id: '3', business_name: 'Spammy Tours' },
      flags: [
        {
          id: '3',
          reason: 'spam',
          reporter: { business_name: 'Clean Marketing Co' },
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ],
      status: 'pending',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];
  // Mock moderation log data
  const mockModerationLog = [
    {
      id: '1',
      action: 'moderate_thread',
      moderator: { business_name: 'ModeratorCorp' },
      target_type: 'thread',
      target_title: 'Inappropriate content thread',
      reason: 'Contains offensive language',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      action: 'pin_thread',
      moderator: { business_name: 'ModeratorCorp' },
      target_type: 'thread',
      target_title: 'Important safety guidelines',
      reason: 'Important community information',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      action: 'mark_solution',
      moderator: { business_name: 'ExpertVendor' },
      target_type: 'reply',
      target_title: 'Best pricing strategies discussion',
      reason: 'Comprehensive solution provided',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];
  useEffect(() => {
    setFlaggedContent(mockFlaggedContent);
    setModerationLog(mockModerationLog);
  }, []);
  const handleModerationAction = async (contentId, action, reason = '') => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Update the content status
      setFlaggedContent(prev =>
        prev.map(item =>
          item.id === contentId
            ? { ...item, status: action === 'approve' ? 'approved' : 'moderated' }
            : item
        )
      );
      // Add to moderation log
      const newLogEntry = {
        id: Date.now().toString(),
        action: action,
        moderator: currentVendor,
        target_type: 'content',
        target_title: 'Moderated content',
        reason: reason || `Content ${action}d by moderator`,
        created_at: new Date()
      };
      setModerationLog(prev => [newLogEntry, ...prev]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const getActionIcon = (action) => {
    const icons = {
      pin_thread: Pin,
      unpin_thread: PinOff,
      lock_thread: Lock,
      unlock_thread: Unlock,
      moderate_thread: EyeOff,
      unmoderate_thread: Eye,
      moderate_reply: EyeOff,
      unmoderate_reply: Eye,
      mark_solution: CheckCircle,
      unmark_solution: XCircle,
      delete_thread: Trash2,
      delete_reply: Trash2
    };
    return icons[action] || Shield;
  };
  const getActionColor = (action) => {
    const colors = {
      pin_thread: 'text-yellow-600',
      unpin_thread: 'text-gray-600',
      lock_thread: 'text-red-600',
      unlock_thread: 'text-green-600',
      moderate_thread: 'text-orange-600',
      unmoderate_thread: 'text-blue-600',
      moderate_reply: 'text-orange-600',
      unmoderate_reply: 'text-blue-600',
      mark_solution: 'text-green-600',
      unmark_solution: 'text-gray-600',
      delete_thread: 'text-red-600',
      delete_reply: 'text-red-600'
    };
    return colors[action] || 'text-gray-600';
  };
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      moderated: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.pending;
  };
  const filteredFlaggedContent = flaggedContent.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const filteredModerationLog = moderationLog.filter(item => {
    return !searchQuery ||
      item.target_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.moderator.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());
  });
  if (!currentVendor.is_moderator) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">You don't have permission to access moderation tools.</p>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Moderation Tools</h1>
        <p className="text-gray-600">Manage community content and maintain forum quality</p>
      </div>
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('flagged')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'flagged'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Flag className="h-4 w-4 inline mr-2" />
              Flagged Content
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'log'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Moderation Log
            </button>
          </nav>
        </div>
        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {activeTab === 'flagged' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="moderated">Moderated</option>
                </select>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'flagged' ? 'Search flagged content...' : 'Search moderation log...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="p-6">
          {activeTab === 'flagged' ? (
            /* Flagged Content */
            <div className="space-y-6">
              {filteredFlaggedContent.length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No flagged content</h3>
                  <p className="text-gray-600">
                    {searchQuery || filterStatus !== 'all'
                      ? 'No content matches your current filters'
                      : 'No content has been flagged for review'}
                  </p>
                </div>
              ) : (
                filteredFlaggedContent.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {item.type === 'thread' ? 'Thread' : 'Reply'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.flags.length} flag{item.flags.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleModerationAction(item.id, 'approve')}
                              disabled={loading}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleModerationAction(item.id, 'moderate', 'Content moderated for community guidelines violation')}
                              disabled={loading}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              <EyeOff className="h-4 w-4 inline mr-1" />
                              Moderate
                            </button>
                          </>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title || item.thread_title}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 line-clamp-3">{item.content}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {item.vendor.business_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {/* Flags */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Flags:</h4>
                      {item.flags.map((flag) => (
                        <div key={flag.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <Flag className="h-4 w-4 text-red-600" />
                            <div>
                              <span className="text-sm font-medium text-red-900">
                                {flag.reason.replace('_', ' ')}
                              </span>
                              <p className="text-xs text-red-700">
                                Reported by {flag.reporter.business_name}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-red-600">
                            {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Moderation Log */
            <div className="space-y-4">
              {filteredModerationLog.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No moderation activity</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'No activities match your search' : 'No moderation actions have been logged'}
                  </p>
                </div>
              ) : (
                filteredModerationLog.map((log) => {
                  const IconComponent = getActionIcon(log.action);
                  const iconColor = getActionColor(log.action);
                  return (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className={`p-2 rounded-full bg-gray-100 ${iconColor}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{log.moderator.business_name}</span>
                          {' '}{log.action.includes('delete') ? 'deleted' : 'moderated'}
                          {' '}<span className="font-medium">{log.target_title}</span>
                        </p>
                        {log.reason && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reason: {log.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ModerationTools;
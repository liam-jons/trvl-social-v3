/**
 * ModerationAppeals Component
 * Handles user appeals for moderation actions and content decisions
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Scale,
  Filter,
  Search,
  ChevronDown,
  MessageCircle,
  Gavel
} from 'lucide-react';
const ModerationAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  // Mock appeals data
  useEffect(() => {
    setAppeals([
      {
        id: 1,
        userId: 'user_123',
        username: 'traveler_mike',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        appealType: 'content_removal',
        originalAction: 'Content Removed',
        actionReason: 'Spam/Promotional Content',
        contentId: 'post_456',
        contentPreview: 'Just discovered this amazing hidden gem in Bali! Check out my travel guide...',
        appealReason: 'This is not spam, it\'s a genuine travel recommendation. I was sharing my personal experience.',
        appealDetails: 'I believe my post was incorrectly flagged as spam. This was a legitimate travel recommendation based on my recent trip to Bali. I included genuine tips and personal photos from my experience. I understand the need to prevent spam, but this was authentic content meant to help fellow travelers.',
        submittedAt: '2024-09-14T10:30:00Z',
        status: 'pending',
        priority: 'medium',
        assignedModerator: null,
        originalModerator: 'mod_sarah',
        actionDate: '2024-09-13T15:45:00Z',
        evidenceUrls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ],
        supportingInfo: 'I have receipts and photos from my actual trip to prove authenticity.',
        moderatorNotes: [],
        lastActivity: '2024-09-14T10:30:00Z'
      },
      {
        id: 2,
        userId: 'user_789',
        username: 'adventure_seeker',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5ab?w=40&h=40&fit=crop&crop=face',
        appealType: 'account_warning',
        originalAction: 'Account Warning',
        actionReason: 'Inappropriate Language',
        contentId: 'comment_789',
        contentPreview: 'That place is absolutely insane! The views are crazy good...',
        appealReason: 'The language used was not inappropriate, just enthusiastic travel descriptions.',
        appealDetails: 'I was expressing enthusiasm about a travel destination using casual language. Terms like "insane" and "crazy" were used in a positive context to describe amazing views and experiences. This is common travel slang and was not intended to be inappropriate or offensive.',
        submittedAt: '2024-09-13T14:20:00Z',
        status: 'under_review',
        priority: 'low',
        assignedModerator: 'mod_john',
        originalModerator: 'mod_sarah',
        actionDate: '2024-09-12T09:15:00Z',
        evidenceUrls: [],
        supportingInfo: 'This is common travel terminology used in many travel blogs and guides.',
        moderatorNotes: [
          {
            id: 1,
            moderator: 'mod_john',
            note: 'Reviewing the context of the language used. Need to check similar cases.',
            timestamp: '2024-09-13T16:00:00Z'
          }
        ],
        lastActivity: '2024-09-13T16:00:00Z'
      },
      {
        id: 3,
        userId: 'user_456',
        username: 'photo_explorer',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        appealType: 'account_suspension',
        originalAction: 'Account Suspended',
        actionReason: 'Multiple Policy Violations',
        contentId: null,
        contentPreview: null,
        appealReason: 'I believe the violations were due to misunderstandings and I have learned from them.',
        appealDetails: 'I acknowledge that some of my posts may have violated guidelines, but I believe the suspension is too severe. I have been a member of this community for over a year and have contributed valuable travel content. I am committed to following all guidelines going forward and request a reduction in penalty.',
        submittedAt: '2024-09-12T08:00:00Z',
        status: 'rejected',
        priority: 'high',
        assignedModerator: 'mod_admin',
        originalModerator: 'system',
        actionDate: '2024-09-10T12:00:00Z',
        evidenceUrls: [],
        supportingInfo: 'I can provide evidence of my positive contributions to the community.',
        moderatorNotes: [
          {
            id: 1,
            moderator: 'mod_admin',
            note: 'Multiple violations confirmed. User had 5 warnings in past month.',
            timestamp: '2024-09-12T14:30:00Z'
          },
          {
            id: 2,
            moderator: 'mod_admin',
            note: 'Appeal denied. Suspension upheld due to pattern of violations.',
            timestamp: '2024-09-12T14:35:00Z'
          }
        ],
        lastActivity: '2024-09-12T14:35:00Z'
      }
    ]);
  }, []);
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || colors.pending;
  };
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };
  const filteredAppeals = appeals.filter(appeal => {
    if (activeTab !== 'all' && appeal.status !== activeTab) return false;
    if (filters.type && appeal.appealType !== filters.type) return false;
    if (filters.priority && appeal.priority !== filters.priority) return false;
    if (searchTerm && !appeal.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !appeal.appealReason.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  const handleApproveAppeal = async (appealId) => {
    try {
      // API call to approve appeal
      setAppeals(prev => prev.map(appeal =>
        appeal.id === appealId
          ? { ...appeal, status: 'approved', lastActivity: new Date().toISOString() }
          : appeal
      ));
    } catch (error) {
      console.error('Failed to approve appeal:', error);
    }
  };
  const handleRejectAppeal = async (appealId, reason) => {
    try {
      // API call to reject appeal
      setAppeals(prev => prev.map(appeal =>
        appeal.id === appealId
          ? {
              ...appeal,
              status: 'rejected',
              lastActivity: new Date().toISOString(),
              moderatorNotes: [
                ...appeal.moderatorNotes,
                {
                  id: Date.now(),
                  moderator: 'current_moderator',
                  note: `Appeal rejected: ${reason}`,
                  timestamp: new Date().toISOString()
                }
              ]
            }
          : appeal
      ));
    } catch (error) {
      console.error('Failed to reject appeal:', error);
    }
  };
  const AppealCard = ({ appeal }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={appeal.userAvatar}
            alt={appeal.username}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">@{appeal.username}</h3>
            <p className="text-sm text-gray-600">Appeal #{appeal.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
            {appeal.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appeal.priority)}`}>
            {appeal.priority}
          </span>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <span className="text-sm font-medium text-gray-700">Original Action: </span>
          <span className="text-sm text-red-600">{appeal.originalAction}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Reason: </span>
          <span className="text-sm text-gray-900">{appeal.actionReason}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Appeal Reason: </span>
          <span className="text-sm text-gray-900">{appeal.appealReason}</span>
        </div>
      </div>
      {appeal.contentPreview && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Content Preview:</h4>
          <p className="text-sm text-gray-600 italic">"{appeal.contentPreview}"</p>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span>Submitted: {new Date(appeal.submittedAt).toLocaleDateString()}</span>
          <span>Original: {new Date(appeal.actionDate).toLocaleDateString()}</span>
          {appeal.assignedModerator && (
            <span>Assigned: {appeal.assignedModerator}</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-3 h-3" />
          <span>{appeal.moderatorNotes.length} notes</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedAppeal(appeal)}
          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1"
        >
          <Eye className="w-3 h-3" />
          <span>View Details</span>
        </button>
        {appeal.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleApproveAppeal(appeal.id)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleRejectAppeal(appeal.id, 'Appeal does not provide sufficient evidence')}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Reject</span>
            </button>
          </div>
        )}
        {appeal.status === 'under_review' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleApproveAppeal(appeal.id)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleRejectAppeal(appeal.id, 'After review, original action was correct')}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
  const AppealDetailModal = ({ appeal, onClose }) => {
    const [newNote, setNewNote] = useState('');
    const handleAddNote = () => {
      if (!newNote.trim()) return;
      setAppeals(prev => prev.map(a =>
        a.id === appeal.id
          ? {
              ...a,
              moderatorNotes: [
                ...a.moderatorNotes,
                {
                  id: Date.now(),
                  moderator: 'current_moderator',
                  note: newNote,
                  timestamp: new Date().toISOString()
                }
              ],
              lastActivity: new Date().toISOString()
            }
          : a
      ));
      setNewNote('');
    };
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Scale className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Appeal #{appeal.id}</h2>
                <p className="text-sm text-gray-600">Submitted by @{appeal.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Appeal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Appeal Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="text-gray-900">{appeal.appealType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                      {appeal.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appeal.priority)}`}>
                      {appeal.priority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="text-gray-900">{new Date(appeal.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Original Action</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Action:</span>
                    <span className="text-red-600">{appeal.originalAction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reason:</span>
                    <span className="text-gray-900">{appeal.actionReason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-900">{new Date(appeal.actionDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Moderator:</span>
                    <span className="text-gray-900">{appeal.originalModerator}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Content Preview */}
            {appeal.contentPreview && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Content in Question</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 italic">"{appeal.contentPreview}"</p>
                  {appeal.contentId && (
                    <p className="text-xs text-gray-500 mt-2">Content ID: {appeal.contentId}</p>
                  )}
                </div>
              </div>
            )}
            {/* Appeal Explanation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">User's Appeal</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 font-medium mb-2">{appeal.appealReason}</p>
                <p className="text-blue-800 text-sm">{appeal.appealDetails}</p>
                {appeal.supportingInfo && (
                  <p className="text-blue-700 text-sm mt-2 italic">
                    Additional info: {appeal.supportingInfo}
                  </p>
                )}
              </div>
            </div>
            {/* Evidence */}
            {appeal.evidenceUrls && appeal.evidenceUrls.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Supporting Evidence</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {appeal.evidenceUrls.map((url, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-2">
                      <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      <p className="text-xs text-gray-600 mt-1 truncate">Evidence {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Moderator Notes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Moderator Notes</h3>
              <div className="space-y-3 mb-4">
                {appeal.moderatorNotes.map((note) => (
                  <div key={note.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{note.moderator}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.note}</p>
                  </div>
                ))}
              </div>
              {/* Add Note */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a moderator note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>
            {/* Actions */}
            {appeal.status === 'pending' || appeal.status === 'under_review' ? (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleRejectAppeal(appeal.id, 'Appeal rejected after review');
                    onClose();
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Appeal</span>
                </button>
                <button
                  onClick={() => {
                    handleApproveAppeal(appeal.id);
                    onClose();
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve Appeal</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <div className={`p-3 rounded-lg ${
                  appeal.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    appeal.status === 'approved' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    This appeal has been {appeal.status}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Moderation Appeals</h2>
          <p className="text-gray-600">Review and process user appeals for moderation actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Export Appeals
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Appeal Guidelines
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-gray-900">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {appeals.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Under Review</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {appeals.filter(a => a.status === 'under_review').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {appeals.filter(a => a.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-900">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {appeals.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>
      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appeals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="content_removal">Content Removal</option>
              <option value="account_warning">Account Warning</option>
              <option value="account_suspension">Account Suspension</option>
              <option value="account_ban">Account Ban</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'pending', label: 'Pending', count: appeals.filter(a => a.status === 'pending').length },
            { id: 'under_review', label: 'Under Review', count: appeals.filter(a => a.status === 'under_review').length },
            { id: 'approved', label: 'Approved', count: appeals.filter(a => a.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: appeals.filter(a => a.status === 'rejected').length },
            { id: 'all', label: 'All', count: appeals.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
      {/* Appeals List */}
      <div className="space-y-4">
        {filteredAppeals.length > 0 ? (
          filteredAppeals.map((appeal) => (
            <AppealCard key={appeal.id} appeal={appeal} />
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appeals found</h3>
            <p className="text-gray-600">No appeals match your current filters.</p>
          </div>
        )}
      </div>
      {/* Appeal Detail Modal */}
      {selectedAppeal && (
        <AppealDetailModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
        />
      )}
    </div>
  );
};
export default ModerationAppeals;
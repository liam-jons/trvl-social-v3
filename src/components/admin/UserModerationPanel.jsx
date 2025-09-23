/**
 * UserModerationPanel Component
 * Handles user warnings, bans, and account restrictions
 */
import React, { useState, useEffect } from 'react';
import {
  User,
  AlertTriangle,
  Ban,
  Clock,
  MessageSquare,
  Calendar,
  Eye,
  UserX,
  Volume2,
  VolumeX,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  Trash2,
  History,
  Mail
} from 'lucide-react';
import ContentModerationService from '../../services/content-moderation-service';
const UserModerationPanel = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [warnings, setWarnings] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [showWarningForm, setShowWarningForm] = useState(false);
  const [showRestrictionForm, setShowRestrictionForm] = useState(false);
  // Mock user data - replace with actual API calls
  useEffect(() => {
    setUser({
      id: userId,
      username: 'traveler_user',
      email: 'user@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      joinDate: '2024-01-15',
      status: 'active',
      reputation: 85,
      totalPosts: 156,
      totalComments: 89,
      reportedContent: 3,
      warningCount: 1,
      lastActive: '2024-09-15T10:30:00Z'
    });
    setWarnings([
      {
        id: 1,
        reason: 'Inappropriate language in post',
        severity: 'medium',
        issuedBy: 'mod_sarah',
        issuedAt: '2024-09-10T14:30:00Z',
        expiresAt: '2024-09-17T14:30:00Z',
        acknowledged: true,
        contentId: 'post_123'
      }
    ]);
    setRestrictions([]);
    setModerationHistory([
      {
        id: 1,
        action: 'warning_issued',
        reason: 'Inappropriate language',
        moderator: 'mod_sarah',
        timestamp: '2024-09-10T14:30:00Z',
        details: 'User warned for using inappropriate language in travel post'
      },
      {
        id: 2,
        action: 'content_removed',
        reason: 'Spam',
        moderator: 'system',
        timestamp: '2024-09-08T09:15:00Z',
        details: 'Promotional content automatically removed'
      }
    ]);
  }, [userId]);
  const WarningForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      reason: '',
      severity: 'medium',
      contentId: '',
      customMessage: '',
      expiryDays: 7
    });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await ContentModerationService.issueUserWarning(userId, {
          reason: formData.reason,
          severity: formData.severity,
          contentId: formData.contentId,
          customMessage: formData.customMessage,
          expiryDays: formData.expiryDays
        });
        onSave();
        onCancel();
      } catch (error) {
      }
    };
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Issue Warning</h3>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warning Reason *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="inappropriate_language">Inappropriate Language</option>
                <option value="spam">Spam or Self-Promotion</option>
                <option value="harassment">Harassment</option>
                <option value="misinformation">Misinformation</option>
                <option value="off_topic">Off-Topic Content</option>
                <option value="policy_violation">Policy Violation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content ID (optional)
              </label>
              <input
                type="text"
                value={formData.contentId}
                onChange={(e) => setFormData(prev => ({ ...prev, contentId: e.target.value }))}
                placeholder="ID of the reported content"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (optional)
              </label>
              <textarea
                value={formData.customMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Additional message to include with the warning"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Issue Warning
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const RestrictionForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      type: 'limited',
      reason: '',
      duration: 3,
      customReason: ''
    });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await ContentModerationService.restrictUser(userId, formData.type, formData.duration);
        onSave();
        onCancel();
      } catch (error) {
      }
    };
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Apply Restriction</h3>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restriction Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="limited">Limited (posting restrictions)</option>
                <option value="suspended">Suspended (temporary ban)</option>
                <option value="banned">Banned (permanent)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="multiple_violations">Multiple Policy Violations</option>
                <option value="severe_harassment">Severe Harassment</option>
                <option value="spam_behavior">Persistent Spam Behavior</option>
                <option value="impersonation">Impersonation</option>
                <option value="illegal_content">Illegal Content</option>
                <option value="terms_violation">Terms of Service Violation</option>
                <option value="other">Other</option>
              </select>
            </div>
            {formData.type !== 'banned' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                value={formData.customReason}
                onChange={(e) => setFormData(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Provide additional context for this restriction"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Warning</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                This action will restrict the user's account and they will be notified immediately.
                Make sure you have sufficient evidence for this action.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Apply Restriction
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar}
            alt={user.username}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-900">@{user.username}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.status === 'active' ? 'bg-green-100 text-green-800' :
            user.status === 'suspended' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.status}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWarningForm(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Issue Warning</span>
          </button>
          <button
            onClick={() => setShowRestrictionForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Ban className="w-4 h-4" />
            <span>Restrict User</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{user.reputation}</div>
          <div className="text-sm text-gray-600">Reputation</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{user.totalPosts}</div>
          <div className="text-sm text-gray-600">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{user.totalComments}</div>
          <div className="text-sm text-gray-600">Comments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{user.reportedContent}</div>
          <div className="text-sm text-gray-600">Reports</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{user.warningCount}</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'warnings', label: 'Warnings', icon: AlertTriangle },
            { id: 'restrictions', label: 'Restrictions', icon: Ban },
            { id: 'history', label: 'History', icon: History }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Join Date:</span>
                    <span className="text-gray-900">{new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="text-gray-900">{new Date(user.lastActive).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`font-medium ${
                      user.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Activity Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content Created:</span>
                    <span className="text-gray-900">{user.totalPosts + user.totalComments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reports Against:</span>
                    <span className="text-gray-900">{user.reportedContent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Warnings:</span>
                    <span className="text-gray-900">{warnings.filter(w => new Date(w.expiresAt) > new Date()).length}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recent Moderation Actions</h3>
              <div className="space-y-2">
                {moderationHistory.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      action.action.includes('warning') ? 'bg-yellow-100' :
                      action.action.includes('removed') ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {action.action.includes('warning') ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : action.action.includes('removed') ? (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      ) : (
                        <Shield className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{action.details}</div>
                      <div className="text-sm text-gray-600">
                        By {action.moderator} • {new Date(action.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'warnings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Active Warnings</h3>
              <button
                onClick={() => setShowWarningForm(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Warning</span>
              </button>
            </div>
            {warnings.length > 0 ? (
              <div className="space-y-3">
                {warnings.map((warning) => (
                  <div key={warning.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-gray-900">{warning.reason}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            warning.severity === 'high' ? 'bg-red-100 text-red-800' :
                            warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {warning.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Issued by: {warning.issuedBy}</div>
                          <div>Date: {new Date(warning.issuedAt).toLocaleDateString()}</div>
                          <div>Expires: {new Date(warning.expiresAt).toLocaleDateString()}</div>
                          {warning.contentId && (
                            <div>Related content: {warning.contentId}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {warning.acknowledged ? (
                          <span className="text-green-600 text-sm">Acknowledged</span>
                        ) : (
                          <span className="text-yellow-600 text-sm">Pending</span>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No warnings issued for this user.
              </div>
            )}
          </div>
        )}
        {activeTab === 'restrictions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Account Restrictions</h3>
              <button
                onClick={() => setShowRestrictionForm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Ban className="w-4 h-4" />
                <span>Add Restriction</span>
              </button>
            </div>
            {restrictions.length > 0 ? (
              <div className="space-y-3">
                {restrictions.map((restriction) => (
                  <div key={restriction.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Ban className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-gray-900">{restriction.type}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Reason: {restriction.reason}</div>
                          <div>Applied by: {restriction.restrictedBy}</div>
                          <div>Date: {new Date(restriction.restrictedAt).toLocaleDateString()}</div>
                          <div>Expires: {new Date(restriction.expiresAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        Lift Restriction
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active restrictions for this user.
              </div>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Moderation History</h3>
            <div className="space-y-3">
              {moderationHistory.map((action) => (
                <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      action.action.includes('warning') ? 'bg-yellow-100' :
                      action.action.includes('removed') ? 'bg-red-100' :
                      action.action.includes('restriction') ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {action.action.includes('warning') ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : action.action.includes('removed') ? (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      ) : action.action.includes('restriction') ? (
                        <Ban className="w-4 h-4 text-red-600" />
                      ) : (
                        <Shield className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">
                          {action.action.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(action.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{action.details}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Moderator: {action.moderator}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Forms */}
      {showWarningForm && (
        <WarningForm
          onSave={() => {
            // Refresh warnings
          }}
          onCancel={() => setShowWarningForm(false)}
        />
      )}
      {showRestrictionForm && (
        <RestrictionForm
          onSave={() => {
            // Refresh restrictions
          }}
          onCancel={() => setShowRestrictionForm(false)}
        />
      )}
    </div>
  );
};
export default UserModerationPanel;
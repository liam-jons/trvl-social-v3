/**
 * ModerationDashboard Component
 * Main admin interface for content moderation and user management
 */
import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Users,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  MessageSquare,
  Heart,
  Share2,
  Calendar,
  AlertCircle,
  Ban,
  UserX,
  Volume2,
  VolumeX
} from 'lucide-react';
import ContentModerationService from '../../services/content-moderation-service';
const ModerationDashboard = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [moderationQueue, setModerationQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    priority: '',
    contentType: '',
    status: 'pending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadDashboardData();
  }, [filters]);
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [queueResult, statsResult] = await Promise.all([
        ContentModerationService.getModerationQueue(filters),
        ContentModerationService.getModerationStats(7)
      ]);
      if (queueResult.success) {
        setModerationQueue(queueResult.data || []);
      }
      if (statsResult.success) {
        setStats(statsResult.data || {});
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleApprove = async (itemId) => {
    try {
      const item = moderationQueue.find(q => q.id === itemId);
      if (!item) return;
      await ContentModerationService.processAutomatedAction(
        item.content_id,
        item.content_type,
        'approve',
        'Approved by moderator'
      );
      await loadDashboardData();
    } catch (error) {
    }
  };
  const handleReject = async (itemId, reason = 'Violates community guidelines') => {
    try {
      const item = moderationQueue.find(q => q.id === itemId);
      if (!item) return;
      await ContentModerationService.processAutomatedAction(
        item.content_id,
        item.content_type,
        'block',
        reason
      );
      await loadDashboardData();
    } catch (error) {
    }
  };
  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) return;
    try {
      for (const itemId of selectedItems) {
        const item = moderationQueue.find(q => q.id === itemId);
        if (item) {
          if (action === 'approve') {
            await handleApprove(itemId);
          } else if (action === 'reject') {
            await handleReject(itemId);
          }
        }
      }
      setSelectedItems([]);
      await loadDashboardData();
    } catch (error) {
    }
  };
  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
  const ModerationQueueItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);
    const priorityColors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <div className={`border rounded-lg p-4 transition-all ${
        isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-start space-x-4">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItems(prev => [...prev, item.id]);
              } else {
                setSelectedItems(prev => prev.filter(id => id !== item.id));
              }
            }}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {/* Content Preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  priorityColors[item.priority] || priorityColors.medium
                }`}>
                  {item.priority} priority
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  {item.content_type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {/* Report Information */}
            {item.content_reports && item.content_reports.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Flag className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Reported: {item.content_reports[0].report_category}
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  {item.content_reports[0].description || item.content_reports[0].report_reason}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Reported by: @{item.content_reports[0].profiles?.username || 'Anonymous'}
                </p>
              </div>
            )}
            {/* Content Preview */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Content Preview</span>
              </div>
              <p className="text-sm text-gray-600">
                "This is a preview of the reported content that needs moderation review..."
              </p>
            </div>
            {/* Metadata */}
            <div className="flex items-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>24 likes</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3" />
                <span>8 comments</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share2 className="w-3 h-3" />
                <span>3 shares</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Posted 2 hours ago</span>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleApprove(item.id)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleReject(item.id)}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <XCircle className="w-3 h-3" />
              <span>Reject</span>
            </button>
            <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  const UserManagementTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Export Users
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add User
          </button>
        </div>
      </div>
      {/* User Management Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Users}
              title="Total Users"
              value="12,345"
              change={5.2}
              color="blue"
            />
            <StatCard
              icon={UserX}
              title="Suspended Users"
              value="23"
              change={-12.5}
              color="red"
            />
            <StatCard
              icon={Volume2}
              title="Active Warnings"
              value="157"
              change={8.3}
              color="yellow"
            />
            <StatCard
              icon={Ban}
              title="Banned Users"
              value="8"
              change={0}
              color="gray"
            />
          </div>
          {/* User List */}
          <div className="space-y-4">
            {[1, 2, 3].map((user) => (
              <div key={user} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={`https://images.unsplash.com/photo-154415899${user}599-e35270bf2d75?w=40&h=40&fit=crop&crop=face`}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">User {user}</h4>
                    <p className="text-sm text-gray-600">user{user}@example.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50">
                    View
                  </button>
                  <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700">
                    Warn
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700">
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
            <p className="text-gray-600">Manage content and user reports</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Export Reports
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              New Policy
            </button>
          </div>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={Flag}
            title="Pending Reports"
            value={stats.pendingReviews || 0}
            change={12.5}
            color="red"
          />
          <StatCard
            icon={CheckCircle}
            title="Actions Processed"
            value={stats.actionsProcessed || 0}
            change={-8.2}
            color="green"
          />
          <StatCard
            icon={AlertTriangle}
            title="Warnings Issued"
            value={stats.warningsIssued || 0}
            change={15.3}
            color="yellow"
          />
          <StatCard
            icon={TrendingUp}
            title="Reports Received"
            value={stats.reportsReceived || 0}
            change={5.7}
            color="blue"
          />
        </div>
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'queue', label: 'Moderation Queue', icon: Clock },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'policies', label: 'Policies', icon: Shield }
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
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        {/* Tab Content */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                  <select
                    value={filters.contentType}
                    onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Content Types</option>
                    <option value="post">Posts</option>
                    <option value="comment">Comments</option>
                    <option value="message">Messages</option>
                    <option value="review">Reviews</option>
                  </select>
                </div>
                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedItems.length} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction('approve')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      Approve All
                    </button>
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject All
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Moderation Queue */}
            <div className="space-y-4">
              {moderationQueue.length > 0 ? (
                moderationQueue.map((item) => (
                  <ModerationQueueItem key={item.id} item={item} />
                ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">No pending moderation items at the moment.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Analytics</h3>
            <p className="text-gray-600">Advanced analytics and comprehensive reporting features are being finalized.</p>
          </div>
        )}
        {activeTab === 'policies' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Policies</h3>
            <p className="text-gray-600">Comprehensive policy management and configuration tools are in active development.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ModerationDashboard;
import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Award,
  Search,
  Plus,
  Filter,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';

const ForumLayout = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories', icon: MessageSquare },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp },
    { id: 'safety', name: 'Safety', icon: Star },
    { id: 'customer_service', name: 'Customer Service', icon: Users },
    { id: 'pricing_strategies', name: 'Pricing', icon: TrendingUp },
    { id: 'equipment_maintenance', name: 'Equipment', icon: Star },
    { id: 'legal_regulations', name: 'Legal', icon: Star },
    { id: 'insurance', name: 'Insurance', icon: Star },
    { id: 'seasonal_tips', name: 'Seasonal Tips', icon: Clock },
    { id: 'technology', name: 'Technology', icon: Star },
    { id: 'general_discussion', name: 'General', icon: MessageSquare }
  ];

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Vendor Forum</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* New Thread Button */}
              <Link
                to="/vendor/forum/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Link
                      key={category.id}
                      to={`/vendor/forum${category.id === 'all' ? '' : `?category=${category.id}`}`}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      {category.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Forum Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Threads</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Members</span>
                  <span className="font-semibold">567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Today</span>
                  <span className="font-semibold">89</span>
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
              <div className="space-y-3">
                {[
                  { name: 'Sarah Wilson', points: 1250, level: 'Expert' },
                  { name: 'Mike Johnson', points: 980, level: 'Helpful' },
                  { name: 'Lisa Chen', points: 756, level: 'Contributor' }
                ].map((contributor, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {contributor.name.charAt(0)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contributor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contributor.points} points • {contributor.level}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Outlet context={{ searchQuery, selectedCategory }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumLayout;
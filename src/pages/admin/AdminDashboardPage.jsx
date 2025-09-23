import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import AlgorithmMonitoringDashboard from '../../components/admin/AlgorithmMonitoringDashboard';
import { BarChart3, Settings, Users, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

/**
 * Admin Dashboard Page
 * Main admin interface with analytics, user management, and system monitoring
 */
const AdminDashboardPage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Access control - redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                System overview, analytics, and administrative controls
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Welcome, {user.full_name || user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring" className="mt-6">
            <AlgorithmMonitoringDashboard />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="mt-6">
            <UserManagementPanel />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <SystemSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// User Management Panel Component
const UserManagementPanel = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">User Management</h3>
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Advanced user management tools are being refined.</p>
          <p className="text-sm mt-2">
            Full user search, role management, and account controls will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
};

// System Settings Panel Component
const SystemSettingsPanel = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">System Settings</h3>
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>System configuration panel is in development.</p>
          <p className="text-sm mt-2">
            API configurations, feature flags, and system parameters will be configurable here soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
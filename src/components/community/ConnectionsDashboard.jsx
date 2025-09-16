/**
 * Connections Dashboard Component
 * Main hub for managing connections, requests, and recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import ConnectionsList from './ConnectionsList';
import ConnectionRequests from './ConnectionRequests';
import ConnectionRecommendations from './ConnectionRecommendations';
import ConnectionActivity from './ConnectionActivity';
import { Users, UserPlus, Heart, Activity } from 'lucide-react';

const ConnectionsDashboard = () => {
  const [activeTab, setActiveTab] = useState('connections');
  const [stats, setStats] = useState({
    totalConnections: 0,
    pendingRequests: 0,
    recommendations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load connections count
      const connectionsResult = await connectionService.getUserConnections(user.id, {
        limit: 1,
        includeProfile: false
      });

      // Load pending requests count
      const requestsResult = await connectionService.getPendingRequests(user.id, 'received');

      // Load recommendations count
      const recommendationsResult = await connectionService.getConnectionRecommendations(user.id, {
        limit: 1
      });

      setStats({
        totalConnections: connectionsResult.success ? connectionsResult.data.length : 0,
        pendingRequests: requestsResult.success ? requestsResult.data.length : 0,
        recommendations: recommendationsResult.success ? recommendationsResult.data.length : 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleRequestUpdate = () => {
    loadDashboardStats();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
        <Button
          onClick={() => setActiveTab('recommendations')}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Find Connections
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Connections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConnections}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Heart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recommendations}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Requests
              {stats.pendingRequests > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pendingRequests}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="connections">
              <ConnectionsList onUpdate={handleRequestUpdate} />
            </TabsContent>

            <TabsContent value="requests">
              <ConnectionRequests onUpdate={handleRequestUpdate} />
            </TabsContent>

            <TabsContent value="recommendations">
              <ConnectionRecommendations onUpdate={handleRequestUpdate} />
            </TabsContent>

            <TabsContent value="activity">
              <ConnectionActivity />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default ConnectionsDashboard;
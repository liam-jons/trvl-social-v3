import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  DollarSign, Users, Calendar, TrendingUp, TrendingDown, RefreshCw,
  Download, Filter, Eye, MapPin, Star, Activity, Clock, Target, Lock
} from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import analyticsService from '../../services/analytics-service';
import dashboardMetricsService from '../../services/dashboard-metrics-service';
import { useAuth } from '../../hooks/useAuth';
import RealTimeMetrics from './RealTimeMetrics';
/**
 * Custom Analytics Dashboard
 * Internal analytics dashboard for business metrics visualization and reporting
 */
const AnalyticsDashboard = ({ className = "" }) => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  // Role-based access control
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor';
  if (!isAdmin && !isVendor) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Lock className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p>You don't have permission to view analytics data.</p>
        </div>
      </div>
    );
  }
  // Fetch metrics data
  useEffect(() => {
    fetchMetrics();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [dateRange, comparisonMode]);
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Fetch data from multiple services in parallel
      const [overviewData, revenueData, userData, adventureData, groupData] = await Promise.all([
        dashboardMetricsService.getOverviewMetrics(dateRange),
        dashboardMetricsService.getRevenueMetrics(dateRange),
        dashboardMetricsService.getUserMetrics(dateRange),
        dashboardMetricsService.getAdventureMetrics(dateRange),
        dashboardMetricsService.getGroupMetrics(dateRange)
      ]);
      // Combine all data sources
      const combinedData = {
        ...overviewData,
        revenueMetrics: revenueData,
        userMetrics: userData,
        adventureMetrics: adventureData,
        groupMetrics: groupData,
        // Calculate growth percentages
        kpis: {
          ...overviewData.kpis,
          revenueGrowth: ((overviewData.kpis.totalRevenue - overviewData.kpis.previousRevenue) / overviewData.kpis.previousRevenue) * 100,
          userGrowth: ((overviewData.kpis.activeUsers - overviewData.kpis.previousActiveUsers) / overviewData.kpis.previousActiveUsers) * 100,
          bookingGrowth: ((overviewData.kpis.totalBookings - overviewData.kpis.previousBookings) / overviewData.kpis.previousBookings) * 100,
          conversionGrowth: ((overviewData.kpis.conversionRate - overviewData.kpis.previousConversionRate) / overviewData.kpis.previousConversionRate) * 100
        }
      };
      setMetrics(combinedData);
      setLastUpdated(new Date());
      // Track successful metrics fetch
      analyticsService.trackEvent('admin_dashboard_loaded', {
        date_range: dateRange,
        comparison_mode: comparisonMode,
        metrics_count: Object.keys(combinedData).length
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      analyticsService.trackError(error, { context: 'analytics_dashboard_fetch' });
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  // Export functionality
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Analytics Dashboard Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Date Range: ${dateRange}`, 20, 45);
    if (metrics) {
      const kpiData = [
        ['Metric', 'Current', 'Previous', 'Change'],
        ['Total Revenue', `$${metrics.kpis.totalRevenue.toLocaleString()}`,
         `$${metrics.kpis.previousRevenue.toLocaleString()}`,
         `${metrics.kpis.revenueGrowth > 0 ? '+' : ''}${metrics.kpis.revenueGrowth.toFixed(1)}%`],
        ['Active Users', metrics.kpis.activeUsers.toLocaleString(),
         metrics.kpis.previousActiveUsers.toLocaleString(),
         `${metrics.kpis.userGrowth > 0 ? '+' : ''}${metrics.kpis.userGrowth.toFixed(1)}%`],
        ['Total Bookings', metrics.kpis.totalBookings.toLocaleString(),
         metrics.kpis.previousBookings.toLocaleString(),
         `${metrics.kpis.bookingGrowth > 0 ? '+' : ''}${metrics.kpis.bookingGrowth.toFixed(1)}%`],
        ['Conversion Rate', `${metrics.kpis.conversionRate.toFixed(1)}%`,
         `${metrics.kpis.previousConversionRate.toFixed(1)}%`,
         `${metrics.kpis.conversionGrowth > 0 ? '+' : ''}${metrics.kpis.conversionGrowth.toFixed(1)}%`]
      ];
      doc.autoTable({
        head: [kpiData[0]],
        body: kpiData.slice(1),
        startY: 60,
      });
    }
    doc.save(`analytics-dashboard-${dateRange}-${Date.now()}.pdf`);
    analyticsService.trackEvent('analytics_export', {
      export_type: 'pdf',
      date_range: dateRange,
      user_role: user?.role
    });
  };
  const csvData = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        metric: 'Total Revenue',
        current: metrics.kpis.totalRevenue,
        previous: metrics.kpis.previousRevenue,
        growth: `${metrics.kpis.revenueGrowth.toFixed(1)}%`
      },
      {
        metric: 'Active Users',
        current: metrics.kpis.activeUsers,
        previous: metrics.kpis.previousActiveUsers,
        growth: `${metrics.kpis.userGrowth.toFixed(1)}%`
      },
      {
        metric: 'Total Bookings',
        current: metrics.kpis.totalBookings,
        previous: metrics.kpis.previousBookings,
        growth: `${metrics.kpis.bookingGrowth.toFixed(1)}%`
      },
      {
        metric: 'Conversion Rate',
        current: `${metrics.kpis.conversionRate.toFixed(1)}%`,
        previous: `${metrics.kpis.previousConversionRate.toFixed(1)}%`,
        growth: `${metrics.kpis.conversionGrowth.toFixed(1)}%`
      }
    ];
  }, [metrics]);
  if (loading && !metrics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`analytics-dashboard p-6 bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time business metrics and performance insights
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        {/* Controls */}
        <div className="flex gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          {/* Comparison Toggle */}
          <Button
            variant={comparisonMode ? "default" : "outline"}
            onClick={() => setComparisonMode(!comparisonMode)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Compare
          </Button>
          {/* Export Buttons */}
          <div className="flex gap-1">
            <CSVLink
              data={csvData}
              filename={`analytics-${dateRange}-${Date.now()}.csv`}
              onClick={() => analyticsService.trackEvent('analytics_export', {
                export_type: 'csv',
                date_range: dateRange,
                user_role: user?.role
              })}
            >
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </CSVLink>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total Revenue"
            value={`$${metrics.kpis.totalRevenue.toLocaleString()}`}
            change={metrics.kpis.revenueGrowth}
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <KPICard
            title="Active Users"
            value={metrics.kpis.activeUsers.toLocaleString()}
            change={metrics.kpis.userGrowth}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <KPICard
            title="Total Bookings"
            value={metrics.kpis.totalBookings.toLocaleString()}
            change={metrics.kpis.bookingGrowth}
            icon={<Calendar className="w-5 h-5" />}
            color="purple"
          />
          <KPICard
            title="Conversion Rate"
            value={`${metrics.kpis.conversionRate.toFixed(1)}%`}
            change={metrics.kpis.conversionGrowth}
            icon={<Target className="w-5 h-5" />}
            color="indigo"
          />
        </div>
      )}
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="adventures">Adventures</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {metrics && <OverviewTab metrics={metrics} comparisonMode={comparisonMode} />}
        </TabsContent>
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6">
          {metrics && <RevenueTab metrics={metrics} comparisonMode={comparisonMode} />}
        </TabsContent>
        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          {metrics && <UsersTab metrics={metrics} comparisonMode={comparisonMode} />}
        </TabsContent>
        {/* Adventures Tab */}
        <TabsContent value="adventures" className="mt-6">
          {metrics && <AdventuresTab metrics={metrics} comparisonMode={comparisonMode} />}
        </TabsContent>
        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-6">
          {metrics && <GroupsTab metrics={metrics} comparisonMode={comparisonMode} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};
// KPI Card Component
const KPICard = ({ title, value, change, icon, color = "blue" }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  };
  const isPositive = change > 0;
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
// Tab Components
const OverviewTab = ({ metrics, comparisonMode }) => (
  <div className="space-y-6">
    {/* Real-Time Metrics */}
    <RealTimeMetrics />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Revenue Trend */}
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={metrics.revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            {comparisonMode && (
              <Area type="monotone" dataKey="previousRevenue" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.4} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* User Growth */}
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="newUsers" stroke="#8884d8" name="New Users" />
            <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" name="Active Users" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* Booking Sources */}
    <Card>
      <CardHeader>
        <CardTitle>Booking Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={metrics.bookingSources}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {metrics.bookingSources.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* Top Performing Adventures */}
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Adventures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.topAdventures.map((adventure, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{adventure.name}</div>
                  <div className="text-sm text-gray-500">{adventure.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{adventure.bookings} bookings</div>
                <div className="text-sm text-gray-500">${adventure.revenue.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  </div>
);
const RevenueTab = ({ metrics, comparisonMode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Monthly Revenue */}
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={metrics.revenueMetrics.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* Revenue by Category */}
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={metrics.revenueMetrics.revenueByCategory} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <YAxis dataKey="category" type="category" />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);
const UsersTab = ({ metrics, comparisonMode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* User Registration Trend */}
    <Card>
      <CardHeader>
        <CardTitle>User Registration Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.userMetrics.userRegistrationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="registrations" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* User Demographics */}
    <Card>
      <CardHeader>
        <CardTitle>User Demographics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={metrics.userMetrics.userDemographics}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {metrics.userMetrics.userDemographics.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);
const AdventuresTab = ({ metrics, comparisonMode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Adventure Performance */}
    <Card>
      <CardHeader>
        <CardTitle>Adventure Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.adventureMetrics.adventureMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" fill="#8884d8" name="Views" />
            <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* Adventure Ratings */}
    <Card>
      <CardHeader>
        <CardTitle>Average Ratings by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.adventureMetrics.adventureRatings}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis domain={[0, 5]} />
            <Tooltip formatter={(value) => [value.toFixed(1), 'Rating']} />
            <Bar dataKey="rating" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);
const GroupsTab = ({ metrics, comparisonMode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Group Formation Trends */}
    <Card>
      <CardHeader>
        <CardTitle>Group Formation Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.groupMetrics.groupFormationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="groupsCreated" stroke="#8884d8" name="Groups Created" />
            <Line type="monotone" dataKey="groupsCompleted" stroke="#82ca9d" name="Groups Completed" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    {/* Group Success Rate */}
    <Card>
      <CardHeader>
        <CardTitle>Group Success Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">
                {metrics.groupMetrics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-green-600">Success Rate</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">
                {metrics.groupMetrics.avgCompatibility.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-600">Avg Compatibility</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.groupMetrics.groupSizeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </div>
);
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#ff8c94'];
export default AnalyticsDashboard;
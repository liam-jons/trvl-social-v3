import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import html2canvas from 'html2canvas';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
// Color palette for charts
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};
const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];
// Date range options
const DATE_RANGES = [
  { label: 'Last 7 Days', value: 7, key: 'week' },
  { label: 'Last 30 Days', value: 30, key: 'month' },
  { label: 'Last 3 Months', value: 90, key: 'quarter' },
  { label: 'Last 6 Months', value: 180, key: 'half-year' },
  { label: 'Last Year', value: 365, key: 'year' }
];
// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.name}: {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
// Analytics KPI Card Component
const AnalyticsKPICard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
  };
  const ChangeIcon = changeType === 'positive' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const changeColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600';
  return (
    <GlassCard variant="light" className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </p>
          {change && (
            <div className="flex items-center">
              <ChangeIcon className={`h-4 w-4 mr-1 ${changeColor}`} />
              <span className={`text-sm font-medium ${changeColor}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </GlassCard>
  );
};
const VendorAnalyticsPage = () => {
  const [selectedDateRange, setSelectedDateRange] = useState(30);
  const [chartType, setChartType] = useState('revenue'); // 'revenue', 'bookings', 'customers'
  const [isExporting, setIsExporting] = useState(false);
  const {
    vendor,
    dashboardStats,
    analyticsData,
    loading,
    error,
    fetchAnalyticsData,
    getFormattedStats
  } = useVendorDashboardStore();
  const { trackEvent, trackFeatureUsage } = useAnalytics();
  // Generate mock analytics data (replace with real data fetching)
  const generateMockData = useMemo(() => {
    const days = selectedDateRange;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, 'MMM dd'),
        fullDate: format(date, 'yyyy-MM-dd'),
        revenue: Math.floor(Math.random() * 5000) + 1000,
        bookings: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 15) + 3,
        avgBookingValue: Math.floor(Math.random() * 300) + 100,
        conversion: Math.random() * 0.15 + 0.05,
        views: Math.floor(Math.random() * 100) + 50,
        avgRating: (Math.random() * 1.5 + 3.5).toFixed(1)
      });
    }
    return data;
  }, [selectedDateRange]);
  // Customer demographics data
  const demographicsData = [
    { name: '18-25', value: 25, color: CHART_COLORS.primary },
    { name: '26-35', value: 35, color: CHART_COLORS.secondary },
    { name: '36-45', value: 20, color: CHART_COLORS.success },
    { name: '46-55', value: 15, color: CHART_COLORS.warning },
    { name: '55+', value: 5, color: CHART_COLORS.danger }
  ];
  // Booking source data
  const bookingSourceData = [
    { name: 'Direct', value: 40, color: CHART_COLORS.primary },
    { name: 'Social Media', value: 30, color: CHART_COLORS.secondary },
    { name: 'Referral', value: 20, color: CHART_COLORS.success },
    { name: 'Search', value: 10, color: CHART_COLORS.warning }
  ];
  // Top adventures data
  const topAdventuresData = [
    { name: 'Mountain Hiking', bookings: 45, revenue: 13500, rating: 4.8 },
    { name: 'City Food Tour', bookings: 38, revenue: 11400, rating: 4.6 },
    { name: 'Beach Adventure', bookings: 32, revenue: 9600, rating: 4.7 },
    { name: 'Cultural Experience', bookings: 28, revenue: 8400, rating: 4.5 },
    { name: 'Night Photography', bookings: 22, revenue: 6600, rating: 4.9 }
  ];
  // Booking patterns heatmap data
  const bookingHeatmapData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return days.flatMap(day =>
      hours.map(hour => ({
        day,
        hour: `${hour}:00`,
        hourValue: hour,
        bookings: Math.floor(Math.random() * 10)
      }))
    );
  }, []);
  useEffect(() => {
    // Track analytics dashboard usage
    trackFeatureUsage('vendor_analytics_dashboard', {
      date_range: selectedDateRange,
      chart_type: chartType
    });
    // Fetch analytics data when component mounts or date range changes
    if (vendor?.id) {
      fetchAnalyticsData?.(vendor.id, selectedDateRange);
    }
  }, [vendor, selectedDateRange, trackFeatureUsage, chartType, fetchAnalyticsData]);
  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = generateMockData.reduce((sum, day) => sum + day.revenue, 0);
    const totalBookings = generateMockData.reduce((sum, day) => sum + day.bookings, 0);
    const avgBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;
    const totalCustomers = generateMockData.reduce((sum, day) => sum + day.customers, 0);
    return {
      totalRevenue: totalRevenue.toLocaleString(),
      totalBookings,
      avgBookingValue: Math.round(avgBookingValue),
      totalCustomers,
      conversionRate: ((totalBookings / (totalBookings * 10)) * 100).toFixed(1),
      revenueChange: '+12.3%',
      bookingsChange: '+8.7%',
      customersChange: '+15.2%',
      conversionChange: '-2.1%'
    };
  }, [generateMockData]);
  // Export functionality
  const handleExportPDF = async () => {
    setIsExporting(true);
    trackEvent('analytics_export', { format: 'pdf', date_range: selectedDateRange });
    try {
      const element = document.getElementById('analytics-dashboard');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const link = document.createElement('a');
      link.download = `vendor-analytics-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  const handleExportCSV = () => {
    trackEvent('analytics_export', { format: 'csv', date_range: selectedDateRange });
    const csvContent = [
      ['Date', 'Revenue', 'Bookings', 'Customers', 'Avg Booking Value', 'Conversion Rate'],
      ...generateMockData.map(day => [
        day.fullDate,
        day.revenue,
        day.bookings,
        day.customers,
        day.avgBookingValue,
        (day.conversion * 100).toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendor-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };
  if (loading.stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message="Loading analytics dashboard..." />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => vendor?.id && fetchAnalyticsData?.(vendor.id, selectedDateRange)}
      />
    );
  }
  return (
    <div id="analytics-dashboard" className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your business performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Range Selector */}
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {DATE_RANGES.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export PNG
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsKPICard
          title="Total Revenue"
          value={`$${kpis.totalRevenue}`}
          change={kpis.revenueChange}
          changeType="positive"
          icon={CurrencyDollarIcon}
          color="green"
        />
        <AnalyticsKPICard
          title="Total Bookings"
          value={kpis.totalBookings}
          change={kpis.bookingsChange}
          changeType="positive"
          icon={CalendarDaysIcon}
          color="blue"
        />
        <AnalyticsKPICard
          title="Avg Booking Value"
          value={`$${kpis.avgBookingValue}`}
          change={kpis.customersChange}
          changeType="positive"
          icon={ArrowTrendingUpIcon}
          color="purple"
        />
        <AnalyticsKPICard
          title="Conversion Rate"
          value={`${kpis.conversionRate}%`}
          change={kpis.conversionChange}
          changeType="negative"
          icon={FunnelIcon}
          color="orange"
        />
      </div>
      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends Chart */}
        <GlassCard variant="light" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Revenue Trends
            </h2>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="revenue">Revenue</option>
              <option value="bookings">Bookings</option>
              <option value="customers">Customers</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateMockData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip formatter={(value) =>
                    chartType === 'revenue' ? `$${value.toLocaleString()}` : value.toString()
                  } />}
                />
                <Area
                  type="monotone"
                  dataKey={chartType}
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        {/* Booking Patterns Chart */}
        <GlassCard variant="light" className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Booking Patterns
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateMockData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="bookings"
                  fill={CHART_COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
      {/* Demographics and Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Demographics */}
        <GlassCard variant="light" className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Customer Demographics
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographicsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip formatter={(value) => `${value}%`} />}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        {/* Booking Sources */}
        <GlassCard variant="light" className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Booking Sources
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bookingSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip formatter={(value) => `${value}%`} />}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
      {/* Top Adventures Performance */}
      <GlassCard variant="light" className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Top Adventure Performance
        </h2>
        <div className="overflow-hidden">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAdventuresData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  type="number"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  content={<CustomTooltip formatter={(value, name) =>
                    name === 'revenue' ? `$${value.toLocaleString()}` :
                    name === 'rating' ? `${value}/5.0` : value.toString()
                  } />}
                />
                <Bar
                  dataKey="bookings"
                  fill={CHART_COLORS.primary}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>
      {/* Adventure Performance Table */}
      <GlassCard variant="light" className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Detailed Adventure Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Adventure Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {topAdventuresData.map((adventure, index) => (
                <tr key={adventure.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {adventure.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {adventure.bookings}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${adventure.revenue.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {adventure.rating}
                      </div>
                      <div className="ml-2 flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(adventure.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {(Math.random() * 0.15 + 0.05).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
export default VendorAnalyticsPage;
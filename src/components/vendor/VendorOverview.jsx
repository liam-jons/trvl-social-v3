import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import GlassCard from '../ui/GlassCard';
import LoadingSpinner from '../common/LoadingSpinner';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
  };

  return (
    <GlassCard variant="light" className="p-6 hover:scale-105 transition-transform duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                {trend}
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

const BookingCard = ({ booking }) => {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <GlassCard variant="default" padding="sm" className="mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {booking.adventures?.adventure_media?.[0]?.media_url ? (
              <img
                src={booking.adventures.adventure_media[0].media_url}
                alt={booking.adventures.title}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <MapPinIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {booking.adventures?.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime(booking.booking_date)} • {booking.booking_participants?.length || 0} guests
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            ${booking.total_amount || 0}
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return CalendarIcon;
      case 'review':
        return UsersIcon;
      default:
        return ClockIcon;
    }
  };

  const Icon = getActivityIcon(activity.type);
  const timeAgo = new Date(activity.timestamp).toLocaleString();

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-200/10 dark:border-gray-700/30 last:border-b-0">
      <div className="flex-shrink-0">
        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {activity.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activity.description}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};

const VendorOverview = () => {
  const navigate = useNavigate();
  const {
    dashboardStats,
    todaysBookings,
    upcomingBookings,
    recentActivities,
    loading,
    error,
    getFormattedStats,
  } = useVendorDashboardStore();

  const stats = getFormattedStats();

  if (loading.stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor your bookings, revenue, and adventure performance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Bookings"
          value={stats?.todayBookings || 0}
          subtitle="Active bookings today"
          icon={CalendarIcon}
          color="blue"
          trend={stats?.todayBookings > 0 ? "+12% from yesterday" : null}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue?.toLocaleString() || 0}`}
          subtitle={`${stats?.monthlyBookingsCount || 0} bookings this month`}
          icon={CurrencyDollarIcon}
          color="green"
          trend={stats?.monthlyRevenue > 0 ? "+8% from last month" : null}
        />
        <StatCard
          title="Total Adventures"
          value={stats?.totalAdventures || 0}
          subtitle={`${stats?.activeAdventures || 0} active listings`}
          icon={MapPinIcon}
          color="purple"
        />
        <StatCard
          title="Avg Booking Value"
          value={`$${stats?.averageBookingValue || 0}`}
          subtitle="Per booking average"
          icon={ArrowTrendingUpIcon}
          color="orange"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Bookings */}
        <div className="lg:col-span-1">
          <GlassCard variant="light" className="h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Bookings
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {todaysBookings?.length || 0} total
              </span>
            </div>

            <div className="space-y-3">
              {todaysBookings && todaysBookings.length > 0 ? (
                todaysBookings.slice(0, 5).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No bookings for today
                  </p>
                </div>
              )}
            </div>

            {todaysBookings && todaysBookings.length > 5 && (
              <div className="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/30">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  View all {todaysBookings.length} bookings
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Upcoming Bookings */}
        <div className="lg:col-span-1">
          <GlassCard variant="light" className="h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming This Week
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {upcomingBookings?.length || 0} scheduled
              </span>
            </div>

            <div className="space-y-3">
              {upcomingBookings && upcomingBookings.length > 0 ? (
                upcomingBookings.slice(0, 5).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No upcoming bookings
                  </p>
                </div>
              )}
            </div>

            {upcomingBookings && upcomingBookings.length > 5 && (
              <div className="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/30">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  View all upcoming bookings
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-1">
          <GlassCard variant="light" className="h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </button>
            </div>

            <div className="space-y-0">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 8).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent activity
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <GlassCard variant="light">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
              <MapPinIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                New Adventure
              </span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
              <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Manage Bookings
              </span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
              <UsersIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Group Builder
              </span>
            </button>
            <button
              onClick={() => navigate('/vendor-portal/analytics')}
              className="flex flex-col items-center p-4 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                View Analytics
              </span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default VendorOverview;
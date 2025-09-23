import { useState } from 'react';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import GlassCard from '../ui/GlassCard';

const VendorHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { vendor, refreshDashboard, loading } = useVendorDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    await refreshDashboard();
  };

  const formatTime = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <GlassCard
      variant="light"
      padding="sm"
      className="sticky z-30 flex-shrink-0 border-b border-white/20 dark:border-white/10 backdrop-blur-xl"
      style={{ top: '88px' }}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Welcome message */}
          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome back, {vendor?.business_name || 'Vendor'}!
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatTime()}
            </p>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-lg mx-4 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search bookings, adventures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300/20 dark:border-gray-700/50 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading.stats}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 disabled:opacity-50 transition-all duration-200"
            title="Refresh dashboard"
          >
            <svg
              className={`h-5 w-5 ${loading.stats ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200">
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200">
              <div className="flex-shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right">
                <GlassCard variant="light" padding="sm" className="shadow-xl">
                  <div className="space-y-1">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="/profile"
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            active
                              ? 'bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Your Profile
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="/settings"
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            active
                              ? 'bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Settings
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="/help"
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            active
                              ? 'bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Help & Support
                        </a>
                      )}
                    </Menu.Item>
                  </div>
                </GlassCard>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </GlassCard>
  );
};

export default VendorHeader;
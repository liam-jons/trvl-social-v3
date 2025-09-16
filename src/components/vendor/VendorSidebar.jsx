import { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  XMarkIcon,
  BellIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import GlassCard from '../ui/GlassCard';

const VendorSidebar = ({ open, onClose }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { vendor } = useVendorDashboardStore();

  const navigation = [
    { name: 'Overview', href: '/vendor-portal', icon: HomeIcon, current: true },
    { name: 'Bookings', href: '/vendor-portal/bookings', icon: CalendarDaysIcon },
    { name: 'Adventures', href: '/vendor-portal/adventures', icon: MapPinIcon },
    { name: 'Group Builder', href: '/vendor-portal/groups', icon: UserGroupIcon },
    { name: 'Bulk Operations', href: '/vendor-portal/bulk-operations', icon: Squares2X2Icon },
    { name: 'Analytics', href: '/vendor-portal/analytics', icon: ChartBarIcon },
    { name: 'Messages', href: '/vendor-portal/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Forum', href: '/vendor-portal/forum', icon: ChatBubbleBottomCenterTextIcon },
    { name: 'Reviews', href: '/vendor-portal/reviews', icon: DocumentTextIcon },
  ];

  const secondaryNavigation = [
    { name: 'Settings', href: '/vendor-portal/settings', icon: CogIcon },
    { name: 'Notifications', href: '/vendor-portal/notifications', icon: BellIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo and vendor info */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              Vendor Portal
            </h2>
            {vendor && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {vendor.business_name}
              </p>
            )}
          </div>
        </div>

        {/* Close button for mobile */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6">
        {/* Primary navigation */}
        <div>
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400'
                    }`
                  }
                  onClick={onClose} // Close mobile sidebar on navigation
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Secondary navigation */}
        <div>
          <ul className="space-y-2">
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400'
                    }`
                  }
                  onClick={onClose}
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <GlassCard variant="light" padding="sm" className="space-y-3">
          {vendor && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {vendor.business_name?.charAt(0) || 'V'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {vendor.business_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Status: {vendor.status}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <svg
              className="mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </GlassCard>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/10 dark:bg-black/20 backdrop-blur-xl px-0 pb-4 shadow-2xl border-r border-white/20 dark:border-white/10">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/10 dark:bg-black/20 backdrop-blur-xl px-0 pb-4 shadow-xl border-r border-white/20 dark:border-white/10">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default VendorSidebar;
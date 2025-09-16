import { useState, lazy, Suspense } from 'react';
import { Outlet, Routes, Route } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import VendorOverview from './VendorOverview';
import GroupBuilderPage from '../../pages/vendor/GroupBuilderPage';
import LoadingSpinner from '../common/LoadingSpinner';

// Lazy load pages for better performance
const VendorAnalyticsPage = lazy(() => import('../../pages/vendor/VendorAnalyticsPage'));
const AdventureManagementPage = lazy(() => import('../../pages/vendor/AdventureManagementPage'));
const VendorForumPage = lazy(() => import('../../pages/vendor/VendorForumPage'));
const BulkOperationsPage = lazy(() => import('../../pages/vendor/BulkOperationsPage'));

const VendorDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <VendorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <VendorHeader
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Main content */}
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Suspense fallback={<LoadingSpinner fullScreen message="Loading page..." />}>
            <Routes>
              <Route index element={<VendorOverview />} />
              <Route path="groups" element={<GroupBuilderPage />} />
              <Route path="adventures" element={<AdventureManagementPage />} />
              <Route path="bulk-operations" element={<BulkOperationsPage />} />
              <Route path="analytics" element={<VendorAnalyticsPage />} />
              <Route path="forum/*" element={<VendorForumPage />} />
              {/* Add more vendor routes here as needed */}
            </Routes>
          </Suspense>

          {/* Nested route content for future expansion */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorDashboardLayout;
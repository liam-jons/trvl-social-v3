import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import VendorDashboardLayout from '../../components/vendor/VendorDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const VendorDashboardPage = () => {
  const { user } = useAuth();
  const {
    vendor,
    loading,
    error,
    initializeDashboard,
    needsRefresh,
    refreshDashboard,
    cleanup
  } = useVendorDashboardStore();

  useEffect(() => {
    if (user && (!vendor || needsRefresh())) {
      initializeDashboard(user.id);
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [user, vendor, initializeDashboard, needsRefresh, cleanup]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (vendor) {
      const interval = setInterval(() => {
        if (needsRefresh()) {
          refreshDashboard();
        }
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [vendor, needsRefresh, refreshDashboard]);

  if (loading.vendor) {
    return <LoadingSpinner fullScreen message="Loading vendor dashboard..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error}
          onRetry={() => user && initializeDashboard(user.id)}
        />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Vendor Registration Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please complete your vendor registration to access the dashboard.
        </p>
        {/* TODO: Add link to vendor registration */}
      </div>
    );
  }

  return <VendorDashboardLayout />;
};

export default VendorDashboardPage;
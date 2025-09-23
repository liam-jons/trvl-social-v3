import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BulkOperationsManager from '../../components/vendor/BulkOperationsManager';
import VendorDashboardLayout from '../../components/vendor/VendorDashboardLayout';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
const BulkOperationsPage = () => {
  const { currentVendor, loadCurrentVendor } = useVendorDashboardStore();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const initializePage = async () => {
      try {
        await loadCurrentVendor();
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    initializePage();
  }, [loadCurrentVendor]);
  if (isLoading) {
    return (
      <VendorDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </VendorDashboardLayout>
    );
  }
  if (!currentVendor) {
    return (
      <VendorDashboardLayout>
        <div className="text-center py-12">
          <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Vendor Profile Not Found
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Please complete your vendor registration to access bulk operations.
          </div>
        </div>
      </VendorDashboardLayout>
    );
  }
  return (
    <VendorDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BulkOperationsManager vendorId={currentVendor.id} />
      </motion.div>
    </VendorDashboardLayout>
  );
};
export default BulkOperationsPage;
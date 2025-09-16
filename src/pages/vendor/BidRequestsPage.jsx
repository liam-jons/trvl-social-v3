import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
import { vendorService } from '../../services/vendor-service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import TripRequestCard from '../../components/vendor/TripRequestCard';
import BidSubmissionModal from '../../components/vendor/BidSubmissionModal';
import BidFilters from '../../components/vendor/BidFilters';

const BidRequestsPage = () => {
  const { user } = useAuth();
  const { vendor } = useVendorDashboardStore();
  const [tripRequests, setTripRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [filters, setFilters] = useState({
    destination: '',
    minBudget: '',
    maxBudget: '',
    startDate: '',
    endDate: '',
    minGroupSize: '',
    maxGroupSize: ''
  });

  // Load trip requests
  const loadTripRequests = async (appliedFilters = {}) => {
    if (!vendor) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: requestError } = await vendorService.getTripRequestsForVendor(
        vendor.id,
        appliedFilters
      );

      if (requestError) {
        throw new Error(requestError);
      }

      setTripRequests(data || []);
    } catch (err) {
      console.error('Load trip requests error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendor) {
      loadTripRequests();
    }
  }, [vendor]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const filterOptions = {};

    if (newFilters.minBudget) filterOptions.minBudget = parseInt(newFilters.minBudget);
    if (newFilters.maxBudget) filterOptions.maxBudget = parseInt(newFilters.maxBudget);
    if (newFilters.startDate) filterOptions.startDate = newFilters.startDate;
    if (newFilters.endDate) filterOptions.endDate = newFilters.endDate;

    loadTripRequests(filterOptions);
  };

  // Handle bid submission
  const handleBidRequest = (request) => {
    setSelectedRequest(request);
    setShowBidModal(true);
  };

  const handleBidSubmitted = () => {
    setShowBidModal(false);
    setSelectedRequest(null);
    // Refresh the requests to show updated bid status
    loadTripRequests();
  };

  // Handle refresh
  const handleRefresh = () => {
    loadTripRequests();
  };

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Vendor Registration Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please complete your vendor registration to view bid requests.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Trip Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and bid on adventure trip requests that match your services
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <BidFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            vendor={vendor}
          />
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner fullScreen={false} message="Loading trip requests..." />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={handleRefresh}
          />
        ) : (
          <>
            {/* Stats Bar */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20 dark:border-gray-700/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {tripRequests.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Available Requests
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {tripRequests.filter(r => r.matchScore >= 70).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    High Match
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {tripRequests.filter(r => r.hasExistingBid).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Already Bid
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {tripRequests.filter(r => !r.hasExistingBid && r.matchScore >= 50).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Good Opportunities
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Requests Grid */}
            {tripRequests.length === 0 ? (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-12 text-center border border-white/20 dark:border-gray-700/30">
                <div className="text-6xl mb-4">🎒</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Trip Requests Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  There are currently no trip requests that match your services and location.
                </p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Check Again
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tripRequests.map((request) => (
                  <TripRequestCard
                    key={request.id}
                    request={request}
                    vendor={vendor}
                    onBidRequest={handleBidRequest}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Bid Submission Modal */}
        {showBidModal && selectedRequest && (
          <BidSubmissionModal
            request={selectedRequest}
            vendor={vendor}
            onClose={() => setShowBidModal(false)}
            onBidSubmitted={handleBidSubmitted}
          />
        )}
      </div>
    </div>
  );
};

export default BidRequestsPage;
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import useOfferManagementStore from '../stores/offerManagementStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import OfferCard from '../components/offers/OfferCard';
import OfferFilters from '../components/offers/OfferFilters';
import OfferComparison from '../components/offers/OfferComparison';
import OfferActionModal from '../components/offers/OfferActionModal';
import SavedOffers from '../components/offers/SavedOffers';

const OfferManagementPage = () => {
  const { user } = useAuth();
  const {
    offers,
    loading,
    error,
    filters,
    comparisonMode,
    selectedOffers,
    loadUserTripRequests,
    getFilteredOffers,
    setFilters,
    setComparisonMode,
    clearOfferSelection,
    toggleOfferSelection
  } = useOfferManagementStore();

  const [activeTab, setActiveTab] = useState('all-offers'); // all-offers, saved, comparison
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, type: null, offer: null });

  // Load data on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserTripRequests(user.id);
    }
  }, [user?.id, loadUserTripRequests]);

  const filteredOffers = getFilteredOffers();

  // Handle offer actions
  const handleOfferAction = (type, offer) => {
    setActionModal({ show: true, type, offer });
  };

  const closeActionModal = () => {
    setActionModal({ show: false, type: null, offer: null });
  };

  // Get offer statistics
  const getOfferStats = () => {
    return {
      total: offers.length,
      pending: offers.filter(o => o.status === 'pending').length,
      accepted: offers.filter(o => o.status === 'accepted').length,
      rejected: offers.filter(o => o.status === 'rejected').length,
      expired: offers.filter(o => o.is_expired).length,
      expiringToday: offers.filter(o => o.days_until_expiry === 0 && !o.is_expired).length
    };
  };

  const stats = getOfferStats();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="text-gray-600 dark:text-gray-400">Please log in to view your offers.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Offer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View, compare, and manage vendor offers for your trip requests
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 lg:mt-0 grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Accepted</div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Rejected</div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.expiringToday}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Expiring Today</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('all-offers')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'all-offers'
                ? 'bg-blue-600 text-white'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
            }`}
          >
            All Offers ({filteredOffers.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'saved'
                ? 'bg-blue-600 text-white'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
            }`}
          >
            Saved Offers
          </button>
          <button
            onClick={() => {
              setActiveTab('comparison');
              setComparisonMode(true);
            }}
            disabled={selectedOffers.length < 2}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'comparison'
                ? 'bg-blue-600 text-white'
                : selectedOffers.length < 2
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
            }`}
          >
            Compare ({selectedOffers.length})
          </button>
        </div>

        {/* Comparison Mode Toggle */}
        {activeTab === 'all-offers' && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => {
                    setComparisonMode(e.target.checked);
                    if (!e.target.checked) {
                      clearOfferSelection();
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Comparison Mode
                </span>
              </label>
              {comparisonMode && selectedOffers.length > 0 && (
                <button
                  onClick={clearOfferSelection}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Clear Selection ({selectedOffers.length})
                </button>
              )}
            </div>
            {comparisonMode && selectedOffers.length >= 2 && (
              <button
                onClick={() => setActiveTab('comparison')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Compare Selected ({selectedOffers.length})
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading.requests ? (
          <LoadingSpinner fullScreen={false} message="Loading your offers..." />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={() => loadUserTripRequests(user.id)}
          />
        ) : (
          <>
            {/* All Offers Tab */}
            {activeTab === 'all-offers' && (
              <>
                {/* Filters */}
                <div className="mb-8">
                  <OfferFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    offers={offers}
                  />
                </div>

                {/* Offers Grid */}
                {filteredOffers.length === 0 ? (
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-12 text-center border border-white/20 dark:border-gray-700/30">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Offers Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {offers.length === 0
                        ? "You don't have any offers yet. Create a trip request to receive vendor offers."
                        : "No offers match your current filters. Try adjusting your filter criteria."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        comparisonMode={comparisonMode}
                        isSelected={selectedOffers.includes(offer.id)}
                        onToggleSelection={() => toggleOfferSelection(offer.id)}
                        onAction={handleOfferAction}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Saved Offers Tab */}
            {activeTab === 'saved' && (
              <SavedOffers userId={user.id} onAction={handleOfferAction} />
            )}

            {/* Comparison Tab */}
            {activeTab === 'comparison' && (
              <OfferComparison
                onAction={handleOfferAction}
                onBackToOffers={() => {
                  setActiveTab('all-offers');
                  setComparisonMode(false);
                }}
              />
            )}
          </>
        )}

        {/* Action Modal */}
        {actionModal.show && (
          <OfferActionModal
            type={actionModal.type}
            offer={actionModal.offer}
            onClose={closeActionModal}
            userId={user.id}
          />
        )}
      </div>
    </div>
  );
};

export default OfferManagementPage;
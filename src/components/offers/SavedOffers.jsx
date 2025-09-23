import { useState, useEffect } from 'react';
import useOfferManagementStore from '../../stores/offerManagementStore';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
const SavedOffers = ({ userId, onAction }) => {
  const {
    savedOffers,
    loading,
    error,
    loadSavedOffers
  } = useOfferManagementStore();
  const [sortBy, setSortBy] = useState('saved_at'); // saved_at, price, expiry
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired
  useEffect(() => {
    if (userId) {
      loadSavedOffers(userId);
    }
  }, [userId, loadSavedOffers]);
  const getFilteredAndSortedOffers = () => {
    let filtered = [...savedOffers];
    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(saved =>
        saved.vendor_bids?.status === 'pending' &&
        new Date(saved.vendor_bids?.valid_until) > new Date()
      );
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(saved =>
        new Date(saved.vendor_bids?.valid_until) <= new Date()
      );
    }
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.vendor_bids?.proposed_price || 0) - (b.vendor_bids?.proposed_price || 0);
        case 'expiry':
          return new Date(a.vendor_bids?.valid_until) - new Date(b.vendor_bids?.valid_until);
        case 'saved_at':
        default:
          return new Date(b.saved_at) - new Date(a.saved_at);
      }
    });
    return filtered;
  };
  const filteredOffers = getFilteredAndSortedOffers();
  const handleRemoveFromSaved = async (savedOfferId) => {
    // TODO: Implement remove from saved functionality
  };
  if (loading.offers) {
    return <LoadingSpinner fullScreen={false} message="Loading saved offers..." />;
  }
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => loadSavedOffers(userId)}
      />
    );
  }
  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saved Offers ({savedOffers.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Offers you've saved for later review
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="saved_at">Recently Saved</option>
            <option value="price">Price (Low to High)</option>
            <option value="expiry">Expires Soon</option>
          </select>
        </div>
      </div>
      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-12 text-center border border-white/20 dark:border-gray-700/30">
          <div className="text-6xl mb-4">💾</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {savedOffers.length === 0 ? 'No Saved Offers' : 'No Offers Match Filter'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {savedOffers.length === 0
              ? "You haven't saved any offers yet. Save offers from the main offers tab to review them later."
              : "Try adjusting your filter criteria to see more offers."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((savedOffer) => {
            const offer = savedOffer.vendor_bids;
            const isExpired = new Date(offer?.valid_until) <= new Date();
            const daysUntilExpiry = Math.ceil((new Date(offer?.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div
                key={savedOffer.id}
                className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/30 ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {offer?.vendors?.avatar_url ? (
                        <img
                          src={offer.vendors.avatar_url}
                          alt={offer.vendors.business_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        offer?.vendors?.business_name?.charAt(0) || 'V'
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {offer?.vendors?.business_name || 'Unknown Vendor'}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>⭐ {offer?.vendors?.rating?.toFixed(1) || 'N/A'}</span>
                        <span>•</span>
                        <span>{offer?.vendors?.total_reviews || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(offer?.proposed_price || 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Saved {formatRelativeTime(savedOffer.saved_at)}
                    </div>
                  </div>
                </div>
                {/* Trip Details */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    {offer?.trip_requests?.title}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>📍 {offer?.trip_requests?.destination}</div>
                    <div>👥 {offer?.trip_requests?.group_size} people</div>
                    <div>📅 {formatDate(offer?.trip_requests?.start_date)}</div>
                    <div className={`font-medium ${
                      isExpired
                        ? 'text-red-600 dark:text-red-400'
                        : daysUntilExpiry <= 3
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      ⏰ {isExpired ? 'Expired' : `${daysUntilExpiry} days left`}
                    </div>
                  </div>
                </div>
                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    offer?.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    offer?.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    offer?.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    offer?.status === 'counter_offered' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {(offer?.status || 'unknown').replace('_', ' ').toUpperCase()}
                  </span>
                  {isExpired && (
                    <span className="ml-2 inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      EXPIRED
                    </span>
                  )}
                </div>
                {/* Vendor Message Preview */}
                {offer?.message && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      <span className="font-medium">Vendor message:</span> {offer.message}
                    </p>
                  </div>
                )}
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onAction('view', offer)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    View Details
                  </button>
                  {offer?.status === 'pending' && !isExpired && (
                    <>
                      <button
                        onClick={() => onAction('accept', offer)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onAction('counteroffer', offer)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Counter
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemoveFromSaved(savedOffer.id)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Remove
                  </button>
                  {offer?.trip_requests && (
                    <button
                      onClick={() => onAction('share', offer)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      Share
                    </button>
                  )}
                </div>
                {/* Expiry Warning */}
                {!isExpired && daysUntilExpiry <= 3 && offer?.status === 'pending' && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                      <span className="text-orange-800 dark:text-orange-300 font-medium">
                        This offer expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Summary Stats */}
      {savedOffers.length > 0 && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Saved Offers Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {savedOffers.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {savedOffers.filter(s =>
                  s.vendor_bids?.status === 'pending' &&
                  new Date(s.vendor_bids?.valid_until) > new Date()
                ).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Still Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {savedOffers.filter(s => {
                  const daysLeft = Math.ceil((new Date(s.vendor_bids?.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
                  return daysLeft <= 3 && daysLeft > 0;
                }).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {savedOffers.filter(s =>
                  new Date(s.vendor_bids?.valid_until) <= new Date()
                ).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Expired</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SavedOffers;
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const OfferCard = ({
  offer,
  comparisonMode = false,
  isSelected = false,
  onToggleSelection,
  onAction
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'counter_offered': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getExpiryStatus = () => {
    if (offer.is_expired) {
      return { text: 'Expired', color: 'text-red-600 dark:text-red-400' };
    } else if (offer.days_until_expiry <= 1) {
      return { text: 'Expires today', color: 'text-red-600 dark:text-red-400' };
    } else if (offer.days_until_expiry <= 3) {
      return { text: `${offer.days_until_expiry} days left`, color: 'text-orange-600 dark:text-orange-400' };
    }
    return { text: `${offer.days_until_expiry} days left`, color: 'text-gray-600 dark:text-gray-400' };
  };

  const expiryStatus = getExpiryStatus();

  return (
    <div
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-white/20 dark:border-gray-700/30'
      } ${offer.is_expired ? 'opacity-60' : ''}`}
    >
      {/* Comparison Mode Checkbox */}
      {comparisonMode && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={offer.is_expired}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Select for comparison
            </span>
          </label>
        </div>
      )}

      <div className="p-6">
        {/* Vendor Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {offer.vendor?.avatar_url ? (
                <img
                  src={offer.vendor.avatar_url}
                  alt={offer.vendor.business_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                offer.vendor?.business_name?.charAt(0) || 'V'
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {offer.vendor?.business_name || 'Unknown Vendor'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>⭐ {offer.vendor?.rating?.toFixed(1) || 'N/A'}</span>
                <span>•</span>
                <span>{offer.vendor?.total_reviews || 0} reviews</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
            {offer.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Trip Details */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {offer.trip_request?.title}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>📍 {offer.trip_request?.destination}</div>
            <div>👥 {offer.trip_request?.group_size} people</div>
            <div>📅 {new Date(offer.trip_request?.start_date).toLocaleDateString()}</div>
            <div>⏱️ {offer.trip_request?.duration_days || 1} days</div>
          </div>
        </div>

        {/* Price and Details */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(offer.proposed_price)}
            </span>
            <span className={`text-sm font-medium ${expiryStatus.color}`}>
              {expiryStatus.text}
            </span>
          </div>

          {offer.price_breakdown && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {showDetails ? 'Hide' : 'Show'} price breakdown
            </button>
          )}
        </div>

        {/* Price Breakdown */}
        {showDetails && offer.price_breakdown && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
              Price Breakdown:
            </h5>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {Object.entries(offer.price_breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                  <span>{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Preview */}
        {offer.message && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {offer.message}
            </p>
          </div>
        )}

        {/* Vendor Specialties */}
        {offer.vendor?.specialties && offer.vendor.specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {offer.vendor.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-md text-xs"
                >
                  {specialty}
                </span>
              ))}
              {offer.vendor.specialties.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{offer.vendor.specialties.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {offer.status === 'pending' && !offer.is_expired && (
            <>
              <button
                onClick={() => onAction('accept', offer)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onAction('counteroffer', offer)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Counter
              </button>
              <button
                onClick={() => onAction('reject', offer)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {(offer.status === 'pending' || offer.status === 'counter_offered') && !offer.is_expired && (
            <button
              onClick={() => onAction('save', offer)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          )}

          <button
            onClick={() => onAction('view', offer)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            View
          </button>

          {offer.trip_request && (
            <button
              onClick={() => onAction('share', offer)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
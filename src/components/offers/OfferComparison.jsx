import { useState } from 'react';
import useOfferManagementStore from '../../stores/offerManagementStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OfferComparison = ({ onAction, onBackToOffers }) => {
  const {
    getComparisonData,
    selectedOffers,
    clearOfferSelection
  } = useOfferManagementStore();

  const [expandedSections, setExpandedSections] = useState({
    pricing: true,
    vendor: true,
    itinerary: false,
    terms: false
  });

  const comparisonData = getComparisonData();
  const { offers, comparison } = comparisonData;

  if (offers.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-12 text-center border border-white/20 dark:border-gray-700/30">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Offers Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select at least 2 offers to start comparing.
        </p>
        <button
          onClick={onBackToOffers}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Back to Offers
        </button>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const getBestValue = (offers, key, type = 'lowest') => {
    const values = offers.map(offer => {
      switch (key) {
        case 'price': return offer.proposed_price;
        case 'rating': return offer.vendor?.rating || 0;
        case 'reviews': return offer.vendor?.total_reviews || 0;
        case 'expiry': return new Date(offer.valid_until).getTime();
        default: return 0;
      }
    });

    if (type === 'lowest') {
      return Math.min(...values);
    } else {
      return Math.max(...values);
    }
  };

  const isHighlighted = (offer, key, type = 'lowest') => {
    const bestValue = getBestValue(offers, key, type);
    let offerValue;

    switch (key) {
      case 'price': offerValue = offer.proposed_price; break;
      case 'rating': offerValue = offer.vendor?.rating || 0; break;
      case 'reviews': offerValue = offer.vendor?.total_reviews || 0; break;
      case 'expiry': offerValue = new Date(offer.valid_until).getTime(); break;
      default: offerValue = 0;
    }

    return offerValue === bestValue;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Compare Offers ({offers.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Side-by-side comparison of selected vendor offers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              clearOfferSelection();
              onBackToOffers();
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Clear & Back
          </button>
          <button
            onClick={onBackToOffers}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Offers
          </button>
        </div>
      </div>

      {/* Comparison Overview */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price Range</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(comparison.priceRange.min)} - {formatCurrency(comparison.priceRange.max)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg: {formatCurrency(comparison.priceRange.average)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating Range</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {comparison.ratingRange.min.toFixed(1)} - {comparison.ratingRange.max.toFixed(1)} ⭐
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg: {comparison.ratingRange.average.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fastest Expiry</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {comparison.expirationDays[0]?.days || 0} days
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Take action soon
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
        {/* Vendor Headers */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="hidden md:block font-medium text-gray-900 dark:text-white">
            Comparison Criteria
          </div>
          {offers.slice(0, 4).map((offer) => (
            <div key={offer.id} className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
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
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                  {offer.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {offer.vendor?.business_name || 'Unknown Vendor'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {offer.trip_request?.title}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('pricing')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              💰 Pricing & Value
            </h3>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.pricing ? '▼' : '▶'}
            </span>
          </button>

          {expandedSections.pricing && (
            <div className="px-6 pb-6">
              {/* Total Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                <div className="font-medium text-gray-900 dark:text-white">Total Price</div>
                {offers.slice(0, 4).map((offer) => (
                  <div
                    key={offer.id}
                    className={`text-center p-3 rounded-lg ${
                      isHighlighted(offer, 'price', 'lowest')
                        ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(offer.proposed_price)}
                    </div>
                    {isHighlighted(offer, 'price', 'lowest') && (
                      <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                        BEST PRICE
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Price per person */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                <div className="font-medium text-gray-900 dark:text-white">Price per Person</div>
                {offers.slice(0, 4).map((offer) => (
                  <div key={offer.id} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(offer.proposed_price / (offer.trip_request?.group_size || 1))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="font-medium text-gray-900 dark:text-white">Price Breakdown</div>
                {offers.slice(0, 4).map((offer) => (
                  <div key={offer.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {offer.price_breakdown ? (
                      <div className="space-y-1 text-sm">
                        {Object.entries(offer.price_breakdown).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {formatCurrency(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        No breakdown provided
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vendor Information Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('vendor')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              👤 Vendor Information
            </h3>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.vendor ? '▼' : '▶'}
            </span>
          </button>

          {expandedSections.vendor && (
            <div className="px-6 pb-6 space-y-4">
              {/* Rating */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="font-medium text-gray-900 dark:text-white">Rating</div>
                {offers.slice(0, 4).map((offer) => (
                  <div
                    key={offer.id}
                    className={`text-center p-3 rounded-lg ${
                      isHighlighted(offer, 'rating', 'highest')
                        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {offer.vendor?.rating?.toFixed(1) || 'N/A'} ⭐
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {offer.vendor?.total_reviews || 0} reviews
                    </div>
                    {isHighlighted(offer, 'rating', 'highest') && (
                      <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        HIGHEST RATED
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Specialties */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="font-medium text-gray-900 dark:text-white">Specialties</div>
                {offers.slice(0, 4).map((offer) => (
                  <div key={offer.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {offer.vendor?.specialties && offer.vendor.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
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
                            +{offer.vendor.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        No specialties listed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Offer Terms Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('terms')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              📋 Offer Terms
            </h3>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.terms ? '▼' : '▶'}
            </span>
          </button>

          {expandedSections.terms && (
            <div className="px-6 pb-6 space-y-4">
              {/* Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="font-medium text-gray-900 dark:text-white">Expires</div>
                {offers.slice(0, 4).map((offer) => (
                  <div
                    key={offer.id}
                    className={`text-center p-3 rounded-lg ${
                      offer.days_until_expiry <= 1
                        ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                        : offer.days_until_expiry <= 3
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(offer.valid_until)}
                    </div>
                    <div className={`text-xs mt-1 ${
                      offer.days_until_expiry <= 1
                        ? 'text-red-700 dark:text-red-400'
                        : offer.days_until_expiry <= 3
                        ? 'text-yellow-700 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {offer.is_expired ? 'Expired' : `${offer.days_until_expiry} days left`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Offer Message */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="font-medium text-gray-900 dark:text-white">Message</div>
                {offers.slice(0, 4).map((offer) => (
                  <div key={offer.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                      {offer.message || 'No message provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="font-medium text-gray-900 dark:text-white flex items-center">
              Actions
            </div>
            {offers.slice(0, 4).map((offer) => (
              <div key={offer.id} className="flex flex-col gap-2">
                {offer.status === 'pending' && !offer.is_expired && (
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
                  onClick={() => onAction('view', offer)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferComparison;
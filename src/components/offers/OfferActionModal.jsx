import { useState, useEffect } from 'react';
import useOfferManagementStore from '../../stores/offerManagementStore';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
const OfferActionModal = ({ type, offer, onClose, userId }) => {
  const {
    acceptOffer,
    rejectOffer,
    submitCounteroffer,
    saveOfferForLater,
    shareOfferWithGroup,
    loading
  } = useOfferManagementStore();
  const [formData, setFormData] = useState({
    rejectionReason: '',
    counterOfferPrice: offer?.proposed_price || 0,
    counterOfferMessage: '',
    counterOfferModifications: '',
    shareMessage: '',
    selectedGroupId: ''
  });
  const [step, setStep] = useState(1); // For multi-step processes
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]); // For sharing functionality
  useEffect(() => {
    // Load user's groups for sharing functionality
    if (type === 'share') {
      // TODO: Implement group loading
      setGroups([]);
    }
  }, [type]);
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleAccept = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await acceptOffer(offer.id, userId);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to accept offer');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  const handleReject = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await rejectOffer(offer.id, formData.rejectionReason);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to reject offer');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  const handleCounteroffer = async () => {
    if (formData.counterOfferPrice <= 0) {
      setError('Please enter a valid counteroffer price');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const counterOfferData = {
        proposed_price: formData.counterOfferPrice,
        message: formData.counterOfferMessage,
        modifications: formData.counterOfferModifications
      };
      const result = await submitCounteroffer(offer.id, counterOfferData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to submit counteroffer');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await saveOfferForLater(offer.id, userId);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to save offer');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  const handleShare = async () => {
    if (!formData.selectedGroupId) {
      setError('Please select a group to share with');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const result = await shareOfferWithGroup(offer.id, formData.selectedGroupId, formData.shareMessage);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to share offer');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  const getModalTitle = () => {
    switch (type) {
      case 'accept': return 'Accept Offer';
      case 'reject': return 'Reject Offer';
      case 'counteroffer': return 'Submit Counteroffer';
      case 'save': return 'Save Offer';
      case 'share': return 'Share Offer';
      case 'view': return 'Offer Details';
      default: return 'Offer Action';
    }
  };
  const renderOfferSummary = () => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
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
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {offer.vendor?.business_name || 'Unknown Vendor'}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>⭐ {offer.vendor?.rating?.toFixed(1) || 'N/A'}</span>
            <span>•</span>
            <span>{offer.vendor?.total_reviews || 0} reviews</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Trip:</span>
          <div className="font-medium text-gray-900 dark:text-white">
            {offer.trip_request?.title}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <div className="font-bold text-green-600 dark:text-green-400 text-lg">
            {formatCurrency(offer.proposed_price)}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Destination:</span>
          <div className="font-medium text-gray-900 dark:text-white">
            {offer.trip_request?.destination}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Expires:</span>
          <div className={`font-medium ${
            offer.days_until_expiry <= 1
              ? 'text-red-600 dark:text-red-400'
              : offer.days_until_expiry <= 3
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatDate(offer.valid_until)} ({offer.days_until_expiry} days)
          </div>
        </div>
      </div>
    </div>
  );
  const renderAcceptModal = () => (
    <div>
      {renderOfferSummary()}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Accept This Offer?
        </h4>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 dark:text-blue-400 text-xl">ℹ️</div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-2">By accepting this offer:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You'll enter into an agreement with {offer.vendor?.business_name}</li>
                <li>All other offers for this trip will be automatically rejected</li>
                <li>Your trip request status will change to "Accepted"</li>
                <li>You'll receive booking confirmation details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAccept}
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <LoadingSpinner size="sm" /> : null}
          Accept Offer
        </button>
      </div>
    </div>
  );
  const renderRejectModal = () => (
    <div>
      {renderOfferSummary()}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reason for rejection (optional)
        </label>
        <select
          value={formData.rejectionReason}
          onChange={(e) => handleInputChange('rejectionReason', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a reason</option>
          <option value="price_too_high">Price too high</option>
          <option value="different_requirements">Different requirements</option>
          <option value="vendor_concerns">Concerns about vendor</option>
          <option value="timing_issues">Timing issues</option>
          <option value="found_better_option">Found better option</option>
          <option value="trip_cancelled">Trip cancelled</option>
          <option value="other">Other</option>
        </select>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <LoadingSpinner size="sm" /> : null}
          Reject Offer
        </button>
      </div>
    </div>
  );
  const renderCounterofferModal = () => (
    <div>
      {renderOfferSummary()}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Counteroffer Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              value={formData.counterOfferPrice}
              onChange={(e) => handleInputChange('counterOfferPrice', parseFloat(e.target.value))}
              min={0}
              step={10}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your price"
            />
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Original price: {formatCurrency(offer.proposed_price)}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message to Vendor
          </label>
          <textarea
            value={formData.counterOfferMessage}
            onChange={(e) => handleInputChange('counterOfferMessage', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain your counteroffer or any modifications you'd like..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Requested Modifications (optional)
          </label>
          <textarea
            value={formData.counterOfferModifications}
            onChange={(e) => handleInputChange('counterOfferModifications', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any specific changes to itinerary, services, etc..."
          />
        </div>
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCounteroffer}
          disabled={submitting || formData.counterOfferPrice <= 0}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <LoadingSpinner size="sm" /> : null}
          Submit Counteroffer
        </button>
      </div>
    </div>
  );
  const renderViewModal = () => (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {offer.vendor?.business_name || 'Unknown Vendor'}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>⭐ {offer.vendor?.rating?.toFixed(1) || 'N/A'} ({offer.vendor?.total_reviews || 0} reviews)</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                offer.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                offer.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {offer.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Trip:</span>
            <div className="font-semibold text-gray-900 dark:text-white">
              {offer.trip_request?.title}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
            <div className="font-bold text-green-600 dark:text-green-400 text-xl">
              {formatCurrency(offer.proposed_price)}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Destination:</span>
            <div className="font-semibold text-gray-900 dark:text-white">
              {offer.trip_request?.destination}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Group Size:</span>
            <div className="font-semibold text-gray-900 dark:text-white">
              {offer.trip_request?.group_size} people
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Trip Dates:</span>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatDate(offer.trip_request?.start_date)} - {formatDate(offer.trip_request?.end_date)}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Offer Expires:</span>
            <div className={`font-semibold ${
              offer.days_until_expiry <= 1
                ? 'text-red-600 dark:text-red-400'
                : offer.days_until_expiry <= 3
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {formatDateTime(offer.valid_until)}
            </div>
          </div>
        </div>
      </div>
      {/* Price Breakdown */}
      {offer.price_breakdown && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Price Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(offer.price_breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace('_', ' ')}:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Vendor Message */}
      {offer.message && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Message from Vendor</h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
            {offer.message}
          </p>
        </div>
      )}
      {/* Vendor Specialties */}
      {offer.vendor?.specialties && offer.vendor.specialties.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Vendor Specialties</h4>
          <div className="flex flex-wrap gap-2">
            {offer.vendor.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
        {offer.status === 'pending' && !offer.is_expired && (
          <>
            <button
              onClick={() => {
                onClose();
                // Trigger accept modal
                setTimeout(() => onAction?.('accept', offer), 100);
              }}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => {
                onClose();
                // Trigger counteroffer modal
                setTimeout(() => onAction?.('counteroffer', offer), 100);
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Counter
            </button>
          </>
        )}
      </div>
    </div>
  );
  const renderSaveModal = () => (
    <div>
      {renderOfferSummary()}
      <div className="mb-6">
        <p className="text-gray-700 dark:text-gray-300">
          Save this offer to review later? You can find all saved offers in the "Saved Offers" tab.
        </p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <LoadingSpinner size="sm" /> : null}
          Save for Later
        </button>
      </div>
    </div>
  );
  const renderContent = () => {
    switch (type) {
      case 'accept': return renderAcceptModal();
      case 'reject': return renderRejectModal();
      case 'counteroffer': return renderCounterofferModal();
      case 'view': return renderViewModal();
      case 'save': return renderSaveModal();
      default: return <div>Unknown action type</div>;
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getModalTitle()}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
export default OfferActionModal;
import { useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, Star, Clock, Eye } from 'lucide-react';

const TripRequestCard = ({ request, vendor, onBidRequest }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get match score color
  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get bid status color and text
  const getBidStatusInfo = () => {
    if (!request.hasExistingBid) {
      return { color: 'text-blue-600 dark:text-blue-400', text: 'No Bid Yet' };
    }

    switch (request.existingBidStatus) {
      case 'pending':
        return { color: 'text-yellow-600 dark:text-yellow-400', text: 'Bid Pending' };
      case 'accepted':
        return { color: 'text-green-600 dark:text-green-400', text: 'Bid Accepted' };
      case 'rejected':
        return { color: 'text-red-600 dark:text-red-400', text: 'Bid Rejected' };
      case 'withdrawn':
        return { color: 'text-gray-600 dark:text-gray-400', text: 'Bid Withdrawn' };
      case 'expired':
        return { color: 'text-gray-600 dark:text-gray-400', text: 'Bid Expired' };
      default:
        return { color: 'text-gray-600 dark:text-gray-400', text: request.existingBidStatus };
    }
  };

  const bidStatusInfo = getBidStatusInfo();
  const canBid = !request.hasExistingBid || request.existingBidStatus === 'rejected' || request.existingBidStatus === 'expired';

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/30 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {request.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            {request.destination}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`text-sm font-medium ${getMatchScoreColor(request.matchScore)}`}>
            {request.matchScore}% Match
          </div>
          <div className={`text-sm ${bidStatusInfo.color}`}>
            {bidStatusInfo.text}
          </div>
        </div>
      </div>

      {/* Key Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(request.start_date)} - {formatDate(request.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {request.group_size} {request.group_size === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(request.budget_min)} - {formatCurrency(request.budget_max)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24))} days
          </span>
        </div>
      </div>

      {/* Client Info */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={request.profiles?.avatar_url || '/default-avatar.png'}
          alt={request.profiles?.full_name}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {request.profiles?.full_name}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Posted {new Date(request.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Description Preview */}
      {request.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {request.description}
          </p>
        </div>
      )}

      {/* Preferences/Activities */}
      {request.preferences?.activities && request.preferences.activities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {request.preferences.activities.slice(0, 3).map((activity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
              >
                {activity}
              </span>
            ))}
            {request.preferences.activities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{request.preferences.activities.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          <Eye className="h-4 w-4" />
          Details
        </button>
        {canBid ? (
          <button
            onClick={() => onBidRequest(request)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Submit Bid
          </button>
        ) : (
          <button
            disabled
            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
          >
            {request.existingBidStatus === 'pending' ? 'Bid Submitted' : 'Cannot Bid'}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            {request.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {request.description}
                </p>
              </div>
            )}

            {request.preferences && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Preferences
                </h4>
                <div className="space-y-2">
                  {request.preferences.experience_level && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Experience Level:</span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {request.preferences.experience_level}
                      </span>
                    </div>
                  )}
                  {request.preferences.accommodation_type && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Accommodation:</span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {request.preferences.accommodation_type}
                      </span>
                    </div>
                  )}
                  {request.preferences.difficulty_level && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Difficulty:</span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {request.preferences.difficulty_level}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {request.preferences?.activities && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Requested Activities
                </h4>
                <div className="flex flex-wrap gap-1">
                  {request.preferences.activities.map((activity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripRequestCard;
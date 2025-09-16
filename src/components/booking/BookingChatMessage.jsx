import { useState } from 'react';
import {
  UserIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const BookingChatMessage = ({ message, isOwn = false }) => {
  const [showFunctionDetails, setShowFunctionDetails] = useState(false);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderFunctionResult = (functionCall, functionResult) => {
    if (!functionCall || !functionResult) return null;

    const { name } = functionCall;

    switch (name) {
      case 'check_availability':
        return renderAvailabilityResult(functionResult);
      case 'modify_booking':
        return renderBookingModification(functionResult);
      case 'get_recommendations':
        return renderRecommendations(functionResult);
      case 'parse_trip_request':
        return renderTripParse(functionResult);
      case 'escalate_to_human':
        return renderEscalation(functionResult);
      default:
        return null;
    }
  };

  const renderAvailabilityResult = (result) => {
    if (result.error) {
      return (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Availability Check Failed
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{result.error}</p>
        </div>
      );
    }

    const { availability } = result;

    return (
      <div className="mt-3 space-y-3">
        {/* Main Availability Status */}
        <div className={`p-4 rounded-lg border ${
          availability.hasAvailability
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {availability.hasAvailability ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <ClockIcon className="w-5 h-5 text-yellow-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {availability.hasAvailability ? 'Available!' : 'Limited Availability'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Destination:</span>
              <p className="font-medium text-gray-900 dark:text-white">{result.destination}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Remaining spots:</span>
              <p className="font-medium text-gray-900 dark:text-white">{availability.remainingSpots}</p>
            </div>
          </div>
        </div>

        {/* Available Dates */}
        {availability.availableDates?.length > 0 && (
          <div className="p-3 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Available Dates</span>
            </h4>
            <div className="space-y-2">
              {availability.availableDates.map((date, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(date.startDate).toLocaleDateString()} - {new Date(date.endDate).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${date.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Dates */}
        {availability.alternativeDates?.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Alternative Dates</span>
            </h4>
            <div className="space-y-2">
              {availability.alternativeDates.map((date, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(date.startDate).toLocaleDateString()} - {new Date(date.endDate).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    ${date.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBookingModification = (result) => {
    if (result.error) {
      return (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Modification Failed
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{result.error}</p>
        </div>
      );
    }

    return (
      <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <span className="font-medium text-green-700 dark:text-green-300">
            Booking Modified Successfully
          </span>
        </div>
        <p className="text-sm text-green-600 dark:text-green-400">
          Booking #{result.bookingId} has been updated with your requested changes.
        </p>
        {result.message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {result.message}
          </p>
        )}
      </div>
    );
  };

  const renderRecommendations = (result) => {
    if (result.error || !result.recommendations?.length) {
      return (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            No recommendations available at this time.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-3 space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
          <SparklesIcon className="w-4 h-4" />
          <span>Recommended Destinations</span>
        </h4>

        <div className="space-y-3">
          {result.recommendations.map((rec, index) => (
            <div key={index} className="p-4 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{rec.destination}</span>
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rec.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600 dark:text-green-400">{rec.price}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{rec.duration}</p>
                </div>
              </div>

              {rec.highlights && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {rec.highlights.map((highlight, idx) => (
                      <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTripParse = (result) => {
    if (result.error) {
      return (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to parse trip request: {result.error}
          </p>
        </div>
      );
    }

    const { parsedData } = result;

    return (
      <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center space-x-2">
          <SparklesIcon className="w-4 h-4" />
          <span>Trip Analysis</span>
        </h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {parsedData.destinations?.primary && (
            <div>
              <span className="text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                <MapPinIcon className="w-3 h-3" />
                <span>Destination:</span>
              </span>
              <p className="font-medium text-gray-900 dark:text-white">{parsedData.destinations.primary}</p>
            </div>
          )}

          {parsedData.groupSize?.size && (
            <div>
              <span className="text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                <UserGroupIcon className="w-3 h-3" />
                <span>Group Size:</span>
              </span>
              <p className="font-medium text-gray-900 dark:text-white">{parsedData.groupSize.size} people</p>
            </div>
          )}

          {parsedData.budget?.amount && (
            <div>
              <span className="text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                <CurrencyDollarIcon className="w-3 h-3" />
                <span>Budget:</span>
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                ${parsedData.budget.amount} {parsedData.budget.currency}
              </p>
            </div>
          )}

          {parsedData.dates?.duration && (
            <div>
              <span className="text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                <CalendarIcon className="w-3 h-3" />
                <span>Duration:</span>
              </span>
              <p className="font-medium text-gray-900 dark:text-white">{parsedData.dates.duration} days</p>
            </div>
          )}
        </div>

        {parsedData.activities?.interests?.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Interests:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {parsedData.activities.interests.slice(0, 4).map((interest, idx) => (
                <span key={idx} className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Confidence: {Math.round(parsedData.overallConfidence * 100)}%
        </div>
      </div>
    );
  };

  const renderEscalation = (result) => {
    return (
      <div className="mt-3 p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-orange-700 dark:text-orange-300">
            Connecting to Human Support
          </span>
        </div>
        <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">
          {result.message}
        </p>
        {result.estimatedWaitTime && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estimated wait time: {result.estimatedWaitTime}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isOwn
              ? 'bg-blue-500'
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
            }
          `}>
            {isOwn ? (
              <UserIcon className="w-4 h-4 text-white" />
            ) : (
              <SparklesIcon className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={`
              px-4 py-2 rounded-2xl
              ${isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white border border-white/20 dark:border-white/10'
              }
            `}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {/* Function Call Details */}
            {message.functionCall && (
              <div className="mt-2">
                <button
                  onClick={() => setShowFunctionDetails(!showFunctionDetails)}
                  className={`
                    flex items-center space-x-1 text-xs
                    ${isOwn ? 'text-blue-100 hover:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                  `}
                >
                  {showFunctionDetails ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronRightIcon className="w-3 h-3" />
                  )}
                  <span>Function: {message.functionCall.name}</span>
                </button>

                {showFunctionDetails && (
                  <div className="mt-2 p-2 bg-black/10 dark:bg-white/10 rounded text-xs">
                    <pre className="whitespace-pre-wrap font-mono">
                      {JSON.stringify(message.functionCall.arguments, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Function Result */}
          {!isOwn && renderFunctionResult(message.functionCall, message.functionResult)}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.timestamp)}
            {message.error && (
              <span className="ml-2 text-red-500">Error</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingChatMessage;
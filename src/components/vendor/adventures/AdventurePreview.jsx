import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import GlassCard from '../../ui/GlassCard';

const AdventurePreview = ({ adventureData }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);

  const {
    title = 'Adventure Title',
    location = 'Location',
    description = '',
    longDescription = '',
    images = [],
    basePrice = 0,
    currency = 'USD',
    duration = 'Duration',
    groupSizeMin = 2,
    groupSizeMax = 12,
    difficulty = 'moderate',
    adventureType = 'outdoor',
    itinerary = [],
    seasonalPricing = [],
    availability = {}
  } = adventureData;

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(images.length, 1));
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));
  };

  const getDifficultyColor = (level) => {
    const colors = {
      easy: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      moderate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
      challenging: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
      expert: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[level] || colors.moderate;
  };

  const formatPrice = (price) => {
    return `${currencySymbol}${price?.toLocaleString() || 0}`;
  };

  const stripHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'availability', label: 'Availability' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Adventure Preview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This is how your adventure will appear to customers
        </p>
      </div>

      {/* Image Gallery */}
      <GlassCard variant="light" padding="none" className="overflow-hidden">
        <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]?.url}
                alt={title}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>

                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏔️</span>
                </div>
                <p>No images uploaded</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
            >
              {isFavorited ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors">
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Adventure Info Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard variant="light" padding="lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {location}
                  </div>
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    4.8 (124 reviews)
                  </div>
                </div>
              </div>

              <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <ClockIcon className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">{duration}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
              </div>

              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <UserGroupIcon className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {groupSizeMin}-{groupSizeMax}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Group Size</div>
              </div>

              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <CalendarIcon className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Year-round</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Availability</div>
              </div>

              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg mb-1">🏔️</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {adventureType.replace('-', ' ')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
              </div>
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          </GlassCard>
        </div>

        {/* Booking Panel */}
        <div className="lg:col-span-1">
          <GlassCard variant="light" padding="lg" className="sticky top-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatPrice(basePrice)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">per person</div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of People
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  {Array.from({ length: groupSizeMax - groupSizeMin + 1 }, (_, i) => groupSizeMin + i).map(size => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              Book Now
            </button>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Free cancellation up to 24 hours before
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <GlassCard variant="light" padding="lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About This Adventure
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: longDescription || description }} />
            </div>
          </GlassCard>
        )}

        {activeTab === 'itinerary' && (
          <GlassCard variant="light" padding="lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Day-by-Day Itinerary
            </h3>
            {itinerary.length > 0 ? (
              <div className="space-y-6">
                {itinerary.map((day, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {day.day}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {day.title}
                      </h4>
                    </div>
                    {day.summary && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {day.summary}
                      </p>
                    )}
                    {day.activities && day.activities.length > 0 && (
                      <div className="space-y-3">
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {activity.title}
                              </h5>
                              {activity.startTime && activity.endTime && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {activity.startTime} - {activity.endTime}
                                </span>
                              )}
                            </div>
                            {activity.description && (
                              <div
                                className="text-sm text-gray-600 dark:text-gray-400"
                                dangerouslySetInnerHTML={{ __html: activity.description }}
                              />
                            )}
                            {activity.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <MapPinIcon className="h-3 w-3" />
                                {activity.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClockIcon className="mx-auto h-12 w-12 mb-4" />
                <p>No detailed itinerary available</p>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'pricing' && (
          <GlassCard variant="light" padding="lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Pricing Details
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Base Price</h4>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>Per person</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(basePrice)}
                    </span>
                  </div>
                </div>
              </div>

              {seasonalPricing.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Seasonal Pricing</h4>
                  <div className="space-y-2">
                    {seasonalPricing.map((season, index) => (
                      <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {season.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {season.startDate} - {season.endDate}
                            </div>
                          </div>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {season.priceType === 'fixed'
                              ? formatPrice(season.fixedPrice)
                              : `${season.priceMultiplier}x (${formatPrice(basePrice * season.priceMultiplier)})`
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>* Prices are per person and may vary based on group size and seasonal demand</p>
                <p>* All prices include applicable taxes and fees</p>
              </div>
            </div>
          </GlassCard>
        )}

        {activeTab === 'availability' && (
          <GlassCard variant="light" padding="lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Availability Information
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Booking Requirements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Advance Notice</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {availability.advanceNotice || 24} hours
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Min Group Size</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {availability.minGroupSize || groupSizeMin} people
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Booking Type</h4>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {availability.type || 'Open Booking'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {availability.type === 'scheduled' && 'Available on specific pre-scheduled dates only'}
                    {availability.type === 'on-demand' && 'Available upon request with flexible scheduling'}
                    {(!availability.type || availability.type === 'open') && 'Available on most dates with advance notice'}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>* Availability is subject to weather conditions and local regulations</p>
                <p>* We recommend booking in advance, especially during peak season</p>
              </div>
            </div>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
};

export default AdventurePreview;
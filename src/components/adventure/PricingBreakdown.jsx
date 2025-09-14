import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

const PricingBreakdown = ({ adventure }) => {
  if (!adventure || !adventure.pricing) {
    return null;
  }

  const { pricing } = adventure;
  const basePrice = pricing.basePrice || adventure.price;
  const currency = pricing.currency || adventure.currency || 'USD';

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateDiscountedPrice = (basePrice, discountPercent) => {
    return basePrice - (basePrice * discountPercent / 100);
  };

  const calculateSeasonalPrice = (basePrice, modifier) => {
    return basePrice * modifier;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <GlassCard variant="light">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Pricing Breakdown
        </h2>

        {/* Base Pricing */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Base Price
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Per person, standard season
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(basePrice)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {adventure.duration}
                </div>
              </div>
            </div>
          </div>

          {/* Group Discounts */}
          {pricing.groupDiscounts && pricing.groupDiscounts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Group Discounts
              </h4>

              <div className="space-y-2">
                {pricing.groupDiscounts.map((discount, index) => {
                  const discountedPrice = calculateDiscountedPrice(basePrice, discount.discount);
                  const savings = basePrice - discountedPrice;

                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {discount.size}
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                          {discount.discount}% off
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {formatPrice(discountedPrice)}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Save {formatPrice(savings)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seasonal Pricing */}
          {pricing.seasonalPricing && pricing.seasonalPricing.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Seasonal Pricing
              </h4>

              <div className="space-y-2">
                {pricing.seasonalPricing.map((season, index) => {
                  const seasonalPrice = calculateSeasonalPrice(basePrice, season.modifier);
                  const difference = seasonalPrice - basePrice;
                  const isIncrease = difference > 0;

                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {season.season}
                        </span>
                        {difference !== 0 && (
                          <span className={`text-sm ml-2 ${
                            isIncrease
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {isIncrease ? '+' : ''}{Math.round(((season.modifier - 1) * 100))}%
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {formatPrice(seasonalPrice)}
                        </div>
                        {difference !== 0 && (
                          <div className={`text-xs ${
                            isIncrease
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {isIncrease ? '+' : ''}{formatPrice(Math.abs(difference))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What's Included Summary */}
          {adventure.included && adventure.included.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Price Includes
              </h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {adventure.included.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
              {adventure.included.length > 6 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  And {adventure.included.length - 6} more items...
                </p>
              )}
            </div>
          )}

          {/* Not Included */}
          {adventure.notIncluded && adventure.notIncluded.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Not Included
              </h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {adventure.notIncluded.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Final price may vary based on group size, season, and availability
          </p>
          <button className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
            Check Availability & Book
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default PricingBreakdown;
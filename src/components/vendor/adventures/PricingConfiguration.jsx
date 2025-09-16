import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];

const SEASON_TEMPLATES = [
  { name: 'Peak Season', months: [6, 7, 8], multiplier: 1.3 },
  { name: 'Shoulder Season', months: [4, 5, 9, 10], multiplier: 1.1 },
  { name: 'Off Season', months: [11, 12, 1, 2, 3], multiplier: 0.9 }
];

const PricingConfiguration = ({ data, onChange }) => {
  const [showSeasonalForm, setShowSeasonalForm] = useState(false);
  const [showGroupDiscountForm, setShowGroupDiscountForm] = useState(false);

  const currency = CURRENCIES.find(c => c.code === (data.currency || 'USD'));

  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const addSeasonalPrice = (seasonData = {}) => {
    const newSeason = {
      id: Date.now(),
      name: seasonData.name || '',
      startDate: seasonData.startDate || '',
      endDate: seasonData.endDate || '',
      priceMultiplier: seasonData.priceMultiplier || 1,
      fixedPrice: seasonData.fixedPrice || '',
      ...seasonData
    };

    const updatedSeasons = [...(data.seasonalPricing || []), newSeason];
    handleInputChange('seasonalPricing', updatedSeasons);
    setShowSeasonalForm(false);
  };

  const updateSeasonalPrice = (id, updates) => {
    const updatedSeasons = (data.seasonalPricing || []).map(season =>
      season.id === id ? { ...season, ...updates } : season
    );
    handleInputChange('seasonalPricing', updatedSeasons);
  };

  const removeSeasonalPrice = (id) => {
    const updatedSeasons = (data.seasonalPricing || []).filter(season => season.id !== id);
    handleInputChange('seasonalPricing', updatedSeasons);
  };

  const addGroupDiscount = (discountData = {}) => {
    const newDiscount = {
      id: Date.now(),
      minGroupSize: discountData.minGroupSize || 6,
      discountType: discountData.discountType || 'percentage',
      discountValue: discountData.discountValue || 10,
      ...discountData
    };

    const updatedDiscounts = [...(data.groupDiscounts || []), newDiscount];
    handleInputChange('groupDiscounts', updatedDiscounts);
    setShowGroupDiscountForm(false);
  };

  const updateGroupDiscount = (id, updates) => {
    const updatedDiscounts = (data.groupDiscounts || []).map(discount =>
      discount.id === id ? { ...discount, ...updates } : discount
    );
    handleInputChange('groupDiscounts', updatedDiscounts);
  };

  const removeGroupDiscount = (id) => {
    const updatedDiscounts = (data.groupDiscounts || []).filter(discount => discount.id !== id);
    handleInputChange('groupDiscounts', updatedDiscounts);
  };

  const calculateSeasonalPrice = (basePrice, multiplier) => {
    return (basePrice * multiplier).toFixed(0);
  };

  const SeasonalPriceForm = ({ onSave, onCancel, initialData = {} }) => {
    const [formData, setFormData] = useState({
      name: initialData.name || '',
      startDate: initialData.startDate || '',
      endDate: initialData.endDate || '',
      priceType: initialData.priceType || 'multiplier',
      priceMultiplier: initialData.priceMultiplier || 1,
      fixedPrice: initialData.fixedPrice || ''
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <GlassCard variant="light" padding="md" className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Add Seasonal Pricing
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Season Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Peak"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pricing Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priceType: 'multiplier' })}
                  className={`p-3 rounded-lg border transition-colors ${
                    formData.priceType === 'multiplier'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm font-medium">Multiplier</div>
                  <div className="text-xs text-gray-500">% of base price</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priceType: 'fixed' })}
                  className={`p-3 rounded-lg border transition-colors ${
                    formData.priceType === 'fixed'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm font-medium">Fixed Price</div>
                  <div className="text-xs text-gray-500">Absolute amount</div>
                </button>
              </div>
            </div>

            {formData.priceType === 'multiplier' ? (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Multiplier
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    value={formData.priceMultiplier}
                    onChange={(e) => setFormData({ ...formData, priceMultiplier: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {data.basePrice && `= ${currency?.symbol}${calculateSeasonalPrice(data.basePrice, formData.priceMultiplier)}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fixed Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {currency?.symbol}
                  </span>
                  <input
                    type="number"
                    value={formData.fixedPrice}
                    onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4">
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.name || !formData.startDate || !formData.endDate}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Season
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Quick Templates */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Templates:</p>
            <div className="flex flex-wrap gap-2">
              {SEASON_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => onSave({
                    name: template.name,
                    priceMultiplier: template.multiplier,
                    priceType: 'multiplier'
                  })}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pricing Configuration
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Set your base pricing and configure seasonal variations or group discounts.
        </p>
      </div>

      {/* Base Pricing */}
      <GlassCard variant="light" padding="md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5" />
          Base Pricing
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency *
            </label>
            <select
              value={data.currency || 'USD'}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Price per Person *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {currency?.symbol}
              </span>
              <input
                type="number"
                value={data.basePrice || ''}
                onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || '')}
                placeholder="0"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Seasonal Pricing */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Seasonal Pricing
          </h4>
          <button
            onClick={() => setShowSeasonalForm(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Season
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {showSeasonalForm && (
              <SeasonalPriceForm
                onSave={addSeasonalPrice}
                onCancel={() => setShowSeasonalForm(false)}
              />
            )}
          </AnimatePresence>

          {data.seasonalPricing?.length > 0 ? (
            <div className="space-y-2">
              {data.seasonalPricing.map((season) => (
                <motion.div
                  key={season.id}
                  layout
                  className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {season.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {season.startDate} to {season.endDate} •
                      {season.priceType === 'multiplier'
                        ? ` ${season.priceMultiplier}x base price (${currency?.symbol}${calculateSeasonalPrice(data.basePrice || 0, season.priceMultiplier)})`
                        : ` ${currency?.symbol}${season.fixedPrice}`
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => removeSeasonalPrice(season.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">
              No seasonal pricing configured. Use base price year-round.
            </p>
          )}
        </div>
      </GlassCard>

      {/* Group Discounts */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5" />
            Group Discounts
          </h4>
          <button
            onClick={() => setShowGroupDiscountForm(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Discount
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {showGroupDiscountForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlassCard variant="light" padding="md" className="space-y-4">
                  <h5 className="font-medium text-gray-900 dark:text-white">Add Group Discount</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min Group Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        placeholder="6"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        onChange={(e) => {
                          const minSize = parseInt(e.target.value) || 6;
                          addGroupDiscount({ minGroupSize: minSize, discountType: 'percentage', discountValue: 10 });
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowGroupDiscountForm(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {data.groupDiscounts?.length > 0 ? (
            <div className="space-y-2">
              {data.groupDiscounts.map((discount) => (
                <motion.div
                  key={discount.id}
                  layout
                  className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Groups of {discount.minGroupSize}+ people
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {discount.discountType === 'percentage'
                        ? `${discount.discountValue}% discount`
                        : `${currency?.symbol}${discount.discountValue} off per person`
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => removeGroupDiscount(discount.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">
              No group discounts configured. Same price for all group sizes.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default PricingConfiguration;
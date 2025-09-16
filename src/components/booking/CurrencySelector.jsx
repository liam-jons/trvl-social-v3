import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import CurrencyService from '../../services/currency-service';

const CurrencySelector = ({
  value,
  onChange,
  amount = 0,
  showPreview = true,
  showConversion = true,
  className = '',
  disabled = false,
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [conversions, setConversions] = useState({});
  const [loading, setLoading] = useState(false);
  const [userCurrency, setUserCurrency] = useState(null);

  useEffect(() => {
    // Load supported currencies
    const supportedCurrencies = CurrencyService.getSupportedCurrencies();
    setCurrencies(supportedCurrencies);

    // Detect user's preferred currency
    const detectCurrency = async () => {
      try {
        const detected = await CurrencyService.detectUserCurrency();
        setUserCurrency(detected);
        if (!value) {
          onChange?.(detected);
        }
      } catch (error) {
        console.warn('Failed to detect user currency:', error);
      }
    };

    detectCurrency();
  }, [value, onChange]);

  useEffect(() => {
    // Generate currency conversion preview when amount or currency changes
    if (amount > 0 && value && showConversion) {
      generateConversions();
    }
  }, [amount, value, showConversion]);

  const generateConversions = async () => {
    if (!value || amount <= 0) return;

    setLoading(true);
    try {
      const targetCurrencies = currencies
        .map(c => c.code)
        .filter(code => code !== value)
        .slice(0, 3); // Show top 3 conversions

      const conversionResults = await CurrencyService.createConversionPreview(
        amount,
        value,
        targetCurrencies
      );

      setConversions(conversionResults);
    } catch (error) {
      console.warn('Failed to load currency conversions:', error);
      setConversions({});
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    if (!disabled) {
      onChange?.(newCurrency);
    }
  };

  const formatCurrencyOption = (currency) => {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{currency.symbol}</span>
          <span className="text-sm text-gray-600">{currency.code}</span>
        </div>
        <span className="text-xs text-gray-500">{currency.name}</span>
      </div>
    );
  };

  const selectedCurrency = currencies.find(c => c.code === value);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Currency Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Currency
          {userCurrency && userCurrency !== value && (
            <button
              type="button"
              onClick={() => handleCurrencyChange(userCurrency)}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              (Use {userCurrency})
            </button>
          )}
        </label>

        <select
          value={value || ''}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Currency</option>
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Preview */}
      {showPreview && selectedCurrency && amount > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="text-lg font-semibold">
                {CurrencyService.formatAmount(amount, selectedCurrency.code)}
              </span>
            </div>
            {selectedCurrency.taxable && (
              <div className="mt-2 text-xs text-gray-500">
                *Taxes may apply based on location ({(selectedCurrency.taxRate * 100).toFixed(1)}% {selectedCurrency.region})
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Currency Conversions */}
      {showConversion && Object.keys(conversions).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Currency Conversions
              {loading && (
                <span className="ml-2 text-xs text-gray-500">Updating...</span>
              )}
            </h4>
            <div className="space-y-2">
              {Object.entries(conversions).map(([currency, conversion]) => {
                if (!conversion) return null;

                return (
                  <div
                    key={currency}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-600">{currency}:</span>
                    <span className="font-medium">{conversion.formatted}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Exchange rates are updated hourly and may vary at payment time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Currency Information */}
      {selectedCurrency && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Region: {selectedCurrency.region}</div>
          {selectedCurrency.taxable && (
            <div>Tax Rate: {(selectedCurrency.taxRate * 100).toFixed(1)}%</div>
          )}
          <div>Symbol Position: {selectedCurrency.symbolPosition}</div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
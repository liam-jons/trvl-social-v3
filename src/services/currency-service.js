/**
 * Currency Service for multi-currency support
 * Handles currency conversion, exchange rates, and international formatting
 */
// Configuration
const CURRENCY_CONFIG = {
  baseCurrency: 'USD',
  apiKey: import.meta.env.VITE_EXCHANGE_RATE_API_KEY,
  apiUrl: 'https://v6.exchangerate-api.com/v6',
  fallbackApiUrl: 'https://api.exchangerate.host',
  cacheTime: 3600000, // 1 hour in milliseconds
  retries: 3,
  timeout: 5000,
};
// Supported currencies with regional information
export const SUPPORTED_CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    region: 'US',
    decimals: 2,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.0825, // Average US sales tax
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    region: 'EU',
    decimals: 2,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.20, // Average EU VAT
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    region: 'UK',
    decimals: 2,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.20, // UK VAT
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    region: 'CA',
    decimals: 2,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.13, // Average Canadian tax
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    region: 'AU',
    decimals: 2,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.10, // Australian GST
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    region: 'JP',
    decimals: 0,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.08, // Japanese consumption tax
  },
  CHF: {
    code: 'CHF',
    symbol: 'Fr',
    name: 'Swiss Franc',
    region: 'CH',
    decimals: 2,
    symbolPosition: 'before',
    taxable: true,
    taxRate: 0.077, // Swiss VAT
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    region: 'SE',
    decimals: 2,
    symbolPosition: 'after',
    taxable: true,
    taxRate: 0.25, // Swedish VAT
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    region: 'DK',
    decimals: 2,
    symbolPosition: 'after',
    taxable: true,
    taxRate: 0.25, // Danish VAT
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    region: 'NO',
    decimals: 2,
    symbolPosition: 'after',
    taxable: true,
    taxRate: 0.25, // Norwegian VAT
  },
};
// Exchange rate cache
let exchangeRateCache = {
  data: {},
  timestamp: 0,
};
/**
 * Currency Service
 */
export class CurrencyService {
  /**
   * Get current exchange rates
   */
  static async getExchangeRates(baseCurrency = CURRENCY_CONFIG.baseCurrency) {
    const now = Date.now();
    // Check cache first
    if (exchangeRateCache.timestamp &&
        (now - exchangeRateCache.timestamp) < CURRENCY_CONFIG.cacheTime &&
        exchangeRateCache.data[baseCurrency]) {
      return exchangeRateCache.data[baseCurrency];
    }
    try {
      let rates;
      // Try primary API first
      if (CURRENCY_CONFIG.apiKey) {
        rates = await this.fetchFromExchangeRateAPI(baseCurrency);
      } else {
        // Fallback to free API
        rates = await this.fetchFromFallbackAPI(baseCurrency);
      }
      // Update cache
      if (!exchangeRateCache.data) {
        exchangeRateCache.data = {};
      }
      exchangeRateCache.data[baseCurrency] = rates;
      exchangeRateCache.timestamp = now;
      return rates;
    } catch (error) {
      // Return cached data if available
      if (exchangeRateCache.data[baseCurrency]) {
        return exchangeRateCache.data[baseCurrency];
      }
      // Return 1:1 rates as last resort
      return this.getDefaultRates();
    }
  }
  /**
   * Fetch rates from primary API (ExchangeRate-API)
   */
  static async fetchFromExchangeRateAPI(baseCurrency) {
    const response = await fetch(
      `${CURRENCY_CONFIG.apiUrl}/${CURRENCY_CONFIG.apiKey}/latest/${baseCurrency}`,
      { timeout: CURRENCY_CONFIG.timeout }
    );
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    const data = await response.json();
    return data.conversion_rates;
  }
  /**
   * Fetch rates from fallback API (free service)
   */
  static async fetchFromFallbackAPI(baseCurrency) {
    const response = await fetch(
      `${CURRENCY_CONFIG.fallbackApiUrl}/latest?base=${baseCurrency}`,
      { timeout: CURRENCY_CONFIG.timeout }
    );
    if (!response.ok) {
      throw new Error(`Fallback API error: ${response.status}`);
    }
    const data = await response.json();
    return data.rates;
  }
  /**
   * Get default 1:1 rates for supported currencies
   */
  static getDefaultRates() {
    const rates = {};
    Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
      rates[currency] = 1.0;
    });
    return rates;
  }
  /**
   * Convert amount between currencies
   */
  static async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    const rates = await this.getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not available for ${toCurrency}`);
    }
    return amount * rate;
  }
  /**
   * Format currency amount for display
   */
  static formatAmount(amount, currency, options = {}) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    const {
      showSymbol = true,
      showCode = false,
      locale = 'en-US',
      minimumFractionDigits = currencyInfo.decimals,
      maximumFractionDigits = currencyInfo.decimals,
    } = options;
    try {
      // Use Intl.NumberFormat for proper localization
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency,
        minimumFractionDigits,
        maximumFractionDigits,
      });
      let formatted = formatter.format(amount);
      // Add currency code if requested
      if (showCode && !showSymbol) {
        formatted += ` ${currency}`;
      }
      return formatted;
    } catch (error) {
      // Fallback to manual formatting
      const symbol = showSymbol ? currencyInfo.symbol : '';
      const decimals = currencyInfo.decimals;
      const fixed = amount.toFixed(decimals);
      if (currencyInfo.symbolPosition === 'before') {
        return `${symbol}${fixed}${showCode ? ` ${currency}` : ''}`;
      } else {
        return `${fixed} ${symbol}${showCode ? ` ${currency}` : ''}`;
      }
    }
  }
  /**
   * Calculate tax for currency/region
   */
  static calculateTax(amount, currency, customRate = null) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo || !currencyInfo.taxable) {
      return 0;
    }
    const rate = customRate !== null ? customRate : currencyInfo.taxRate;
    return amount * rate;
  }
  /**
   * Get tax rate for currency/region
   */
  static getTaxRate(currency) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    return currencyInfo?.taxRate || 0;
  }
  /**
   * Detect user's currency from location
   */
  static async detectUserCurrency() {
    try {
      // Try to get user's location
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 3000,
      });
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code;
        // Map country to currency
        const currencyMap = {
          US: 'USD',
          CA: 'CAD',
          GB: 'GBP',
          UK: 'GBP',
          AU: 'AUD',
          JP: 'JPY',
          CH: 'CHF',
          SE: 'SEK',
          DK: 'DKK',
          NO: 'NOK',
          // EU countries
          DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
          NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR',
          IE: 'EUR', PT: 'EUR', GR: 'EUR', LU: 'EUR',
          CY: 'EUR', MT: 'EUR', SI: 'EUR', SK: 'EUR',
          EE: 'EUR', LV: 'EUR', LT: 'EUR',
        };
        return currencyMap[countryCode] || 'USD';
      }
    } catch (error) {
    }
    // Fallback to browser locale
    try {
      const locale = navigator.language || navigator.languages[0];
      if (locale.includes('en-GB')) return 'GBP';
      if (locale.includes('en-CA')) return 'CAD';
      if (locale.includes('en-AU')) return 'AUD';
      if (locale.includes('de') || locale.includes('fr') || locale.includes('it') || locale.includes('es')) return 'EUR';
      if (locale.includes('ja')) return 'JPY';
      if (locale.includes('sv')) return 'SEK';
      if (locale.includes('da')) return 'DKK';
      if (locale.includes('nb') || locale.includes('nn')) return 'NOK';
    } catch (error) {
    }
    return 'USD'; // Default fallback
  }
  /**
   * Get all supported currencies
   */
  static getSupportedCurrencies() {
    return Object.values(SUPPORTED_CURRENCIES);
  }
  /**
   * Validate currency code
   */
  static isValidCurrency(currency) {
    return currency && SUPPORTED_CURRENCIES.hasOwnProperty(currency.toUpperCase());
  }
  /**
   * Convert Stripe amount (cents) to display amount
   */
  static stripeToDisplay(amountInCents, currency) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    if (currencyInfo.decimals === 0) {
      // For currencies like JPY that don't use decimal places
      return amountInCents;
    }
    return amountInCents / 100;
  }
  /**
   * Convert display amount to Stripe amount (cents)
   */
  static displayToStripe(amount, currency) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    if (currencyInfo.decimals === 0) {
      // For currencies like JPY that don't use decimal places
      return Math.round(amount);
    }
    return Math.round(amount * 100);
  }
  /**
   * Create currency conversion preview
   */
  static async createConversionPreview(amount, fromCurrency, targetCurrencies = ['USD', 'EUR', 'GBP']) {
    const conversions = {};
    for (const toCurrency of targetCurrencies) {
      if (toCurrency !== fromCurrency) {
        try {
          const convertedAmount = await this.convertCurrency(amount, fromCurrency, toCurrency);
          conversions[toCurrency] = {
            amount: convertedAmount,
            formatted: this.formatAmount(convertedAmount, toCurrency),
          };
        } catch (error) {
          conversions[toCurrency] = null;
        }
      }
    }
    return conversions;
  }
}
// Export default service instance
export default CurrencyService;
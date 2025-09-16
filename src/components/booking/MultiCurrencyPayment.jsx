import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import CurrencySelector from './CurrencySelector';
import InvoiceManagement from './InvoiceManagement';
import stripeService from '../../services/stripe-service';
import CurrencyService from '../../services/currency-service';
import InvoiceService from '../../services/invoice-service';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Receipt, FileText, Globe, Shield, Info } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const MultiCurrencyPayment = ({
  bookingId,
  vendorId,
  vendorAccountId,
  userId,
  baseAmount,
  baseCurrency = 'USD',
  description = '',
  customerInfo = {},
  vendorInfo = {},
  onPaymentSuccess,
  onPaymentError,
  className = '',
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);
  const [convertedAmount, setConvertedAmount] = useState(baseAmount);
  const [currencyPreview, setCurrencyPreview] = useState({});
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [invoiceTemplate, setInvoiceTemplate] = useState('standard');
  const [taxDetails, setTaxDetails] = useState(null);

  useEffect(() => {
    // Convert amount when currency changes
    if (selectedCurrency !== baseCurrency) {
      convertCurrency();
    } else {
      setConvertedAmount(baseAmount);
    }

    // Calculate tax details
    calculateTaxDetails();
  }, [selectedCurrency, baseAmount, baseCurrency]);

  const convertCurrency = async () => {
    try {
      setLoading(true);
      const converted = await CurrencyService.convertCurrency(
        baseAmount,
        baseCurrency,
        selectedCurrency
      );
      setConvertedAmount(converted);

      // Generate preview for other currencies
      const preview = await stripeService.payments.getPaymentCurrencyPreview(
        converted,
        selectedCurrency,
        ['USD', 'EUR', 'GBP'].filter(c => c !== selectedCurrency)
      );
      setCurrencyPreview(preview);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      setConvertedAmount(baseAmount);
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxDetails = () => {
    const taxRate = CurrencyService.getTaxRate(selectedCurrency);
    const taxAmount = CurrencyService.calculateTax(convertedAmount, selectedCurrency);
    const totalWithTax = convertedAmount + taxAmount;

    setTaxDetails({
      rate: taxRate,
      amount: taxAmount,
      total: totalWithTax,
      region: CurrencyService.getSupportedCurrencies()
        .find(c => c.code === selectedCurrency)?.region || 'Unknown',
    });
  };

  const createPaymentIntent = async () => {
    try {
      setLoading(true);

      const paymentData = {
        amount: convertedAmount,
        currency: selectedCurrency,
        vendorAccountId,
        bookingId,
        userId,
        vendorId,
        description,
        customerInfo,
        vendorInfo,
        autoInvoice,
        invoiceTemplate,
      };

      const result = await stripeService.payments.createMultiCurrencyPayment(paymentData);
      setPaymentIntent(result);

      return result;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      onPaymentError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Currency Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Payment Currency</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <CurrencySelector
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                amount={convertedAmount}
                showPreview={true}
                showConversion={true}
              />
            </div>

            {/* Payment Summary */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Amount ({baseCurrency}):</span>
                    <span>{CurrencyService.formatAmount(baseAmount, baseCurrency)}</span>
                  </div>
                  {selectedCurrency !== baseCurrency && (
                    <div className="flex justify-between">
                      <span>Converted Amount ({selectedCurrency}):</span>
                      <span className="font-medium">
                        {CurrencyService.formatAmount(convertedAmount, selectedCurrency)}
                      </span>
                    </div>
                  )}
                  {taxDetails && taxDetails.amount > 0 && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax ({(taxDetails.rate * 100).toFixed(1)}% {taxDetails.region}):</span>
                        <span>+{CurrencyService.formatAmount(taxDetails.amount, selectedCurrency)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Total with Tax:</span>
                        <span>{CurrencyService.formatAmount(taxDetails.total, selectedCurrency)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                    <span>Platform Fee (5%):</span>
                    <span>
                      {CurrencyService.formatAmount(
                        convertedAmount * 0.05,
                        selectedCurrency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Currency Preview */}
              {Object.keys(currencyPreview).length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-2">Other Currencies</h5>
                  <div className="space-y-1 text-xs">
                    {Object.entries(currencyPreview).map(([currency, data]) => (
                      data && (
                        <div key={currency} className="flex justify-between">
                          <span>{currency}:</span>
                          <span>{data.formatted}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Options */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Receipt className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Invoice Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoInvoice}
                  onChange={(e) => setAutoInvoice(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Auto-generate invoice</span>
              </label>

              {autoInvoice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Template
                  </label>
                  <select
                    value={invoiceTemplate}
                    onChange={(e) => setInvoiceTemplate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="branded">Branded</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowInvoices(!showInvoices)}
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Invoices</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Elements stripe={stripePromise}>
        <PaymentForm
          amount={taxDetails ? taxDetails.total : convertedAmount}
          currency={selectedCurrency}
          onCreatePaymentIntent={createPaymentIntent}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          paymentIntent={paymentIntent}
          loading={loading}
        />
      </Elements>

      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800 mb-1">Secure Payment</p>
              <p className="text-green-700">
                Your payment is processed securely through Stripe with bank-level encryption.
                Multi-currency conversion rates are updated hourly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Management */}
      {showInvoices && (
        <InvoiceManagement
          userId={userId}
          vendorId={vendorId}
          bookingId={bookingId}
        />
      )}
    </div>
  );
};

// Payment Form Component
const PaymentForm = ({
  amount,
  currency,
  onCreatePaymentIntent,
  onPaymentSuccess,
  onPaymentError,
  paymentIntent,
  loading,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      let clientSecret;

      if (paymentIntent) {
        clientSecret = paymentIntent.clientSecret;
      } else {
        const newPaymentIntent = await onCreatePaymentIntent();
        clientSecret = newPaymentIntent.clientSecret;
      }

      const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (error) {
        setErrorMessage(error.message);
        onPaymentError?.(error);
      } else {
        onPaymentSuccess?.(confirmedPayment);
      }
    } catch (error) {
      setErrorMessage(error.message);
      onPaymentError?.(error);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Payment Details</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-lg font-semibold">
                Total: {CurrencyService.formatAmount(amount, currency)}
              </p>
              <p className="text-xs text-gray-500">
                Processed securely by Stripe
              </p>
            </div>

            <Button
              type="submit"
              disabled={!stripe || processing || loading}
              className="min-w-[120px]"
            >
              {processing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Pay ${CurrencyService.formatAmount(amount, currency)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MultiCurrencyPayment;
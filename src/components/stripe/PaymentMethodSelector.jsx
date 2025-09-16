/**
 * PaymentMethodSelector Component
 * Displays and manages saved payment methods for customers
 */

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import {
  CreditCardIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PaymentMethodSelector = ({
  customerId,
  selectedMethodId,
  onMethodSelect,
  onMethodDelete,
  onAddNewMethod,
  loading = false,
  showAddButton = true,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [deletingMethod, setDeletingMethod] = useState(null);
  const [error, setError] = useState(null);

  // Fetch customer's saved payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!customerId) {
        setLoadingMethods(false);
        return;
      }

      try {
        setLoadingMethods(true);
        setError(null);

        // Call API to fetch payment methods
        const response = await fetch(`/api/stripe/payment-methods?customer=${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
        }

        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setError('Failed to load payment methods');
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchPaymentMethods();
  }, [customerId]);

  const handleMethodSelect = (methodId) => {
    onMethodSelect?.(methodId);
  };

  const handleMethodDelete = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setDeletingMethod(methodId);

      const response = await fetch(`/api/stripe/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      // Remove from local state
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));

      // If deleted method was selected, clear selection
      if (selectedMethodId === methodId) {
        onMethodSelect?.(null);
      }

      onMethodDelete?.(methodId);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    } finally {
      setDeletingMethod(null);
    }
  };

  const getCardIcon = (brand) => {
    const iconClasses = "h-8 w-12 text-gray-400";

    switch (brand?.toLowerCase()) {
      case 'visa':
        return <div className={`${iconClasses} bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold`}>VISA</div>;
      case 'mastercard':
        return <div className={`${iconClasses} bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold`}>MC</div>;
      case 'american_express':
      case 'amex':
        return <div className={`${iconClasses} bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold`}>AMEX</div>;
      case 'discover':
        return <div className={`${iconClasses} bg-orange-600 rounded flex items-center justify-center text-white text-xs font-bold`}>DISC</div>;
      default:
        return <CreditCardIcon className={iconClasses} />;
    }
  };

  const formatExpiryDate = (month, year) => {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  };

  if (loadingMethods) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <GlassButton
            onClick={() => window.location.reload()}
            className="text-sm"
          >
            Try Again
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">
          Saved Payment Methods
        </h3>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No saved payment methods</p>
            {showAddButton && (
              <GlassButton onClick={() => onAddNewMethod?.()}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Payment Method
              </GlassButton>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all
                    ${selectedMethodId === method.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }
                  `}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Card Icon */}
                      <div className="flex-shrink-0">
                        {getCardIcon(method.card?.brand)}
                      </div>

                      {/* Card Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            •••• •••• •••• {method.card?.last4}
                          </span>
                          <span className="text-sm text-gray-400 capitalize">
                            {method.card?.brand}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Expires {formatExpiryDate(method.card?.exp_month, method.card?.exp_year)}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      {selectedMethodId === method.id && (
                        <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMethodDelete(method.id);
                        }}
                        disabled={deletingMethod === method.id}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete payment method"
                      >
                        {deletingMethod === method.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showAddButton && (
              <div className="pt-4 border-t border-gray-600">
                <GlassButton
                  onClick={() => onAddNewMethod?.()}
                  variant="outline"
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Payment Method
                </GlassButton>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default PaymentMethodSelector;
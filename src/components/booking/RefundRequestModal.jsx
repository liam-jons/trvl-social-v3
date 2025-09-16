/**
 * RefundRequestModal - User interface for submitting refund requests
 * Provides guided workflow for users to request refunds with proper validation
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { manualRefundManager, getRefundConfig } from '../../services/payment-refund-service.js';

const RefundRequestModal = ({
  isOpen,
  onClose,
  bookingId,
  splitPaymentId,
  userId,
  onRefundRequested
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: reason, 2: confirmation, 3: success
  const [refundData, setRefundData] = useState({
    reason: '',
    reasonCategory: '',
    description: '',
    requestedAmount: 'full',
    customAmount: '',
    evidence: [],
  });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [refundOptions, setRefundOptions] = useState(null);
  const [error, setError] = useState('');

  const refundReasons = [
    {
      category: 'booking_cancelled',
      label: 'Booking Cancelled by Vendor',
      description: 'The vendor cancelled your booking'
    },
    {
      category: 'quality_issues',
      label: 'Service Quality Issues',
      description: 'The service did not meet expectations'
    },
    {
      category: 'emergency',
      label: 'Personal Emergency',
      description: 'Unable to attend due to emergency'
    },
    {
      category: 'weather',
      label: 'Weather/External Factors',
      description: 'Booking affected by weather or external circumstances'
    },
    {
      category: 'duplicate_payment',
      label: 'Duplicate Payment',
      description: 'I was charged multiple times'
    },
    {
      category: 'other',
      label: 'Other',
      description: 'Other reason not listed above'
    },
  ];

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);

      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (title, vendor_id),
          split_payments (*)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBookingDetails(booking);

      // Get refund options if split payment exists
      if (splitPaymentId) {
        const options = await manualRefundManager.getRefundOptions(splitPaymentId, userId);
        setRefundOptions(options);
      }

    } catch (error) {
      setError(`Failed to load booking details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReasonChange = (category) => {
    setRefundData(prev => ({
      ...prev,
      reasonCategory: category,
      reason: refundReasons.find(r => r.category === category)?.label || ''
    }));
  };

  const handleAmountChange = (type, value) => {
    setRefundData(prev => ({
      ...prev,
      requestedAmount: type,
      customAmount: type === 'custom' ? value : ''
    }));
  };

  const submitRefundRequest = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate form
      if (!refundData.reasonCategory) {
        throw new Error('Please select a reason for the refund');
      }

      if (refundData.reasonCategory === 'other' && !refundData.description) {
        throw new Error('Please provide a description for other reasons');
      }

      if (refundData.requestedAmount === 'custom' && !refundData.customAmount) {
        throw new Error('Please specify the custom refund amount');
      }

      // Create refund request record
      const { data: request, error: requestError } = await supabase
        .from('refund_requests')
        .insert({
          booking_id: bookingId,
          split_payment_id: splitPaymentId,
          user_id: userId,
          reason_category: refundData.reasonCategory,
          reason_description: refundData.reason,
          additional_details: refundData.description,
          requested_amount_type: refundData.requestedAmount,
          custom_amount: refundData.customAmount ? parseInt(refundData.customAmount * 100) : null,
          status: 'pending_review',
          created_at: new Date().toISOString(),
          metadata: {
            booking_title: bookingDetails?.adventures?.title,
            user_submitted: true,
          },
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Notify vendor about refund request
      await supabase
        .from('notifications')
        .insert({
          user_id: bookingDetails.adventures.vendor_id,
          type: 'refund_request',
          title: 'Refund Request Received',
          message: `A customer has requested a refund for booking ${bookingId}`,
          data: {
            booking_id: bookingId,
            refund_request_id: request.id,
            reason: refundData.reasonCategory,
          },
          created_at: new Date().toISOString(),
        });

      setStep(3);
      if (onRefundRequested) {
        onRefundRequested(request);
      }

    } catch (error) {
      setError(`Failed to submit refund request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Why are you requesting a refund?
        </h3>
        <div className="space-y-3">
          {refundReasons.map((reason) => (
            <label key={reason.category} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="refundReason"
                value={reason.category}
                checked={refundData.reasonCategory === reason.category}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {reason.label}
                </div>
                <div className="text-sm text-gray-500">
                  {reason.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {refundData.reasonCategory === 'other' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please explain your reason
          </label>
          <textarea
            value={refundData.description}
            onChange={(e) => setRefundData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide details about your refund request..."
          />
        </div>
      )}

      {refundOptions && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Refund Amount
          </h4>
          <div className="space-y-2">
            {refundOptions.refundOptions.map((option) => (
              <label key={option.type} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="refundAmount"
                  value={option.type}
                  checked={refundData.requestedAmount === option.type}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    ${(option.amount / 100).toFixed(2)} - {option.description}
                  </div>
                </div>
              </label>
            ))}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="refundAmount"
                value="custom"
                checked={refundData.requestedAmount === 'custom'}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1 flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Custom amount:</span>
                <input
                  type="number"
                  value={refundData.customAmount}
                  onChange={(e) => handleAmountChange('custom', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={refundData.requestedAmount !== 'custom'}
                />
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirm Refund Request
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Booking:</span>
            <span className="ml-2 text-sm text-gray-900">
              {bookingDetails?.adventures?.title}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Reason:</span>
            <span className="ml-2 text-sm text-gray-900">
              {refundData.reason}
            </span>
          </div>
          {refundData.description && (
            <div>
              <span className="text-sm font-medium text-gray-700">Details:</span>
              <span className="ml-2 text-sm text-gray-900">
                {refundData.description}
              </span>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-700">Requested Amount:</span>
            <span className="ml-2 text-sm text-gray-900">
              {refundData.requestedAmount === 'custom'
                ? `$${refundData.customAmount}`
                : refundOptions?.refundOptions.find(o => o.type === refundData.requestedAmount)?.description
              }
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Refund Request Process
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your refund request will be reviewed by the vendor. You'll receive updates via email and notifications.
                If approved, refunds typically take 5-10 business days to appear in your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Refund Request Submitted
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your refund request has been submitted successfully. The vendor will review your request and respond within 48 hours.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-700">
          <p><strong>What happens next?</strong></p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Vendor reviews your request</li>
            <li>• You'll receive an email update</li>
            <li>• If approved, refund processes automatically</li>
            <li>• Funds return to your original payment method</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Request Refund
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {step < 3 && (
            <div className="mt-2">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {!loading && (
            <>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </>
          )}
        </div>

        {!loading && step < 3 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  disabled={!refundData.reasonCategory}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={submitRefundRequest}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundRequestModal;
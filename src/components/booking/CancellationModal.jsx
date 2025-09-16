/**
 * CancellationModal - Interface for booking cancellation with policy enforcement
 * Provides guided workflow for full and partial cancellations
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { cancellationPolicyEngine } from '../../services/booking-modification-service.js';
const CancellationModal = ({
  isOpen,
  onClose,
  bookingId,
  userId,
  onCancellationRequested
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: policy, 3: confirmation, 4: success
  const [cancellationData, setCancellationData] = useState({
    type: 'full', // 'full' or 'partial'
    reason: '',
    specialCircumstances: '',
    evidence: {},
    participantsToCancel: [],
  });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [policyEvaluation, setPolicyEvaluation] = useState(null);
  const [error, setError] = useState('');
  const cancellationReasons = [
    {
      id: 'personal_emergency',
      label: 'Personal Emergency',
      description: 'Medical emergency or family situation',
      requiresEvidence: true,
    },
    {
      id: 'travel_restrictions',
      label: 'Travel Restrictions',
      description: 'Government restrictions or border closures',
      requiresEvidence: false,
    },
    {
      id: 'weather_conditions',
      label: 'Weather Conditions',
      description: 'Severe weather affecting travel',
      requiresEvidence: false,
    },
    {
      id: 'work_conflict',
      label: 'Work Conflict',
      description: 'Unexpected work obligations',
      requiresEvidence: false,
    },
    {
      id: 'financial_hardship',
      label: 'Financial Hardship',
      description: 'Unable to afford the trip',
      requiresEvidence: false,
    },
    {
      id: 'quality_concerns',
      label: 'Quality Concerns',
      description: 'Concerns about service quality',
      requiresEvidence: true,
    },
    {
      id: 'change_of_mind',
      label: 'Change of Mind',
      description: 'No longer wish to take the trip',
      requiresEvidence: false,
    },
    {
      id: 'other',
      label: 'Other',
      description: 'Other reason not listed',
      requiresEvidence: false,
    },
  ];
  const specialCircumstances = [
    { id: 'emergency', label: 'Medical Emergency', requiresEvidence: true },
    { id: 'weather', label: 'Weather/Natural Disaster', requiresEvidence: false },
    { id: 'vendor_cancellation', label: 'Vendor Cancelled', requiresEvidence: false },
    { id: 'quality_issues', label: 'Service Quality Issues', requiresEvidence: true },
  ];
  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);
  useEffect(() => {
    if (bookingDetails && cancellationData.type) {
      evaluatePolicy();
    }
  }, [bookingDetails, cancellationData.type, cancellationData.specialCircumstances]);
  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (
            id,
            title,
            start_date,
            end_date,
            vendor_id,
            vendors (name, cancellation_policy)
          ),
          split_payments (
            id,
            participant_count,
            total_amount,
            organizer_id,
            individual_payments (
              id,
              user_id,
              amount_due,
              amount_paid,
              status,
              metadata
            )
          )
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      setBookingDetails(booking);
      // Initialize participants for partial cancellation
      if (booking.split_payments?.[0]?.individual_payments) {
        const participants = booking.split_payments[0].individual_payments.map(ip => ({
          userId: ip.user_id,
          name: ip.metadata?.participantName || `Participant ${ip.user_id}`,
          amount: ip.amount_paid || ip.amount_due,
          status: ip.status,
          selected: false,
        }));
        setCancellationData(prev => ({ ...prev, participantsToCancel: participants }));
      }
    } catch (error) {
      setError(`Failed to load booking details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const evaluatePolicy = async () => {
    try {
      if (!bookingDetails) return;
      const evaluation = await cancellationPolicyEngine.evaluateCancellationPolicy(
        bookingId,
        cancellationData.type
      );
      setPolicyEvaluation(evaluation);
    } catch (error) {
      console.error('Failed to evaluate policy:', error);
    }
  };
  const handleParticipantToggle = (participantIndex) => {
    setCancellationData(prev => ({
      ...prev,
      participantsToCancel: prev.participantsToCancel.map((p, index) =>
        index === participantIndex ? { ...p, selected: !p.selected } : p
      ),
    }));
  };
  const submitCancellation = async () => {
    try {
      setLoading(true);
      setError('');
      // Validate form
      if (!cancellationData.reason) {
        throw new Error('Please select a reason for cancellation');
      }
      if (cancellationData.type === 'partial') {
        const selectedParticipants = cancellationData.participantsToCancel.filter(p => p.selected);
        if (selectedParticipants.length === 0) {
          throw new Error('Please select participants to cancel');
        }
      }
      let result;
      if (cancellationData.type === 'partial') {
        // Process partial cancellation
        const selectedParticipants = cancellationData.participantsToCancel.filter(p => p.selected);
        result = await cancellationPolicyEngine.processPartialCancellation({
          bookingId,
          userId,
          participantsToCancel: selectedParticipants,
          reason: cancellationData.reason,
        });
      } else {
        // Process full cancellation
        result = await cancellationPolicyEngine.processCancellation({
          bookingId,
          userId,
          cancellationType: cancellationData.type,
          reason: cancellationData.reason,
          specialCircumstances: cancellationData.specialCircumstances,
          evidence: cancellationData.evidence,
        });
      }
      setStep(4);
      if (onCancellationRequested) {
        onCancellationRequested(result);
      }
    } catch (error) {
      setError(`Failed to process cancellation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Cancellation Type
        </h3>
        <div className="space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="cancellationType"
              value="full"
              checked={cancellationData.type === 'full'}
              onChange={(e) => setCancellationData(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Full Cancellation
              </div>
              <div className="text-sm text-gray-500">
                Cancel the entire booking for all participants
              </div>
            </div>
          </label>
          {bookingDetails?.split_payments?.[0] && (
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="cancellationType"
                value="partial"
                checked={cancellationData.type === 'partial'}
                onChange={(e) => setCancellationData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Partial Cancellation
                </div>
                <div className="text-sm text-gray-500">
                  Cancel specific participants from a group booking
                </div>
              </div>
            </label>
          )}
        </div>
      </div>
      {cancellationData.type === 'partial' && bookingDetails?.split_payments?.[0] && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Select Participants to Cancel
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {cancellationData.participantsToCancel.map((participant, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={participant.selected}
                  onChange={() => handleParticipantToggle(index)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {participant.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Amount: ${(participant.amount / 100).toFixed(2)} - Status: {participant.status}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Reason for Cancellation
        </h4>
        <div className="space-y-2">
          {cancellationReasons.map((reason) => (
            <label key={reason.id} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="cancellationReason"
                value={reason.id}
                checked={cancellationData.reason === reason.id}
                onChange={(e) => setCancellationData(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {reason.label}
                  {reason.requiresEvidence && (
                    <span className="ml-1 text-xs text-red-500">*</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {reason.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      {['personal_emergency', 'quality_concerns'].includes(cancellationData.reason) && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Special Circumstances
          </h4>
          <div className="space-y-2">
            {specialCircumstances.map((circumstance) => (
              <label key={circumstance.id} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="specialCircumstances"
                  value={circumstance.id}
                  checked={cancellationData.specialCircumstances === circumstance.id}
                  onChange={(e) => setCancellationData(prev => ({ ...prev, specialCircumstances: e.target.value }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {circumstance.label}
                    {circumstance.requiresEvidence && (
                      <span className="ml-1 text-xs text-red-500">*</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
      {bookingDetails && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Trip:</strong> {bookingDetails.adventures.title}</p>
            <p><strong>Dates:</strong> {new Date(bookingDetails.adventures.start_date).toLocaleDateString()} - {new Date(bookingDetails.adventures.end_date).toLocaleDateString()}</p>
            <p><strong>Vendor:</strong> {bookingDetails.adventures.vendors?.name}</p>
            {bookingDetails.split_payments?.[0] && (
              <>
                <p><strong>Total Participants:</strong> {bookingDetails.split_payments[0].participant_count}</p>
                <p><strong>Total Amount:</strong> ${(bookingDetails.split_payments[0].total_amount / 100).toFixed(2)}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Cancellation Policy & Refund Information
        </h3>
        {policyEvaluation && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Trip Details
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Time until trip:</strong> {Math.floor(policyEvaluation.hoursUntilStart)} hours</p>
                <p><strong>Total amount paid:</strong> ${(policyEvaluation.booking.totalAmount / 100).toFixed(2)}</p>
              </div>
            </div>
            <div className={`rounded-lg p-4 ${
              policyEvaluation.eligibility.eligible
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {policyEvaluation.eligibility.eligible ? (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    policyEvaluation.eligibility.eligible ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {policyEvaluation.eligibility.eligible ? 'Refund Available' : 'No Refund Available'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    policyEvaluation.eligibility.eligible ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>{policyEvaluation.eligibility.reason}</p>
                    {policyEvaluation.eligibility.eligible && (
                      <div className="mt-2">
                        <p><strong>Refund Type:</strong> {policyEvaluation.eligibility.refundType}</p>
                        <p><strong>Refund Percentage:</strong> {policyEvaluation.eligibility.refundPercentage}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {policyEvaluation.eligibility.eligible && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Refund Breakdown
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {policyEvaluation.refundCalculation.breakdown && (
                    <>
                      <div className="flex justify-between">
                        <span>Original Amount:</span>
                        <span>${(policyEvaluation.refundCalculation.breakdown.originalAmount / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refund ({policyEvaluation.eligibility.refundPercentage}%):</span>
                        <span>${(policyEvaluation.refundCalculation.breakdown.baseRefund / 100).toFixed(2)}</span>
                      </div>
                      {policyEvaluation.refundCalculation.breakdown.fees > 0 && (
                        <div className="flex justify-between">
                          <span>Less: Processing Fees:</span>
                          <span>-${(policyEvaluation.refundCalculation.breakdown.fees / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-300 pt-1 font-medium">
                        <div className="flex justify-between">
                          <span>Net Refund:</span>
                          <span>${(policyEvaluation.refundCalculation.netRefund / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Information
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="space-y-1">
                      <li>• Cancellations are final and cannot be undone</li>
                      <li>• Refunds take 5-10 business days to process</li>
                      <li>• Some vendor policies may apply additional restrictions</li>
                      {cancellationData.type === 'partial' && (
                        <li>• Partial cancellations may affect group pricing</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirm Cancellation
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Booking:</span>
            <span className="ml-2 text-sm text-gray-900">
              {bookingDetails?.adventures?.title}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Cancellation Type:</span>
            <span className="ml-2 text-sm text-gray-900">
              {cancellationData.type === 'full' ? 'Full Cancellation' : 'Partial Cancellation'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Reason:</span>
            <span className="ml-2 text-sm text-gray-900">
              {cancellationReasons.find(r => r.id === cancellationData.reason)?.label}
            </span>
          </div>
          {cancellationData.type === 'partial' && (
            <div>
              <span className="text-sm font-medium text-gray-700">Participants to Cancel:</span>
              <span className="ml-2 text-sm text-gray-900">
                {cancellationData.participantsToCancel.filter(p => p.selected).length} participant(s)
              </span>
            </div>
          )}
          {policyEvaluation?.eligibility.eligible && (
            <div>
              <span className="text-sm font-medium text-gray-700">Expected Refund:</span>
              <span className="ml-2 text-sm text-gray-900">
                ${(policyEvaluation.refundCalculation.netRefund / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Final Warning
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                This action cannot be undone. Once you confirm, your booking will be cancelled immediately.
                Please ensure you want to proceed with this cancellation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Cancellation Processed
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your booking has been successfully cancelled. You'll receive a confirmation email shortly.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-700">
          <p><strong>What happens next?</strong></p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Confirmation email will be sent</li>
            <li>• Vendor will be notified</li>
            <li>• Refunds will be processed if applicable</li>
            <li>• You can track refund status in your bookings</li>
          </ul>
        </div>
      </div>
    </div>
  );
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Cancel Booking
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
          {step < 4 && (
            <div className="mt-2">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-0.5 w-8 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
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
              {step === 4 && renderStep4()}
            </>
          )}
        </div>
        {!loading && step < 4 && (
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
                  disabled={!cancellationData.reason || (cancellationData.type === 'partial' && cancellationData.participantsToCancel.filter(p => p.selected).length === 0)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={submitCancellation}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancellation
                </button>
              )}
            </div>
          </div>
        )}
        {step === 4 && (
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
export default CancellationModal;
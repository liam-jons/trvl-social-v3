/**
 * ModificationRequestModal - Interface for submitting booking modification requests
 * Provides guided workflow for users to request booking modifications
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  bookingModificationManager,
  getModificationConfig
} from '../../services/booking-modification-service.js';

const ModificationRequestModal = ({
  isOpen,
  onClose,
  bookingId,
  userId,
  onModificationRequested
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: details, 3: confirmation, 4: success
  const [modificationData, setModificationData] = useState({
    type: '',
    changes: {},
    reason: '',
    urgency: 'normal',
  });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [estimatedFees, setEstimatedFees] = useState(null);
  const [error, setError] = useState('');

  const modificationTypes = [
    {
      id: 'date_change',
      label: 'Change Dates',
      description: 'Modify trip start and/or end dates',
      icon: '📅',
      fields: ['newStartDate', 'newEndDate'],
    },
    {
      id: 'participant_update',
      label: 'Update Participants',
      description: 'Add or remove participants from the booking',
      icon: '👥',
      fields: ['participantCount', 'participantDetails'],
    },
    {
      id: 'itinerary_adjustment',
      label: 'Adjust Itinerary',
      description: 'Modify activities or schedule',
      icon: '🗺️',
      fields: ['itinerary'],
    },
    {
      id: 'accommodation_change',
      label: 'Change Accommodation',
      description: 'Update hotel or lodging preferences',
      icon: '🏨',
      fields: ['accommodation'],
    },
    {
      id: 'meal_preference',
      label: 'Meal Preferences',
      description: 'Update dietary requirements or meal options',
      icon: '🍽️',
      fields: ['meals'],
    },
    {
      id: 'special_requests',
      label: 'Special Requests',
      description: 'Add special accommodations or requests',
      icon: '⭐',
      fields: ['specialRequests'],
    },
  ];

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (modificationData.type && modificationData.changes) {
      calculateEstimatedFees();
    }
  }, [modificationData.type, modificationData.changes]);

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
            vendors (name)
          ),
          split_payments (
            id,
            participant_count,
            total_amount
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBookingDetails(booking);

    } catch (error) {
      setError(`Failed to load booking details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedFees = async () => {
    try {
      if (!bookingDetails || !modificationData.type) return;

      const fees = await bookingModificationManager.calculateModificationFees(
        bookingDetails,
        modificationData.type,
        modificationData.changes
      );

      setEstimatedFees(fees);
    } catch (error) {
      console.error('Failed to calculate fees:', error);
    }
  };

  const handleTypeSelection = (type) => {
    setModificationData(prev => ({
      ...prev,
      type,
      changes: {},
    }));
    setStep(2);
  };

  const handleChangeUpdate = (field, value) => {
    setModificationData(prev => ({
      ...prev,
      changes: {
        ...prev.changes,
        [field]: value,
      },
    }));
  };

  const submitModificationRequest = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate form
      if (!modificationData.type) {
        throw new Error('Please select a modification type');
      }

      if (!modificationData.reason) {
        throw new Error('Please provide a reason for the modification');
      }

      // Submit modification request
      const result = await bookingModificationManager.createModificationRequest({
        bookingId,
        userId,
        modificationType: modificationData.type,
        requestedChanges: modificationData.changes,
        reason: modificationData.reason,
        urgency: modificationData.urgency,
      });

      setStep(4);
      if (onModificationRequested) {
        onModificationRequested(result);
      }

    } catch (error) {
      setError(`Failed to submit modification request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          What would you like to modify?
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modificationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelection(type.id)}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                  {type.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {type.label}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {bookingDetails && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Booking</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Trip:</strong> {bookingDetails.adventures.title}</p>
            <p><strong>Dates:</strong> {new Date(bookingDetails.adventures.start_date).toLocaleDateString()} - {new Date(bookingDetails.adventures.end_date).toLocaleDateString()}</p>
            <p><strong>Vendor:</strong> {bookingDetails.adventures.vendors?.name}</p>
            {bookingDetails.split_payments?.[0] && (
              <p><strong>Participants:</strong> {bookingDetails.split_payments[0].participant_count}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    const selectedType = modificationTypes.find(t => t.id === modificationData.type);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{selectedType?.icon}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {selectedType?.label}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedType?.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {renderModificationFields()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for modification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={modificationData.reason}
              onChange={(e) => setModificationData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please explain why you need this modification..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency
            </label>
            <select
              value={modificationData.urgency}
              onChange={(e) => setModificationData(prev => ({ ...prev, urgency: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Emergency requests are processed faster but may incur additional fees
            </p>
          </div>
        </div>

        {estimatedFees && estimatedFees.total > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Modification Fees Apply
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="mb-2">This modification will incur the following fees:</p>
                  <ul className="space-y-1">
                    {estimatedFees.breakdown.map((fee, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{fee.type}:</span>
                        <span>${(fee.amount / 100).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-yellow-300 mt-2 pt-2 font-medium">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>${(estimatedFees.total / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModificationFields = () => {
    switch (modificationData.type) {
      case 'date_change':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Start Date
              </label>
              <input
                type="date"
                value={modificationData.changes.newStartDate || ''}
                onChange={(e) => handleChangeUpdate('newStartDate', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New End Date
              </label>
              <input
                type="date"
                value={modificationData.changes.newEndDate || ''}
                onChange={(e) => handleChangeUpdate('newEndDate', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case 'participant_update':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Participant Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={modificationData.changes.participantCount || bookingDetails?.split_payments?.[0]?.participant_count || 1}
                onChange={(e) => handleChangeUpdate('participantCount', parseInt(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participant Details
              </label>
              <textarea
                value={modificationData.changes.participantDetails || ''}
                onChange={(e) => handleChangeUpdate('participantDetails', e.target.value)}
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide details about new or removed participants..."
              />
            </div>
          </div>
        );

      case 'itinerary_adjustment':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Itinerary Changes
            </label>
            <textarea
              value={modificationData.changes.itinerary || ''}
              onChange={(e) => handleChangeUpdate('itinerary', e.target.value)}
              rows={4}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the changes you'd like to make to the itinerary..."
            />
          </div>
        );

      case 'accommodation_change':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accommodation Preferences
            </label>
            <textarea
              value={modificationData.changes.accommodation || ''}
              onChange={(e) => handleChangeUpdate('accommodation', e.target.value)}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your accommodation requirements..."
            />
          </div>
        );

      case 'meal_preference':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Preferences & Dietary Requirements
            </label>
            <textarea
              value={modificationData.changes.meals || ''}
              onChange={(e) => handleChangeUpdate('meals', e.target.value)}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your dietary requirements or meal preferences..."
            />
          </div>
        );

      case 'special_requests':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={modificationData.changes.specialRequests || ''}
              onChange={(e) => handleChangeUpdate('specialRequests', e.target.value)}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe any special accommodations or requests..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirm Modification Request
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Booking:</span>
            <span className="ml-2 text-sm text-gray-900">
              {bookingDetails?.adventures?.title}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Modification Type:</span>
            <span className="ml-2 text-sm text-gray-900">
              {modificationTypes.find(t => t.id === modificationData.type)?.label}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Reason:</span>
            <span className="ml-2 text-sm text-gray-900">
              {modificationData.reason}
            </span>
          </div>
          {estimatedFees && estimatedFees.total > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Estimated Fees:</span>
              <span className="ml-2 text-sm text-gray-900">
                ${(estimatedFees.total / 100).toFixed(2)}
              </span>
            </div>
          )}
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
              Modification Process
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your modification request will be reviewed. You'll receive updates via email and notifications.
                Some modifications may be approved automatically based on vendor policies.
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
          Modification Request Submitted
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your modification request has been submitted successfully. You'll receive updates as it's reviewed.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-700">
          <p><strong>What happens next?</strong></p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Vendor reviews your request</li>
            <li>• You'll receive an email update</li>
            <li>• If approved, changes apply automatically</li>
            <li>• Any fees will be charged separately</li>
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
              Modify Booking
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
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!modificationData.reason || Object.keys(modificationData.changes).length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={submitModificationRequest}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
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

export default ModificationRequestModal;
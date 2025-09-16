/**
 * Split Payment Form Component
 * Allows group organizers to set up payment splitting for bookings
 */

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import GlassInput from '../ui/GlassInput.jsx';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { groupPaymentManager, paymentSplitting } from '../../services/split-payment-service.js';
import { paymentCollectionWorkflow } from '../../services/payment-collection-service.js';

const SplitPaymentForm = ({
  booking,
  vendorAccountId,
  onSuccess,
  onError,
  onCancel,
  isOrganizer = true,
}) => {
  // State management
  const [participants, setParticipants] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState([]);
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});
  const [splitPreview, setSplitPreview] = useState(null);

  // Initialize default deadline (48 hours from now)
  useEffect(() => {
    const defaultDeadline = new Date();
    defaultDeadline.setHours(defaultDeadline.getHours() + 48);
    setPaymentDeadline(defaultDeadline.toISOString().slice(0, 16));
  }, []);

  // Calculate split preview whenever inputs change
  useEffect(() => {
    if (participants.length > 0 && booking?.total_amount) {
      try {
        let preview;
        if (splitType === 'equal') {
          preview = paymentSplitting.calculateEqualSplit(
            booking.total_amount,
            participants.length,
            !isOrganizer
          );
        } else if (splitType === 'custom' && customSplits.length === participants.length) {
          preview = paymentSplitting.calculateCustomSplit(
            booking.total_amount,
            customSplits
          );
        }

        if (preview) {
          // Calculate with fees
          const feePreview = paymentSplitting.calculateSplitWithFees(
            preview.splits[0],
            participants.length
          );

          setSplitPreview({ ...preview, fees: feePreview });
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, split: error.message }));
      }
    }
  }, [participants, splitType, customSplits, booking?.total_amount, isOrganizer]);

  const addParticipant = () => {
    const newParticipant = {
      id: Date.now(),
      name: '',
      email: '',
      userId: null,
    };
    setParticipants(prev => [...prev, newParticipant]);

    if (splitType === 'custom') {
      setCustomSplits(prev => [...prev, 0]);
    }
  };

  const removeParticipant = (index) => {
    setParticipants(prev => prev.filter((_, i) => i !== index));

    if (splitType === 'custom') {
      setCustomSplits(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    setParticipants(prev => prev.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const updateCustomSplit = (index, amount) => {
    const amountInCents = Math.round(parseFloat(amount || 0) * 100);
    setCustomSplits(prev => prev.map((split, i) =>
      i === index ? amountInCents : split
    ));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate participants
    if (participants.length === 0) {
      newErrors.participants = 'At least one participant is required';
    }

    participants.forEach((participant, index) => {
      if (!participant.name.trim()) {
        newErrors[`participant_${index}_name`] = 'Name is required';
      }
      if (!participant.email.trim() || !/\S+@\S+\.\S+/.test(participant.email)) {
        newErrors[`participant_${index}_email`] = 'Valid email is required';
      }
    });

    // Validate payment deadline
    const deadlineDate = new Date(paymentDeadline);
    const now = new Date();
    const minDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    if (deadlineDate <= now) {
      newErrors.deadline = 'Payment deadline must be in the future';
    } else if (deadlineDate < minDeadline) {
      newErrors.deadline = 'Payment deadline must be at least 24 hours from now';
    }

    // Validate custom splits
    if (splitType === 'custom') {
      const totalCustom = customSplits.reduce((sum, amount) => sum + amount, 0);
      if (totalCustom !== booking.total_amount) {
        newErrors.customSplits = `Custom amounts must total $${(booking.total_amount / 100).toFixed(2)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    setErrors({});

    try {
      // Create the split payment
      const result = await groupPaymentManager.createSplitPayment({
        bookingId: booking.id,
        organizerId: booking.user_id,
        totalAmount: booking.total_amount,
        currency: booking.currency || 'usd',
        participants: participants.map(p => ({
          userId: p.userId,
          name: p.name,
          email: p.email,
        })),
        splitType,
        customSplits: splitType === 'custom' ? customSplits : null,
        paymentDeadline,
        vendorAccountId,
        description: booking.title || `Booking #${booking.id}`,
        metadata: {
          bookingTitle: booking.title,
          organizerName: booking.organizer_name,
          createdFrom: 'split_payment_form',
        },
      });

      // Initialize payment collection workflow
      await paymentCollectionWorkflow.initializeCollection(result.splitPaymentId);

      onSuccess?.({
        splitPaymentId: result.splitPaymentId,
        participantsCount: participants.length,
        totalAmount: booking.total_amount,
      });

    } catch (error) {
      setErrors({ submit: error.message });
      onError?.(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const formatAmount = (amountInCents) => {
    return `$${(amountInCents / 100).toFixed(2)}`;
  };

  return (
    <GlassCard className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <UserGroupIcon className="h-6 w-6 mr-2" />
          Set Up Split Payment
        </h2>
        <p className="text-gray-300">
          Collect payments from multiple participants for this booking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Booking Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Title:</span>
              <span className="text-white ml-2">{booking.title}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Amount:</span>
              <span className="text-white ml-2 font-semibold">
                {formatAmount(booking.total_amount)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Booking Date:</span>
              <span className="text-white ml-2">
                {new Date(booking.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Split Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Payment Split Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="relative">
              <input
                type="radio"
                name="splitType"
                value="equal"
                checked={splitType === 'equal'}
                onChange={(e) => setSplitType(e.target.value)}
                className="sr-only"
              />
              <div className={`
                cursor-pointer rounded-lg border-2 p-4 transition-colors
                ${splitType === 'equal'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 hover:border-white/20'
                }
              `}>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-5 w-5 mr-2 ${
                    splitType === 'equal' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-white">Equal Split</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Split the total amount equally among all participants
                </p>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                name="splitType"
                value="custom"
                checked={splitType === 'custom'}
                onChange={(e) => setSplitType(e.target.value)}
                className="sr-only"
              />
              <div className={`
                cursor-pointer rounded-lg border-2 p-4 transition-colors
                ${splitType === 'custom'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 hover:border-white/20'
                }
              `}>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-5 w-5 mr-2 ${
                    splitType === 'custom' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-white">Custom Split</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Set custom amounts for each participant
                </p>
              </div>
            </label>
          </div>
          {errors.split && (
            <p className="mt-2 text-sm text-red-400">{errors.split}</p>
          )}
        </div>

        {/* Payment Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Payment Deadline
          </label>
          <GlassInput
            type="datetime-local"
            value={paymentDeadline}
            onChange={(e) => setPaymentDeadline(e.target.value)}
            required
          />
          {errors.deadline && (
            <p className="mt-2 text-sm text-red-400">{errors.deadline}</p>
          )}
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-300">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              Participants ({participants.length})
            </label>
            <GlassButton
              type="button"
              onClick={addParticipant}
              className="text-sm px-3 py-2"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Participant
            </GlassButton>
          </div>

          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No participants added yet</p>
              <p className="text-sm">Click "Add Participant" to get started</p>
            </div>
          )}

          <div className="space-y-4">
            {participants.map((participant, index) => (
              <div key={participant.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-medium">Participant {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <GlassInput
                      label="Full Name"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                    {errors[`participant_${index}_name`] && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors[`participant_${index}_name`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <GlassInput
                      label="Email"
                      type="email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                    {errors[`participant_${index}_email`] && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors[`participant_${index}_email`]}
                      </p>
                    )}
                  </div>

                  {splitType === 'custom' && (
                    <div className="md:col-span-2">
                      <GlassInput
                        label="Amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={booking.total_amount / 100}
                        value={customSplits[index] ? (customSplits[index] / 100).toFixed(2) : ''}
                        onChange={(e) => updateCustomSplit(index, e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Amount preview for this participant */}
                {splitPreview && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Amount Due:</span>
                      <span className="text-white font-medium">
                        {splitType === 'equal'
                          ? formatAmount(splitPreview.splits[index] || 0)
                          : formatAmount(customSplits[index] || 0)
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {errors.participants && (
            <p className="mt-2 text-sm text-red-400">{errors.participants}</p>
          )}
          {errors.customSplits && (
            <p className="mt-2 text-sm text-red-400">{errors.customSplits}</p>
          )}
        </div>

        {/* Split Preview */}
        {splitPreview && participants.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
              Payment Split Preview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Amount:</span>
                <div className="text-white font-semibold">
                  {formatAmount(booking.total_amount)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Per Person:</span>
                <div className="text-white font-semibold">
                  {splitType === 'equal'
                    ? formatAmount(splitPreview.baseAmount)
                    : 'Custom amounts'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-400">Participants:</span>
                <div className="text-white font-semibold">
                  {participants.length}
                </div>
              </div>
            </div>

            {splitPreview.remainder > 0 && splitType === 'equal' && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-yellow-400" />
                <span className="text-yellow-400">
                  ${(splitPreview.remainder / 100).toFixed(2)} remainder will be distributed to the first {splitPreview.remainder} participant(s)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-200">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <GlassButton
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto order-2 sm:order-1"
            variant="secondary"
          >
            Cancel
          </GlassButton>

          <GlassButton
            type="submit"
            disabled={isCreating || participants.length === 0}
            className="w-full sm:flex-1 order-1 sm:order-2"
          >
            {isCreating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                Creating Split Payment...
              </div>
            ) : (
              <>
                <ClockIcon className="h-4 w-4 mr-2" />
                Create Split Payment
              </>
            )}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
};

export default SplitPaymentForm;
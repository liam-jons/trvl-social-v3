/**
 * ModificationApprovalDashboard - Vendor interface for reviewing and approving booking modifications
 * Provides comprehensive workflow for vendor decision-making
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { vendorModificationManager } from '../../services/booking-modification-service.js';

const ModificationApprovalDashboard = ({ vendorId }) => {
  const [loading, setLoading] = useState(false);
  const [pendingModifications, setPendingModifications] = useState([]);
  const [selectedModification, setSelectedModification] = useState(null);
  const [approvalData, setApprovalData] = useState({
    decision: '', // 'approve' or 'reject'
    notes: '',
    rejectionReason: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorId) {
      loadPendingModifications();
    }
  }, [vendorId]);

  const loadPendingModifications = async () => {
    try {
      setLoading(true);
      const modifications = await vendorModificationManager.getPendingModifications(vendorId);
      setPendingModifications(modifications);
    } catch (error) {
      setError(`Failed to load pending modifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (modificationId, approved, notes = '', rejectionReason = '') => {
    try {
      setLoading(true);
      setError('');

      await vendorModificationManager.processModificationRequest(
        modificationId,
        vendorId,
        { approved, rejectionReason },
        notes
      );

      // Refresh the list
      await loadPendingModifications();
      setSelectedModification(null);
      setApprovalData({ decision: '', notes: '', rejectionReason: '' });

    } catch (error) {
      setError(`Failed to process modification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getModificationTypeDisplay = (type) => {
    const types = {
      date_change: { label: 'Date Change', icon: '📅', color: 'blue' },
      participant_update: { label: 'Participant Update', icon: '👥', color: 'green' },
      itinerary_adjustment: { label: 'Itinerary Adjustment', icon: '🗺️', color: 'purple' },
      accommodation_change: { label: 'Accommodation Change', icon: '🏨', color: 'orange' },
      meal_preference: { label: 'Meal Preferences', icon: '🍽️', color: 'yellow' },
      special_requests: { label: 'Special Requests', icon: '⭐', color: 'pink' },
    };
    return types[type] || { label: type, icon: '📝', color: 'gray' };
  };

  const getUrgencyDisplay = (urgency) => {
    const urgencies = {
      normal: { label: 'Normal', color: 'gray' },
      urgent: { label: 'Urgent', color: 'orange' },
      emergency: { label: 'Emergency', color: 'red' },
    };
    return urgencies[urgency] || urgencies.normal;
  };

  const formatTimeUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursLeft = (deadlineDate - now) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      return { text: 'Overdue', color: 'red' };
    } else if (hoursLeft < 24) {
      return { text: `${Math.floor(hoursLeft)}h left`, color: 'red' };
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return { text: `${daysLeft}d left`, color: hoursLeft < 48 ? 'orange' : 'green' };
    }
  };

  const renderModificationsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Pending Modifications ({pendingModifications.length})
        </h2>
        <button
          onClick={loadPendingModifications}
          disabled={loading}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {pendingModifications.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending modifications</h3>
          <p className="mt-1 text-sm text-gray-500">All modification requests have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingModifications.map((modification) => {
            const typeDisplay = getModificationTypeDisplay(modification.modification_type);
            const urgencyDisplay = getUrgencyDisplay(modification.urgency);
            const deadline = formatTimeUntilDeadline(modification.vendor_response_deadline);

            return (
              <div
                key={modification.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedModification(modification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{typeDisplay.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {modification.bookings?.adventures?.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Customer: {modification.bookings?.users?.name}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeDisplay.color}-100 text-${typeDisplay.color}-800`}>
                        {typeDisplay.label}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${urgencyDisplay.color}-100 text-${urgencyDisplay.color}-800`}>
                        {urgencyDisplay.label}
                      </span>
                      <span className={`text-xs text-${deadline.color}-600`}>
                        {deadline.text}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {modification.reason}
                    </p>

                    {modification.estimated_fees > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Estimated fees: ${(modification.estimated_fees / 100).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecision(modification.id, true);
                      }}
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Quick Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModification(modification);
                        setApprovalData({ decision: 'reject', notes: '', rejectionReason: '' });
                      }}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderModificationDetails = () => {
    if (!selectedModification) return null;

    const typeDisplay = getModificationTypeDisplay(selectedModification.modification_type);
    const urgencyDisplay = getUrgencyDisplay(selectedModification.urgency);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedModification(null)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <span className="text-2xl">{typeDisplay.icon}</span>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900">
                {typeDisplay.label} Request
              </h2>
              <p className="text-sm text-gray-500">
                {selectedModification.bookings?.adventures?.title}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${urgencyDisplay.color}-100 text-${urgencyDisplay.color}-800`}>
              {urgencyDisplay.label}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Booking Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Customer:</strong> {selectedModification.bookings?.users?.name}</p>
                <p><strong>Email:</strong> {selectedModification.bookings?.users?.email}</p>
                <p><strong>Trip Dates:</strong> {new Date(selectedModification.bookings?.adventures?.start_date).toLocaleDateString()}</p>
                <p><strong>Request Date:</strong> {new Date(selectedModification.created_at).toLocaleDateString()}</p>
                <p><strong>Response Deadline:</strong> {new Date(selectedModification.vendor_response_deadline).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Request Details</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Reason:</p>
                  <p className="text-sm text-gray-600">{selectedModification.reason}</p>
                </div>
                {selectedModification.estimated_fees > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Estimated Fees:</p>
                    <p className="text-sm text-gray-600">${(selectedModification.estimated_fees / 100).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Requested Changes</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(selectedModification.requested_changes, null, 2)}
              </pre>
            </div>
          </div>

          {selectedModification.fee_breakdown && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Fee Breakdown</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {selectedModification.fee_breakdown.map((fee, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{fee.type}:</span>
                    <span>${(fee.amount / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Decision</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="decision"
                    value="approve"
                    checked={approvalData.decision === 'approve'}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, decision: e.target.value }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Approve modification</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={approvalData.decision === 'reject'}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, decision: e.target.value }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Reject modification</span>
                </label>
              </div>
            </div>

            {approvalData.decision === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <select
                  value={approvalData.rejectionReason}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="unavailable_dates">Requested dates not available</option>
                  <option value="capacity_exceeded">Would exceed capacity limits</option>
                  <option value="policy_violation">Violates company policy</option>
                  <option value="insufficient_notice">Insufficient notice provided</option>
                  <option value="operational_constraints">Operational constraints</option>
                  <option value="safety_concerns">Safety concerns</option>
                  <option value="other">Other reason</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes to Customer
              </label>
              <textarea
                value={approvalData.notes}
                onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes to include in the response to the customer..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleDecision(
                  selectedModification.id,
                  approvalData.decision === 'approve',
                  approvalData.notes,
                  approvalData.rejectionReason
                )}
                disabled={!approvalData.decision || loading || (approvalData.decision === 'reject' && !approvalData.rejectionReason)}
                className={`px-4 py-2 text-sm font-medium rounded-md border border-transparent shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalData.decision === 'approve'
                    ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {loading ? 'Processing...' : approvalData.decision === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setSelectedModification(null);
                  setApprovalData({ decision: '', notes: '', rejectionReason: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {loading && !selectedModification && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading modifications...</p>
        </div>
      )}

      {!loading && (
        <>
          {selectedModification ? renderModificationDetails() : renderModificationsList()}
        </>
      )}
    </div>
  );
};

export default ModificationApprovalDashboard;
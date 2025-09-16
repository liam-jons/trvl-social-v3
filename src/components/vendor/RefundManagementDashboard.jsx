/**
 * RefundManagementDashboard - Vendor interface for managing refund requests
 * Provides comprehensive tools for reviewing, approving, and processing refunds
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { manualRefundManager, refundMonitoring } from '../../services/payment-refund-service.js';

const RefundManagementDashboard = ({ vendorId }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [refundRequests, setRefundRequests] = useState([]);
  const [refundStats, setRefundStats] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [filter, setFilter] = useState({
    dateRange: '30d',
    status: 'all',
    reason: 'all',
  });

  useEffect(() => {
    if (vendorId) {
      loadRefundData();
    }
  }, [vendorId, activeTab, filter]);

  const loadRefundData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Load refund statistics
      const stats = await refundMonitoring.getRefundStats(
        vendorId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setRefundStats(stats);

      // Load refund requests
      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          bookings (
            id,
            adventures (title, vendor_id)
          ),
          split_payments (
            id,
            description,
            total_amount,
            status
          ),
          users (
            id,
            email,
            full_name
          )
        `)
        .eq('bookings.adventures.vendor_id', vendorId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (activeTab !== 'all') {
        if (activeTab === 'pending') {
          query = query.in('status', ['pending_review', 'under_review']);
        } else {
          query = query.eq('status', activeTab);
        }
      }

      // Apply additional filters
      if (filter.reason !== 'all') {
        query = query.eq('reason_category', filter.reason);
      }

      const { data: requests, error } = await query;

      if (error) throw error;
      setRefundRequests(requests || []);

    } catch (error) {
      console.error('Failed to load refund data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status, notes = '') => {
    try {
      setProcessingRefund(requestId);

      const { error } = await supabase
        .from('refund_requests')
        .update({
          status,
          vendor_notes: notes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Reload data
      await loadRefundData();
      setSelectedRequest(null);

    } catch (error) {
      console.error('Failed to update request status:', error);
    } finally {
      setProcessingRefund(null);
    }
  };

  const processRefund = async (request, refundType = 'full') => {
    try {
      setProcessingRefund(request.id);

      // Process actual refund through service
      const refundResult = await manualRefundManager.processManualRefund({
        splitPaymentId: request.split_payment_id,
        organizerId: vendorId,
        reason: request.reason_category,
        refundType,
      });

      if (refundResult.success) {
        // Update request status to processed
        await updateRequestStatus(request.id, 'approved_processed', 'Refund processed successfully');

        // Send notification to customer
        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            type: 'refund_approved',
            title: 'Refund Approved',
            message: `Your refund request has been approved and processed. You should see the refund in your account within 5-10 business days.`,
            data: {
              refund_request_id: request.id,
              booking_id: request.booking_id,
            },
            created_at: new Date().toISOString(),
          });
      } else {
        throw new Error('Refund processing failed');
      }

    } catch (error) {
      console.error('Failed to process refund:', error);
      await updateRequestStatus(request.id, 'processing_failed', `Failed to process refund: ${error.message}`);
    } finally {
      setProcessingRefund(null);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved_processed: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      processing_failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Refunds (30d)
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {refundStats?.totalRefunds || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Successful Refunds
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {refundStats?.successfulRefunds || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending Review
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {refundRequests.filter(r => ['pending_review', 'under_review'].includes(r.status)).length}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-purple-500 rounded-md flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Amount
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {formatAmount(refundStats?.totalRefundAmount || 0)}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequestDetail = (request) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Refund Request Details
            </h3>
            <button
              onClick={() => setSelectedRequest(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Customer Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name:</span>
                <span className="text-sm text-gray-900">{request.users?.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Email:</span>
                <span className="text-sm text-gray-900">{request.users?.email}</span>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Adventure:</span>
                <span className="text-sm text-gray-900">{request.bookings?.adventures?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Booking ID:</span>
                <span className="text-sm text-gray-900">{request.booking_id}</span>
              </div>
              {request.split_payments && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Amount:</span>
                  <span className="text-sm text-gray-900">
                    {formatAmount(request.split_payments.total_amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Request Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Refund Request</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reason:</span>
                <span className="text-sm text-gray-900">{request.reason_description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requested Amount:</span>
                <span className="text-sm text-gray-900">
                  {request.requested_amount_type === 'custom'
                    ? formatAmount(request.custom_amount)
                    : request.requested_amount_type
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                  {request.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Submitted:</span>
                <span className="text-sm text-gray-900">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {request.additional_details && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Details</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{request.additional_details}</p>
              </div>
            </div>
          )}

          {request.vendor_notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Vendor Notes</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{request.vendor_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {['pending_review', 'under_review'].includes(request.status) && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={() => processRefund(request, 'full')}
                disabled={processingRefund === request.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRefund === request.id ? 'Processing...' : 'Approve & Process Refund'}
              </button>
              <button
                onClick={() => updateRequestStatus(request.id, 'under_review')}
                disabled={processingRefund === request.id}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Under Review
              </button>
              <button
                onClick={() => updateRequestStatus(request.id, 'denied', 'Refund request denied after review')}
                disabled={processingRefund === request.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deny
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRequestsList = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {refundRequests.map((request) => (
          <li key={request.id}>
            <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {request.bookings?.adventures?.title}
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.users?.full_name} • {request.reason_description}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {request.split_payments && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAmount(request.split_payments.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.requested_amount_type === 'custom'
                        ? `Requesting: ${formatAmount(request.custom_amount)}`
                        : `Requesting: ${request.requested_amount_type}`
                      }
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {refundRequests.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No refund requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'pending'
              ? 'No pending refund requests at this time.'
              : `No refund requests with status: ${activeTab}`
            }
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Refund Management
            </h2>
          </div>
        </div>

        {/* Statistics */}
        {refundStats && renderStats()}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'pending', label: 'Pending Review' },
              { key: 'approved_processed', label: 'Processed' },
              { key: 'denied', label: 'Denied' },
              { key: 'all', label: 'All Requests' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Refund Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading refund requests...</p>
          </div>
        ) : (
          renderRequestsList()
        )}

        {/* Request Detail Modal */}
        {selectedRequest && renderRequestDetail(selectedRequest)}
      </div>
    </div>
  );
};

export default RefundManagementDashboard;
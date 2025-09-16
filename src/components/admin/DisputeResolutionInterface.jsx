/**
 * DisputeResolutionInterface - Admin interface for handling payment disputes
 * Provides tools for managing Stripe disputes, chargebacks, and escalated refund issues
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { payments } from '../../services/stripe-service.js';

const DisputeResolutionInterface = ({ adminId }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [filter, setFilter] = useState({
    reason: 'all',
    status: 'all',
    dateRange: '30d',
  });

  const disputeReasons = {
    duplicate: 'Duplicate Payment',
    fraudulent: 'Fraudulent Transaction',
    subscription_canceled: 'Subscription Canceled',
    product_unacceptable: 'Product Unacceptable',
    product_not_received: 'Product Not Received',
    unrecognized: 'Unrecognized Transaction',
    credit_not_processed: 'Credit Not Processed',
    general: 'General Dispute',
    incorrect_account_details: 'Incorrect Account Details',
    insufficient_funds: 'Insufficient Funds',
    bank_cannot_process: 'Bank Cannot Process',
    debit_not_authorized: 'Debit Not Authorized',
    customer_initiated: 'Customer Initiated',
  };

  const disputeStatuses = {
    warning_needs_response: 'Needs Response',
    warning_under_review: 'Under Review',
    warning_closed: 'Warning Closed',
    needs_response: 'Needs Response',
    under_review: 'Under Review',
    charge_refunded: 'Charge Refunded',
    won: 'Won',
    lost: 'Lost',
  };

  useEffect(() => {
    loadDisputes();
  }, [activeTab, filter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);

      // Get disputes from database (synchronized from Stripe webhooks)
      let query = supabase
        .from('payment_disputes')
        .select(`
          *,
          bookings (
            id,
            adventures (title, vendor_id, vendors (business_name))
          ),
          users (id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (activeTab !== 'all') {
        if (activeTab === 'active') {
          query = query.in('status', ['warning_needs_response', 'needs_response', 'under_review']);
        } else {
          query = query.eq('status', activeTab);
        }
      }

      // Apply additional filters
      if (filter.reason !== 'all') {
        query = query.eq('reason', filter.reason);
      }

      if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDisputes(data || []);

    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitDisputeResponse = async (disputeId) => {
    try {
      setSubmittingResponse(true);

      // Upload evidence files if any
      const evidenceUrls = [];
      for (const file of evidenceFiles) {
        const fileName = `dispute-${disputeId}-${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dispute-evidence')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        evidenceUrls.push(uploadData.path);
      }

      // Submit response via Stripe API
      const response = await fetch('/api/stripe/disputes/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disputeId,
          evidence: {
            customer_communication: responseText,
            receipt: evidenceUrls.find(url => url.includes('receipt')),
            shipping_documentation: evidenceUrls.find(url => url.includes('shipping')),
            service_documentation: evidenceUrls.find(url => url.includes('service')),
            refund_policy: evidenceUrls.find(url => url.includes('policy')),
            uncategorized_file: evidenceUrls[0], // First file as fallback
          },
          metadata: {
            admin_id: adminId,
            response_timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit dispute response');
      }

      // Update dispute status in database
      await supabase
        .from('payment_disputes')
        .update({
          status: 'under_review',
          admin_response: responseText,
          evidence_files: evidenceUrls,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      // Reset form
      setResponseText('');
      setEvidenceFiles([]);
      setSelectedDispute(null);

      // Reload disputes
      await loadDisputes();

    } catch (error) {
      console.error('Failed to submit dispute response:', error);
      alert(`Failed to submit response: ${error.message}`);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const acceptDispute = async (disputeId) => {
    try {
      const response = await fetch('/api/stripe/disputes/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disputeId,
          metadata: {
            admin_id: adminId,
            accepted_timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept dispute');
      }

      // Update in database
      await supabase
        .from('payment_disputes')
        .update({
          status: 'lost',
          admin_response: 'Dispute accepted - customer refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      await loadDisputes();

    } catch (error) {
      console.error('Failed to accept dispute:', error);
      alert(`Failed to accept dispute: ${error.message}`);
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
      warning_needs_response: 'bg-yellow-100 text-yellow-800',
      warning_under_review: 'bg-yellow-100 text-yellow-800',
      warning_closed: 'bg-gray-100 text-gray-800',
      needs_response: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800',
      charge_refunded: 'bg-green-100 text-green-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (status, createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const hoursSinceCreated = (now - created) / (1000 * 60 * 60);

    if (['warning_needs_response', 'needs_response'].includes(status)) {
      if (hoursSinceCreated > 168) return 'border-l-4 border-red-500'; // 7 days
      if (hoursSinceCreated > 120) return 'border-l-4 border-yellow-500'; // 5 days
      return 'border-l-4 border-blue-500';
    }
    return '';
  };

  const renderDisputeDetail = (dispute) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Dispute Resolution - {dispute.stripe_dispute_id}
            </h3>
            <button
              onClick={() => setSelectedDispute(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Dispute Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Dispute Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount:</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {formatAmount(dispute.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reason:</span>
                  <span className="text-sm text-gray-900">
                    {disputeReasons[dispute.reason] || dispute.reason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                    {disputeStatuses[dispute.status] || dispute.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </span>
                </div>
                {dispute.evidence_due_by && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Evidence Due:</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {new Date(dispute.evidence_due_by).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Adventure:</span>
                  <span className="text-sm text-gray-900">
                    {dispute.bookings?.adventures?.title || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vendor:</span>
                  <span className="text-sm text-gray-900">
                    {dispute.bookings?.adventures?.vendors?.business_name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Customer:</span>
                  <span className="text-sm text-gray-900">
                    {dispute.users?.full_name || dispute.users?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Booking ID:</span>
                  <span className="text-sm text-gray-900">
                    {dispute.booking_id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer's Dispute Reason */}
          {dispute.customer_message && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Customer's Dispute Reason</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{dispute.customer_message}</p>
              </div>
            </div>
          )}

          {/* Previous Response */}
          {dispute.admin_response && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Previous Response</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">{dispute.admin_response}</p>
                {dispute.responded_at && (
                  <p className="text-xs text-blue-600 mt-2">
                    Responded on: {new Date(dispute.responded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Response Form - Only show if needs response */}
          {['warning_needs_response', 'needs_response'].includes(dispute.status) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Submit Response</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Message
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain why this charge is valid and provide any relevant details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Files
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setEvidenceFiles(Array.from(e.target.files))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload receipts, communication logs, service documentation, etc.
                  </p>
                </div>

                {evidenceFiles.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Selected Files:</h5>
                    <ul className="text-sm text-gray-600">
                      {evidenceFiles.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between">
            <div>
              {['warning_needs_response', 'needs_response'].includes(dispute.status) && (
                <button
                  onClick={() => acceptDispute(dispute.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Accept Dispute (Refund Customer)
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              {['warning_needs_response', 'needs_response'].includes(dispute.status) && (
                <button
                  onClick={() => submitDisputeResponse(dispute.id)}
                  disabled={submittingResponse || !responseText.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResponse ? 'Submitting...' : 'Submit Response'}
                </button>
              )}
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisputesList = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {disputes.map((dispute) => (
          <li key={dispute.id} className={getUrgencyColor(dispute.status, dispute.created_at)}>
            <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {dispute.stripe_dispute_id}
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                      {disputeStatuses[dispute.status] || dispute.status}
                    </span>
                    {['warning_needs_response', 'needs_response'].includes(dispute.status) && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {disputeReasons[dispute.reason] || dispute.reason} • {formatAmount(dispute.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dispute.bookings?.adventures?.title || 'Direct Payment'} •
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </div>
                  {dispute.evidence_due_by && (
                    <div className="text-sm text-red-600 font-medium">
                      Evidence due: {new Date(dispute.evidence_due_by).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {dispute.users?.full_name || 'Unknown Customer'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dispute.bookings?.adventures?.vendors?.business_name || 'Direct Vendor'}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Resolve
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {disputes.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'active'
              ? 'No active disputes requiring attention.'
              : `No disputes with status: ${activeTab}`
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
              Dispute Resolution
            </h2>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Disputes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {disputes.filter(d => ['warning_needs_response', 'needs_response', 'under_review'].includes(d.status)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Needs Response
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {disputes.filter(d => ['warning_needs_response', 'needs_response'].includes(d.status)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
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
                      Won This Month
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {disputes.filter(d => d.status === 'won').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total at Risk
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatAmount(
                        disputes
                          .filter(d => ['warning_needs_response', 'needs_response', 'under_review'].includes(d.status))
                          .reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'active', label: 'Active Disputes' },
              { key: 'won', label: 'Won' },
              { key: 'lost', label: 'Lost' },
              { key: 'all', label: 'All Disputes' },
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

        {/* Disputes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading disputes...</p>
          </div>
        ) : (
          renderDisputesList()
        )}

        {/* Dispute Detail Modal */}
        {selectedDispute && renderDisputeDetail(selectedDispute)}
      </div>
    </div>
  );
};

export default DisputeResolutionInterface;
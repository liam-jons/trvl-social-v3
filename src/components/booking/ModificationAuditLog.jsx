/**
 * ModificationAuditLog - Display comprehensive audit trail for booking modifications
 * Shows detailed history of all changes, approvals, and system events
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { bookingModificationManager } from '../../services/booking-modification-service.js';

const ModificationAuditLog = ({ bookingId, userId }) => {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [modifications, setModifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'modifications', 'approvals', 'system'
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      loadAuditData();
    }
  }, [bookingId]);

  const loadAuditData = async () => {
    try {
      setLoading(true);

      // Load modification history
      const modificationHistory = await bookingModificationManager.getModificationHistory(bookingId, userId);
      setModifications(modificationHistory);

      // Load audit logs
      const { data: logs, error } = await supabase
        .from('booking_audit_logs')
        .select(`
          *,
          actor_user:users!booking_audit_logs_actor_id_fkey(name, email),
          modification_requests:booking_modifications(
            id,
            modification_type,
            status
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuditLogs(logs || []);

    } catch (error) {
      setError(`Failed to load audit data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      modification_requested: '📝',
      modification_auto_approved: '✅',
      modification_approved: '👍',
      modification_rejected: '❌',
      booking_cancelled: '🚫',
      refund_processed: '💰',
      payment_updated: '💳',
      system_update: '⚙️',
      notification_sent: '📧',
    };
    return icons[action] || '📋';
  };

  const getActionColor = (action) => {
    const colors = {
      modification_requested: 'blue',
      modification_auto_approved: 'green',
      modification_approved: 'green',
      modification_rejected: 'red',
      booking_cancelled: 'red',
      refund_processed: 'green',
      payment_updated: 'blue',
      system_update: 'gray',
      notification_sent: 'purple',
    };
    return colors[action] || 'gray';
  };

  const getModificationTypeDisplay = (type) => {
    const types = {
      date_change: 'Date Change',
      participant_update: 'Participant Update',
      itinerary_adjustment: 'Itinerary Adjustment',
      accommodation_change: 'Accommodation Change',
      meal_preference: 'Meal Preferences',
      special_requests: 'Special Requests',
      partial_cancellation: 'Partial Cancellation',
      full_cancellation: 'Full Cancellation',
    };
    return types[type] || type;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending_vendor_review: 'yellow',
      auto_approved: 'green',
      approved: 'green',
      rejected: 'red',
      cancelled: 'gray',
    };
    return colors[status] || 'gray';
  };

  const formatActorDisplay = (log) => {
    if (log.actor_type === 'system') {
      return 'System';
    } else if (log.actor_user) {
      return log.actor_user.name || log.actor_user.email;
    } else {
      return `${log.actor_type} (ID: ${log.actor_id})`;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'modifications') {
      return log.action.includes('modification') || log.action.includes('booking_cancelled');
    }
    if (filter === 'approvals') {
      return log.action.includes('approved') || log.action.includes('rejected');
    }
    if (filter === 'system') {
      return log.actor_type === 'system';
    }
    return true;
  });

  const renderModificationSummary = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Modification Summary</h3>

      {modifications.length === 0 ? (
        <p className="text-sm text-gray-500">No modifications have been requested for this booking.</p>
      ) : (
        <div className="space-y-3">
          {modifications.map((mod) => (
            <div key={mod.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">
                {getActionIcon(`modification_${mod.status.replace('_vendor_review', '')}`)}
              </span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {getModificationTypeDisplay(mod.modification_type)}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${getStatusBadgeColor(mod.status)}-100 text-${getStatusBadgeColor(mod.status)}-800`}>
                    {mod.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{mod.reason}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Requested: {new Date(mod.created_at).toLocaleDateString()}</span>
                  {mod.processed_at && (
                    <span>Processed: {new Date(mod.processed_at).toLocaleDateString()}</span>
                  )}
                  {mod.estimated_fees > 0 && (
                    <span>Fees: ${(mod.estimated_fees / 100).toFixed(2)}</span>
                  )}
                </div>
                {mod.approval_notes && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">
                      <strong>Vendor Notes:</strong> {mod.approval_notes}
                    </p>
                  </div>
                )}
                {mod.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-600">
                      <strong>Rejection Reason:</strong> {mod.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAuditLogEntry = (log) => {
    const actionColor = getActionColor(log.action);
    const actionIcon = getActionIcon(log.action);

    return (
      <div key={log.id} className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${actionColor}-100 flex items-center justify-center`}>
          <span className="text-sm">{actionIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">
              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <span className="text-xs text-gray-500">
              {formatActorDisplay(log)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(log.created_at).toLocaleString()}
          </p>
          {log.details && (
            <div className="mt-2">
              <details className="group">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                  View details
                </summary>
                <div className="mt-2 p-2 bg-gray-50 rounded border text-xs">
                  <pre className="whitespace-pre-wrap text-gray-600">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading audit log...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {renderModificationSummary()}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Events</option>
                <option value="modifications">Modifications</option>
                <option value="approvals">Approvals</option>
                <option value="system">System Events</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit entries</h3>
              <p className="mt-1 text-sm text-gray-500">No events found for the selected filter.</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {filteredLogs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== filteredLogs.length - 1 ? (
                        <span className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      {renderAuditLogEntry(log)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={loadAuditData}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Refresh Audit Log
        </button>
      </div>
    </div>
  );
};

export default ModificationAuditLog;
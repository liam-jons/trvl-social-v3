/**
 * Payment Dashboard Component
 * Comprehensive dashboard for group payment organizers
 */
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import GlassInput from '../ui/GlassInput.jsx';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BellIcon,
  EyeIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase.js';
import { groupPaymentManager } from '../../services/split-payment-service.js';
import { paymentCollectionWorkflow } from '../../services/payment-collection-service.js';
const PaymentDashboard = ({ organizerId }) => {
  const [splitPayments, setSplitPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'overdue'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'deadline', 'amount', 'completion'
  useEffect(() => {
    fetchPaymentData();
  }, [organizerId]);
  const fetchPaymentData = async () => {
    try {
      setError(null);
      setLoading(true);
      // Fetch all split payments for this organizer
      const { data: payments, error: paymentsError } = await supabase
        .from('split_payments')
        .select(`
          *,
          individual_payments (*)
        `)
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });
      if (paymentsError) throw paymentsError;
      // Process payments with statistics
      const processedPayments = await Promise.all(
        payments.map(async (payment) => {
          const stats = groupPaymentManager.calculatePaymentStats(payment.individual_payments);
          // Get collection stats
          let collectionStats = null;
          try {
            collectionStats = await paymentCollectionWorkflow.getCollectionStats(payment.id);
          } catch (err) {
            console.warn(`Failed to get collection stats for payment ${payment.id}:`, err);
          }
          return {
            ...payment,
            stats,
            collectionStats,
          };
        })
      );
      setSplitPayments(processedPayments);
      // Calculate overall dashboard statistics
      const overallStats = calculateDashboardStats(processedPayments);
      setDashboardStats(overallStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const calculateDashboardStats = (payments) => {
    const stats = {
      totalPayments: payments.length,
      activePayments: 0,
      completedPayments: 0,
      overduePayments: 0,
      totalAmountManaged: 0,
      totalCollected: 0,
      totalParticipants: 0,
      averageCompletionRate: 0,
      upcomingDeadlines: 0,
    };
    const now = new Date();
    let totalCompletionRate = 0;
    payments.forEach(payment => {
      stats.totalAmountManaged += payment.total_amount;
      stats.totalCollected += payment.stats.totalPaid;
      stats.totalParticipants += payment.stats.participantCount;
      totalCompletionRate += payment.stats.completionPercentage;
      const deadline = new Date(payment.payment_deadline);
      if (payment.status === 'completed') {
        stats.completedPayments++;
      } else if (payment.status === 'pending' || payment.status === 'partially_paid') {
        stats.activePayments++;
        if (deadline < now) {
          stats.overduePayments++;
        } else if (deadline.getTime() - now.getTime() < 48 * 60 * 60 * 1000) { // 48 hours
          stats.upcomingDeadlines++;
        }
      }
    });
    stats.averageCompletionRate = payments.length > 0 ? totalCompletionRate / payments.length : 0;
    return stats;
  };
  const getFilteredAndSortedPayments = () => {
    let filtered = [...splitPayments];
    // Apply filters
    switch (filter) {
      case 'active':
        filtered = filtered.filter(p => ['pending', 'partially_paid'].includes(p.status));
        break;
      case 'completed':
        filtered = filtered.filter(p => ['completed', 'completed_partial'].includes(p.status));
        break;
      case 'overdue':
        const now = new Date();
        filtered = filtered.filter(p =>
          ['pending', 'partially_paid'].includes(p.status) &&
          new Date(p.payment_deadline) < now
        );
        break;
      default:
        break;
    }
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.payment_deadline) - new Date(b.payment_deadline);
        case 'amount':
          return b.total_amount - a.total_amount;
        case 'completion':
          return b.stats.completionPercentage - a.stats.completionPercentage;
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    return filtered;
  };
  const sendBulkReminders = async (paymentId) => {
    try {
      // Find pending payments
      const payment = splitPayments.find(p => p.id === paymentId);
      const pendingPayments = payment.individual_payments.filter(p => p.status === 'pending');
      // Send reminders to all pending participants
      const reminderPromises = pendingPayments.map(individualPayment =>
        paymentCollectionWorkflow.sendPaymentRequest(individualPayment, payment)
      );
      await Promise.all(reminderPromises);
      // Refresh data to show updated reminder counts
      await fetchPaymentData();
    } catch (error) {
      console.error('Failed to send bulk reminders:', error);
    }
  };
  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-500/20 text-yellow-400', text: 'Pending' },
      'partially_paid': { color: 'bg-blue-500/20 text-blue-400', text: 'Partial' },
      'completed': { color: 'bg-green-500/20 text-green-400', text: 'Complete' },
      'completed_partial': { color: 'bg-green-500/20 text-green-400', text: 'Complete*' },
      'cancelled_insufficient': { color: 'bg-red-500/20 text-red-400', text: 'Cancelled' },
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };
  const formatAmount = (amountInCents) => {
    return `$${(amountInCents / 100).toFixed(2)}`;
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  const isDeadlineUrgent = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff < 48 * 60 * 60 * 1000; // Less than 48 hours
  };
  const isOverdue = (deadline) => {
    return new Date() > new Date(deadline);
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-white">Loading payment dashboard...</span>
          </div>
        </GlassCard>
      </div>
    );
  }
  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8 text-red-400">
          <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
          <span>Failed to load dashboard: {error}</span>
        </div>
        <div className="text-center mt-4">
          <GlassButton onClick={fetchPaymentData} className="text-sm">
            Try Again
          </GlassButton>
        </div>
      </GlassCard>
    );
  }
  const filteredPayments = getFilteredAndSortedPayments();
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <ChartBarIcon className="h-8 w-8 mr-3" />
          Payment Dashboard
        </h1>
        <GlassButton onClick={fetchPaymentData} className="text-sm">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </GlassButton>
      </div>
      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {formatAmount(dashboardStats.totalCollected)}
                </div>
                <div className="text-sm text-gray-400">Total Collected</div>
                <div className="text-xs text-gray-500">
                  of {formatAmount(dashboardStats.totalAmountManaged)}
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {dashboardStats.totalParticipants}
                </div>
                <div className="text-sm text-gray-400">Total Participants</div>
                <div className="text-xs text-gray-500">
                  Across {dashboardStats.totalPayments} payments
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(dashboardStats.averageCompletionRate)}%
                </div>
                <div className="text-sm text-gray-400">Avg Completion</div>
                <div className="text-xs text-gray-500">
                  {dashboardStats.completedPayments} completed
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {dashboardStats.upcomingDeadlines}
                </div>
                <div className="text-sm text-gray-400">Urgent Deadlines</div>
                <div className="text-xs text-gray-500">
                  {dashboardStats.overduePayments} overdue
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
      {/* Filters and Sorting */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-400 font-medium">Filter:</span>
            {['all', 'active', 'completed', 'overdue'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-blue-500/30 text-blue-400'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
            >
              <option value="created_at">Date Created</option>
              <option value="deadline">Deadline</option>
              <option value="amount">Amount</option>
              <option value="completion">Completion %</option>
            </select>
          </div>
        </div>
      </GlassCard>
      {/* Payment List */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Payment Collections ({filteredPayments.length})
        </h2>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No payments found for the selected filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map(payment => {
              const deadlineUrgent = isDeadlineUrgent(payment.payment_deadline);
              const overdue = isOverdue(payment.payment_deadline);
              return (
                <div
                  key={payment.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    overdue
                      ? 'border-red-500/30 bg-red-500/5'
                      : deadlineUrgent
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">
                          {payment.description || `Payment Collection #${payment.id.slice(0, 8)}`}
                        </h3>
                        {getStatusBadge(payment.status)}
                        {overdue && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                            Overdue
                          </span>
                        )}
                        {deadlineUrgent && !overdue && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <div className="text-white font-medium">
                            {formatAmount(payment.total_amount)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Collected:</span>
                          <div className="text-white font-medium">
                            {formatAmount(payment.stats.totalPaid)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Progress:</span>
                          <div className="text-white font-medium">
                            {payment.stats.paidCount}/{payment.stats.participantCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Deadline:</span>
                          <div className={`font-medium ${
                            overdue ? 'text-red-400' : deadlineUrgent ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {formatDate(payment.payment_deadline)}
                          </div>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-3 bg-black/20 rounded-full h-2">
                        <div
                          className={`rounded-full h-2 transition-all duration-500 ${
                            payment.stats.completionPercentage === 100
                              ? 'bg-green-500'
                              : payment.stats.completionPercentage > 0
                              ? 'bg-blue-500'
                              : 'bg-gray-500'
                          }`}
                          style={{ width: `${Math.min(payment.stats.completionPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <GlassButton
                        onClick={() => setSelectedPayment(payment.id)}
                        className="text-sm px-3 py-2"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </GlassButton>
                      {payment.stats.pendingCount > 0 && (
                        <GlassButton
                          onClick={() => sendBulkReminders(payment.id)}
                          className="text-sm px-3 py-2"
                          variant="secondary"
                        >
                          <BellIcon className="h-4 w-4 mr-1" />
                          Remind All
                        </GlassButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
      {/* Alert Cards */}
      {dashboardStats && (dashboardStats.overduePayments > 0 || dashboardStats.upcomingDeadlines > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardStats.overduePayments > 0 && (
            <GlassCard className="p-4 border-red-500/30">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <h3 className="text-red-400 font-medium">
                    {dashboardStats.overduePayments} Overdue Payment{dashboardStats.overduePayments > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    These payments require immediate attention
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
          {dashboardStats.upcomingDeadlines > 0 && (
            <GlassCard className="p-4 border-yellow-500/30">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-yellow-500 mr-3" />
                <div>
                  <h3 className="text-yellow-400 font-medium">
                    {dashboardStats.upcomingDeadlines} Deadline{dashboardStats.upcomingDeadlines > 1 ? 's' : ''} Approaching
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Payment deadlines within 48 hours
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
};
export default PaymentDashboard;
/**
 * RefundDisputeManagementDemo - Comprehensive demo showcasing refund and dispute management
 * This component demonstrates the integration of all refund and dispute features
 */
import React, { useState } from 'react';
import RefundRequestModal from '../booking/RefundRequestModal.jsx';
import RefundManagementDashboard from '../vendor/RefundManagementDashboard.jsx';
import DisputeResolutionInterface from './DisputeResolutionInterface.jsx';
import RefundTrackingTable from '../common/RefundTrackingTable.jsx';
const RefundDisputeManagementDemo = () => {
  const [activeView, setActiveView] = useState('overview');
  const [demoData, setDemoData] = useState({
    userId: 'demo-user-123',
    vendorId: 'demo-vendor-456',
    adminId: 'demo-admin-789',
    bookingId: 'demo-booking-101',
    splitPaymentId: 'demo-payment-202',
  });
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const viewOptions = [
    {
      key: 'overview',
      title: 'System Overview',
      description: 'Overview of the refund and dispute management system',
      icon: '📊',
    },
    {
      key: 'customer-request',
      title: 'Customer Refund Request',
      description: 'Customer-facing refund request interface',
      icon: '🙋‍♂️',
    },
    {
      key: 'vendor-management',
      title: 'Vendor Management',
      description: 'Vendor dashboard for handling refund requests',
      icon: '🏪',
    },
    {
      key: 'admin-disputes',
      title: 'Admin Dispute Resolution',
      description: 'Admin interface for payment disputes and chargebacks',
      icon: '⚖️',
    },
    {
      key: 'tracking-reports',
      title: 'Tracking & Reports',
      description: 'Comprehensive refund tracking and reporting',
      icon: '📈',
    },
  ];
  const systemFeatures = [
    {
      category: 'Customer Features',
      features: [
        'Guided refund request wizard with reason categorization',
        'Automatic eligibility checking based on cancellation policies',
        'Real-time status tracking and notifications',
        'Support for full, partial, and custom refund amounts',
        'Evidence upload for special circumstances',
      ],
    },
    {
      category: 'Vendor Features',
      features: [
        'Centralized refund management dashboard',
        'One-click refund approval and processing',
        'Bulk refund operations for group cancellations',
        'Refund analytics and reporting',
        'Configurable refund policies per adventure',
      ],
    },
    {
      category: 'Admin Features',
      features: [
        'Payment dispute and chargeback management',
        'Evidence submission for dispute resolution',
        'Automated dispute notifications and deadlines',
        'Comprehensive audit trails and compliance reporting',
        'Cross-platform refund tracking and analytics',
      ],
    },
    {
      category: 'System Features',
      features: [
        'Automatic refund processing for failed group payments',
        'Stripe integration for seamless payment handling',
        'Policy engine for consistent refund decisions',
        'Real-time notifications and status updates',
        'Comprehensive logging and audit trails',
      ],
    },
  ];
  const workflowSteps = [
    {
      step: 1,
      title: 'Customer Request',
      description: 'Customer submits refund request through guided interface',
      actors: ['Customer'],
      outcomes: ['Refund request created', 'Vendor notified'],
    },
    {
      step: 2,
      title: 'Policy Evaluation',
      description: 'System evaluates eligibility based on cancellation policies',
      actors: ['System'],
      outcomes: ['Eligibility determined', 'Refund amount calculated'],
    },
    {
      step: 3,
      title: 'Vendor Review',
      description: 'Vendor reviews request and makes approval decision',
      actors: ['Vendor'],
      outcomes: ['Request approved/denied', 'Customer notified'],
    },
    {
      step: 4,
      title: 'Payment Processing',
      description: 'Approved refunds are processed through Stripe',
      actors: ['System', 'Stripe'],
      outcomes: ['Refund processed', 'Funds returned to customer'],
    },
    {
      step: 5,
      title: 'Dispute Handling',
      description: 'Handle any payment disputes or chargebacks',
      actors: ['Admin', 'Stripe'],
      outcomes: ['Dispute resolved', 'Evidence submitted'],
    },
  ];
  const renderOverview = () => (
    <div className="space-y-8">
      {/* System Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Refund & Dispute Management System
        </h3>
        <p className="text-gray-600 mb-6">
          A comprehensive system for handling customer refunds, vendor refund management,
          and payment dispute resolution. Built with Stripe integration for seamless payment processing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemFeatures.map((category) => (
            <div key={category.category} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
              <ul className="space-y-2">
                {category.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Workflow Diagram */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Refund Processing Workflow</h3>
        <div className="space-y-4">
          {workflowSteps.map((step) => (
            <div key={step.step} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.step}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">Actors:</span>
                    {step.actors.map((actor, index) => (
                      <span key={index} className="ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {actor}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">Outcomes:</span>
                    {step.outcomes.map((outcome, index) => (
                      <span key={index} className="ml-1 bg-green-100 text-green-800 px-2 py-1 rounded">
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveView('customer-request')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">🙋‍♂️</div>
            <div className="font-medium text-gray-900">Submit Refund Request</div>
            <div className="text-sm text-gray-600">As a customer</div>
          </button>
          <button
            onClick={() => setActiveView('vendor-management')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-medium text-gray-900">Manage Refunds</div>
            <div className="text-sm text-gray-600">As a vendor</div>
          </button>
          <button
            onClick={() => setActiveView('admin-disputes')}
            className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">⚖️</div>
            <div className="font-medium text-gray-900">Resolve Disputes</div>
            <div className="text-sm text-gray-600">As an admin</div>
          </button>
          <button
            onClick={() => setActiveView('tracking-reports')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-gray-900">View Reports</div>
            <div className="text-sm text-gray-600">Analytics & tracking</div>
          </button>
        </div>
      </div>
    </div>
  );
  const renderCustomerRequest = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Refund Request Interface</h3>
        <p className="text-gray-600 mb-6">
          This demonstrates the customer-facing refund request modal. Customers can submit refund requests
          with detailed reasons and supporting information.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Key Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Multi-step guided wizard for easy completion</li>
            <li>• Automatic refund eligibility checking</li>
            <li>• Support for different refund types (full, partial, custom)</li>
            <li>• File upload for supporting evidence</li>
            <li>• Real-time validation and feedback</li>
          </ul>
        </div>
        <button
          onClick={() => setShowRefundModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Refund Request Modal
        </button>
      </div>
      {showRefundModal && (
        <RefundRequestModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          bookingId={demoData.bookingId}
          splitPaymentId={demoData.splitPaymentId}
          userId={demoData.userId}
          onRefundRequested={(request) => {
            setShowRefundModal(false);
          }}
        />
      )}
    </div>
  );
  const renderVendorManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Vendor Refund Management Dashboard</h3>
        <p className="text-gray-600 mb-6">
          Vendors can efficiently manage all refund requests for their adventures. The dashboard provides
          comprehensive tools for reviewing, approving, and processing refunds.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-green-900 mb-2">Vendor Capabilities:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• View all refund requests with detailed information</li>
            <li>• One-click approval and processing</li>
            <li>• Add vendor notes and communication</li>
            <li>• Track refund status and history</li>
            <li>• Analytics and reporting dashboard</li>
          </ul>
        </div>
      </div>
      <RefundManagementDashboard vendorId={demoData.vendorId} />
    </div>
  );
  const renderAdminDisputes = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Admin Dispute Resolution Interface</h3>
        <p className="text-gray-600 mb-6">
          Admins can handle payment disputes, chargebacks, and escalated refund issues. The interface
          provides tools for evidence submission and dispute resolution.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-900 mb-2">Admin Functions:</h4>
          <ul className="text-sm text-red-800 space-y-1">
            <li>• Monitor active disputes and deadlines</li>
            <li>• Submit evidence for dispute resolution</li>
            <li>• Track dispute outcomes and learn from results</li>
            <li>• Handle escalated refund cases</li>
            <li>• Maintain compliance and audit trails</li>
          </ul>
        </div>
      </div>
      <DisputeResolutionInterface adminId={demoData.adminId} />
    </div>
  );
  const renderTrackingReports = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Refund Tracking & Reports</h3>
        <p className="text-gray-600 mb-6">
          Comprehensive tracking and reporting for all refunds across the platform. Supports filtering,
          sorting, exporting, and detailed analytics.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-purple-900 mb-2">Reporting Features:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Real-time refund tracking and status updates</li>
            <li>• Advanced filtering and search capabilities</li>
            <li>• Export functionality (CSV, JSON)</li>
            <li>• Performance analytics and insights</li>
            <li>• Compliance and audit reporting</li>
          </ul>
        </div>
      </div>
      <RefundTrackingTable
        adminView={true}
        onRefundSelect={(refund) => {
          setSelectedRefund(refund);
        }}
      />
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Refund & Dispute Management System
          </h1>
          <p className="text-gray-600">
            Comprehensive demo of refund request handling, vendor management, and dispute resolution
          </p>
        </div>
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {viewOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setActiveView(option.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === option.key
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-medium">{option.title}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>
        {/* Content */}
        <div className="mb-8">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'customer-request' && renderCustomerRequest()}
          {activeView === 'vendor-management' && renderVendorManagement()}
          {activeView === 'admin-disputes' && renderAdminDisputes()}
          {activeView === 'tracking-reports' && renderTrackingReports()}
        </div>
        {/* Footer */}
        <div className="border-t border-gray-200 pt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl text-green-500 mb-2">✅</div>
                <div className="text-sm font-medium text-gray-900">Customer Interface</div>
                <div className="text-xs text-gray-500">RefundRequestModal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-green-500 mb-2">✅</div>
                <div className="text-sm font-medium text-gray-900">Vendor Dashboard</div>
                <div className="text-xs text-gray-500">RefundManagementDashboard</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-green-500 mb-2">✅</div>
                <div className="text-sm font-medium text-gray-900">Admin Interface</div>
                <div className="text-xs text-gray-500">DisputeResolutionInterface</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-green-500 mb-2">✅</div>
                <div className="text-sm font-medium text-gray-900">Tracking & Reports</div>
                <div className="text-xs text-gray-500">RefundTrackingTable</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RefundDisputeManagementDemo;
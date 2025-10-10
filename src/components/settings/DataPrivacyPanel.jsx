import { useState } from 'react';
import {
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import DeleteAccountModal from './DeleteAccountModal';
import ConsentManagementPanel from './ConsentManagementPanel';
import { useAuth } from '../../contexts/AuthContext';

const DataPrivacyPanel = () => {
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleExportData = async () => {
    setExportLoading(true);
    setExportStatus(null);

    try {
      const response = await fetch('/api/v1/data-export-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const data = await response.json();

      setExportStatus({
        type: 'success',
        message: 'Data export initiated successfully. You will receive an email with a secure download link within 24 hours.'
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: 'Failed to initiate data export. Please try again or contact support.'
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Portability Section */}
      <GlassCard>
        <div className="flex items-start space-x-3 mb-6">
          <ArrowDownTrayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Data Portability
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download a complete copy of your personal data in a machine-readable format (JSON).
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-2">Your export will include:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Profile information and preferences</li>
                <li>Booking history and travel data</li>
                <li>Community posts, reviews, and connections</li>
                <li>Trip requests and saved wishlists</li>
                <li>URLs to your uploaded media files</li>
                <li>Consent and privacy preferences</li>
              </ul>
            </div>
          </div>
        </div>

        {exportStatus && (
          <div className={`mb-4 p-4 rounded-lg ${
            exportStatus.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              exportStatus.type === 'success'
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {exportStatus.message}
            </p>
          </div>
        )}

        <GlassButton
          variant="primary"
          onClick={handleExportData}
          disabled={exportLoading}
          className="w-full sm:w-auto"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          {exportLoading ? 'Processing Request...' : 'Request Data Export'}
        </GlassButton>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Export requests are processed within 24 hours. You'll receive an email with a secure download link valid for 48 hours.
        </p>
      </GlassCard>

      {/* Consent Management Section */}
      <ConsentManagementPanel />

      {/* Account Erasure Section */}
      <GlassCard>
        <div className="flex items-start space-x-3 mb-6">
          <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Account Erasure
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permanently delete your account and all associated personal data.
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-2">Warning: This action is permanent and cannot be undone.</p>
              <p className="mb-2">When you delete your account:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Your profile and personal information will be permanently deleted</li>
                <li>All bookings, payments, and transaction history will be removed</li>
                <li>Your community posts and reviews will be anonymized</li>
                <li>Connected third-party accounts (Stripe, analytics) will be notified</li>
                <li>You will be immediately logged out and cannot recover your account</li>
              </ul>
            </div>
          </div>
        </div>

        <GlassButton
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
          className="w-full sm:w-auto"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Delete My Account
        </GlassButton>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Before deleting, consider exporting your data. Some anonymized content may remain for community integrity.
        </p>
      </GlassCard>

      {/* GDPR Rights Information */}
      <GlassCard>
        <div className="flex items-start space-x-3 mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Your Privacy Rights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Under GDPR and other privacy regulations, you have the following rights:
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Access:</span>
            <span>View and download all personal data we hold about you</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Rectification:</span>
            <span>Correct any inaccurate or incomplete personal data</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Erasure:</span>
            <span>Request deletion of your personal data (right to be forgotten)</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Restriction:</span>
            <span>Limit how we process your personal data</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Portability:</span>
            <span>Receive your data in a portable format</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Object:</span>
            <span>Object to processing of your personal data</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium min-w-fit">✓ Right to Withdraw Consent:</span>
            <span>Revoke consent for data processing at any time</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            For additional privacy requests or questions, contact our Data Protection Officer:
          </p>
          <a
            href="mailto:privacy@trvlsocial.com"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            privacy@trvlsocial.com
          </a>
        </div>
      </GlassCard>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default DataPrivacyPanel;

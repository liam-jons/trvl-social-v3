import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation

  const requiredText = 'DELETE MY ACCOUNT';
  const isConfirmationValid = confirmationText === requiredText && agreeTerms && password.length >= 6;

  const handleClose = () => {
    if (!deleting) {
      setConfirmationText('');
      setPassword('');
      setAgreeTerms(false);
      setError(null);
      setStep(1);
      onClose();
    }
  };

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) return;

    setDeleting(true);
    setError(null);

    try {
      // Step 1: Re-authenticate with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (signInError) {
        throw new Error('Invalid password. Please enter your correct password to continue.');
      }

      // Step 2: Call the account deletion Edge Function
      const { data, error: deletionError } = await supabase.functions.invoke(
        'account-deletion-request',
        {
          body: {
            userId: user.id,
            confirmation: confirmationText
          }
        }
      );

      if (deletionError) {
        throw new Error(deletionError.message || 'Failed to delete account');
      }

      // Step 3: Sign out the user
      await signOut();

      // Step 4: Redirect to home page with message
      window.location.href = '/?message=account-deleted';

    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.message || 'An error occurred while deleting your account. Please try again or contact support.');
      setDeleting(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={!deleting}
      closeOnEsc={!deleting}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action is permanent and cannot be undone
            </p>
          </div>
          {!deleting && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {step === 1 && (
          <>
            {/* Warning Step */}
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Important: What happens when you delete your account
                  </h3>
                  <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
                    <p className="font-semibold">All of the following will be permanently deleted:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Your profile, account credentials, and personal information</li>
                      <li>All bookings, payment methods, and transaction history</li>
                      <li>Saved wishlists, trip requests, and travel preferences</li>
                      <li>Direct messages and private communications</li>
                      <li>Uploaded photos and media files</li>
                      <li>Privacy preferences and consent settings</li>
                    </ul>

                    <p className="font-semibold mt-4">The following will be anonymized but not deleted:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Community posts and comments (for community integrity)</li>
                      <li>Public reviews of adventures and vendors</li>
                      <li>Forum contributions and discussions</li>
                    </ul>

                    <p className="font-semibold mt-4">We will also:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Notify Stripe to delete your payment customer profile</li>
                      <li>Request deletion from our analytics providers (Mixpanel, etc.)</li>
                      <li>Remove you from all marketing and communication lists</li>
                      <li>Send erasure requests to all integrated third-party services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Before you continue:</strong> We recommend exporting your data first. Once your account is deleted, this data cannot be recovered.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <GlassButton
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="danger"
                onClick={() => setStep(2)}
              >
                Continue to Delete
              </GlassButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Confirmation Step */}
            <div className="space-y-4">
              {/* Re-authentication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your password to confirm
                </label>
                <GlassInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your current password"
                  disabled={deleting}
                  required
                  autoComplete="current-password"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For security, we need to verify your identity
                </p>
              </div>

              {/* Confirmation Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{requiredText}</span> to confirm
                </label>
                <GlassInput
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type the confirmation text"
                  disabled={deleting}
                  required
                />
                {confirmationText && confirmationText !== requiredText && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Text must match exactly (case-sensitive)
                  </p>
                )}
              </div>

              {/* Final Acknowledgment */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={deleting}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="agree-terms"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  I understand that this action is permanent and cannot be undone. All my personal data will be permanently deleted from TRVL Social and integrated third-party services.
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <GlassButton
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={deleting}
              >
                Back
              </GlassButton>
              <GlassButton
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={!isConfirmationValid || deleting}
              >
                {deleting ? 'Deleting Account...' : 'Permanently Delete Account'}
              </GlassButton>
            </div>
          </>
        )}
      </div>
    </GlassModal>
  );
};

export default DeleteAccountModal;

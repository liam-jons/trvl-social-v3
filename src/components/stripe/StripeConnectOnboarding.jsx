/**
 * Stripe Connect Onboarding Component
 * Comprehensive vendor onboarding flow with Stripe Connect
 * Features: KYC verification, document upload, status tracking, notifications
 */
import React, { useState, useEffect } from 'react';
import { stripeConnect } from '../../services/stripe-service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { supabase } from '../../lib/supabase.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import GlassInput from '../ui/GlassInput.jsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  InformationCircleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
const StripeConnectOnboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [onboardingUrl, setOnboardingUrl] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('initial'); // initial, creating, onboarding, verifying, complete, rejected
  const [businessInfo, setBusinessInfo] = useState({
    businessType: 'individual',
    country: 'US',
    businessUrl: '',
    businessName: '',
    businessDescription: ''
  });
  const [notifications, setNotifications] = useState([]);
  // Check if user already has a Stripe account and load status
  useEffect(() => {
    const checkExistingAccount = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Check database for existing Stripe account
        const { data: existingAccount, error: dbError } = await supabase
          .from('vendor_stripe_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (dbError && dbError.code !== 'PGRST116') {
          throw dbError;
        }
        if (existingAccount) {
          setAccount({ accountId: existingAccount.stripe_account_id });
          // Get current account status from Stripe
          try {
            const status = await stripeConnect.getAccountStatus(existingAccount.stripe_account_id);
            setAccountStatus(status);
            setRequirements(status.requirements);
            // Determine onboarding step based on account status
            if (status.charges_enabled && status.payouts_enabled) {
              setOnboardingStep('complete');
            } else if (status.details_submitted) {
              setOnboardingStep('verifying');
            } else {
              setOnboardingStep('onboarding');
            }
          } catch (statusError) {
            setOnboardingStep('onboarding');
          }
        }
        // Load any existing notifications
        loadNotifications();
      } catch (error) {
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };
    checkExistingAccount();
  }, [user]);
  // Load notifications for the user
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'stripe_onboarding')
        .order('created_at', { ascending: false })
        .limit(5);
      setNotifications(notifs || []);
    } catch (error) {
    }
  };
  // Add notification
  const addNotification = async (title, message, type = 'info') => {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    // Save to database
    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'stripe_onboarding',
        title,
        message,
        data: { type },
        read: false
      });
    } catch (error) {
    }
  };
  // Create Stripe Connect account with business info
  const handleCreateAccount = async () => {
    if (!user) {
      setError('You must be logged in to create a Stripe account');
      return;
    }
    setLoading(true);
    setError(null);
    setOnboardingStep('creating');
    try {
      await addNotification(
        'Account Creation Started',
        'Creating your Stripe Connect account...',
        'info'
      );
      // Create Stripe Connect account with business information
      const result = await stripeConnect.createAccount({
        userId: user.id,
        email: user.email,
        businessType: businessInfo.businessType,
        country: businessInfo.country,
        businessProfile: {
          url: businessInfo.businessUrl || undefined,
          mcc: '7999', // Amusement and Recreation Services
          name: businessInfo.businessName || undefined,
          product_description: businessInfo.businessDescription || 'Travel and adventure services'
        }
      });
      setAccount(result);
      await addNotification(
        'Account Created Successfully',
        'Your Stripe Connect account has been created. Complete the onboarding process to start accepting payments.',
        'success'
      );
      // Generate onboarding link
      const linkResult = await stripeConnect.createOnboardingLink(
        result.accountId,
        user.id
      );
      setOnboardingUrl(linkResult.url);
      setOnboardingStep('onboarding');
    } catch (error) {
      setError(error.message || 'Failed to create Stripe account');
      setOnboardingStep('initial');
      await addNotification(
        'Account Creation Failed',
        error.message || 'Failed to create Stripe account. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  // Regenerate onboarding link for incomplete accounts
  const handleRegenerateOnboardingLink = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const linkResult = await stripeConnect.createOnboardingLink(
        account.accountId,
        user.id
      );
      setOnboardingUrl(linkResult.url);
      await addNotification(
        'New Onboarding Link Generated',
        'A new onboarding link has been created. Please complete the process.',
        'info'
      );
    } catch (error) {
      setError(error.message || 'Failed to generate onboarding link');
    } finally {
      setLoading(false);
    }
  };
  // Handle onboarding completion (called when user returns from Stripe)
  const handleOnboardingComplete = async () => {
    if (!account) return;
    setLoading(true);
    setOnboardingStep('verifying');
    try {
      // Check account status
      const status = await stripeConnect.getAccountStatus(account.accountId);
      setAccountStatus(status);
      setRequirements(status.requirements);
      if (status.charges_enabled && status.payouts_enabled) {
        // Account is fully set up
        await stripeConnect.updateAccountStatus(account.accountId, 'active');
        setOnboardingStep('complete');
        await addNotification(
          'Onboarding Complete!',
          'Your account is now active and ready to accept payments.',
          'success'
        );
      } else if (status.details_submitted) {
        // Account submitted but still under review
        await stripeConnect.updateAccountStatus(account.accountId, 'pending');
        setOnboardingStep('verifying');
        await addNotification(
          'Account Under Review',
          'Your account information has been submitted and is being reviewed by Stripe.',
          'info'
        );
      } else {
        // Account needs more information
        const missingRequirements = [
          ...status.requirements.currently_due,
          ...status.requirements.eventually_due
        ];
        setError(
          `Your account needs additional information: ${missingRequirements.join(', ')}. Please complete the onboarding process.`
        );
        await addNotification(
          'Additional Information Required',
          `Please provide: ${missingRequirements.slice(0, 3).join(', ')}${missingRequirements.length > 3 ? '...' : ''}`,
          'warning'
        );
      }
    } catch (error) {
      setError('Failed to verify account status');
      setOnboardingStep('onboarding');
      await addNotification(
        'Verification Failed',
        'Unable to verify your account status. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  // Refresh account status
  const refreshAccountStatus = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const status = await stripeConnect.getAccountStatus(account.accountId);
      setAccountStatus(status);
      setRequirements(status.requirements);
      if (status.charges_enabled && status.payouts_enabled) {
        setOnboardingStep('complete');
      } else if (status.details_submitted) {
        setOnboardingStep('verifying');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  // Check URL parameters for onboarding completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('account_id');
    if (accountId) {
      setAccount({ accountId });
      handleOnboardingComplete();
    }
  }, []);
  if (!user) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Vendor Onboarding</h2>
          <p className="text-gray-300 mb-4">
            Please log in to start your vendor onboarding process.
          </p>
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-6 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">
          Become a TRVL Social Vendor
        </h2>
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        {!account && !onboardingUrl && (
          <>
            <p className="text-gray-300 mb-6">
              Start accepting payments for your adventures by setting up your Stripe account.
              This secure process takes just a few minutes.
            </p>
            <div className="space-y-4">
              <div className="text-left">
                <h3 className="font-medium text-white mb-2">What you'll need:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Business information</li>
                  <li>• Bank account details</li>
                  <li>• Identity verification documents</li>
                  <li>• Business registration (if applicable)</li>
                </ul>
              </div>
              <div className="border-t border-gray-600 pt-4">
                <GlassButton
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Setting up...
                    </div>
                  ) : (
                    'Start Vendor Setup'
                  )}
                </GlassButton>
              </div>
            </div>
          </>
        )}
        {onboardingUrl && (
          <>
            <p className="text-gray-300 mb-6">
              Your Stripe account has been created! Click below to complete the onboarding process.
            </p>
            <GlassButton
              as="a"
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              Complete Onboarding with Stripe
            </GlassButton>
            <p className="text-xs text-gray-400 mt-4">
              This will open Stripe's secure onboarding process in a new window.
            </p>
          </>
        )}
        {account && !onboardingUrl && (
          <>
            <div className="animate-pulse">
              <div className="h-8 w-8 mx-auto mb-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-300">
              Verifying your account setup...
            </p>
          </>
        )}
      </div>
    </GlassCard>
  );
};
StripeConnectOnboarding.displayName = 'StripeConnectOnboarding';
export default StripeConnectOnboarding;
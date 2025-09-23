import React, { useState, useEffect } from 'react';
import { PhoneIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import useNotificationStore from '../../stores/notificationStore';
import { toast } from 'react-hot-toast';
/**
 * WhatsApp Settings Component
 * Manages WhatsApp notification preferences and opt-in/opt-out
 */
export default function WhatsAppSettings() {
  const { user } = useAuthStore();
  const { preferences, updatePreferences } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappPreferences, setWhatsappPreferences] = useState({
    enabled: false,
    bookingConfirmations: true,
    tripReminders: true,
    vendorOffers: true,
    groupInvitations: true,
    customerSupport: true
  });
  useEffect(() => {
    loadUserProfile();
    loadWhatsAppPreferences();
  }, []);
  /**
   * Load user profile including phone number
   */
  const loadUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setPhoneNumber(profile?.phone_number || '');
    } catch (error) {
    }
  };
  /**
   * Load WhatsApp notification preferences
   */
  const loadWhatsAppPreferences = async () => {
    try {
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('whatsapp_notifications, whatsapp_preferences')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (prefs) {
        setWhatsappPreferences({
          enabled: prefs.whatsapp_notifications !== false,
          ...prefs.whatsapp_preferences
        });
      }
    } catch (error) {
    }
  };
  /**
   * Update phone number
   */
  const updatePhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Please enter a valid phone number with country code');
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          phone_number: formattedPhone,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      setPhoneNumber(formattedPhone);
      toast.success('Phone number updated successfully');
    } catch (error) {
      toast.error('Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };
  /**
   * Update WhatsApp preferences
   */
  const updateWhatsAppPreferences = async (newPreferences) => {
    setLoading(true);
    try {
      // Update local state
      const updatedPrefs = { ...whatsappPreferences, ...newPreferences };
      setWhatsappPreferences(updatedPrefs);
      // Update in database
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          whatsapp_notifications: updatedPrefs.enabled,
          whatsapp_preferences: {
            bookingConfirmations: updatedPrefs.bookingConfirmations,
            tripReminders: updatedPrefs.tripReminders,
            vendorOffers: updatedPrefs.vendorOffers,
            groupInvitations: updatedPrefs.groupInvitations,
            customerSupport: updatedPrefs.customerSupport
          },
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      // Update notification store
      await updatePreferences({
        whatsappNotifications: updatedPrefs.enabled
      });
      toast.success('WhatsApp preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
      // Revert local state
      loadWhatsAppPreferences();
    } finally {
      setLoading(false);
    }
  };
  /**
   * Send test WhatsApp message
   */
  const sendTestMessage = async () => {
    if (!phoneNumber) {
      toast.error('Please add your phone number first');
      return;
    }
    if (!whatsappPreferences.enabled) {
      toast.error('Please enable WhatsApp notifications first');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          type: 'text',
          to: phoneNumber,
          message: '🎯 Test message from TRVL!\n\nYour WhatsApp notifications are working correctly. You\'ll now receive updates about your adventures directly on WhatsApp!'
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test message');
      }
      toast.success('Test message sent! Check your WhatsApp.');
    } catch (error) {
      toast.error(error.message || 'Failed to send test message');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">WhatsApp Settings</h3>
        <p className="text-sm text-gray-500">
          Manage your WhatsApp notifications and communication preferences
        </p>
      </div>
      {/* Phone Number Section */}
      <div className="border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center">
          <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Phone Number</h4>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your WhatsApp Phone Number
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Include country code (e.g., +1 for US, +44 for UK)
            </p>
            <div className="flex gap-3">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={updatePhoneNumber}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          {phoneNumber && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              <span>Phone number saved</span>
            </div>
          )}
        </div>
      </div>
      {/* WhatsApp Notifications */}
      <div className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="text-md font-medium text-gray-900">WhatsApp Notifications</h4>
        {!phoneNumber && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium">Phone Number Required</p>
                <p className="text-yellow-700">
                  Please add your WhatsApp phone number to enable notifications.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Master Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h5 className="text-sm font-medium text-gray-900">Enable WhatsApp Notifications</h5>
            <p className="text-sm text-gray-500">Receive notifications via WhatsApp</p>
          </div>
          <button
            onClick={() => updateWhatsAppPreferences({ enabled: !whatsappPreferences.enabled })}
            disabled={loading || !phoneNumber}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              whatsappPreferences.enabled ? 'bg-green-600' : 'bg-gray-200'
            } ${!phoneNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                whatsappPreferences.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {/* Specific Notifications */}
        {whatsappPreferences.enabled && phoneNumber && (
          <div className="space-y-3 pl-4 border-l-2 border-green-100">
            {[
              {
                key: 'bookingConfirmations',
                title: 'Booking Confirmations',
                description: 'Get notified when your bookings are confirmed'
              },
              {
                key: 'tripReminders',
                title: 'Trip Reminders',
                description: 'Receive reminders before your adventures'
              },
              {
                key: 'vendorOffers',
                title: 'Vendor Offers',
                description: 'Get personalized offers from adventure vendors'
              },
              {
                key: 'groupInvitations',
                title: 'Group Invitations',
                description: 'Receive invitations to join travel groups'
              },
              {
                key: 'customerSupport',
                title: 'Customer Support',
                description: 'Allow customer support to contact you via WhatsApp'
              }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <h6 className="text-sm font-medium text-gray-900">{item.title}</h6>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <button
                  onClick={() => updateWhatsAppPreferences({ [item.key]: !whatsappPreferences[item.key] })}
                  disabled={loading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    whatsappPreferences[item.key] ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      whatsappPreferences[item.key] ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Test Message */}
        {whatsappPreferences.enabled && phoneNumber && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={sendTestMessage}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Test Message'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Send a test message to verify your WhatsApp notifications are working.
            </p>
          </div>
        )}
      </div>
      {/* Privacy Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2">Privacy & Data</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Your phone number is used only for WhatsApp notifications</li>
          <li>• You can opt out of notifications at any time</li>
          <li>• We never share your contact information with third parties</li>
          <li>• Standard messaging rates may apply</li>
        </ul>
      </div>
    </div>
  );
}
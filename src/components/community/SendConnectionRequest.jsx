/**
 * Send Connection Request Component
 * Modal/form for sending connection requests with personalized messages
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { connectionService } from '../../services/connection-service';
import { X, Send, User } from 'lucide-react';

const SendConnectionRequest = ({
  recipientId,
  recipientProfile,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    try {
      setSending(true);

      const result = await connectionService.sendConnectionRequest(recipientId, message);

      if (result.success) {
        onSuccess?.();
        onClose();
        setMessage(''); // Reset form
      } else {
        console.error('Failed to send request:', result.error);
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Send Connection Request</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Recipient Info */}
          {recipientProfile && (
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
              <img
                src={recipientProfile.avatar_url || '/default-avatar.png'}
                alt={`${recipientProfile.first_name} ${recipientProfile.last_name}`}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-medium text-gray-900">
                  {recipientProfile.first_name} {recipientProfile.last_name}
                </h4>
                {recipientProfile.location && (
                  <p className="text-sm text-gray-600">{recipientProfile.location}</p>
                )}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to connect and maybe plan future adventures together..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
              maxLength="500"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {message.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SendConnectionRequest;
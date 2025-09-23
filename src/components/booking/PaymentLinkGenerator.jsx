/**
 * PaymentLinkGenerator - Component for generating and sharing payment links
 * Handles link generation, sharing options, and communication with participants
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GlassInput } from '../ui/GlassInput';
import { supabase } from '../../lib/supabase';
import {
  Link,
  Copy,
  Mail,
  MessageSquare,
  Share2,
  ExternalLink,
  CheckCircle,
  Send,
  QrCode,
  Download
} from 'lucide-react';
const PaymentLinkGenerator = ({
  splitPaymentId,
  individualPayments = [],
  splitPaymentDetails,
  onPaymentUpdate,
  disabled = false
}) => {
  const [paymentLinks, setPaymentLinks] = useState({});
  const [copiedLinks, setCopiedLinks] = useState({});
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [sendingEmails, setSendingEmails] = useState({});
  const [customMessage, setCustomMessage] = useState('');
  const [showQRCodes, setShowQRCodes] = useState({});
  // Generate payment links for all participants
  useEffect(() => {
    if (individualPayments.length > 0) {
      generateAllPaymentLinks();
    }
  }, [individualPayments]);
  const generateAllPaymentLinks = async () => {
    setGeneratingLinks(true);
    try {
      const links = {};
      for (const payment of individualPayments) {
        const link = await generatePaymentLink(payment);
        links[payment.id] = link;
      }
      setPaymentLinks(links);
    } catch (err) {
    } finally {
      setGeneratingLinks(false);
    }
  };
  const generatePaymentLink = async (payment) => {
    const baseUrl = window.location.origin;
    const paymentToken = generateSecureToken(payment.id, payment.user_id);
    // Store payment token in database for verification
    try {
      await supabase
        .from('payment_tokens')
        .upsert({
          individual_payment_id: payment.id,
          token: paymentToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
    } catch (err) {
    }
    return `${baseUrl}/pay/${paymentToken}`;
  };
  const generateSecureToken = (paymentId, userId) => {
    // Generate a secure token combining payment ID, user ID, and timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return btoa(`${paymentId}-${userId}-${timestamp}-${randomString}`).replace(/[+=\/]/g, '');
  };
  const handleCopyLink = async (paymentId, link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinks({ ...copiedLinks, [paymentId]: true });
      setTimeout(() => {
        setCopiedLinks(prev => ({ ...prev, [paymentId]: false }));
      }, 2000);
    } catch (err) {
    }
  };
  const handleSendEmail = async (payment) => {
    setSendingEmails({ ...sendingEmails, [payment.id]: true });
    try {
      const link = paymentLinks[payment.id];
      const participantName = payment.metadata?.participantName || 'there';
      const amount = formatCurrency(payment.amount_due);
      const deadline = formatDate(payment.payment_deadline);
      const emailData = {
        to: payment.metadata?.participantEmail,
        subject: `Payment Required: ${splitPaymentDetails?.description || 'Group Booking'}`,
        body: `Hi ${participantName},
You've been included in a group booking payment split. Here are the details:
• Amount Due: ${amount}
• Payment Deadline: ${deadline}
• Description: ${splitPaymentDetails?.description || 'Group Booking'}
${customMessage ? `\nPersonal message:\n${customMessage}\n` : ''}
Click the link below to complete your payment:
${link}
This link is secure and specific to your portion of the payment. If you have any questions, please reply to this email.
Best regards,
The TRVL Social Team`,
      };
      // Send email via API
      const response = await fetch('/api/send-payment-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      // Update reminder count
      await supabase
        .from('individual_payments')
        .update({
          reminder_count: (payment.reminder_count || 0) + 1,
          last_reminder_sent: new Date().toISOString(),
        })
        .eq('id', payment.id);
      onPaymentUpdate?.();
    } catch (err) {
    } finally {
      setSendingEmails({ ...sendingEmails, [payment.id]: false });
    }
  };
  const handleSendAllEmails = async () => {
    const pendingPayments = individualPayments.filter(p => p.status === 'pending');
    for (const payment of pendingPayments) {
      await handleSendEmail(payment);
      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };
  const handleShareLink = async (payment) => {
    const link = paymentLinks[payment.id];
    const amount = formatCurrency(payment.amount_due);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Group Payment Request',
          text: `Please complete your payment of ${amount} for our group booking.`,
          url: link,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying link
      handleCopyLink(payment.id, link);
    }
  };
  const generateQRCode = (link) => {
    // Generate QR code URL using a QR code service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    return qrCodeUrl;
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: splitPaymentDetails?.currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-amber-600 bg-amber-50';
    }
  };
  const pendingPayments = individualPayments.filter(p => p.status === 'pending');
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium flex items-center">
            <Link className="w-4 h-4 mr-2" />
            Payment Links
          </h4>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateAllPaymentLinks}
              disabled={generatingLinks || disabled}
            >
              {generatingLinks ? 'Generating...' : 'Refresh Links'}
            </Button>
            {pendingPayments.length > 0 && (
              <Button
                size="sm"
                onClick={handleSendAllEmails}
                disabled={disabled}
              >
                <Send className="w-3 h-3 mr-1" />
                Send All Reminders
              </Button>
            )}
          </div>
        </div>
        {/* Custom Message */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">
            Personal Message (optional)
          </label>
          <GlassInput
            as="textarea"
            rows={3}
            placeholder="Add a personal message to include in payment emails..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            disabled={disabled}
          />
        </div>
      </Card>
      {/* Individual Payment Links */}
      <div className="space-y-4">
        {individualPayments.map((payment) => (
          <Card key={payment.id} className={`p-4 ${getStatusColor(payment.status)}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">
                  {payment.metadata?.participantName || 'Unknown Participant'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.metadata?.participantEmail}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(payment.amount_due)}
                </p>
                <Badge variant={
                  payment.status === 'paid' ? 'default' : 'outline'
                }>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </div>
            </div>
            {payment.status === 'pending' && paymentLinks[payment.id] && (
              <div className="space-y-3">
                {/* Payment Link */}
                <div className="flex items-center space-x-2">
                  <GlassInput
                    value={paymentLinks[payment.id]}
                    readOnly
                    className="flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(payment.id, paymentLinks[payment.id])}
                  >
                    {copiedLinks[payment.id] ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(payment)}
                    disabled={sendingEmails[payment.id] || disabled}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    {sendingEmails[payment.id] ? 'Sending...' : 'Send Email'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareLink(payment)}
                    disabled={disabled}
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(paymentLinks[payment.id], '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Test Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRCodes(prev => ({
                      ...prev,
                      [payment.id]: !prev[payment.id]
                    }))}
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    QR Code
                  </Button>
                </div>
                {/* QR Code */}
                {showQRCodes[payment.id] && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <div className="text-center">
                      <img
                        src={generateQRCode(paymentLinks[payment.id])}
                        alt="Payment QR Code"
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Scan to pay {formatCurrency(payment.amount_due)}
                      </p>
                    </div>
                  </div>
                )}
                {/* Reminder History */}
                {payment.reminder_count > 0 && (
                  <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                    <p>
                      {payment.reminder_count} reminder(s) sent
                      {payment.last_reminder_sent && (
                        <span className="ml-2">
                          (Last: {new Date(payment.last_reminder_sent).toLocaleDateString()})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            {payment.status === 'paid' && (
              <div className="flex items-center justify-center p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-700 font-medium">
                  Payment completed {payment.paid_at && formatDate(payment.paid_at)}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>
      {/* Instructions */}
      <Card className="p-4 bg-muted/30">
        <h5 className="text-sm font-medium mb-2">How to Use Payment Links</h5>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Each participant gets a unique, secure payment link</li>
          <li>• Links expire after 7 days for security</li>
          <li>• Participants don't need to create an account to pay</li>
          <li>• You'll receive real-time notifications when payments are made</li>
          <li>• QR codes work great for in-person sharing</li>
        </ul>
      </Card>
    </div>
  );
};
export default PaymentLinkGenerator;
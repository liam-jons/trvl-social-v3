import whatsAppService from '../../src/services/whatsapp-service.js';
import { supabase } from '../../src/lib/supabase.js';

/**
 * WhatsApp message sending API endpoint
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const {
      type,
      to,
      message,
      templateName,
      templateParams,
      bookingData,
      tripData,
      offerData
    } = req.body;

    // Validate required fields
    if (!type || !to) {
      return res.status(400).json({
        error: 'Missing required fields: type, to'
      });
    }

    let result;

    // Handle different message types
    switch (type) {
      case 'text':
        if (!message) {
          return res.status(400).json({ error: 'Message text is required' });
        }
        result = await whatsAppService.sendTextMessage(to, message);
        break;

      case 'template':
        if (!templateName) {
          return res.status(400).json({ error: 'Template name is required' });
        }
        result = await whatsAppService.sendTemplateMessage(
          to,
          templateName,
          'en',
          templateParams || []
        );
        break;

      case 'booking_confirmation':
        if (!bookingData) {
          return res.status(400).json({ error: 'Booking data is required' });
        }
        result = await whatsAppService.sendBookingConfirmation(to, bookingData);
        break;

      case 'trip_reminder':
        if (!tripData) {
          return res.status(400).json({ error: 'Trip data is required' });
        }
        result = await whatsAppService.sendTripReminder(to, tripData);
        break;

      case 'vendor_offer':
        if (!offerData) {
          return res.status(400).json({ error: 'Offer data is required' });
        }
        result = await whatsAppService.sendVendorOffer(to, offerData);
        break;

      default:
        return res.status(400).json({ error: 'Invalid message type' });
    }

    if (result.success) {
      // Log the message in database
      try {
        await supabase
          .from('whatsapp_messages')
          .insert({
            message_id: result.messageId,
            user_id: user.id,
            phone_number: to,
            message_type: type,
            message_content: message || JSON.stringify({
              templateName,
              templateParams,
              bookingData,
              tripData,
              offerData
            }),
            status: 'sent',
            sent_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Error logging WhatsApp message:', logError);
        // Don't fail the request for logging errors
      }

      return res.status(200).json({
        status: 'success',
        messageId: result.messageId,
        message: 'WhatsApp message sent successfully'
      });
    } else {
      return res.status(400).json({
        status: 'error',
        error: result.error,
        message: 'Failed to send WhatsApp message'
      });
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
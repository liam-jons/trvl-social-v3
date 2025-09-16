import whatsAppService from '../../src/services/whatsapp-service.js';

/**
 * WhatsApp webhook endpoint for handling incoming messages and status updates
 */
export default async function handler(req, res) {
  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      // Verify the token matches our configured verify token
      if (mode === 'subscribe' && token === whatsAppService.getVerifyToken()) {
        console.log('WhatsApp webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        console.error('WhatsApp webhook verification failed');
        return res.status(403).json({ error: 'Forbidden' });
      }
    } catch (error) {
      console.error('Error verifying WhatsApp webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle incoming messages and status updates (POST request)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      const signature = req.headers['x-hub-signature-256'];

      // Verify webhook signature for security
      const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
      if (webhookSecret && signature) {
        const isValid = whatsAppService.verifyWebhookSignature(
          JSON.stringify(body),
          signature,
          webhookSecret
        );

        if (!isValid) {
          console.error('Invalid webhook signature');
          return res.status(403).json({ error: 'Invalid signature' });
        }
      }

      // Process the webhook data
      const result = await whatsAppService.processWebhookMessage(body);

      if (result.success) {
        // Execute any actions determined from the messages
        for (const processedMessage of result.processedMessages) {
          if (processedMessage.success && processedMessage.actions) {
            await whatsAppService.executeMessageActions(
              processedMessage.messageData,
              processedMessage.actions
            );
          }
        }

        console.log(`Processed ${result.totalProcessed} WhatsApp messages`);
        return res.status(200).json({
          status: 'success',
          processed: result.totalProcessed
        });
      } else {
        console.error('Error processing webhook:', result.error);
        return res.status(400).json({
          status: 'error',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
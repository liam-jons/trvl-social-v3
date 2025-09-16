# WhatsApp Business API Integration Setup Guide

## Overview

This document provides a comprehensive guide to setting up WhatsApp Business API integration for the TRVL Social platform. The integration enables:

- One-click WhatsApp group creation for travel adventures
- Automated booking confirmations and trip reminders
- Two-way messaging between vendors and customers
- Opt-in/opt-out management for users
- Webhook handling for incoming messages

## Prerequisites

1. **Facebook Business Account**: Required to access WhatsApp Business API
2. **WhatsApp Business Account**: Must be verified and approved
3. **Meta Developer Account**: For API access and app configuration
4. **HTTPS Domain**: Required for webhook endpoints
5. **Phone Number**: Dedicated business phone number for WhatsApp

## Setup Steps

### 1. Create Facebook Business Account

1. Go to [Facebook Business](https://business.facebook.com)
2. Create a new business account or use existing
3. Verify your business information
4. Add your business phone number

### 2. Set Up WhatsApp Business API

1. Navigate to [Meta for Developers](https://developers.facebook.com)
2. Create a new app or use existing
3. Add WhatsApp Business API product to your app
4. Complete business verification process
5. Add and verify your business phone number

### 3. Get API Credentials

After setup, collect these credentials:

```bash
# WhatsApp Business API Configuration
VITE_WHATSAPP_API_BASE_URL="https://graph.facebook.com/v18.0"
VITE_WHATSAPP_ACCESS_TOKEN="your_access_token_here"
VITE_WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
VITE_WHATSAPP_VERIFY_TOKEN="your_custom_verify_token"
WHATSAPP_WEBHOOK_SECRET="your_webhook_secret"
```

#### How to Get Each Credential:

**Access Token:**
- Go to your Meta App Dashboard
- Navigate to WhatsApp > API Setup
- Copy the temporary access token
- For production, generate a permanent access token

**Phone Number ID:**
- In WhatsApp > API Setup
- Find your phone number in the "From" dropdown
- Copy the Phone Number ID (not the display number)

**Verify Token:**
- Create your own random string (e.g., "my_verify_token_123")
- This is used to verify your webhook endpoint

**Webhook Secret:**
- Create a strong random string for signature verification
- Used to validate incoming webhook requests

### 4. Configure Webhooks

1. **Set Webhook URL:**
   ```
   https://yourdomain.com/api/whatsapp/webhook
   ```

2. **Configure Webhook Fields:**
   - `messages` - For incoming messages
   - `message_deliveries` - For delivery status
   - `message_reads` - For read receipts

3. **Test Webhook:**
   ```bash
   # WhatsApp will send a GET request to verify your endpoint
   # Your endpoint should return the hub.challenge parameter
   ```

### 5. Environment Variables

Add these variables to your `.env` file:

```bash
# WhatsApp Business API Configuration
VITE_WHATSAPP_API_BASE_URL="https://graph.facebook.com/v18.0"
VITE_WHATSAPP_ACCESS_TOKEN="EAAG..."  # Your access token
VITE_WHATSAPP_PHONE_NUMBER_ID="123456789"  # Your phone number ID
VITE_WHATSAPP_VERIFY_TOKEN="my_verify_token_123"  # Your custom token
WHATSAPP_WEBHOOK_SECRET="your_strong_secret_key"  # Webhook signature secret
```

### 6. Database Migration

Run the WhatsApp database migration:

```bash
# Apply the WhatsApp tables migration
npx supabase migration up
```

This creates:
- `whatsapp_groups` - WhatsApp group management
- `whatsapp_messages` - Message logging
- `whatsapp_webhooks` - Webhook event storage
- Updates `user_preferences` - WhatsApp notification settings

## Testing Setup

### 1. Webhook Testing (Development)

Use ngrok for local development:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the HTTPS URL for webhook configuration
https://abc123.ngrok.io/api/whatsapp/webhook
```

### 2. Send Test Message

```javascript
// Test sending a message
const response = await fetch('/api/whatsapp/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    type: 'text',
    to: '+1234567890',
    message: 'Hello from TRVL! Your WhatsApp integration is working.'
  })
});
```

### 3. Test Webhook Reception

```bash
# Send a message to your business number
# Check the webhook endpoint receives the data
# Verify the webhook is processed correctly
```

## API Endpoints

### Send Message
```bash
POST /api/whatsapp/messages
Content-Type: application/json
Authorization: Bearer <user-token>

{
  "type": "text",
  "to": "+1234567890",
  "message": "Hello from TRVL!"
}
```

### Create Group
```bash
POST /api/whatsapp/groups
Content-Type: application/json
Authorization: Bearer <user-token>

{
  "name": "Bali Adventure Group",
  "description": "Let's explore Bali together!",
  "adventureId": "uuid-here",
  "adminPhoneNumber": "+1234567890",
  "members": [
    {"name": "John", "phone": "+1234567891"},
    {"name": "Jane", "phone": "+1234567892"}
  ]
}
```

### Webhook Handler
```bash
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
POST /api/whatsapp/webhook
```

## Message Templates

### Booking Confirmation Template
```
✅ Booking Confirmed!

Adventure: {adventure_name}
Date: {date}
Location: {location}
Group Size: {group_size}

Booking ID: {booking_id}

We'll keep you updated on your WhatsApp! 🎯
```

### Trip Reminder Template
```
⏰ Trip Reminder

Your {adventure_name} adventure is {time_until}!

📍 Meeting Point: {meeting_point}
🕐 Time: {time}

Don't forget: {reminders}

Have an amazing adventure! 🌟
```

### Group Invitation Template
```
🎉 You're invited to join: {group_name}

{description}

{invitation_link ? `Join here: ${invitation_link}` : 'The group admin will send you the invitation link soon.'}
```

## Compliance & Privacy

### User Consent
- Users must explicitly opt-in to WhatsApp notifications
- Provide clear privacy policy regarding WhatsApp usage
- Allow easy opt-out at any time

### Message Content Guidelines
- Keep messages relevant and valuable
- Avoid spam or promotional content
- Follow WhatsApp Business Policy guidelines
- Include opt-out instructions when required

### Rate Limiting
- WhatsApp API has rate limits (1000 messages per second)
- Implement queuing for bulk messages
- Add delays between messages to avoid limits

## Troubleshooting

### Common Issues

**1. Webhook Verification Fails**
```bash
# Check your verify token matches
# Ensure HTTPS endpoint is accessible
# Verify the endpoint returns the challenge parameter
```

**2. Access Token Expired**
```bash
# Temporary tokens expire in 24 hours
# Generate permanent access token for production
# Implement token refresh logic
```

**3. Phone Number Not Registered**
```bash
# Ensure phone number is verified in Meta Business
# Check phone number ID is correct
# Verify number has WhatsApp Business API access
```

**4. Messages Not Delivered**
```bash
# Check recipient has WhatsApp
# Verify recipient hasn't blocked your number
# Ensure message content follows WhatsApp policies
```

### Debug Tools

**1. Meta Graph API Explorer**
- Test API calls directly
- Verify credentials work
- Debug response formats

**2. WhatsApp Business API Logs**
- Check Meta Developer Console logs
- Monitor webhook delivery status
- Review error messages

**3. Local Testing**
```javascript
// Add debug logging to webhook handler
console.log('Webhook received:', req.body);

// Test message sending
const result = await whatsAppService.sendTextMessage(phone, message);
console.log('Send result:', result);
```

## Production Considerations

### Security
- Use HTTPS for all endpoints
- Implement webhook signature verification
- Validate all input data
- Use environment variables for secrets

### Monitoring
- Log all WhatsApp API interactions
- Monitor webhook delivery success
- Track message delivery rates
- Set up alerts for API failures

### Performance
- Implement message queuing
- Use connection pooling
- Cache frequently used data
- Monitor API rate limits

### Backup Plans
- Have fallback notification methods
- Store failed messages for retry
- Implement circuit breaker pattern
- Plan for API downtime

## Support & Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Meta Developer Community](https://developers.facebook.com/community/)

## Frequently Asked Questions

**Q: Can I use WhatsApp Personal API?**
A: No, only WhatsApp Business API is supported for business communications.

**Q: How much does WhatsApp Business API cost?**
A: Pricing varies by country and message volume. Check Meta's pricing page.

**Q: Can I send messages to users who haven't messaged me first?**
A: Only with pre-approved message templates for specific use cases.

**Q: What's the difference between WhatsApp Business App and API?**
A: Business App is for small businesses, API is for larger scale integrations.

**Q: Can I create groups programmatically?**
A: Direct group creation via API is limited. Our implementation guides users through manual group creation with automatic invitation handling.
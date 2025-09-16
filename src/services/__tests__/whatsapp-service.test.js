import { describe, it, expect, beforeEach, vi } from 'vitest';
import whatsAppService from '../whatsapp-service';

// Mock environment variables
vi.stubEnv('VITE_WHATSAPP_ACCESS_TOKEN', 'test-token');
vi.stubEnv('VITE_WHATSAPP_PHONE_NUMBER_ID', '123456789');
vi.stubEnv('VITE_WHATSAPP_VERIFY_TOKEN', 'test-verify-token');

// Mock fetch globally
global.fetch = vi.fn();

describe('WhatsAppService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid credentials', async () => {
      // Mock successful phone number validation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ display_phone_number: '+1234567890' })
      });

      const result = await whatsAppService.initialize();
      expect(result).toBe(true);
    });

    it('should fail to initialize without credentials', async () => {
      // Temporarily remove credentials
      const originalToken = whatsAppService.accessToken;
      whatsAppService.accessToken = null;

      const result = await whatsAppService.initialize();
      expect(result).toBe(false);

      // Restore credentials
      whatsAppService.accessToken = originalToken;
    });
  });

  describe('sendTextMessage', () => {
    it('should send a text message successfully', async () => {
      const mockResponse = {
        messages: [{ id: 'message-123' }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await whatsAppService.sendTextMessage('+1234567890', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/123456789/messages'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test message')
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'Invalid phone number' } })
      });

      const result = await whatsAppService.sendTextMessage('invalid-phone', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send a template message with parameters', async () => {
      const mockResponse = {
        messages: [{ id: 'template-123' }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await whatsAppService.sendTemplateMessage(
        '+1234567890',
        'booking_confirmation',
        'en',
        ['Bali Adventure', 'March 15, 2024']
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('template-123');

      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.type).toBe('template');
      expect(body.template.name).toBe('booking_confirmation');
      expect(body.template.components[0].parameters).toHaveLength(2);
    });
  });

  describe('createGroup', () => {
    it('should create group info and send admin notification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'admin-msg-123' }] })
      });

      const groupData = {
        name: 'Bali Adventure Group',
        description: 'Explore Bali together!',
        members: [
          { name: 'John', phone: '+1234567891' },
          { name: 'Jane', phone: '+1234567892' }
        ],
        adminPhoneNumber: '+1234567890'
      };

      const result = await whatsAppService.createGroup(groupData);

      expect(result.success).toBe(true);
      expect(result.groupInfo.name).toBe('Bali Adventure Group');
      expect(result.groupInfo.members).toHaveLength(2);
      expect(result.groupInfo.status).toBe('pending_creation');

      // Verify admin notification was sent
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Travel Group Setup')
        })
      );
    });
  });

  describe('inviteToGroup', () => {
    it('should send invitations to all group members', async () => {
      // Mock successful message sends
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ messages: [{ id: 'invite-1' }] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ messages: [{ id: 'invite-2' }] })
        });

      const groupInfo = {
        name: 'Bali Adventure Group',
        description: 'Explore Bali together!',
        invitation_link: 'https://chat.whatsapp.com/test123'
      };

      const members = [
        { name: 'John', phone: '+1234567891' },
        { name: 'Jane', phone: '+1234567892' }
      ];

      const result = await whatsAppService.inviteToGroup(groupInfo, members);

      expect(result.success).toBe(true);
      expect(result.totalInvited).toBe(2);
      expect(result.totalFailed).toBe(0);
      expect(result.invitationResults).toHaveLength(2);

      // Verify both invitations were sent
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in invitations', async () => {
      // Mock one success, one failure
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ messages: [{ id: 'invite-1' }] })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: { message: 'Invalid phone number' } })
        });

      const groupInfo = {
        name: 'Test Group',
        description: 'Test description'
      };

      const members = [
        { name: 'John', phone: '+1234567891' },
        { name: 'Jane', phone: 'invalid-phone' }
      ];

      const result = await whatsAppService.inviteToGroup(groupInfo, members);

      expect(result.success).toBe(true);
      expect(result.totalInvited).toBe(1);
      expect(result.totalFailed).toBe(1);
    });
  });

  describe('processWebhookMessage', () => {
    it('should process incoming webhook messages', async () => {
      const webhookData = {
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [
                    {
                      id: 'msg-123',
                      from: '1234567890',
                      timestamp: '1640995200',
                      type: 'text',
                      text: { body: 'Hello from user' }
                    }
                  ],
                  contacts: [
                    {
                      wa_id: '1234567890',
                      profile: { name: 'John Doe' }
                    }
                  ]
                }
              }
            ]
          }
        ]
      };

      const result = await whatsAppService.processWebhookMessage(webhookData);

      expect(result.success).toBe(true);
      expect(result.processedMessages).toHaveLength(1);
      expect(result.processedMessages[0].messageData.from).toBe('1234567890');
      expect(result.processedMessages[0].messageData.text).toBe('Hello from user');
    });

    it('should handle invalid webhook data', async () => {
      const result = await whatsAppService.processWebhookMessage({ invalid: 'data' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid webhook data');
    });
  });

  describe('determineMessageActions', () => {
    it('should suggest auto-response for booking queries', async () => {
      const messageData = {
        type: 'text',
        text: 'I need help with my booking'
      };

      const actions = await whatsAppService.determineMessageActions(messageData);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('auto_response');
      expect(actions[0].message).toContain('booking');
    });

    it('should forward non-text messages to support', async () => {
      const messageData = {
        type: 'image',
        media: { id: 'img-123' }
      };

      const actions = await whatsAppService.determineMessageActions(messageData);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('forward_to_support');
    });
  });

  describe('notification methods', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: 'msg-123' }] })
      });
    });

    it('should send booking confirmation with proper format', async () => {
      const bookingData = {
        adventureName: 'Bali Temple Tour',
        date: 'March 15, 2024',
        location: 'Ubud, Bali',
        groupSize: 4,
        bookingId: 'BOOK-123'
      };

      const result = await whatsAppService.sendBookingConfirmation('+1234567890', bookingData);

      expect(result.success).toBe(true);

      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.text.body).toContain('✅ Booking Confirmed!');
      expect(body.text.body).toContain('Bali Temple Tour');
      expect(body.text.body).toContain('BOOK-123');
    });

    it('should send trip reminder with meeting details', async () => {
      const tripData = {
        adventureName: 'Volcano Hiking',
        timeUntil: 'tomorrow',
        meetingPoint: 'Hotel Lobby',
        time: '6:00 AM',
        reminders: ['hiking boots', 'water bottle']
      };

      const result = await whatsAppService.sendTripReminder('+1234567890', tripData);

      expect(result.success).toBe(true);

      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.text.body).toContain('⏰ Trip Reminder');
      expect(body.text.body).toContain('Volcano Hiking');
      expect(body.text.body).toContain('Hotel Lobby');
    });

    it('should send vendor offer with adventure details', async () => {
      const offerData = {
        vendorName: 'Bali Adventures Co',
        adventureType: 'snorkeling tour',
        location: 'Nusa Penida',
        price: '$75',
        availability: 'March 20-25'
      };

      const result = await whatsAppService.sendVendorOffer('+1234567890', offerData);

      expect(result.success).toBe(true);

      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.text.body).toContain('🎯 New Adventure Offer!');
      expect(body.text.body).toContain('Bali Adventures Co');
      expect(body.text.body).toContain('$75');
    });
  });

  describe('utility methods', () => {
    it('should return correct verify token', () => {
      const token = whatsAppService.getVerifyToken();
      expect(token).toBe('test-verify-token');
    });

    it('should mark message as read', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await whatsAppService.markMessageAsRead('msg-123');

      expect(result.success).toBe(true);

      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.status).toBe('read');
      expect(body.message_id).toBe('msg-123');
    });
  });
});
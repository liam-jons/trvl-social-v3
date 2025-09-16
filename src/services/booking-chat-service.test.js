import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendChatMessage,
  getChatHistory,
  getUserChatSessions,
  clearChatSession,
  getChatServiceConfig
} from './booking-chat-service.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  store: new Map(),
  getItem: vi.fn((key) => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key, value) => mockLocalStorage.store.set(key, value)),
  removeItem: vi.fn((key) => mockLocalStorage.store.delete(key)),
  clear: vi.fn(() => mockLocalStorage.store.clear()),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_OPENAI_API_KEY: 'test-api-key'
  }
}));

describe('BookingChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.store.clear();
  });

  describe('getChatServiceConfig', () => {
    it('should return service configuration', () => {
      const config = getChatServiceConfig();

      expect(config).toEqual({
        hasOpenAIKey: true,
        model: 'gpt-4',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
        maxMessages: 50,
        sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
        quickActions: expect.any(Array)
      });
    });
  });

  describe('sendChatMessage', () => {
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: 'Hello! How can I help you with your travel plans today?',
          role: 'assistant'
        }
      }]
    };

    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIResponse
      });
    });

    it('should send a chat message and return response', async () => {
      const message = 'I want to book a trip to Japan';
      const userId = 'test-user-123';

      const result = await sendChatMessage(message, userId);

      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: expect.stringContaining('"model":"gpt-4"')
      });

      expect(result.message).toEqual({
        id: expect.any(String),
        role: 'assistant',
        content: 'Hello! How can I help you with your travel plans today?',
        timestamp: expect.any(String),
        language: 'en'
      });

      expect(result.session).toEqual({
        sessionId: expect.any(String),
        userId,
        language: 'en',
        messageCount: 2, // user message + assistant message
        isActive: true,
        humanHandoffRequested: false
      });
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const result = await sendChatMessage('Test message', 'test-user');

      expect(result.error).toContain('OpenAI API error: 429');
      expect(result.message.role).toBe('assistant');
      expect(result.message.content).toContain('error processing your request');
    });

    it('should require message and userId', async () => {
      await expect(sendChatMessage('', 'user')).rejects.toThrow('Message and userId are required');
      await expect(sendChatMessage('message', '')).rejects.toThrow('Message and userId are required');
      await expect(sendChatMessage(null, 'user')).rejects.toThrow('Message and userId are required');
    });
  });

  describe('session management', () => {
    it('should save and retrieve chat history', async () => {
      const userId = 'test-user';
      const sessionId = 'test-session';

      // Mock OpenAI response
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Test response',
              role: 'assistant'
            }
          }]
        })
      });

      // Send a message to create a session
      await sendChatMessage('Test message', userId, sessionId);

      // Retrieve chat history
      const history = getChatHistory(userId, sessionId);

      expect(history).toBeTruthy();
      expect(history.messages).toHaveLength(2); // user + assistant message
      expect(history.sessionId).toBe(sessionId);
    });

    it('should list user chat sessions', async () => {
      const userId = 'test-user';

      // Mock OpenAI response
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Test response',
              role: 'assistant'
            }
          }]
        })
      });

      // Create a session
      await sendChatMessage('Test message', userId);

      // Get user sessions
      const sessions = getUserChatSessions(userId);

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual({
        sessionId: expect.any(String),
        lastActivity: expect.any(String),
        messageCount: 2,
        preview: expect.any(String),
        language: 'en',
        humanHandoffRequested: false
      });
    });

    it('should clear chat sessions', async () => {
      const userId = 'test-user';
      const sessionId = 'test-session';

      // Mock OpenAI response
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Test response',
              role: 'assistant'
            }
          }]
        })
      });

      // Create a session
      await sendChatMessage('Test message', userId, sessionId);

      // Verify session exists
      expect(getChatHistory(userId, sessionId)).toBeTruthy();

      // Clear session
      const cleared = clearChatSession(userId, sessionId);

      expect(cleared).toBe(true);
      expect(getChatHistory(userId, sessionId)).toBe(null);
    });
  });

  describe('function calling', () => {
    it('should handle check_availability function call', async () => {
      const functionCallResponse = {
        choices: [{
          message: {
            role: 'assistant',
            function_call: {
              name: 'check_availability',
              arguments: '{"destination": "Tokyo", "startDate": "2024-03-15", "participants": 2}'
            }
          }
        }]
      };

      const followUpResponse = {
        choices: [{
          message: {
            content: 'I found some great availability for your Tokyo trip!',
            role: 'assistant'
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => functionCallResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => followUpResponse
      });

      const result = await sendChatMessage('Check availability for Tokyo for 2 people', 'test-user');

      expect(fetch).toHaveBeenCalledTimes(2); // Initial call + follow-up
      expect(result.functionResult).toBeTruthy();
      expect(result.functionResult.destination).toBe('Tokyo');
      expect(result.message.content).toContain('availability for your Tokyo trip');
    });
  });

  describe('language detection', () => {
    it('should detect Spanish language', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '¡Hola! ¿Cómo puedo ayudarte con tus planes de viaje?',
              role: 'assistant'
            }
          }]
        })
      });

      const result = await sendChatMessage('Hola, quiero hacer un viaje a España', 'test-user');

      expect(result.session.language).toBe('es');
    });

    it('should default to English for unknown languages', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Hello! How can I help you?',
              role: 'assistant'
            }
          }]
        })
      });

      const result = await sendChatMessage('I want to travel', 'test-user');

      expect(result.session.language).toBe('en');
    });
  });
});
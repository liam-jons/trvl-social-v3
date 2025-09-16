/**
 * AI-Powered Booking Chat Service
 * Provides intelligent conversation interface for booking assistance and modifications
 * Integrates with existing NLP service and OpenAI Assistant API
 */

import { parseTripDescription } from './nlp-service.js';
import sentryService from './sentry-service.js';

// Configuration
const CHAT_CONFIG = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY,
    model: 'gpt-4', // Using GPT-4 for better conversational abilities
    maxTokens: 1000,
    temperature: 0.7, // Higher temperature for more natural conversation
  },
  assistant: {
    name: 'Trvl Booking Assistant',
    instructions: `You are a professional travel booking assistant for Trvl Social. Your role is to help users with:
    - Checking availability for trips and accommodations
    - Modifying existing bookings (dates, participants, preferences)
    - Answering questions about travel destinations and activities
    - Providing personalized recommendations
    - Processing booking requests through natural conversation

    Always be helpful, friendly, and professional. If you cannot complete a task, offer to connect the user with human support.

    Available functions:
    - check_availability: Check dates and capacity for trips
    - modify_booking: Update existing booking details
    - get_recommendations: Provide personalized trip suggestions
    - escalate_to_human: Transfer conversation to human agent
    - parse_trip_request: Extract structured data from natural language descriptions`,
  },
  timeout: 30000, // 30 seconds for chat responses
  maxRetries: 2,
  retryDelay: 1000,
  sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
  maxMessages: 50, // Max messages per session
  supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
};

// Intent recognition patterns
const INTENT_PATTERNS = {
  CHECK_AVAILABILITY: /\b(check|available|availability|dates|when|can|book)\b.*\b(trip|travel|booking|available|dates)\b/i,
  MODIFY_BOOKING: /\b(change|modify|update|edit|cancel)\b.*\b(booking|trip|reservation|dates|participants)\b/i,
  ADD_PARTICIPANTS: /\b(add|include|bring)\b.*\b(people|person|friend|family|participant|traveler)\b/i,
  GET_RECOMMENDATIONS: /\b(recommend|suggest|advice|best|good)\b.*\b(trip|destination|place|activity|travel)\b/i,
  PRICE_INQUIRY: /\b(cost|price|expensive|cheap|budget|money|pay)\b/i,
  LOCATION_QUESTION: /\b(where|location|place|destination|city|country)\b/i,
  SUPPORT_REQUEST: /\b(help|support|agent|human|speak|talk)\b.*\b(human|person|agent|support)\b/i,
};

// Quick action templates
const QUICK_ACTIONS = {
  CHECK_AVAILABILITY: {
    text: 'Check availability',
    icon: 'calendar',
    prompt: 'I want to check availability for dates',
  },
  MODIFY_DATES: {
    text: 'Change dates',
    icon: 'pencil-square',
    prompt: 'I need to modify my travel dates',
  },
  ADD_PEOPLE: {
    text: 'Add travelers',
    icon: 'user-plus',
    prompt: 'I want to add more people to my trip',
  },
  GET_RECOMMENDATIONS: {
    text: 'Get suggestions',
    icon: 'light-bulb',
    prompt: 'Can you recommend some destinations for me?',
  },
  CONTACT_SUPPORT: {
    text: 'Human support',
    icon: 'chat-bubble-left-right',
    prompt: 'I need to speak with a human agent',
  },
};

// Session management
class ChatSession {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId || this.generateSessionId();
    this.messages = [];
    this.context = {};
    this.language = 'en';
    this.createdAt = new Date().toISOString();
    this.lastActivity = new Date().toISOString();
    this.isActive = true;
    this.humanHandoffRequested = false;
  }

  generateSessionId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addMessage(message) {
    if (this.messages.length >= CHAT_CONFIG.maxMessages) {
      // Remove oldest messages if limit exceeded
      this.messages = this.messages.slice(-Math.floor(CHAT_CONFIG.maxMessages * 0.8));
    }

    const messageWithId = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...message,
    };

    this.messages.push(messageWithId);
    this.lastActivity = new Date().toISOString();
    this.saveSession();
    return messageWithId;
  }

  updateContext(updates) {
    this.context = { ...this.context, ...updates };
    this.saveSession();
  }

  isExpired() {
    return Date.now() - new Date(this.lastActivity).getTime() > CHAT_CONFIG.sessionTimeout;
  }

  saveSession() {
    try {
      const sessionData = {
        userId: this.userId,
        sessionId: this.sessionId,
        messages: this.messages,
        context: this.context,
        language: this.language,
        createdAt: this.createdAt,
        lastActivity: this.lastActivity,
        isActive: this.isActive,
        humanHandoffRequested: this.humanHandoffRequested,
      };

      localStorage.setItem(`chat_session_${this.sessionId}`, JSON.stringify(sessionData));

      // Also save to user's active sessions list
      const userSessions = this.getUserSessions(this.userId);
      const existingIndex = userSessions.findIndex(s => s.sessionId === this.sessionId);

      const sessionSummary = {
        sessionId: this.sessionId,
        lastActivity: this.lastActivity,
        messageCount: this.messages.length,
        isActive: this.isActive,
      };

      if (existingIndex >= 0) {
        userSessions[existingIndex] = sessionSummary;
      } else {
        userSessions.push(sessionSummary);
      }

      localStorage.setItem(`chat_sessions_${this.userId}`, JSON.stringify(userSessions));
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'booking-chat', operation: 'saveChatSession' }
      });
    }
  }

  getUserSessions(userId) {
    try {
      const sessions = localStorage.getItem(`chat_sessions_${userId}`);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'booking-chat', operation: 'loadUserSessions' }
      });
      return [];
    }
  }

  static loadSession(sessionId) {
    try {
      const sessionData = localStorage.getItem(`chat_session_${sessionId}`);
      if (!sessionData) return null;

      const data = JSON.parse(sessionData);
      const session = new ChatSession(data.userId, data.sessionId);

      session.messages = data.messages || [];
      session.context = data.context || {};
      session.language = data.language || 'en';
      session.createdAt = data.createdAt;
      session.lastActivity = data.lastActivity;
      session.isActive = data.isActive;
      session.humanHandoffRequested = data.humanHandoffRequested || false;

      return session.isExpired() ? null : session;
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'booking-chat', operation: 'loadChatSession' }
      });
      return null;
    }
  }

  static clearExpiredSessions(userId) {
    try {
      const userSessions = localStorage.getItem(`chat_sessions_${userId}`);
      if (!userSessions) return;

      const sessions = JSON.parse(userSessions);
      const activeSessions = sessions.filter(sessionSummary => {
        const session = ChatSession.loadSession(sessionSummary.sessionId);
        return session && !session.isExpired();
      });

      // Remove expired sessions from localStorage
      sessions.forEach(sessionSummary => {
        if (!activeSessions.find(s => s.sessionId === sessionSummary.sessionId)) {
          localStorage.removeItem(`chat_session_${sessionSummary.sessionId}`);
        }
      });

      localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(activeSessions));
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'booking-chat', operation: 'clearExpiredSessions' }
      });
    }
  }
}

// Language detection and translation
async function detectLanguage(text) {
  // Simple language detection based on common patterns
  const patterns = {
    es: /\b(hola|gracias|por favor|viaje|reserva|fecha)\b/i,
    fr: /\b(bonjour|merci|s'il vous plaît|voyage|réservation|date)\b/i,
    de: /\b(hallo|danke|bitte|reise|buchung|datum)\b/i,
    it: /\b(ciao|grazie|prego|viaggio|prenotazione|data)\b/i,
    pt: /\b(olá|obrigado|por favor|viagem|reserva|data)\b/i,
    ja: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/,
    ko: /[\uac00-\ud7af]/,
    zh: /[\u4e00-\u9fff]/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return 'en'; // Default to English
}

async function translateMessage(message, targetLanguage, sourceLanguage = 'auto') {
  if (!CHAT_CONFIG.openai.apiKey || targetLanguage === 'en') {
    return message;
  }

  try {
    const response = await fetch(`${CHAT_CONFIG.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_CONFIG.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Translate the following message to ${targetLanguage}. Maintain the same tone and meaning. If the message is already in ${targetLanguage}, return it unchanged.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error(`Translation failed: ${response.statusText}`);

    const data = await response.json();
    return data.choices[0]?.message?.content || message;
  } catch (error) {
    sentryService.captureException(error, {
      tags: { service: 'booking-chat', operation: 'translateMessage' }
    });
    return message;
  }
}

// Intent recognition
function recognizeIntent(message) {
  const text = message.toLowerCase();

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(text)) {
      return intent;
    }
  }

  return 'GENERAL_INQUIRY';
}

// AI Assistant functions
const assistantFunctions = [
  {
    name: 'check_availability',
    description: 'Check availability for trips, accommodations, or activities',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'The destination to check availability for',
        },
        startDate: {
          type: 'string',
          description: 'Check-in or start date (YYYY-MM-DD format)',
        },
        endDate: {
          type: 'string',
          description: 'Check-out or end date (YYYY-MM-DD format)',
        },
        participants: {
          type: 'number',
          description: 'Number of participants/travelers',
        },
        accommodationType: {
          type: 'string',
          description: 'Type of accommodation (hotel, airbnb, etc.)',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'modify_booking',
    description: 'Modify an existing booking',
    parameters: {
      type: 'object',
      properties: {
        bookingId: {
          type: 'string',
          description: 'The booking ID to modify',
        },
        changes: {
          type: 'object',
          description: 'Changes to make to the booking',
          properties: {
            dates: {
              type: 'object',
              properties: {
                startDate: { type: 'string' },
                endDate: { type: 'string' },
              },
            },
            participants: {
              type: 'number',
              description: 'New number of participants',
            },
            accommodation: {
              type: 'string',
              description: 'New accommodation preference',
            },
          },
        },
      },
      required: ['bookingId', 'changes'],
    },
  },
  {
    name: 'get_recommendations',
    description: 'Get personalized travel recommendations',
    parameters: {
      type: 'object',
      properties: {
        preferences: {
          type: 'object',
          description: 'User preferences for recommendations',
          properties: {
            budget: { type: 'string' },
            activities: { type: 'array', items: { type: 'string' } },
            destinations: { type: 'array', items: { type: 'string' } },
            groupSize: { type: 'number' },
            duration: { type: 'string' },
          },
        },
      },
    },
  },
  {
    name: 'parse_trip_request',
    description: 'Parse natural language trip description into structured data',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'The natural language trip description',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'escalate_to_human',
    description: 'Escalate conversation to human support',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for escalation',
        },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Urgency level',
        },
      },
    },
  },
];

// Function handlers
async function handleFunctionCall(functionCall, session) {
  const { name, arguments: args } = functionCall;

  try {
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    switch (name) {
      case 'check_availability':
        return await checkAvailability(parsedArgs, session);

      case 'modify_booking':
        return await modifyBooking(parsedArgs, session);

      case 'get_recommendations':
        return await getRecommendations(parsedArgs, session);

      case 'parse_trip_request':
        return await parseTrip(parsedArgs, session);

      case 'escalate_to_human':
        return await escalateToHuman(parsedArgs, session);

      default:
        return { error: `Unknown function: ${name}` };
    }
  } catch (error) {
    sentryService.captureException(error, {
      tags: { service: 'booking-chat', operation: 'handleFunctionCall', functionName: name }
    });
    return { error: `Failed to execute ${name}: ${error.message}` };
  }
}

async function checkAvailability(args, session) {
  // Mock implementation - integrate with actual booking service
  const { destination, startDate, endDate, participants = 1 } = args;

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update session context with search parameters
  session.updateContext({
    lastSearch: {
      destination,
      startDate,
      endDate,
      participants,
      timestamp: new Date().toISOString(),
    },
  });

  // Mock availability data
  return {
    success: true,
    destination,
    availability: {
      hasAvailability: Math.random() > 0.3,
      availableDates: startDate && endDate ? [{ startDate, endDate, price: Math.floor(Math.random() * 500) + 200 }] : [],
      alternativeDates: [
        {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: Math.floor(Math.random() * 400) + 250,
        },
      ],
      capacity: Math.floor(Math.random() * 20) + 5,
      remainingSpots: Math.floor(Math.random() * 15) + 1,
    },
  };
}

async function modifyBooking(args, session) {
  // Mock implementation - integrate with actual booking service
  const { bookingId, changes } = args;

  await new Promise(resolve => setTimeout(resolve, 800));

  session.updateContext({
    lastModification: {
      bookingId,
      changes,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    success: true,
    bookingId,
    changes,
    message: 'Booking modification request processed successfully',
  };
}

async function getRecommendations(args, session) {
  // Mock implementation - integrate with recommendation service
  const { preferences } = args;

  await new Promise(resolve => setTimeout(resolve, 1200));

  const recommendations = [
    {
      destination: 'Bali, Indonesia',
      type: 'Beach & Culture',
      price: '$450',
      duration: '7 days',
      highlights: ['Beautiful beaches', 'Rich culture', 'Great food'],
    },
    {
      destination: 'Tokyo, Japan',
      type: 'Urban Adventure',
      price: '$680',
      duration: '5 days',
      highlights: ['Modern city', 'Traditional culture', 'Amazing cuisine'],
    },
  ];

  return {
    success: true,
    recommendations,
    preferences,
  };
}

async function parseTrip(args, session) {
  const { description } = args;

  try {
    const result = await parseTripDescription(description);

    session.updateContext({
      parsedTrip: result,
      originalDescription: description,
    });

    return {
      success: true,
      parsedData: result,
    };
  } catch (error) {
    return {
      error: `Failed to parse trip description: ${error.message}`,
    };
  }
}

async function escalateToHuman(args, session) {
  const { reason, urgency = 'medium' } = args;

  session.humanHandoffRequested = true;
  session.updateContext({
    escalation: {
      reason,
      urgency,
      timestamp: new Date().toISOString(),
    },
  });

  // In a real implementation, this would trigger notifications to support staff
  return {
    success: true,
    message: 'Your conversation has been escalated to human support. A team member will be with you shortly.',
    estimatedWaitTime: urgency === 'urgent' ? '5 minutes' : urgency === 'high' ? '15 minutes' : '30 minutes',
  };
}

// Main chat function
export async function sendChatMessage(message, userId, sessionId = null) {
  if (!message?.trim() || !userId) {
    throw new Error('Message and userId are required');
  }

  // Load or create session
  let session = sessionId ? ChatSession.loadSession(sessionId) : null;
  if (!session) {
    ChatSession.clearExpiredSessions(userId);
    session = new ChatSession(userId, sessionId);
  }

  // Detect language if not set
  if (!session.language || session.language === 'en') {
    session.language = await detectLanguage(message);
  }

  // Add user message to session
  const userMessage = session.addMessage({
    role: 'user',
    content: message,
    intent: recognizeIntent(message),
    language: session.language,
  });

  // Prepare messages for OpenAI
  const systemMessage = {
    role: 'system',
    content: CHAT_CONFIG.assistant.instructions,
  };

  const conversationMessages = [
    systemMessage,
    ...session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  try {
    const response = await fetch(`${CHAT_CONFIG.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_CONFIG.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_CONFIG.openai.model,
        messages: conversationMessages,
        functions: assistantFunctions,
        function_call: 'auto',
        max_tokens: CHAT_CONFIG.openai.maxTokens,
        temperature: CHAT_CONFIG.openai.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    let assistantMessage;
    let functionResult = null;

    if (choice.message.function_call) {
      // Handle function call
      functionResult = await handleFunctionCall(choice.message.function_call, session);

      // Create follow-up request with function result
      const followUpMessages = [
        ...conversationMessages,
        choice.message,
        {
          role: 'function',
          name: choice.message.function_call.name,
          content: JSON.stringify(functionResult),
        },
      ];

      const followUpResponse = await fetch(`${CHAT_CONFIG.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHAT_CONFIG.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: CHAT_CONFIG.openai.model,
          messages: followUpMessages,
          max_tokens: CHAT_CONFIG.openai.maxTokens,
          temperature: CHAT_CONFIG.openai.temperature,
        }),
      });

      const followUpData = await followUpResponse.json();
      assistantMessage = session.addMessage({
        role: 'assistant',
        content: followUpData.choices[0].message.content,
        functionCall: choice.message.function_call,
        functionResult,
        language: session.language,
      });
    } else {
      assistantMessage = session.addMessage({
        role: 'assistant',
        content: choice.message.content,
        language: session.language,
      });
    }

    // Translate response if needed
    if (session.language !== 'en') {
      assistantMessage.content = await translateMessage(
        assistantMessage.content,
        session.language,
        'en'
      );
    }

    return {
      message: assistantMessage,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        language: session.language,
        messageCount: session.messages.length,
        isActive: session.isActive,
        humanHandoffRequested: session.humanHandoffRequested,
      },
      functionResult,
      quickActions: getQuickActionsForContext(session),
    };

  } catch (error) {
    sentryService.captureException(error, {
      tags: { service: 'booking-chat', operation: 'chatServiceError' }
    });

    // Add error message to session
    const errorMessage = session.addMessage({
      role: 'assistant',
      content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
      error: error.message,
      language: session.language,
    });

    return {
      message: errorMessage,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        language: session.language,
        messageCount: session.messages.length,
        isActive: session.isActive,
        humanHandoffRequested: session.humanHandoffRequested,
      },
      error: error.message,
      quickActions: getQuickActionsForContext(session),
    };
  }
}

// Get contextual quick actions
function getQuickActionsForContext(session) {
  const recentMessages = session.messages.slice(-3);
  const hasAvailabilitySearch = session.context.lastSearch;
  const hasBooking = session.context.lastModification;

  const actions = [];

  if (!hasAvailabilitySearch) {
    actions.push(QUICK_ACTIONS.CHECK_AVAILABILITY);
  }

  if (hasAvailabilitySearch && !hasBooking) {
    actions.push(QUICK_ACTIONS.MODIFY_DATES);
  }

  actions.push(QUICK_ACTIONS.GET_RECOMMENDATIONS);
  actions.push(QUICK_ACTIONS.ADD_PEOPLE);
  actions.push(QUICK_ACTIONS.CONTACT_SUPPORT);

  return actions.slice(0, 4); // Return max 4 actions
}

// Get chat session history
export function getChatHistory(userId, sessionId) {
  const session = ChatSession.loadSession(sessionId);
  if (!session || session.userId !== userId) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    messages: session.messages,
    context: session.context,
    language: session.language,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    humanHandoffRequested: session.humanHandoffRequested,
  };
}

// Get user's active chat sessions
export function getUserChatSessions(userId) {
  ChatSession.clearExpiredSessions(userId);

  try {
    const sessionsData = localStorage.getItem(`chat_sessions_${userId}`);
    if (!sessionsData) return [];

    const sessions = JSON.parse(sessionsData);
    return sessions.map(sessionSummary => {
      const session = ChatSession.loadSession(sessionSummary.sessionId);
      return session ? {
        sessionId: session.sessionId,
        lastActivity: session.lastActivity,
        messageCount: session.messages.length,
        preview: session.messages[session.messages.length - 1]?.content?.substring(0, 100) || '',
        language: session.language,
        humanHandoffRequested: session.humanHandoffRequested,
      } : null;
    }).filter(Boolean);
  } catch (error) {
    sentryService.captureException(error, {
      tags: { service: 'booking-chat', operation: 'getUserChatSessions' }
    });
    return [];
  }
}

// Clear chat session
export function clearChatSession(userId, sessionId) {
  try {
    localStorage.removeItem(`chat_session_${sessionId}`);

    const userSessions = JSON.parse(localStorage.getItem(`chat_sessions_${userId}`) || '[]');
    const filteredSessions = userSessions.filter(s => s.sessionId !== sessionId);
    localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(filteredSessions));

    return true;
  } catch (error) {
    sentryService.captureException(error, {
      tags: { service: 'booking-chat', operation: 'clearChatSession' }
    });
    return false;
  }
}

// Get service configuration
export function getChatServiceConfig() {
  return {
    hasOpenAIKey: !!CHAT_CONFIG.openai.apiKey,
    model: CHAT_CONFIG.openai.model,
    supportedLanguages: CHAT_CONFIG.supportedLanguages,
    maxMessages: CHAT_CONFIG.maxMessages,
    sessionTimeout: CHAT_CONFIG.sessionTimeout,
    quickActions: Object.values(QUICK_ACTIONS),
  };
}

export default {
  sendChatMessage,
  getChatHistory,
  getUserChatSessions,
  clearChatSession,
  getChatServiceConfig,
  QUICK_ACTIONS,
};
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  LanguageIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import BookingChatMessage from './BookingChatMessage';
import GlassInput from '../ui/GlassInput';
import { sendChatMessage, getChatHistory, getUserChatSessions, clearChatSession } from '../../services/booking-chat-service';
const BookingChatInterface = ({
  isOpen = false,
  onClose,
  userId,
  initialMessage = null,
  sessionId = null,
  className = '',
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [quickActions, setQuickActions] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [error, setError] = useState(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  // Load existing session on mount
  useEffect(() => {
    if (isOpen && userId) {
      loadChatHistory();
      loadUserSessions();
    }
  }, [isOpen, userId, currentSessionId]);
  // Send initial message if provided
  useEffect(() => {
    if (isOpen && initialMessage && !messages.length) {
      handleSendMessage(initialMessage);
    }
  }, [isOpen, initialMessage, messages.length]);
  const loadChatHistory = async () => {
    if (!currentSessionId) return;
    try {
      const history = getChatHistory(userId, currentSessionId);
      if (history) {
        setMessages(history.messages || []);
        setCurrentLanguage(history.language || 'en');
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setError('Failed to load chat history');
    }
  };
  const loadUserSessions = async () => {
    try {
      const sessions = getUserChatSessions(userId);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to load user sessions:', error);
    }
  };
  const handleSendMessage = async (message = inputMessage) => {
    const messageText = message.trim();
    if (!messageText || isLoading) return;
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setIsTyping(true);
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    try {
      const response = await sendChatMessage(messageText, userId, currentSessionId);
      if (response.error) {
        setError(response.error);
      } else {
        // Update messages with both user message and assistant response
        setMessages(prev => {
          const newMessages = [...prev];
          // Find and update user message if it exists, otherwise add it
          const userMessageIndex = newMessages.findIndex(
            msg => msg.role === 'user' && msg.content === messageText && !msg.id
          );
          if (userMessageIndex === -1) {
            // Add user message if not found
            newMessages.push({
              id: `user_${Date.now()}`,
              role: 'user',
              content: messageText,
              timestamp: new Date().toISOString(),
            });
          }
          // Add assistant message
          newMessages.push(response.message);
          return newMessages;
        });
        setCurrentSessionId(response.session.sessionId);
        setQuickActions(response.quickActions || []);
        setCurrentLanguage(response.session.language || 'en');
        // Update sessions list
        loadUserSessions();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      // Set typing timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };
  const handleQuickAction = (action) => {
    handleSendMessage(action.prompt);
  };
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setQuickActions([]);
    setError(null);
    setShowSessionsList(false);
    inputRef.current?.focus();
  };
  const handleLoadSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setShowSessionsList(false);
    loadChatHistory();
  };
  const handleDeleteSession = async (sessionId, event) => {
    event.stopPropagation();
    if (clearChatSession(userId, sessionId)) {
      setChatSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (sessionId === currentSessionId) {
        handleNewChat();
      }
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
  ];
  if (!isOpen) return null;
  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`
        bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
        border border-white/20 dark:border-white/10
        rounded-2xl shadow-2xl
        transition-all duration-300 ease-in-out
        ${isMinimized ? 'h-16 w-80' : 'h-[600px] w-96'}
        flex flex-col overflow-hidden
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Travel Assistant
                </h3>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  {isTyping && (
                    <>
                      <ClockIcon className="w-3 h-3" />
                      <span>Typing...</span>
                    </>
                  )}
                  {!isTyping && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative group">
              <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <LanguageIcon className="w-4 h-4" />
              </button>
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="p-2 space-y-1 min-w-[120px]">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setCurrentLanguage(lang.code)}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Sessions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSessionsList(!showSessionsList)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
              </button>
              {showSessionsList && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Chat Sessions
                      </span>
                      <button
                        onClick={handleNewChat}
                        className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                      >
                        New Chat
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {chatSessions.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        No chat sessions yet
                      </div>
                    ) : (
                      chatSessions.map((session) => (
                        <div
                          key={session.sessionId}
                          onClick={() => handleLoadSession(session.sessionId)}
                          className={`
                            p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700
                            ${session.sessionId === currentSessionId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 dark:text-white truncate">
                                {session.preview || 'New conversation'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {session.messageCount} messages • {new Date(session.lastActivity).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(session.sessionId, e)}
                              className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Minimize/Maximize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to Trvl Assistant
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                    I can help you check availability, modify bookings, get recommendations, and answer travel questions.
                  </p>
                </div>
              )}
              {/* Messages */}
              {messages.map((message) => (
                <BookingChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.role === 'user'}
                />
              ))}
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm">Assistant is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Error Message */}
            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}
            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      disabled={isLoading}
                      className="
                        inline-flex items-center space-x-1 px-3 py-1.5 text-xs
                        bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                        border border-blue-200 dark:border-blue-800 rounded-full
                        hover:bg-blue-100 dark:hover:bg-blue-900/50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      "
                    >
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <GlassInput
                    ref={inputRef}
                    type="textarea"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="min-h-[40px] max-h-32 resize-none"
                    disabled={isLoading}
                  />
                </div>
                {/* Voice Mode Toggle */}
                <button
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isVoiceMode
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  disabled={isLoading}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="
                    p-2 bg-blue-500 text-white rounded-lg
                    hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  "
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default BookingChatInterface;
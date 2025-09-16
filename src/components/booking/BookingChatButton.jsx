import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

import BookingChatInterface from './BookingChatInterface';

const BookingChatButton = ({
  userId,
  initialMessage = null,
  sessionId = null,
  position = 'bottom-right',
  className = '',
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Position classes mapping
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Hide/show button based on scroll position
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateVisibility = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollingUp = currentScrollY < lastScrollY;

      // Hide when scrolling down, show when scrolling up or at top
      if (scrollingDown && currentScrollY > 100) {
        setIsVisible(false);
      } else if (scrollingUp || currentScrollY <= 100) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    // Throttle scroll events
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setHasNewMessage(false);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setHasNewMessage(false);
  };

  // Simulate new message notification (in real app, this would come from websocket/server events)
  useEffect(() => {
    if (!isChatOpen && userId) {
      const interval = setInterval(() => {
        // Random chance to show notification (for demo purposes)
        if (Math.random() > 0.95) {
          setHasNewMessage(true);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isChatOpen, userId]);

  if (!userId) return null;

  return (
    <>
      {/* Chat Button */}
      <div
        className={`
          fixed z-40 transition-all duration-300 ease-in-out
          ${positionClasses[position]}
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}
          ${className}
        `}
      >
        <button
          onClick={handleToggleChat}
          className="
            relative group
            w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600
            rounded-full shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-all duration-200 ease-in-out
            hover:scale-110 active:scale-95
            focus:outline-none focus:ring-4 focus:ring-blue-500/25
          "
          aria-label={isChatOpen ? 'Close chat' : 'Open travel assistant chat'}
        >
          {/* Main Icon */}
          <div className="relative">
            {isChatOpen ? (
              <XMarkIcon className="w-6 h-6 text-white" />
            ) : (
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            )}

            {/* New Message Indicator */}
            {hasNewMessage && !isChatOpen && (
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <BellIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Ripple Effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-200" />

          {/* Pulse Animation for New Messages */}
          {hasNewMessage && !isChatOpen && (
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
          )}
        </button>

        {/* Tooltip */}
        {!isChatOpen && (
          <div className="
            absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
            px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            pointer-events-none whitespace-nowrap
          ">
            Travel Assistant
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <BookingChatInterface
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        userId={userId}
        initialMessage={initialMessage}
        sessionId={sessionId}
      />

      {/* Backdrop for mobile */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={handleCloseChat}
        />
      )}
    </>
  );
};

export default BookingChatButton;
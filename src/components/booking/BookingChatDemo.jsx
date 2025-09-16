import { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  PhoneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import BookingChatButton from './BookingChatButton';

const BookingChatDemo = () => {
  const [demoUserId] = useState('demo-user-123');
  const [selectedScenario, setSelectedScenario] = useState('availability');

  const demoScenarios = [
    {
      id: 'availability',
      title: 'Check Availability',
      description: 'Ask about trip availability for specific dates',
      icon: CalendarIcon,
      exampleMessage: 'I want to check availability for a trip to Bali for 2 people from March 15-22',
      color: 'blue',
    },
    {
      id: 'recommendations',
      title: 'Get Recommendations',
      description: 'Ask for personalized travel suggestions',
      icon: SparklesIcon,
      exampleMessage: 'Can you recommend some destinations for a romantic getaway in Europe with a budget of $3000?',
      color: 'purple',
    },
    {
      id: 'modify',
      title: 'Modify Booking',
      description: 'Change existing booking details',
      icon: CalendarIcon,
      exampleMessage: 'I need to change my Tokyo trip dates and add one more person',
      color: 'green',
    },
    {
      id: 'multilingual',
      title: 'Multilingual Support',
      description: 'Chat in different languages',
      icon: LanguageIcon,
      exampleMessage: 'Hola, me gustaría reservar un viaje a España para 4 personas',
      color: 'orange',
    },
    {
      id: 'complex',
      title: 'Complex Planning',
      description: 'Detailed trip planning with multiple requirements',
      icon: MapPinIcon,
      exampleMessage: 'I need a 10-day adventure trip for 6 people in South America, focusing on hiking and cultural experiences, budget around $2500 per person',
      color: 'indigo',
    },
    {
      id: 'support',
      title: 'Human Handoff',
      description: 'Escalate to human support when needed',
      icon: PhoneIcon,
      exampleMessage: 'I have a complex issue with my booking that I need to discuss with a human agent',
      color: 'red',
    },
  ];

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Conversations',
      description: 'Natural language understanding with OpenAI GPT-4 integration',
    },
    {
      icon: LanguageIcon,
      title: 'Multilingual Support',
      description: 'Automatic language detection and translation for global users',
    },
    {
      icon: CalendarIcon,
      title: 'Smart Intent Recognition',
      description: 'Understands booking actions like availability checks and modifications',
    },
    {
      icon: UserGroupIcon,
      title: 'Session Management',
      description: 'Persistent conversations with context and history tracking',
    },
    {
      icon: PhoneIcon,
      title: 'Human Handoff',
      description: 'Seamless escalation to human support when needed',
    },
    {
      icon: CheckCircleIcon,
      title: 'Quick Actions',
      description: 'Context-aware quick action buttons for common requests',
    },
  ];

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario.id);
    // The BookingChatButton will handle opening the chat with the example message
  };

  const getScenarioInitialMessage = () => {
    const scenario = demoScenarios.find(s => s.id === selectedScenario);
    return scenario?.exampleMessage || null;
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Booking Chat Interface
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience intelligent travel assistance with natural language processing,
            multilingual support, and seamless booking management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
              border border-white/20 dark:border-white/10
              rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200
            ">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Demo Scenarios */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Try Different Scenarios
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoScenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className={`
                  relative cursor-pointer group
                  bg-gradient-to-r ${getColorClasses(scenario.color)}
                  rounded-xl p-6 text-white shadow-lg hover:shadow-xl
                  transform hover:scale-105 transition-all duration-200
                `}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <scenario.icon className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">{scenario.title}</h3>
                </div>
                <p className="text-white/90 text-sm mb-4">
                  {scenario.description}
                </p>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-xs text-white/80 mb-1">Example:</p>
                  <p className="text-sm font-medium">"{scenario.exampleMessage}"</p>
                </div>

                {/* Click to chat indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How to Use the Chat Interface
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">1</div>
              <p>Click on any scenario above or use the chat button in the bottom-right corner</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">2</div>
              <p>Type your message or use the pre-filled example to start the conversation</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">3</div>
              <p>Experience AI-powered responses with function calls and contextual actions</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-12 bg-gray-100 dark:bg-gray-800 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Technical Implementation
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Integration</h4>
              <ul className="space-y-1">
                <li>• OpenAI GPT-4 for conversational AI</li>
                <li>• Function calling for booking actions</li>
                <li>• Intent recognition with pattern matching</li>
                <li>• Integration with existing NLP service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h4>
              <ul className="space-y-1">
                <li>• Persistent session management</li>
                <li>• Real-time message streaming</li>
                <li>• Multilingual support with auto-detection</li>
                <li>• Glass morphism UI design</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> This is a demo implementation. In production, ensure proper API key management,
              rate limiting, and integration with real booking systems.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <BookingChatButton
        userId={demoUserId}
        initialMessage={getScenarioInitialMessage()}
        sessionId={`demo-${selectedScenario}-${Date.now()}`}
      />
    </div>
  );
};

export default BookingChatDemo;
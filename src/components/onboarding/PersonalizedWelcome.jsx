import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

// Personality type configurations
const PERSONALITY_CONFIGS = {
  'The Thrill Seeker': {
    emoji: '🏔️',
    gradient: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
    welcomeMessage: 'Ready for your next adrenaline rush?',
    description: 'You live for high-energy adventures and love pushing your limits. Your fearless spirit makes every trip an epic journey.',
    recommendations: [
      'Bungee jumping in New Zealand',
      'Volcano hiking in Iceland',
      'White water rafting adventures',
      'Rock climbing expeditions'
    ],
    travelTips: [
      'Always check safety equipment and certifications',
      'Travel insurance is essential for extreme activities',
      'Connect with local adventure communities',
      'Document your adventures for epic stories'
    ]
  },
  'The Comfort Traveler': {
    emoji: '🏖️',
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
    welcomeMessage: 'Time to relax and unwind in style!',
    description: 'You appreciate the finer things in travel - comfort, luxury, and peace of mind. Every trip should be a rejuvenating escape.',
    recommendations: [
      'Luxury resort getaways',
      'Spa and wellness retreats',
      'Scenic train journeys',
      'Cultural city tours with premium guides'
    ],
    travelTips: [
      'Book accommodations with excellent reviews',
      'Consider travel insurance for peace of mind',
      'Plan rest days between activities',
      'Research local cuisine and fine dining'
    ]
  },
  'The Solo Explorer': {
    emoji: '🎒',
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    welcomeMessage: 'The world awaits your solo adventures!',
    description: 'You find freedom in solitude and discovery in independence. Solo travel lets you follow your curiosity wherever it leads.',
    recommendations: [
      'Backpacking through Southeast Asia',
      'Solo hiking on scenic trails',
      'Photography expeditions',
      'Cultural immersion experiences'
    ],
    travelTips: [
      'Stay connected with regular check-ins',
      'Research local customs and safety',
      'Join solo traveler communities online',
      'Trust your instincts and stay flexible'
    ]
  },
  'The Social Butterfly': {
    emoji: '🎉',
    gradient: 'from-yellow-500 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    welcomeMessage: 'Let\'s make friends around the world!',
    description: 'You thrive on human connections and shared experiences. Travel is about the people you meet and the memories you create together.',
    recommendations: [
      'Group adventure tours',
      'Festival and event travel',
      'Hostel and social accommodation',
      'Food tours and cooking classes'
    ],
    travelTips: [
      'Join group activities and tours',
      'Stay in social accommodations',
      'Use travel apps to meet locals',
      'Document shared experiences with new friends'
    ]
  },
  'The Adventurer': {
    emoji: '⛰️',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    welcomeMessage: 'Adventure is calling your name!',
    description: 'You seek meaningful experiences and transformative journeys. Every trip is a chance to discover something new about yourself and the world.',
    recommendations: [
      'Multi-day trekking expeditions',
      'Wildlife safari adventures',
      'Cultural exchange programs',
      'Off-the-beaten-path destinations'
    ],
    travelTips: [
      'Pack versatile, durable gear',
      'Research local guides and operators',
      'Prepare physically for challenging activities',
      'Embrace unexpected opportunities'
    ]
  },
  'The Group Planner': {
    emoji: '👥',
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
    welcomeMessage: 'Time to organize the perfect group adventure!',
    description: 'You excel at bringing people together for unforgettable experiences. Your organizational skills make group travel smooth and enjoyable.',
    recommendations: [
      'Group villa rentals',
      'Corporate retreat destinations',
      'Multi-generational family trips',
      'Wedding and celebration travel'
    ],
    travelTips: [
      'Create shared planning documents',
      'Book group-friendly accommodations',
      'Plan activities for different interests',
      'Establish clear communication channels'
    ]
  },
  'The Balanced Wanderer': {
    emoji: '🌎',
    gradient: 'from-lime-500 to-green-500',
    bgGradient: 'from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20',
    welcomeMessage: 'The perfect balance of adventure and relaxation awaits!',
    description: 'You appreciate variety in your travels - a mix of excitement and tranquility, culture and nature, planned activities and spontaneous discoveries.',
    recommendations: [
      'Mixed itinerary destinations',
      'City and nature combinations',
      'Cultural and adventure packages',
      'Flexible travel plans'
    ],
    travelTips: [
      'Keep itineraries flexible',
      'Mix different types of activities',
      'Balance busy days with rest time',
      'Stay open to changing plans'
    ]
  },
  'The Active Soloist': {
    emoji: '🚴',
    gradient: 'from-pink-500 to-rose-500',
    bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    welcomeMessage: 'Ready to power through your next adventure!',
    description: 'You combine the independence of solo travel with high-energy activities. Every trip is an opportunity for personal challenge and growth.',
    recommendations: [
      'Solo cycling tours',
      'Marathon destination runs',
      'Yoga and fitness retreats',
      'Adventure racing events'
    ],
    travelTips: [
      'Train before departure',
      'Pack appropriate gear',
      'Stay hydrated and nourished',
      'Listen to your body\'s limits'
    ]
  },
  'The Leisure Socializer': {
    emoji: '🍹',
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    welcomeMessage: 'Let\'s socialize in style and comfort!',
    description: 'You enjoy meeting people in relaxed, comfortable settings. Travel is about quality time with others in beautiful, stress-free environments.',
    recommendations: [
      'Beach resort vacations',
      'Wine tasting tours',
      'Cruise ship adventures',
      'All-inclusive destinations'
    ],
    travelTips: [
      'Choose social accommodations',
      'Join organized group activities',
      'Plan relaxing downtime',
      'Research local social customs'
    ]
  },
  'The Curious Traveler': {
    emoji: '🔍',
    gradient: 'from-gray-500 to-slate-500',
    bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
    welcomeMessage: 'The world is full of mysteries to uncover!',
    description: 'You travel with an insatiable curiosity about the world. Every destination is a chance to learn, discover, and expand your understanding.',
    recommendations: [
      'Historical and archaeological sites',
      'Museum and cultural tours',
      'Educational travel programs',
      'Local immersion experiences'
    ],
    travelTips: [
      'Research before you go',
      'Take notes and photos',
      'Engage with local experts',
      'Ask questions everywhere'
    ]
  }
};

const PersonalizedWelcome = ({ personalizedData, user, onComplete }) => {
  const [currentRecommendation, setCurrentRecommendation] = useState(0);

  // Get personality config or default
  const personalityType = personalizedData?.personalityType || 'The Curious Traveler';
  const config = PERSONALITY_CONFIGS[personalityType] || PERSONALITY_CONFIGS['The Curious Traveler'];

  // Rotate recommendations
  useEffect(() => {
    if (config.recommendations.length > 1) {
      const interval = setInterval(() => {
        setCurrentRecommendation(prev =>
          (prev + 1) % config.recommendations.length
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [config.recommendations.length]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="text-center p-8 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-32 h-32 mx-auto mb-6 bg-gradient-to-r ${config.gradient} rounded-full flex items-center justify-center shadow-xl`}
            >
              <span className="text-6xl">{config.emoji}</span>
            </motion.div>

            <h1 className="text-4xl font-bold mb-4">
              <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                Welcome, {personalityType}!
              </span>
            </h1>

            <p className="text-2xl text-gray-700 dark:text-gray-300 mb-6 font-medium">
              {config.welcomeMessage}
            </p>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {config.description}
            </p>

            {/* Personality Traits Display */}
            {personalizedData?.personalityTraits && (
              <PersonalityTraitsDisplay
                traits={personalizedData.personalityTraits}
                gradient={config.gradient}
              />
            )}
          </GlassCard>
        </motion.div>

        {/* Recommendations Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Adventure Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <GlassCard className="p-6 h-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Perfect Adventures for You
              </h3>

              <div className="space-y-3">
                {config.recommendations.map((rec, index) => (
                  <motion.div
                    key={rec}
                    initial={{ opacity: 0.6, scale: 0.95 }}
                    animate={{
                      opacity: index === currentRecommendation ? 1 : 0.6,
                      scale: index === currentRecommendation ? 1 : 0.95,
                    }}
                    className={`p-3 rounded-lg transition-all ${
                      index === currentRecommendation
                        ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                        : 'bg-white/50 dark:bg-black/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {rec}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Travel Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <GlassCard className="p-6 h-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Travel Tips for You
              </h3>

              <div className="space-y-3">
                {config.travelTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full bg-gradient-to-r ${config.gradient} flex-shrink-0 flex items-center justify-center text-white text-sm font-bold mt-0.5`}>
                      {index + 1}
                    </span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <GlassCard className="text-center p-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Ready to Start Your Journey?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your personalized dashboard is ready with adventures tailored to your {personalityType.toLowerCase()} style!
            </p>

            <button
              onClick={onComplete}
              className={`px-8 py-4 bg-gradient-to-r ${config.gradient} text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-lg`}
            >
              Enter Your Dashboard 🎯
            </button>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

// Helper component for personality traits display
const PersonalityTraitsDisplay = ({ traits, gradient }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {Object.entries(traits).map(([trait, value]) => (
        <div key={trait} className="text-center">
          <div className={`w-16 h-16 mx-auto mb-2 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center shadow-lg`}>
            <span className="text-2xl font-bold text-white">
              {value}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {trait.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        </div>
      ))}
    </motion.div>
  );
};

export default PersonalizedWelcome;
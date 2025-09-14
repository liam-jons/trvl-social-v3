import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { onboardingService } from '../../services/onboarding-service';
import GlassCard from '../ui/GlassCard';

/**
 * QuizLaterPrompt - Shows a dismissible prompt for users who skipped the quiz
 * during onboarding, encouraging them to take it later
 */
const QuizLaterPrompt = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPromptStatus = async () => {
      if (!user) return;

      try {
        const shouldPrompt = await onboardingService.shouldPromptQuizLater(user);
        setShouldShow(shouldPrompt);

        // Show with delay for better UX
        if (shouldPrompt) {
          setTimeout(() => setIsVisible(true), 2000);
        }
      } catch (error) {
        console.error('Error checking quiz prompt status:', error);
      }
    };

    checkPromptStatus();
  }, [user]);

  const handleTakeQuiz = () => {
    navigate('/quiz');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Mark as dismissed for this session
    sessionStorage.setItem('quizPromptDismissed', 'true');
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Set reminder for next session (could be enhanced with more sophisticated logic)
    sessionStorage.setItem('quizPromptRemindLater', Date.now().toString());
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <GlassCard className="p-6 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🌟</span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Complete Your Travel Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Take our quick personality quiz to get personalized adventure recommendations tailored just for you!
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleTakeQuiz}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg text-sm hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Take Quiz Now ✨
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRemindLater}
                      className="flex-1 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Remind me later
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Don't show again
                    </button>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizLaterPrompt;
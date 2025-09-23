import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { onboardingService, ONBOARDING_STEPS } from '../../services/onboarding-service';
import lazyAssessmentService from '../../services/lazy-assessment-service';
import QuizContainer from '../quiz/QuizContainer';
import QuizResults from '../quiz/QuizResults';
import GlassCard from '../ui/GlassCard';
import PersonalizedWelcome from './PersonalizedWelcome';
const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [personalizedData, setPersonalizedData] = useState(null);
  const { handleSubmit } = useForm();
  // Initialize onboarding
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        // Check if user is first-time user
        const isFirstTime = await onboardingService.isFirstTimeUser(user);
        if (!isFirstTime) {
          navigate('/dashboard');
          return;
        }
        // Initialize onboarding
        const initialProgress = await onboardingService.initializeOnboarding(user);
        setProgress(initialProgress);
        setCurrentStep(initialProgress.currentStep);
        // Load personalized data if available
        const personalizedData = await onboardingService.getPersonalizedData();
        if (personalizedData) {
          setPersonalizedData(personalizedData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initializeOnboarding();
  }, [user, navigate]);
  // Handle step completion
  const completeStep = useCallback(async (stepData = {}) => {
    try {
      const updatedProgress = await onboardingService.completeStep(currentStep, stepData);
      setProgress(updatedProgress);
      setCurrentStep(updatedProgress.currentStep);
      // If completed, redirect to dashboard
      if (updatedProgress.isComplete) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  }, [currentStep, navigate]);
  // Handle quiz completion
  const handleQuizComplete = useCallback(async (answers) => {
    try {
      setLoading(true);
      // Calculate personality profile (simplified - actual calculation would be in assessment service)
      const calculatedProfile = await calculatePersonalityProfile(answers);
      // Save assessment
      const assessmentData = {
        userId: user.id,
        answers: answers,
        ...calculatedProfile,
        completedAt: new Date().toISOString()
      };
      const savedAssessment = await lazyAssessmentService.createAssessment(assessmentData);
      setQuizResults(savedAssessment.calculatorProfile);
      // Complete quiz step in onboarding
      await onboardingService.completeQuiz(savedAssessment);
      // Update current step
      setCurrentStep(ONBOARDING_STEPS.QUIZ_RESULTS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  // Handle quiz skip
  const handleSkipQuiz = useCallback(async () => {
    try {
      const updatedProgress = await onboardingService.skipQuiz();
      setProgress(updatedProgress);
      setCurrentStep(updatedProgress.currentStep);
      // Load personalized data if user has existing assessment
      const personalizedData = await onboardingService.getPersonalizedData();
      if (personalizedData) {
        setPersonalizedData(personalizedData);
      }
      // If completed, redirect to dashboard
      if (updatedProgress.isComplete) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  }, [navigate]);
  // Handle viewing results
  const handleViewResults = useCallback(() => {
    setCurrentStep(ONBOARDING_STEPS.WELCOME_PERSONALIZED);
  }, []);
  // Handle retaking quiz
  const handleRetakeQuiz = useCallback(() => {
    setCurrentStep(ONBOARDING_STEPS.PERSONALITY_QUIZ);
    setQuizResults(null);
  }, []);
  if (loading) {
    return <LoadingScreen />;
  }
  if (error) {
    return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Progress indicator */}
        <OnboardingProgressBar currentStep={currentStep} />
        {/* Step content */}
        <AnimatePresence mode="wait">
          {renderCurrentStep()}
        </AnimatePresence>
      </div>
    </div>
  );
  function renderCurrentStep() {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return (
          <WelcomeStep
            key="welcome"
            onContinue={() => completeStep()}
            user={user}
          />
        );
      case ONBOARDING_STEPS.PERSONALITY_QUIZ:
        return (
          <QuizStep
            key="quiz"
            onComplete={handleQuizComplete}
            onSkip={handleSkipQuiz}
            isLoading={loading}
          />
        );
      case ONBOARDING_STEPS.QUIZ_RESULTS:
        return (
          <ResultsStep
            key="results"
            results={quizResults}
            onContinue={handleViewResults}
            onRetake={handleRetakeQuiz}
          />
        );
      case ONBOARDING_STEPS.WELCOME_PERSONALIZED:
        return (
          <PersonalizedWelcomeStep
            key="personalized"
            personalizedData={personalizedData}
            onComplete={() => completeStep()}
            user={user}
          />
        );
      default:
        return null;
    }
  }
};
// Step Components
const WelcomeStep = ({ onContinue, user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="max-w-2xl mx-auto p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
        >
          <span className="text-4xl">🌍</span>
        </motion.div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Welcome to TRVL Social!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          Hi {user?.email?.split('@')[0] || 'there'}! We're excited to help you discover amazing travel experiences.
        </p>
        <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-8">
          <p className="flex items-center justify-center gap-3">
            <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">1</span>
            Take a quick personality quiz to understand your travel style
          </p>
          <p className="flex items-center justify-center gap-3">
            <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">2</span>
            Get personalized adventure recommendations
          </p>
          <p className="flex items-center justify-center gap-3">
            <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">3</span>
            Connect with like-minded travelers and plan amazing trips
          </p>
        </div>
        <button
          onClick={onContinue}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          Let's Get Started! 🚀
        </button>
      </GlassCard>
    </motion.div>
  );
};
const QuizStep = ({ onComplete, onSkip, isLoading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Quiz introduction */}
        <GlassCard className="mb-8 p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            Discover Your Travel Personality
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Answer a few quick questions to get personalized travel recommendations that match your style.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
            >
              Skip for now →
            </button>
          </div>
        </GlassCard>
        {/* Quiz component */}
        {!isLoading && (
          <QuizContainer onComplete={onComplete} />
        )}
      </div>
    </motion.div>
  );
};
const ResultsStep = ({ results, onContinue, onRetake }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        <QuizResults
          profile={results}
          onRetake={onRetake}
          className="mb-8"
        />
        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Continue to Dashboard 🎯
          </button>
        </div>
      </div>
    </motion.div>
  );
};
const PersonalizedWelcomeStep = ({ personalizedData, onComplete, user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <PersonalizedWelcome
        personalizedData={personalizedData}
        user={user}
        onComplete={onComplete}
      />
    </motion.div>
  );
};
// Helper Components
const OnboardingProgressBar = ({ currentStep }) => {
  const steps = Object.values(ONBOARDING_STEPS);
  const currentIndex = steps.indexOf(currentStep);
  const progressPercent = ((currentIndex + 1) / (steps.length - 1)) * 100; // -1 to exclude COMPLETE step
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Getting Started</span>
        <span>Complete</span>
      </div>
    </div>
  );
};
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <GlassCard className="max-w-md w-full text-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 mx-auto mb-4"
      >
        <div className="w-full h-full rounded-full border-4 border-blue-500 border-t-transparent" />
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Setting Up Your Experience
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Preparing your personalized onboarding...
      </p>
    </GlassCard>
  </div>
);
const ErrorScreen = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center">
    <GlassCard className="max-w-md w-full text-center p-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </GlassCard>
  </div>
);
// Utility functions
const calculatePersonalityProfile = async (answers) => {
  // This is a simplified calculation - the actual logic would be more complex
  // and likely moved to the assessment service
  const traitScores = {
    energyLevel: 0,
    socialPreference: 0,
    adventureStyle: 0,
    riskTolerance: 0
  };
  // Calculate scores based on answers
  answers.forEach(answer => {
    Object.keys(answer.traitScores).forEach(trait => {
      if (traitScores.hasOwnProperty(trait)) {
        traitScores[trait] += answer.traitScores[trait];
      }
    });
  });
  // Normalize scores to 0-100
  const maxPossibleScore = answers.length * 5; // Assuming max 5 points per question per trait
  Object.keys(traitScores).forEach(trait => {
    traitScores[trait] = Math.round((traitScores[trait] / maxPossibleScore) * 100);
  });
  // Determine personality type (simplified logic)
  const personalityType = determinePersonalityType(traitScores);
  return {
    ...traitScores,
    personalityType,
    completedAt: new Date().toISOString()
  };
};
const determinePersonalityType = (scores) => {
  // Simplified personality type determination
  // In reality, this would use more sophisticated logic
  if (scores.adventureStyle > 70 && scores.riskTolerance > 70) {
    return 'The Thrill Seeker';
  }
  if (scores.socialPreference > 70 && scores.energyLevel > 70) {
    return 'The Social Butterfly';
  }
  if (scores.socialPreference < 40 && scores.adventureStyle > 60) {
    return 'The Solo Explorer';
  }
  if (scores.riskTolerance < 40 && scores.socialPreference > 60) {
    return 'The Comfort Traveler';
  }
  return 'The Balanced Wanderer';
};
export default OnboardingFlow;
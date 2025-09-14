import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import QuizProgress from './QuizProgress';
import QuizQuestion from './QuizQuestion';
import { quizQuestions } from '../../data/quiz-questions';
import GlassCard from '../ui/GlassCard';

export default function QuizContainer({ onComplete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  const { handleSubmit } = useForm();

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const selectedOption = answers[currentQuestion.id];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  const handleSelectOption = useCallback((option) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  }, [currentQuestion.id]);

  const handleNext = useCallback(async () => {
    if (isLastQuestion) {
      setIsCalculating(true);

      // Prepare answers for calculation
      const quizAnswers = Object.entries(answers).map(([questionId, option]) => ({
        questionId: parseInt(questionId),
        optionId: option.id,
        traitScores: option.traitScores
      }));

      // Pass to onComplete or navigate to results
      if (onComplete) {
        await onComplete(quizAnswers);
      } else {
        // Store answers temporarily and navigate to results
        sessionStorage.setItem('quizAnswers', JSON.stringify(quizAnswers));
        navigate('/quiz/results');
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, answers, onComplete, navigate]);

  const handlePrevious = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [isFirstQuestion]);

  const handleSkip = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion]);

  if (isCalculating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <div className="w-full h-full rounded-full border-4 border-blue-500 border-t-transparent" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Analyzing Your Travel Personality
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Creating your personalized travel profile...
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleNext)} className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Discover Your Travel Personality
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <Link
                to="/quiz/history"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View History
              </Link>
            )}
            {!isLastQuestion && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Skip Question →
              </button>
            )}
          </div>
        </div>
        <QuizProgress
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={quizQuestions.length}
        />
      </div>

      <QuizQuestion
        question={currentQuestion}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isFirst={isFirstQuestion}
        isLast={isLastQuestion}
      />
    </form>
  );
}

QuizContainer.propTypes = {
  onComplete: PropTypes.func,
};
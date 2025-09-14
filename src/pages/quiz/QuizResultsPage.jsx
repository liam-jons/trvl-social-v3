import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import QuizResults from '../../components/quiz/QuizResults';
import { calculatePersonalityProfile } from '../../utils/personality-calculator';

export default function QuizResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHistorical, setIsHistorical] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // Check if viewing historical assessment
        const selectedAssessment = sessionStorage.getItem('selectedAssessment');
        if (selectedAssessment) {
          const assessment = JSON.parse(selectedAssessment);
          setIsHistorical(assessment.isHistorical || false);
        }

        // Check for existing profile in session storage
        const savedProfile = sessionStorage.getItem('personalityProfile');
        const savedAnswers = sessionStorage.getItem('quizAnswers');

        if (savedProfile) {
          // Parse existing profile
          const parsedProfile = JSON.parse(savedProfile);
          setProfile(parsedProfile);
        } else if (savedAnswers) {
          // Recalculate profile from answers
          const answers = JSON.parse(savedAnswers);
          const calculatedProfile = await calculatePersonalityProfile(answers);
          setProfile(calculatedProfile);

          // Save the calculated profile
          sessionStorage.setItem('personalityProfile', JSON.stringify(calculatedProfile));
        } else {
          // No data available, redirect to quiz
          navigate('/quiz');
          return;
        }
      } catch (err) {
        console.error('Error loading quiz results:', err);
        setError('Failed to load your quiz results. Please try taking the quiz again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [navigate]);

  const handleRetakeQuiz = () => {
    // Clear existing data and navigate to quiz
    sessionStorage.removeItem('personalityProfile');
    sessionStorage.removeItem('quizAnswers');
    sessionStorage.removeItem('selectedAssessment');
    navigate('/quiz');
  };

  const handleViewHistory = () => {
    navigate('/quiz/history');
  };

  const handleShare = async (personalityProfile) => {
    const shareData = {
      title: `My Travel Personality: ${personalityProfile.personalityType}`,
      text: `I just discovered my travel personality! I'm ${personalityProfile.personalityType}. 🌍✈️\n\nFind out yours at ${window.location.origin}/quiz`,
      url: `${window.location.origin}/quiz`
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        const shareText = `${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);

        // You could show a toast notification here
        console.log('Results copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing results:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Quiz Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <QuizResults
        profile={profile}
        onShare={handleShare}
        onRetake={handleRetakeQuiz}
        onViewHistory={user ? handleViewHistory : undefined}
        isHistorical={isHistorical}
      />
    </div>
  );
}
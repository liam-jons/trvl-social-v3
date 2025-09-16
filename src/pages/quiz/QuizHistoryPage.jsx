import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import QuizHistory from '../../components/quiz/QuizHistory';
import { assessmentService } from '../../services/assessment-service';
export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const handleRetakeQuiz = () => {
    // Clear any existing session data and navigate to quiz
    sessionStorage.removeItem('personalityProfile');
    sessionStorage.removeItem('quizAnswers');
    navigate('/quiz');
  };
  const handleViewResult = async (assessment) => {
    try {
      // Store the selected assessment in session storage to view in results page
      const profile = assessment.calculatorProfile;
      if (profile) {
        sessionStorage.setItem('personalityProfile', JSON.stringify(profile));
        // Store assessment metadata for context
        sessionStorage.setItem('selectedAssessment', JSON.stringify({
          id: assessment.id,
          completedAt: assessment.completed_at,
          isHistorical: true
        }));
        navigate('/quiz/results');
      }
    } catch (error) {
      console.error('Error viewing assessment result:', error);
    }
  };
  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login', {
      state: {
        from: '/quiz/history',
        message: 'Please log in to view your assessment history.'
      },
      replace: true
    });
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <QuizHistory
        onRetakeQuiz={handleRetakeQuiz}
        onViewResult={handleViewResult}
      />
    </div>
  );
}
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizContainer from '../../components/quiz/QuizContainer';
import { calculatePersonalityProfile } from '../../utils/personality-calculator';

export default function PersonalityQuizPage() {
  const navigate = useNavigate();

  const handleQuizComplete = useCallback(async (answers) => {
    try {
      // Calculate personality profile from answers
      const profile = calculatePersonalityProfile(answers);

      // Store profile in session storage for now (will integrate with Supabase later)
      sessionStorage.setItem('personalityProfile', JSON.stringify(profile));
      sessionStorage.setItem('quizAnswers', JSON.stringify(answers));

      // Navigate to results page
      navigate('/quiz/results');
    } catch (error) {
      console.error('Error processing quiz results:', error);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <QuizContainer onComplete={handleQuizComplete} />
      </div>
    </div>
  );
}
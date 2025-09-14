import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import QuizContainer from '../../components/quiz/QuizContainer';
import { calculatePersonalityProfile } from '../../utils/personality-calculator';
import { assessmentService } from '../../services/assessment-service';

export default function PersonalityQuizPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleQuizComplete = useCallback(async (answers) => {
    try {
      // Calculate personality profile from answers
      const profile = await calculatePersonalityProfile(answers);

      // Store profile in session storage for immediate display
      sessionStorage.setItem('personalityProfile', JSON.stringify(profile));
      sessionStorage.setItem('quizAnswers', JSON.stringify(answers));

      // Clear any historical assessment flag
      sessionStorage.removeItem('selectedAssessment');

      // Save to database if user is authenticated
      if (user?.id) {
        try {
          const assessmentData = {
            userId: user.id,
            answers,
            profile,
            completedAt: new Date(),
            metadata: {
              version: '1.0',
              source: 'personality_quiz_page',
              userAgent: navigator.userAgent
            }
          };

          await assessmentService.saveAssessment(assessmentData);
          console.log('Assessment saved successfully to database');
        } catch (dbError) {
          // Don't prevent navigation if database save fails
          console.error('Failed to save assessment to database:', dbError);
        }
      }

      // Navigate to results page
      navigate('/quiz/results');
    } catch (error) {
      console.error('Error processing quiz results:', error);
    }
  }, [navigate, user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <QuizContainer onComplete={handleQuizComplete} />
      </div>
    </div>
  );
}
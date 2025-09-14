import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { onboardingService } from '../../services/onboarding-service';
import OnboardingFlow from '../../components/onboarding/OnboardingFlow';

/**
 * OnboardingPage - Main page component for new user onboarding
 * Handles routing logic and user authentication checks
 */
const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for auth to complete loading
      if (loading) return;

      // Redirect to login if not authenticated
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Check if user has already completed onboarding
      try {
        const isFirstTime = await onboardingService.isFirstTimeUser(user);

        if (!isFirstTime) {
          // User has already completed onboarding, redirect to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }

        // User needs onboarding, stay on this page
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow onboarding to proceed (fail-safe approach)
      }
    };

    checkOnboardingStatus();
  }, [user, loading, navigate]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Checking your account status...
          </p>
        </div>
      </div>
    );
  }

  // Don't render the onboarding flow if user is not authenticated
  // The useEffect above will handle the redirect
  if (!user) {
    return null;
  }

  return (
    <div className="onboarding-page">
      <OnboardingFlow />
    </div>
  );
};

export default OnboardingPage;
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { onboardingService } from '../../services/onboarding-service';
/**
 * OnboardingRedirect - Component that automatically redirects first-time users to onboarding
 * Should be included in components that authenticated users land on (Dashboard, etc.)
 */
const OnboardingRedirect = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    const checkAndRedirectToOnboarding = async () => {
      // Wait for authentication to complete
      if (loading || !user) return;
      try {
        const isFirstTime = await onboardingService.isFirstTimeUser(user);
        if (isFirstTime) {
          // Redirect to onboarding
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        // On error, don't redirect to avoid infinite loops
      }
    };
    checkAndRedirectToOnboarding();
  }, [user, loading, navigate]);
  // Don't render children if we're still checking or if we're about to redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }
  return children;
};
export default OnboardingRedirect;
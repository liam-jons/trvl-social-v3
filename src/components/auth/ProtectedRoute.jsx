import { Navigate, useLocation } from 'react-router-dom';
import { useUser, useRole } from '../../hooks/useAuth';
import GlassCard from '../ui/GlassCard';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requiredRole = null,
  redirectTo = '/login',
  fallback = null 
}) => {
  const location = useLocation();
  const { user, loading } = useUser();
  const { hasRole } = useRole();

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <GlassCard className="p-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-lg">Loading...</span>
            </div>
          </GlassCard>
        </div>
      )
    );
  }

  // Check authentication
  if (requireAuth && !user) {
    // Save the attempted location for redirecting after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access this page.
            </p>
            {requiredRole && (
              <p className="text-sm text-gray-500 mt-2">
                Required role: {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
            <Navigate to="/dashboard" replace />
          </div>
        </GlassCard>
      </div>
    );
  }

  // Render children if all checks pass
  return children;
};

export default ProtectedRoute;
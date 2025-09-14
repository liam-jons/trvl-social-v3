import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

// Hook to initialize and manage auth state
export const useAuth = () => {
  const {
    user,
    profile,
    session,
    loading,
    error,
    initialize,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    verifyOTP,
    resendConfirmation,
    cleanup,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  return {
    // State
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    
    // Actions
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    verifyOTP,
    resendConfirmation,
  };
};

// Hook to get current user
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  
  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
  };
};

// Hook to check user role
export const useRole = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  
  const role = profile?.role || user?.user_metadata?.role || 'traveler';
  
  return {
    role,
    isAdmin: role === 'admin',
    isVendor: role === 'vendor',
    isTraveler: role === 'traveler',
    hasRole: (requiredRole) => {
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(role);
      }
      return role === requiredRole;
    },
  };
};

// Hook for auth-required components
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, loading } = useUser();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store intended destination
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, loading, redirectTo]);
  
  return { isAuthenticated, loading };
};

export default useAuth;
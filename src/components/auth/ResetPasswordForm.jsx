import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword, verifyOTP, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Get token from URL params
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'recovery';

  useEffect(() => {
    // Verify token is present
    if (!token || !email) {
      setTokenError(true);
    }
  }, [token, email]);

  const validateForm = () => {
    const newErrors = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // First verify the OTP token
      if (type === 'recovery' && token && email) {
        const verifyResult = await verifyOTP({ email, token, type: 'recovery' });
        
        if (!verifyResult.success) {
          setTokenError(true);
          return;
        }
      }
      
      // Then update the password
      const result = await updatePassword(formData.password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };

  if (tokenError) {
    return (
      <GlassCard className="max-w-md mx-auto mt-20 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This password reset link is invalid or has expired.
          </p>
        </div>
        
        <div className="space-y-3">
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={() => navigate('/auth/forgot-password')}
          >
            Request New Reset Link
          </GlassButton>
          
          <GlassButton
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  if (success) {
    return (
      <GlassCard className="max-w-md mx-auto mt-20 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Password Reset Successful!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your password has been successfully reset.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to login page...
          </p>
        </div>
        
        <div className="mt-6">
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-md mx-auto mt-20 p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Reset Your Password</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="••••••••"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <GlassButton
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </GlassButton>

        {/* Cancel Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500"
          >
            Cancel and return to sign in
          </button>
        </div>
      </form>
    </GlassCard>
  );
};

export default ResetPasswordForm;
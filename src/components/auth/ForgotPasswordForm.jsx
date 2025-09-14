import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const ForgotPasswordForm = () => {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess(true);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  if (success) {
    return (
      <GlassCard className="max-w-md mx-auto mt-20 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 dark:text-gray-300">
            We've sent password reset instructions to:
          </p>
          <p className="font-medium mt-2">{email}</p>
        </div>
        
        <div className="space-y-4 text-left bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or request a new one.
          </p>
        </div>
        
        <div className="mt-6 space-y-3">
          <GlassButton
            variant="secondary"
            className="w-full"
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
          >
            Send Another Email
          </GlassButton>
          
          <Link to="/login" className="block">
            <GlassButton variant="ghost" className="w-full">
              Back to Sign In
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-md mx-auto mt-20 p-8">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link to="/login" className="mr-2">
            <svg className="w-6 h-6 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h2 className="text-3xl font-bold">Forgot Password?</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
            autoComplete="email"
            autoFocus
          />
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
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
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </GlassButton>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Sign In
          </Link>
        </div>
      </form>
    </GlassCard>
  );
};

export default ForgotPasswordForm;
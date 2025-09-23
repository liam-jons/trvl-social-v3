import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';

const AgeVerificationNotice = ({ variant = 'default', className = '' }) => {
  const variants = {
    default: {
      container: 'p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
      title: 'text-blue-800 dark:text-blue-200',
      text: 'text-blue-700 dark:text-blue-300'
    },
    warning: {
      container: 'p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
      title: 'text-amber-800 dark:text-amber-200',
      text: 'text-amber-700 dark:text-amber-300'
    },
    error: {
      container: 'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
      title: 'text-red-800 dark:text-red-200',
      text: 'text-red-700 dark:text-red-300'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <GlassCard className={`${currentVariant.container} rounded-lg ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className={`w-5 h-5 ${currentVariant.title}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${currentVariant.title} mb-2`}>
            Age Requirement
          </h3>
          <p className={`text-sm ${currentVariant.text} mb-3`}>
            You must be 13 or older to use TRVL Social. We comply with the Children's Online Privacy Protection Act (COPPA).
          </p>
          <div className={`text-xs ${currentVariant.text} space-y-1`}>
            <p>
              <strong>Why age verification is required:</strong> To protect children's privacy and comply with federal regulations.
            </p>
            <p>
              Learn more about our{' '}
              <Link
                to="/privacy"
                className="underline hover:opacity-80"
              >
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link
                to="/terms"
                className="underline hover:opacity-80"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// Export additional variants for specific use cases
export const AgeVerificationWarning = (props) => (
  <AgeVerificationNotice variant="warning" {...props} />
);

export const AgeVerificationError = (props) => (
  <AgeVerificationNotice variant="error" {...props} />
);

// Compact version for smaller spaces
export const AgeVerificationBadge = ({ className = '' }) => (
  <div className={`inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full ${className}`}>
    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    13+ Required
  </div>
);

export default AgeVerificationNotice;
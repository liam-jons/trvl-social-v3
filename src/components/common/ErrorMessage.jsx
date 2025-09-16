import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const ErrorMessage = ({
  message,
  title = "Something went wrong",
  onRetry,
  showRetry = true,
  className = ""
}) => {
  return (
    <GlassCard variant="light" className={`text-center ${className}`}>
      <div className="py-8 px-6">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        {showRetry && onRetry && (
          <GlassButton
            onClick={onRetry}
            variant="primary"
            size="md"
          >
            Try Again
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
};

export default ErrorMessage;
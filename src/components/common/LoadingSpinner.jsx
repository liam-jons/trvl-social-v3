import GlassCard from '../ui/GlassCard';

const LoadingSpinner = ({ 
  size = 'md', 
  fullScreen = false, 
  message = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-gray-600 dark:text-gray-300 text-sm animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-modal bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <GlassCard className="p-8">
          {spinner}
        </GlassCard>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
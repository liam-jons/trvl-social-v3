import { useMemo, useEffect, useState } from 'react';

const BookingConfidenceScore = ({
  score = 0,
  size = 'md',
  animated = false,
  showLabel = true,
  showBreakdown = false,
  onScoreClick,
  className = ''
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animated) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScore(score);
    }
  }, [score, animated]);

  const sizeConfig = {
    xs: {
      container: 'w-8 h-8',
      text: 'text-xs',
      strokeWidth: 3,
      radius: 12
    },
    sm: {
      container: 'w-12 h-12',
      text: 'text-sm',
      strokeWidth: 3,
      radius: 18
    },
    md: {
      container: 'w-16 h-16',
      text: 'text-base',
      strokeWidth: 4,
      radius: 24
    },
    lg: {
      container: 'w-20 h-20',
      text: 'text-lg',
      strokeWidth: 4,
      radius: 30
    }
  };

  const config = sizeConfig[size];
  const { container, text, strokeWidth, radius } = config;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 85) return { color: '#059669', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' };
    if (score >= 70) return { color: '#2563eb', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' };
    if (score >= 55) return { color: '#d97706', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
    if (score >= 40) return { color: '#ea580c', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' };
    return { color: '#dc2626', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
  };

  const scoreInfo = getScoreColor(animatedScore);

  const getConfidenceLevel = (score) => {
    if (score >= 85) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 55) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Very Low';
  };

  const getConfidenceDescription = (score) => {
    if (score >= 85) return 'Excellent group dynamics - high trip success likelihood';
    if (score >= 70) return 'Good compatibility - strong potential for success';
    if (score >= 55) return 'Decent match - moderate planning may be needed';
    if (score >= 40) return 'Some challenges expected - careful coordination required';
    return 'Significant differences - extensive planning recommended';
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Circular Progress Ring */}
      <div
        className={`${container} relative cursor-pointer transition-transform duration-200 ${
          animated && isVisible ? 'scale-105' : ''
        } ${onScoreClick ? 'hover:scale-110' : ''}`}
        onClick={() => onScoreClick?.(score)}
        title={showLabel ? '' : `Booking Confidence: ${Math.round(animatedScore)}%`}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={scoreInfo.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              transitionDelay: animated ? '200ms' : '0ms'
            }}
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${text} font-bold ${scoreInfo.text}`}>
            {Math.round(animatedScore)}
          </span>
        </div>

        {/* Pulse animation for high scores */}
        {animatedScore >= 85 && animated && (
          <div className="absolute inset-0 rounded-full animate-pulse bg-green-400/20" />
        )}
      </div>

      {/* Label and confidence level */}
      {showLabel && (
        <div className="text-center">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Booking Confidence
          </div>
          <div className={`text-xs font-semibold ${scoreInfo.text}`}>
            {getConfidenceLevel(animatedScore)}
          </div>
        </div>
      )}

      {/* Detailed breakdown */}
      {showBreakdown && (
        <div className="text-center max-w-xs">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {getConfidenceDescription(animatedScore)}
          </p>

          {/* Confidence factors */}
          <div className="mt-3 space-y-1">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Key Factors
            </div>
            {[
              { label: 'Group Chemistry', weight: 40 },
              { label: 'Personality Balance', weight: 25 },
              { label: 'Travel Alignment', weight: 20 },
              { label: 'Communication', weight: 15 }
            ].map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {factor.label}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(100, (animatedScore * factor.weight / 100) + Math.random() * 20)}%`,
                        backgroundColor: scoreInfo.color,
                        transitionDelay: `${300 + index * 100}ms`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingConfidenceScore;
import { useEffect, useState } from 'react';
import { COMPATIBILITY_THRESHOLDS } from '../../types/compatibility';

const CompatibilityCircularProgress = ({
  score = 0,
  size = 120,
  strokeWidth = 8,
  animate = true,
  showLabel = true,
  className = ''
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Get threshold info based on score
  const getThresholdInfo = (score) => {
    if (score >= COMPATIBILITY_THRESHOLDS.EXCELLENT.min) return COMPATIBILITY_THRESHOLDS.EXCELLENT;
    if (score >= COMPATIBILITY_THRESHOLDS.GOOD.min) return COMPATIBILITY_THRESHOLDS.GOOD;
    if (score >= COMPATIBILITY_THRESHOLDS.FAIR.min) return COMPATIBILITY_THRESHOLDS.FAIR;
    return COMPATIBILITY_THRESHOLDS.POOR;
  };

  const threshold = getThresholdInfo(score);

  useEffect(() => {
    if (!animate) {
      setAnimatedScore(score);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepValue = score / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setAnimatedScore(Math.min(stepValue * currentStep, score));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700 opacity-30"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={threshold.color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${threshold.color}40)`
          }}
        />

        {/* Glow effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={threshold.color}
          strokeWidth={strokeWidth / 2}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="opacity-60"
          style={{
            filter: `blur(2px)`
          }}
        />
      </svg>

      {/* Center content */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold transition-colors duration-500"
            style={{ color: threshold.color }}
          >
            {Math.round(animatedScore)}%
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Match
          </span>
        </div>
      )}
    </div>
  );
};

export default CompatibilityCircularProgress;
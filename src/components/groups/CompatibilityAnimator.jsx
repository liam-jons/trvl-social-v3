import { useState, useEffect, useRef, useMemo } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

const CompatibilityAnimator = ({
  currentScore = 0,
  previousScore = null,
  duration = 1500,
  onAnimationComplete,
  children,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayScore, setDisplayScore] = useState(currentScore);
  const animationRef = useRef(null);
  const hasAnimated = useRef(false);

  // Calculate score change direction and magnitude
  const scoreChange = useMemo(() => {
    if (previousScore === null) return null;
    return {
      direction: currentScore > previousScore ? 'up' : currentScore < previousScore ? 'down' : 'none',
      magnitude: Math.abs(currentScore - previousScore),
      percentage: currentScore - previousScore
    };
  }, [currentScore, previousScore]);

  // Spring animation for score transitions
  const scoreSpring = useSpring({
    from: { score: previousScore || currentScore },
    to: { score: currentScore },
    config: {
      ...config.gentle,
      duration: scoreChange?.magnitude > 20 ? duration * 1.5 : duration
    },
    onStart: () => setIsAnimating(true),
    onRest: () => {
      setIsAnimating(false);
      onAnimationComplete?.();
    }
  });

  // Pulse animation for significant changes
  const pulseSpring = useSpring({
    from: {
      scale: 1,
      opacity: 1,
      rotation: 0
    },
    to: async (next) => {
      if (scoreChange && scoreChange.magnitude > 15 && !hasAnimated.current) {
        hasAnimated.current = true;
        // Initial pulse
        await next({ scale: 1.1, opacity: 0.9 });
        await next({ scale: 1.05, opacity: 1 });
        await next({ scale: 1, opacity: 1 });

        // Add rotation for dramatic changes
        if (scoreChange.magnitude > 25) {
          await next({ rotation: scoreChange.direction === 'up' ? 5 : -5 });
          await next({ rotation: 0 });
        }
      }
    },
    config: config.wobbly,
    reset: true
  });

  // Color transition for score changes
  const colorSpring = useSpring({
    from: {
      color: getScoreColor(previousScore || currentScore),
      backgroundColor: getScoreBackgroundColor(previousScore || currentScore)
    },
    to: {
      color: getScoreColor(currentScore),
      backgroundColor: getScoreBackgroundColor(currentScore)
    },
    config: config.slow
  });

  // Update display score during animation
  useEffect(() => {
    if (scoreSpring.score) {
      const unsubscribe = scoreSpring.score.start({
        onChange: ({ value }) => {
          setDisplayScore(Math.round(value));
        }
      });
      return unsubscribe;
    }
  }, [scoreSpring.score]);

  // Reset animation flag when score changes
  useEffect(() => {
    hasAnimated.current = false;
  }, [currentScore]);

  function getScoreColor(score) {
    if (score >= 85) return '#059669'; // green-600
    if (score >= 70) return '#2563eb'; // blue-600
    if (score >= 55) return '#d97706'; // amber-600
    if (score >= 40) return '#ea580c'; // orange-600
    return '#dc2626'; // red-600
  }

  function getScoreBackgroundColor(score) {
    if (score >= 85) return 'rgba(5, 150, 105, 0.1)';
    if (score >= 70) return 'rgba(37, 99, 235, 0.1)';
    if (score >= 55) return 'rgba(217, 119, 6, 0.1)';
    if (score >= 40) return 'rgba(234, 88, 12, 0.1)';
    return 'rgba(220, 38, 38, 0.1)';
  }

  // Render change indicator
  const renderChangeIndicator = () => {
    if (!scoreChange || scoreChange.magnitude < 5) return null;

    const isPositive = scoreChange.direction === 'up';
    const arrow = isPositive ? '↗' : '↘';
    const colorClass = isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

    return (
      <animated.div
        style={{
          transform: pulseSpring.scale.to(s => `scale(${s})`),
          opacity: pulseSpring.opacity
        }}
        className={`inline-flex items-center space-x-1 ml-2 text-xs font-medium ${colorClass}`}
      >
        <span>{arrow}</span>
        <span>{scoreChange.percentage > 0 ? '+' : ''}{Math.round(scoreChange.percentage)}</span>
      </animated.div>
    );
  };

  // Render floating change notification
  const renderFloatingNotification = () => {
    if (!scoreChange || scoreChange.magnitude < 15) return null;

    return (
      <animated.div
        style={{
          transform: pulseSpring.scale.to(s => `scale(${s}) translateY(-20px)`),
          opacity: pulseSpring.opacity.to(o => Math.max(0, o - 0.3))
        }}
        className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
          scoreChange.direction === 'up'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {scoreChange.direction === 'up' ? 'Chemistry improved!' : 'Chemistry changed'}
        </div>
      </animated.div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main animated container */}
      <animated.div
        style={{
          transform: pulseSpring.scale.to(s =>
            pulseSpring.rotation.to(r => `scale(${s}) rotate(${r}deg)`)
          ),
          opacity: pulseSpring.opacity
        }}
        ref={animationRef}
      >
        {/* Render children with animated score */}
        {children ? (
          typeof children === 'function'
            ? children({
                score: displayScore,
                isAnimating,
                scoreChange,
                animatedColor: colorSpring.color,
                animatedBackgroundColor: colorSpring.backgroundColor
              })
            : children
        ) : (
          <animated.div
            style={{
              color: colorSpring.color,
              backgroundColor: colorSpring.backgroundColor
            }}
            className="px-3 py-2 rounded-full text-sm font-medium transition-colors"
          >
            {displayScore}%
          </animated.div>
        )}
      </animated.div>

      {/* Change indicators */}
      {renderChangeIndicator()}
      {renderFloatingNotification()}

      {/* Loading indicator during recalculation */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-lg">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Hook for managing compatibility animations
export const useCompatibilityAnimation = (groupId) => {
  const [previousScore, setPreviousScore] = useState(null);
  const [animationQueue, setAnimationQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const queueScoreUpdate = (newScore) => {
    setAnimationQueue(prev => [...prev, { score: newScore, timestamp: Date.now() }]);
  };

  const processQueue = async () => {
    if (animationQueue.length === 0 || isProcessingQueue) return;

    setIsProcessingQueue(true);
    const update = animationQueue[0];

    // Set previous score for animation comparison
    setPreviousScore(prev => prev);

    // Remove processed update from queue
    setAnimationQueue(prev => prev.slice(1));

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessingQueue(false);
  };

  useEffect(() => {
    processQueue();
  }, [animationQueue, isProcessingQueue]);

  return {
    queueScoreUpdate,
    previousScore,
    setPreviousScore,
    isProcessingQueue
  };
};

export default CompatibilityAnimator;
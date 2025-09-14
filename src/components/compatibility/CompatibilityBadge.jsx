import { COMPATIBILITY_THRESHOLDS } from '../../types/compatibility';

const CompatibilityBadge = ({
  score = 0,
  variant = 'default',
  size = 'md',
  showScore = true,
  className = ''
}) => {
  // Get threshold info based on score
  const getThresholdInfo = (score) => {
    if (score >= COMPATIBILITY_THRESHOLDS.EXCELLENT.min) return COMPATIBILITY_THRESHOLDS.EXCELLENT;
    if (score >= COMPATIBILITY_THRESHOLDS.GOOD.min) return COMPATIBILITY_THRESHOLDS.GOOD;
    if (score >= COMPATIBILITY_THRESHOLDS.FAIR.min) return COMPATIBILITY_THRESHOLDS.FAIR;
    return COMPATIBILITY_THRESHOLDS.POOR;
  };

  const threshold = getThresholdInfo(score);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-5 py-2.5 text-lg'
  };

  const variantClasses = {
    default: `
      glass-blur-sm border
      text-white font-medium
      shadow-lg
    `,
    solid: `
      font-medium text-white
      shadow-lg
    `,
    outline: `
      glass-blur-sm border-2 bg-transparent
      font-medium shadow-lg
    `,
    minimal: `
      font-medium
    `
  };

  const baseStyle = {
    backgroundColor: variant === 'solid' ? threshold.color : variant === 'default' ? `${threshold.color}20` : 'transparent',
    borderColor: threshold.color,
    color: variant === 'outline' || variant === 'minimal' ? threshold.color : 'white'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full
        transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      style={baseStyle}
    >
      {/* Status dot */}
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: threshold.color }}
      />

      {/* Label */}
      <span>{threshold.label}</span>

      {/* Score */}
      {showScore && (
        <span className="font-bold">
          {Math.round(score)}%
        </span>
      )}
    </span>
  );
};

export default CompatibilityBadge;
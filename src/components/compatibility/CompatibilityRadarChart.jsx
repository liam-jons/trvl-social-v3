import { useMemo } from 'react';
import { ScoringDimensionType } from '../../types/compatibility';

const CompatibilityRadarChart = ({
  dimensions = {},
  size = 200,
  strokeWidth = 2,
  gridLevels = 5,
  showLabels = true,
  showValues = false,
  animate = true,
  className = ''
}) => {
  const chartData = useMemo(() => {
    // Default dimension labels and scores
    const defaultDimensions = {
      [ScoringDimensionType.PERSONALITY_TRAITS]: { name: 'Personality', score: 0 },
      [ScoringDimensionType.TRAVEL_PREFERENCES]: { name: 'Travel Style', score: 0 },
      [ScoringDimensionType.EXPERIENCE_LEVEL]: { name: 'Experience', score: 0 },
      [ScoringDimensionType.BUDGET_RANGE]: { name: 'Budget', score: 0 },
      [ScoringDimensionType.ACTIVITY_PREFERENCES]: { name: 'Activities', score: 0 }
    };

    // Merge with provided dimensions
    const mergedDimensions = { ...defaultDimensions };
    Object.keys(dimensions).forEach(key => {
      if (mergedDimensions[key]) {
        mergedDimensions[key] = {
          ...mergedDimensions[key],
          score: dimensions[key].score || 0
        };
      }
    });

    return Object.values(mergedDimensions);
  }, [dimensions]);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) - 40; // Leave space for labels
  const angleStep = (2 * Math.PI) / chartData.length;

  // Calculate points for the polygon
  const dataPoints = chartData.map((dimension, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const value = dimension.score / 100; // Normalize to 0-1
    const x = centerX + Math.cos(angle) * radius * value;
    const y = centerY + Math.sin(angle) * radius * value;
    return { x, y, angle, value, ...dimension };
  });

  // Calculate grid circles
  const gridCircles = Array.from({ length: gridLevels }, (_, i) => {
    const level = (i + 1) / gridLevels;
    return radius * level;
  });

  // Calculate axis lines
  const axisLines = chartData.map((_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const endX = centerX + Math.cos(angle) * radius;
    const endY = centerY + Math.sin(angle) * radius;
    return { endX, endY };
  });

  // Calculate label positions
  const labelPositions = chartData.map((dimension, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 25;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;

    // Text anchor based on position
    let textAnchor = 'middle';
    if (x > centerX + 10) textAnchor = 'start';
    else if (x < centerX - 10) textAnchor = 'end';

    return { x, y, textAnchor, ...dimension };
  });

  // Create path string for the filled area
  const pathString = dataPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ') + ' Z';

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {gridCircles.map((circleRadius, index) => (
          <circle
            key={`grid-${index}`}
            cx={centerX}
            cy={centerY}
            r={circleRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-gray-300 dark:text-gray-600 opacity-50"
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis, index) => (
          <line
            key={`axis-${index}`}
            x1={centerX}
            y1={centerY}
            x2={axis.endX}
            y2={axis.endY}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-gray-300 dark:text-gray-600 opacity-50"
          />
        ))}

        {/* Data area (filled) */}
        <path
          d={pathString}
          fill="url(#radarGradient)"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          opacity={0.6}
          className={animate ? 'transition-all duration-1000 ease-out' : ''}
        />

        {/* Data line (outline) */}
        <path
          d={pathString}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          className={`${animate ? 'transition-all duration-1000 ease-out' : ''} drop-shadow-sm`}
        />

        {/* Data points */}
        {dataPoints.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#3B82F6"
            stroke="#ffffff"
            strokeWidth={2}
            className={`${animate ? 'transition-all duration-1000 ease-out' : ''} drop-shadow-sm`}
            style={{
              transformOrigin: `${point.x}px ${point.y}px`,
              animation: animate ? `pulse 2s infinite ${index * 0.2}s` : 'none'
            }}
          />
        ))}

        {/* Gradient definitions */}
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </radialGradient>
        </defs>
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none">
          {labelPositions.map((label, index) => (
            <div
              key={`label-${index}`}
              className="absolute text-sm font-medium text-gray-700 dark:text-gray-300"
              style={{
                left: label.x,
                top: label.y,
                transform: 'translate(-50%, -50%)',
                textAlign: label.textAnchor
              }}
            >
              <div className="whitespace-nowrap">
                {label.name}
                {showValues && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(label.score)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompatibilityRadarChart;
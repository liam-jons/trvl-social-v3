import { useState } from 'react';

const ClusterMarker = ({
  cluster,
  onClick,
  isSelected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const pointCount = cluster.properties.point_count;
  const clusterId = cluster.properties.cluster_id;

  // Get size based on cluster size
  const getClusterSize = (count) => {
    if (count < 10) return { size: 'w-10 h-10', textSize: 'text-sm' };
    if (count < 50) return { size: 'w-12 h-12', textSize: 'text-sm' };
    if (count < 100) return { size: 'w-14 h-14', textSize: 'text-base' };
    return { size: 'w-16 h-16', textSize: 'text-lg' };
  };

  // Get color based on cluster size
  const getClusterColor = (count) => {
    if (count < 10) return 'bg-primary-500/80 border-primary-400/60';
    if (count < 50) return 'bg-secondary-500/80 border-secondary-400/60';
    if (count < 100) return 'bg-accent-500/80 border-accent-400/60';
    return 'bg-red-500/80 border-red-400/60';
  };

  const { size, textSize } = getClusterSize(pointCount);
  const colorClass = getClusterColor(pointCount);

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(cluster);
  };

  const baseClasses = `
    ${size}
    cursor-pointer
    transform transition-all duration-300 ease-out
    ${isHovered || isSelected ? 'scale-110 -translate-y-1' : 'scale-100'}
    ${isSelected ? 'z-20' : 'z-10'}
  `;

  const glassClasses = `
    ${colorClass}
    backdrop-blur-md
    border-2
    rounded-full
    shadow-lg
    ${isHovered || isSelected ? 'shadow-xl' : ''}
    flex items-center justify-center
    relative
    overflow-hidden
  `;

  return (
    <div
      className={baseClasses}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${pointCount} adventures in this area`}
    >
      {/* Main cluster marker */}
      <div className={glassClasses}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

        {/* Point count */}
        <span className={`${textSize} font-bold text-white drop-shadow-sm relative z-10`}>
          {pointCount}
        </span>

        {/* Pulse animation for selected cluster */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full bg-current opacity-30 animate-ping" />
        )}

        {/* Additional rings for visual hierarchy */}
        {pointCount >= 50 && (
          <div className="absolute inset-[-4px] border-2 border-white/30 rounded-full animate-pulse-slow" />
        )}
        {pointCount >= 100 && (
          <div className="absolute inset-[-8px] border border-white/20 rounded-full animate-pulse-slow" />
        )}
      </div>

      {/* Expansion indicator */}
      <div className="absolute -bottom-1 -right-1 bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 rounded-full p-1 shadow-sm">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </div>
    </div>
  );
};

export default ClusterMarker;
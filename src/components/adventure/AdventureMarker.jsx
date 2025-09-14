import { useState } from 'react';

const AdventureMarker = ({ adventure, onClick, isSelected = false, size = 'medium' }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Size variants
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  // Get activity icon based on adventure type
  const getActivityIcon = (type) => {
    const icons = {
      hiking: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 4l4-4 4 4v4l-1 6h2l1-6v-4l-4-4-4 4v4l-1 6h2l1-6V4z"
        />
      ),
      climbing: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 2l3 7h7l-5.5 4L19 22l-7-5-7 5 2.5-9L2 9h7l3-7z"
        />
      ),
      kayaking: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 12a8 8 0 018-8V2.5M20 12a8 8 0 01-8 8v1.5M12 2.5V4m0 16v1.5"
        />
      ),
      cycling: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16a4 4 0 108 0 4 4 0 00-8 0zM16 8a4 4 0 108 0 4 4 0 00-8 0z"
        />
      ),
      skiing: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16l-3-3m0 0l3-3m-3 3h12m-9 4l3-3m0 0l3 3m-3-3v8"
        />
      ),
      default: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      ),
    };

    return icons[type?.toLowerCase()] || icons.default;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'bg-green-500/80 border-green-400/60',
      intermediate: 'bg-yellow-500/80 border-yellow-400/60',
      advanced: 'bg-orange-500/80 border-orange-400/60',
      expert: 'bg-red-500/80 border-red-400/60',
    };

    return colors[difficulty?.toLowerCase()] || 'bg-primary-500/80 border-primary-400/60';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(adventure);
  };

  const baseClasses = `
    ${sizeClasses[size]}
    cursor-pointer
    transform transition-all duration-300 ease-out
    ${isHovered || isSelected ? 'scale-110 -translate-y-1' : 'scale-100'}
    ${isSelected ? 'z-20' : 'z-10'}
  `;

  const glassClasses = `
    ${getDifficultyColor(adventure.difficulty)}
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
      title={adventure.title}
    >
      {/* Main marker */}
      <div className={glassClasses}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

        {/* Activity icon */}
        <svg
          className={`${iconSizeClasses[size]} text-white drop-shadow-sm`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {getActivityIcon(adventure.activityType)}
        </svg>

        {/* Pulse animation for selected marker */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full bg-current opacity-30 animate-ping" />
        )}
      </div>

      {/* Price badge (optional) */}
      {adventure.price && (
        <div className="absolute -top-2 -right-2 bg-accent-500/90 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow-lg backdrop-blur-sm border border-white/20">
          ${adventure.price}
        </div>
      )}

      {/* Rating indicator (optional) */}
      {adventure.rating && adventure.rating >= 4 && (
        <div className="absolute -bottom-1 -right-1 bg-yellow-400/90 rounded-full p-1 shadow-sm">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AdventureMarker;
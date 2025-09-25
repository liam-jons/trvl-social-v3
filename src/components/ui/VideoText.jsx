import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

const VideoText = React.forwardRef(({
  children,
  src,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  ...props
}, ref) => {
  const videoRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const text = textRef.current;

    if (video && text) {
      // Handle video load event
      const handleVideoLoad = () => {
        // Video is loaded and ready
        video.play().catch(console.warn);
      };

      // Handle video error
      const handleVideoError = () => {
        console.warn('Video failed to load:', src);
      };

      video.addEventListener('loadeddata', handleVideoLoad);
      video.addEventListener('error', handleVideoError);

      return () => {
        video.removeEventListener('loadeddata', handleVideoLoad);
        video.removeEventListener('error', handleVideoError);
      };
    }
  }, [src]);

  return (
    <div
      ref={ref}
      className={cn("relative inline-block", className)}
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          clipPath: 'url(#text-clip)',
          WebkitClipPath: 'url(#text-clip)',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <clipPath id="text-clip">
            <text
              ref={textRef}
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              className="fill-white text-8xl font-bold select-none"
              style={{ fontSize: 'inherit' }}
            >
              {children}
            </text>
          </clipPath>
        </defs>
      </svg>

      {/* Invisible text for layout */}
      <div
        className="text-8xl font-bold text-transparent select-none"
        style={{ fontSize: 'inherit' }}
      >
        {children}
      </div>
    </div>
  );
});

VideoText.displayName = 'VideoText';

export { VideoText };
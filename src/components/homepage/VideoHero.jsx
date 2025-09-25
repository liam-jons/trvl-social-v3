import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassButton from '../ui/GlassButton';
import { getHeroVideoUrl, videoExists } from '../../services/video-service';

const VideoHero = () => {
  const { isAuthenticated } = useAuth();
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  // Use Supabase URL in production, local file in development
  const isProduction = window.location.hostname !== 'localhost';
  const defaultVideoUrl = isProduction
    ? 'https://vhecnqaejsukulaktjob.supabase.co/storage/v1/object/public/videos/hero/vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4'
    : '/vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4';
  const [videoSource, setVideoSource] = useState(defaultVideoUrl);
  const [attemptedSupabase, setAttemptedSupabase] = useState(false);

  useEffect(() => {
    // Log the video source for debugging
    console.log('Video source initialized:', videoSource);
    console.log('Is production:', isProduction);

    let timer;

    // Only try to upgrade in development when using local file
    if (!isProduction && !attemptedSupabase) {
      const upgradeToSupabase = async () => {
        try {
          const supabaseVideoUrl = getHeroVideoUrl();
          console.log('Checking Supabase video availability:', supabaseVideoUrl);

          // Create a test video element to check if Supabase URL works
          const testVideo = document.createElement('video');
          testVideo.src = supabaseVideoUrl;

          testVideo.onloadedmetadata = () => {
            console.log('Supabase video available, upgrading source');
            setVideoSource(supabaseVideoUrl);
            setAttemptedSupabase(true);
          };

          testVideo.onerror = () => {
            console.log('Supabase video not available, keeping local video');
            setAttemptedSupabase(true);
          };

          // Set a timeout for the test
          setTimeout(() => {
            testVideo.src = '';
            setAttemptedSupabase(true);
          }, 5000);
        } catch (error) {
          console.log('Error checking Supabase video, using local:', error);
          setAttemptedSupabase(true);
        }
      };

      // Attempt upgrade after a short delay to not block initial render
      timer = setTimeout(upgradeToSupabase, 1000);
    }

    // Cleanup function to reset video state when component unmounts
    return () => {
      if (timer) clearTimeout(timer);
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setHasVideoError(false);
  };

  const handleVideoError = (error) => {
    console.warn('Video load error:', error);
    setHasVideoError(true);
    setIsVideoLoaded(false);

    // Try fallback to local video if not already using it
    if (!videoSource?.includes('vecteezy_')) {
      console.log('Falling back to local video file');
      setVideoSource('/vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4');
      setHasVideoError(false); // Reset error state to try again
    }
  };

  const handleVideoCanPlay = () => {
    // Ensure video is ready to play seamlessly
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      // Set up seamless looping by monitoring time updates
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // Near the end of video, restart for seamless loop
      if (videoRef.current.currentTime > videoRef.current.duration - 0.1) {
        videoRef.current.currentTime = 0;
      }
    }
  };

  const handleVideoEnded = () => {
    // Ensure seamless looping as backup
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.warn);
    }
  };

  return (
    <section className="relative min-h-screen max-h-[150vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      {videoSource && !hasVideoError && (
        <>
          <video
            ref={videoRef}
            className={`
              absolute top-0 left-0 w-full h-full object-cover z-0
              transition-opacity duration-500
              ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              objectPosition: 'center center',
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0Qjc2ODg7c3RvcC1vcGFjaXR5OjEiIC8+CjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA2MUIyNztzdG9wLW9wYWNpdHk6MSIgLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            onEnded={handleVideoEnded}
          >
            <source src={videoSource} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Loading overlay */}
          {!isVideoLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-cyan-700 to-slate-900 z-10 animate-pulse">
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}
        </>
      )}

      {/* Fallback gradient background */}
      {(hasVideoError || !videoSource) && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-cyan-700 to-slate-900 z-0">
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-white drop-shadow-lg leading-tight">
            Discover Your Next Adventure
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-md mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with fellow travelers, find amazing experiences, and create unforgettable memories
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/adventures">
                  <GlassButton variant="primary" size="lg">
                    Browse Adventures
                  </GlassButton>
                </Link>
                <Link to="/community">
                  <GlassButton variant="secondary" size="lg">
                    Join Community
                  </GlassButton>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <GlassButton variant="primary" size="lg">
                    Get Started Free
                  </GlassButton>
                </Link>
                <Link to="/login">
                  <GlassButton variant="ghost" size="lg">
                    Sign In
                  </GlassButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-10" />
    </section>
  );
};

export default VideoHero;
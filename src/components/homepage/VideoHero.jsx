import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassButton from '../ui/GlassButton';
import { VideoText } from '../ui/VideoText';

const VideoHero = () => {
  const { isAuthenticated } = useAuth();

  // Use MagicUI ocean video
  const videoUrl = 'https://cdn.magicui.design/ocean-small.webm';

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent">

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* VideoText Hero Title */}
        <div className="flex flex-col items-center mb-8 sm:mb-12">
          {/* TRVL with video text effect */}
          <div className="mb-4" id="trvl-container">
            <VideoText
              src={videoUrl}
              className="text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] font-black tracking-wider"
            >
              TRVL
            </VideoText>
          </div>

          {/* social text below with controlled letter spacing */}
          <div
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white"
            style={{
              letterSpacing: '0.35em',
              textTransform: 'lowercase',
            }}
          >
            social
          </div>
        </div>

        {/* Subtitle and description */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16 mt-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white leading-tight">
            Discover Your Next Adventure
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
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
    </section>
  );
};

export default VideoHero;
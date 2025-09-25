import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassButton from '../ui/GlassButton';
import { VideoText } from '../ui/VideoText';

const VideoHero = () => {
  const { isAuthenticated } = useAuth();

  // Use Supabase video URL for the VideoText component
  const videoUrl = 'https://vhecnqaejsukulaktjob.supabase.co/storage/v1/object/public/videos/hero/vecteezy_tranquil-lake-landscape-with-blue-water-and-cloudy-sky-in_65688460.mp4';

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-600 via-cyan-700 to-slate-900">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 z-0" />

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* VideoText Hero Title */}
        <div className="flex flex-col items-center mb-8 sm:mb-12">
          {/* TRVL with video text effect */}
          <div className="mb-4">
            <VideoText
              src={videoUrl}
              className="text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] font-black tracking-wider"
            >
              TRVL
            </VideoText>
          </div>

          {/* Social text below, matching TRVL width */}
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white drop-shadow-lg tracking-wider">
            Social
          </div>
        </div>

        {/* Subtitle and description */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16 mt-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white drop-shadow-lg leading-tight">
            Discover Your Next Adventure
          </h2>
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
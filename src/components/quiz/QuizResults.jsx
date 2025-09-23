import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Globe, Plane } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { PERSONALITY_DIMENSIONS } from '../../types/personality';
const PERSONALITY_TYPE_COLORS = {
  'The Thrill Seeker': { primary: '#ef4444', secondary: '#dc2626', gradient: 'from-red-500 to-orange-500' },
  'The Comfort Traveler': { primary: '#10b981', secondary: '#059669', gradient: 'from-emerald-500 to-green-500' },
  'The Solo Explorer': { primary: '#6366f1', secondary: '#4f46e5', gradient: 'from-indigo-500 to-purple-500' },
  'The Social Butterfly': { primary: '#f59e0b', secondary: '#d97706', gradient: 'from-yellow-500 to-orange-500' },
  'The Adventurer': { primary: '#8b5cf6', secondary: '#7c3aed', gradient: 'from-purple-500 to-pink-500' },
  'The Group Planner': { primary: '#06b6d4', secondary: '#0891b2', gradient: 'from-cyan-500 to-blue-500' },
  'The Balanced Wanderer': { primary: '#84cc16', secondary: '#65a30d', gradient: 'from-lime-500 to-green-500' },
  'The Active Soloist': { primary: '#ec4899', secondary: '#db2777', gradient: 'from-pink-500 to-rose-500' },
  'The Leisure Socializer': { primary: '#3b82f6', secondary: '#2563eb', gradient: 'from-blue-500 to-indigo-500' },
  'The Curious Traveler': { primary: '#6b7280', secondary: '#4b5563', gradient: 'from-gray-500 to-slate-500' },
};
const TRAIT_LABELS = {
  energyLevel: 'Energy Level',
  socialPreference: 'Social Preference',
  adventureStyle: 'Adventure Style',
  riskTolerance: 'Risk Tolerance'
};
export default function QuizResults({ profile, onShare, onRetake, onViewHistory, isHistorical = false, className = '' }) {
  const [selectedView, setSelectedView] = useState('radar');
  const resultCardRef = useRef(null);
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Results Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please complete the quiz to see your results.
          </p>
        </GlassCard>
      </div>
    );
  }
  const typeColors = PERSONALITY_TYPE_COLORS[profile.personalityType] || PERSONALITY_TYPE_COLORS['The Curious Traveler'];
  // Prepare data for radar chart
  const radarData = [
    {
      trait: 'Energy',
      value: profile.energyLevel,
      fullName: 'Energy Level'
    },
    {
      trait: 'Social',
      value: profile.socialPreference,
      fullName: 'Social Preference'
    },
    {
      trait: 'Adventure',
      value: profile.adventureStyle,
      fullName: 'Adventure Style'
    },
    {
      trait: 'Risk',
      value: profile.riskTolerance,
      fullName: 'Risk Tolerance'
    }
  ];
  // Prepare data for bar chart
  const barData = radarData.map(item => ({
    ...item,
    trait: item.fullName
  }));
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };
  const handleShare = async () => {
    if (onShare) {
      onShare(profile);
      return;
    }
    // Default share behavior - copy to clipboard
    const shareText = `I just discovered my travel personality: ${profile.personalityType}!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Travel Personality',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could show a toast notification here
    } catch (err) {
    }
  };
  const downloadResultCard = async () => {
    if (!resultCardRef.current) return;
    try {
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(resultCardRef.current, {
        backgroundColor: null,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `travel-personality-${profile.personalityType.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
    }
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen p-6 ${className}`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className={`bg-gradient-to-r ${typeColors.gradient} bg-clip-text text-transparent`}>
              Your Travel Personality
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Discover what makes you unique as a traveler
          </p>
        </motion.div>
        {/* Personality Type Card */}
        <motion.div variants={itemVariants}>
          <PersonalityTypeCard profile={profile} colors={typeColors} ref={resultCardRef} />
        </motion.div>
        {/* Chart Toggle */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
            <button
              onClick={() => setSelectedView('radar')}
              className={`px-4 py-2 rounded-md transition-all ${
                selectedView === 'radar'
                  ? 'bg-white/20 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Radar View
            </button>
            <button
              onClick={() => setSelectedView('bar')}
              className={`px-4 py-2 rounded-md transition-all ${
                selectedView === 'bar'
                  ? 'bg-white/20 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Bar View
            </button>
          </div>
        </motion.div>
        {/* Charts */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8">
            <h3 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-200">
              Your Personality Dimensions
            </h3>
            <div className="h-96">
              {selectedView === 'radar' ? (
                <RadarChartView data={radarData} colors={typeColors} />
              ) : (
                <BarChartView data={barData} colors={typeColors} />
              )}
            </div>
          </GlassCard>
        </motion.div>
        {/* Trait Descriptions */}
        <motion.div variants={itemVariants}>
          <TraitDescriptions profile={profile} />
        </motion.div>
        {/* Historical Assessment Banner */}
        {isHistorical && (
          <motion.div variants={itemVariants}>
            <GlassCard className="max-w-2xl mx-auto text-center p-4 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Historical Assessment</span>
              </div>
              <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                You're viewing a previous assessment result
              </p>
            </GlassCard>
          </motion.div>
        )}
        {/* Actions */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleShare}
            className={`px-8 py-3 rounded-lg bg-gradient-to-r ${typeColors.gradient} text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
          >
            Share Results
          </button>
          <button
            onClick={downloadResultCard}
            className="px-8 py-3 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 text-gray-800 dark:text-gray-200 font-medium hover:bg-white/20 dark:hover:bg-black/30 transform hover:scale-105 transition-all"
          >
            Download Card
          </button>
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="px-8 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transform hover:scale-105 transition-all"
            >
              View History
            </button>
          )}
          {onRetake && (
            <button
              onClick={onRetake}
              className="px-8 py-3 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 text-gray-800 dark:text-gray-200 font-medium hover:bg-white/20 dark:hover:bg-black/30 transform hover:scale-105 transition-all"
            >
              {isHistorical ? 'Take New Quiz' : 'Retake Quiz'}
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
// Personality Type Card Component
const PersonalityTypeCard = motion.forwardRef(({ profile, colors }, ref) => (
  <GlassCard ref={ref} className="max-w-2xl mx-auto text-center p-8" variant="light">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div
        className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center shadow-lg`}
      >
        <Globe className="w-8 h-8 text-white" />
      </div>
      <h2 className={`text-3xl font-bold mb-4 bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
        {profile.personalityType}
      </h2>
      <div className="grid grid-cols-2 gap-4 mt-8">
        {Object.entries(TRAIT_LABELS).map(([key, label]) => (
          <div key={key} className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {profile[key]}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </GlassCard>
));
PersonalityTypeCard.displayName = 'PersonalityTypeCard';
// Radar Chart Component
function RadarChartView({ data, colors }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
        <PolarGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
        <PolarAngleAxis
          dataKey="trait"
          tick={{ fill: 'currentColor', fontSize: 14, fontWeight: 500 }}
          className="text-gray-700 dark:text-gray-300"
        />
        <PolarRadiusAxis
          angle={0}
          domain={[0, 100]}
          tick={{ fill: 'currentColor', fontSize: 12 }}
          className="text-gray-500 dark:text-gray-400"
        />
        <Radar
          name="Personality"
          dataKey="value"
          stroke={colors.primary}
          fill={colors.primary}
          fillOpacity={0.3}
          strokeWidth={3}
          dot={{ fill: colors.primary, strokeWidth: 2, r: 6 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
// Bar Chart Component
function BarChartView({ data, colors }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <XAxis
          dataKey="trait"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: 'currentColor', fontSize: 12 }}
          className="text-gray-700 dark:text-gray-300"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'currentColor', fontSize: 12 }}
          className="text-gray-700 dark:text-gray-300"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'inherit'
          }}
          formatter={(value) => [`${value}%`, 'Score']}
        />
        <Bar
          dataKey="value"
          fill={colors.primary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
// Trait Descriptions Component
function TraitDescriptions({ profile }) {
  if (!profile.traitDescriptions) {
    return null;
  }
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {Object.entries(TRAIT_LABELS).map(([key, label]) => (
        <GlassCard key={key} className="p-6">
          <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            {label}
          </h4>
          <div className="mb-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${profile[key]}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
              {profile[key]}%
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {profile.traitDescriptions[key] || `Your ${label.toLowerCase()} score is ${profile[key]}%.`}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
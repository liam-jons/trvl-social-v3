import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import GlassCard from '../ui/GlassCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { assessmentService } from '../../services/assessment-service';
import { useAuth } from '../../hooks/useAuth';

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

export default function QuizHistory({ onRetakeQuiz, onViewResult, className = '' }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssessments, setSelectedAssessments] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [showComparison, setShowComparison] = useState(false);
  const { user } = useAuth();
  const exportRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadAssessmentHistory();
    }
  }, [user?.id, sortBy]);

  const loadAssessmentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await assessmentService.queryAssessments({
        userId: user.id,
        limit: 50,
        offset: 0
      });

      let sortedAssessments = result.data || [];

      // Apply sorting
      if (sortBy === 'newest') {
        sortedAssessments.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
      } else if (sortBy === 'oldest') {
        sortedAssessments.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
      }

      // Apply filtering
      if (filterBy !== 'all') {
        sortedAssessments = sortedAssessments.filter(assessment =>
          assessment.calculatorProfile?.personalityType === filterBy
        );
      }

      setAssessments(sortedAssessments);
    } catch (err) {
      console.error('Error loading assessment history:', err);
      setError('Failed to load your assessment history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeWithConfirmation = () => {
    if (window.confirm('Taking a new quiz will create a new assessment result. Your previous results will remain in your history. Continue?')) {
      onRetakeQuiz?.();
    }
  };

  const handleSelectAssessment = (assessmentId) => {
    setSelectedAssessments(prev => {
      if (prev.includes(assessmentId)) {
        return prev.filter(id => id !== assessmentId);
      } else if (prev.length < 3) { // Limit to 3 comparisons
        return [...prev, assessmentId];
      }
      return prev;
    });
  };

  const getPersonalityTypes = () => {
    const types = ['all', ...new Set(assessments.map(a => a.calculatorProfile?.personalityType).filter(Boolean))];
    return types;
  };

  const prepareComparisonData = () => {
    if (selectedAssessments.length < 2) return [];

    const selectedData = assessments.filter(a => selectedAssessments.includes(a.id));
    const traits = ['energyLevel', 'socialPreference', 'adventureStyle', 'riskTolerance'];

    return traits.map(trait => ({
      trait: TRAIT_LABELS[trait],
      ...selectedData.reduce((acc, assessment, index) => {
        const date = format(new Date(assessment.completed_at), 'MMM dd');
        acc[`assessment_${index + 1}`] = assessment.calculatorProfile?.[trait] || 0;
        acc[`date_${index + 1}`] = date;
        return acc;
      }, {})
    }));
  };

  const prepareTimelineData = () => {
    if (assessments.length < 2) return [];

    return assessments
      .slice(0, 10) // Last 10 assessments
      .reverse()
      .map(assessment => ({
        date: format(new Date(assessment.completed_at), 'MMM dd'),
        energyLevel: assessment.calculatorProfile?.energyLevel || 0,
        socialPreference: assessment.calculatorProfile?.socialPreference || 0,
        adventureStyle: assessment.calculatorProfile?.adventureStyle || 0,
        riskTolerance: assessment.calculatorProfile?.riskTolerance || 0,
      }));
  };

  const downloadHistory = async () => {
    if (!exportRef.current) return;

    try {
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(exportRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `personality-assessment-history-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Failed to download history:', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Unable to Load History
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={loadAssessmentHistory}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </GlassCard>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Assessment History
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't completed any personality assessments yet.
          </p>
          <button
            onClick={onRetakeQuiz}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
          >
            Take Your First Quiz
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen p-6 ${className}`}
      ref={exportRef}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Your Assessment History
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your personality journey over time
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter by Type
                  </label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getPersonalityTypes().map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  disabled={selectedAssessments.length < 2}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedAssessments.length >= 2
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </button>
                <button
                  onClick={downloadHistory}
                  className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                >
                  Export History
                </button>
                <button
                  onClick={handleRetakeWithConfirmation}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Timeline Evolution Chart */}
        {assessments.length > 1 && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-8">
              <h3 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-200">
                Personality Evolution Timeline
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareTimelineData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
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
                    />
                    <Legend />
                    <Line type="monotone" dataKey="energyLevel" stroke="#ef4444" strokeWidth={2} name="Energy Level" />
                    <Line type="monotone" dataKey="socialPreference" stroke="#10b981" strokeWidth={2} name="Social Preference" />
                    <Line type="monotone" dataKey="adventureStyle" stroke="#6366f1" strokeWidth={2} name="Adventure Style" />
                    <Line type="monotone" dataKey="riskTolerance" stroke="#f59e0b" strokeWidth={2} name="Risk Tolerance" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Comparison View */}
        <AnimatePresence>
          {showComparison && selectedAssessments.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              variants={itemVariants}
            >
              <ComparisonView
                data={prepareComparisonData()}
                assessments={assessments.filter(a => selectedAssessments.includes(a.id))}
                onClearSelection={() => setSelectedAssessments([])}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assessment Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, index) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                index={index}
                isSelected={selectedAssessments.includes(assessment.id)}
                onSelect={() => handleSelectAssessment(assessment.id)}
                onView={() => onViewResult?.(assessment)}
                showComparisonMode={showComparison}
              />
            ))}
          </div>
        </motion.div>

        {/* Selection Info */}
        {showComparison && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedAssessments.length === 0 && 'Select 2-3 assessments to compare'}
                {selectedAssessments.length === 1 && 'Select 1-2 more assessments to compare'}
                {selectedAssessments.length >= 2 && `Comparing ${selectedAssessments.length} assessments`}
                {selectedAssessments.length >= 3 && ' (maximum reached)'}
              </p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Assessment Card Component
function AssessmentCard({ assessment, index, isSelected, onSelect, onView, showComparisonMode }) {
  const profile = assessment.calculatorProfile;
  const typeColors = PERSONALITY_TYPE_COLORS[profile?.personalityType] || PERSONALITY_TYPE_COLORS['The Curious Traveler'];
  const completedAt = new Date(assessment.completed_at);

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, delay: index * 0.1, ease: 'easeOut' }
    }
  };

  return (
    <motion.div variants={cardVariants}>
      <GlassCard
        className={`p-6 cursor-pointer transition-all transform hover:scale-105 ${
          isSelected ? 'ring-2 ring-purple-500' : ''
        }`}
        onClick={showComparisonMode ? onSelect : onView}
      >
        {showComparisonMode && (
          <div className="flex justify-end mb-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
          </div>
        )}

        <div className="text-center">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${typeColors.gradient} flex items-center justify-center shadow-lg`}
          >
            <span className="text-2xl">🌍</span>
          </div>

          <h3 className={`text-lg font-semibold mb-2 bg-gradient-to-r ${typeColors.gradient} bg-clip-text text-transparent`}>
            {profile?.personalityType || 'Unknown Type'}
          </h3>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>{format(completedAt, 'MMM dd, yyyy')}</p>
            <p>{formatDistanceToNow(completedAt, { addSuffix: true })}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(TRAIT_LABELS).map(([key, label]) => (
              <div key={key} className="text-center">
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {profile?.[key] || 0}%
                </div>
                <div className="text-gray-500 dark:text-gray-400 truncate">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {!showComparisonMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="mt-4 px-4 py-2 text-sm bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-white/20 dark:hover:bg-black/30 transition-all"
            >
              View Details
            </button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Comparison View Component
function ComparisonView({ data, assessments, onClearSelection }) {
  return (
    <GlassCard className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Assessment Comparison
        </h3>
        <button
          onClick={onClearSelection}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Clear Selection
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
            Trait Comparison
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <PolarGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-gray-700 dark:text-gray-300"
                />
                <PolarRadiusAxis
                  angle={0}
                  domain={[0, 100]}
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                  className="text-gray-500 dark:text-gray-400"
                />
                {assessments.map((assessment, index) => {
                  const colors = ['#ef4444', '#10b981', '#6366f1'];
                  const date = format(new Date(assessment.completed_at), 'MMM dd');
                  return (
                    <Radar
                      key={assessment.id}
                      name={date}
                      dataKey={`assessment_${index + 1}`}
                      stroke={colors[index]}
                      fill={colors[index]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assessment Details */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Assessment Details
          </h4>
          <div className="space-y-4">
            {assessments.map((assessment, index) => {
              const profile = assessment.calculatorProfile;
              const typeColors = PERSONALITY_TYPE_COLORS[profile?.personalityType] || PERSONALITY_TYPE_COLORS['The Curious Traveler'];
              return (
                <div key={assessment.id} className="p-4 bg-white/5 dark:bg-black/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className={`font-medium bg-gradient-to-r ${typeColors.gradient} bg-clip-text text-transparent`}>
                      {profile?.personalityType}
                    </h5>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(assessment.completed_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(TRAIT_LABELS).map(([key, label]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {profile?.[key] || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
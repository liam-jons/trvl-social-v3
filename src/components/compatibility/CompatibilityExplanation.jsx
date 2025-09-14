/**
 * CompatibilityExplanation Component
 * Displays AI-generated explanations for compatibility scores
 */

import React, { useState, useEffect } from 'react';
import { generateCompatibilityExplanation, getSupportedLanguages } from '../../services/explanation-generator.js';

const CompatibilityExplanation = ({
  compatibilityScore,
  language = 'en',
  showControls = false,
  onExplanationGenerated = null,
  className = ''
}) => {
  const [explanation, setExplanation] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Controls state
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedTone, setSelectedTone] = useState('auto');
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('auto');

  const supportedLanguages = getSupportedLanguages();

  const toneOptions = [
    { value: 'auto', label: 'Auto (based on score)' },
    { value: 'encouraging', label: 'Encouraging' },
    { value: 'positive', label: 'Positive' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'cautionary', label: 'Cautionary' }
  ];

  const providerOptions = [
    { value: 'auto', label: 'Auto (best available)' },
    { value: 'anthropic', label: 'Anthropic Claude' },
    { value: 'openai', label: 'OpenAI GPT' },
    { value: 'fallback', label: 'Template-based' }
  ];

  const generateExplanation = async () => {
    if (!compatibilityScore) return;

    setLoading(true);
    setError(null);

    try {
      const options = {
        language: selectedLanguage,
        tone: selectedTone === 'auto' ? undefined : selectedTone,
        includeRecommendations,
        provider: selectedProvider
      };

      const result = await generateCompatibilityExplanation(compatibilityScore, options);

      setExplanation(result.explanation);
      setMetadata(result.metadata);

      if (onExplanationGenerated) {
        onExplanationGenerated(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate explanation');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount and when score changes
  useEffect(() => {
    generateExplanation();
  }, [compatibilityScore, selectedLanguage]);

  // Determine compatibility level for styling
  const getCompatibilityLevel = (score) => {
    if (score >= 80) return { level: 'excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 60) return { level: 'good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { level: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const levelInfo = compatibilityScore ? getCompatibilityLevel(compatibilityScore.overallScore) : null;

  if (!compatibilityScore) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No compatibility score available
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls Panel (optional) */}
      {showControls && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">Explanation Settings</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(supportedLanguages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {providerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Include Recommendations Toggle */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={(e) => setIncludeRecommendations(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Include Recommendations
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={generateExplanation}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Regenerate Explanation'}
          </button>
        </div>
      )}

      {/* Score Header */}
      <div className={`p-4 rounded-lg ${levelInfo?.bg || 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Compatibility Analysis
          </h3>
          <div className={`text-xl font-bold ${levelInfo?.color || 'text-gray-600'}`}>
            {compatibilityScore.overallScore}%
          </div>
        </div>
        {compatibilityScore.confidence && (
          <p className="text-sm text-gray-600 mt-1">
            Confidence: {Math.round(compatibilityScore.confidence * 100)}%
          </p>
        )}
      </div>

      {/* Explanation Content */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Generating explanation...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error: {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {explanation && !loading && (
          <div className="prose max-w-none">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            </div>
          </div>
        )}

        {/* Metadata (for debugging/development) */}
        {metadata && showControls && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              Generation Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
              <pre>{JSON.stringify(metadata, null, 2)}</pre>
            </div>
          </details>
        )}
      </div>

      {/* Dimension Breakdown */}
      {compatibilityScore.dimensions && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Compatibility Dimensions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(compatibilityScore.dimensions).map(([key, dimension]) => {
              const dimensionLevel = getCompatibilityLevel(dimension.score);
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {dimension.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (Weight: {Math.round((dimension.weight || 0) * 100)}%)
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${dimensionLevel.color}`}>
                    {Math.round(dimension.score)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompatibilityExplanation;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';

const TestCompatibilityPage = () => {
  const [componentTests, setComponentTests] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const tests = {};

      try {
        // Test compatibility components import
        const compatibilityModule = await import('../components/compatibility');
        tests.compatibilityComponents = {
          success: true,
          exports: Object.keys(compatibilityModule),
          message: 'All compatibility components imported successfully'
        };
      } catch (error) {
        tests.compatibilityComponents = {
          success: false,
          error: error.message,
          message: 'Failed to import compatibility components'
        };
      }

      try {
        // Test demo components import
        const InteractivePersonalityQuiz = await import('../components/demo/InteractivePersonalityQuiz');
        const GroupCompatibilityDemo = await import('../components/demo/GroupCompatibilityDemo');
        tests.demoComponents = {
          success: true,
          message: 'Demo components imported successfully',
          components: ['InteractivePersonalityQuiz', 'GroupCompatibilityDemo']
        };
      } catch (error) {
        tests.demoComponents = {
          success: false,
          error: error.message,
          message: 'Failed to import demo components'
        };
      }

      try {
        // Test types import
        const types = await import('../types/compatibility');
        tests.types = {
          success: true,
          message: 'Compatibility types imported successfully',
          exports: Object.keys(types)
        };
      } catch (error) {
        tests.types = {
          success: false,
          error: error.message,
          message: 'Failed to import compatibility types'
        };
      }

      try {
        // Test if ScoringDimensionType is accessible
        const { ScoringDimensionType } = await import('../types/compatibility');
        tests.scoringDimensionType = {
          success: true,
          message: 'ScoringDimensionType imported successfully',
          values: Object.values(ScoringDimensionType)
        };
      } catch (error) {
        tests.scoringDimensionType = {
          success: false,
          error: error.message,
          message: 'Failed to import ScoringDimensionType'
        };
      }

      setComponentTests(tests);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Testing Compatibility Components...
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
        Compatibility Demo Component Test
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Object.entries(componentTests).map(([testName, result]) => (
            <GlassCard key={testName}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  result.success
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {result.success ? (
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold capitalize ${
                    result.success
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {result.message}
                  </p>
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                      Error: {result.error}
                    </div>
                  )}
                  {result.exports && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Exports:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.exports.slice(0, 5).map(exp => (
                          <span key={exp} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs">
                            {exp}
                          </span>
                        ))}
                        {result.exports.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                            +{result.exports.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {result.components && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Components:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.components.map(comp => (
                          <span key={comp} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.values && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Values:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.values.map(val => (
                          <span key={val} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs">
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
      </div>

      <div className="text-center">
        <div className="space-x-4">
            <Link
              to="/compatibility-demo"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Compatibility Demo
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Home
            </Link>
        </div>
      </div>

      <div className="mt-8">
        <GlassCard>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Debug Information
            </h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
              <p><strong>React Version:</strong> {React.version}</p>
            </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TestCompatibilityPage;
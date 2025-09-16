/**
 * ContentFilterManager Component
 * Manages automated content filtering rules and policies
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Filter,
  Settings,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';
import ContentModerationService from '../../services/content-moderation-service';

const ContentFilterManager = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [filterRules, setFilterRules] = useState([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [testContent, setTestContent] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    autoModeration: true,
    toxicityThreshold: 0.7,
    spamThreshold: 0.6,
    profanityThreshold: 0.5,
    autoBlockThreshold: 0.85,
    enableMLDetection: true,
    enableProfanityFilter: true,
    enableSpamDetection: true
  });

  const defaultRules = [
    {
      id: 1,
      name: 'Profanity Filter',
      type: 'profanity',
      enabled: true,
      severity: 'medium',
      action: 'flag',
      patterns: ['profane word 1', 'profane word 2'],
      description: 'Detects and flags inappropriate language',
      detections: 45,
      accuracy: 92
    },
    {
      id: 2,
      name: 'Spam Detection',
      type: 'spam',
      enabled: true,
      severity: 'high',
      action: 'block',
      patterns: ['click here', 'free money', 'limited time'],
      description: 'Identifies spam and promotional content',
      detections: 128,
      accuracy: 87
    },
    {
      id: 3,
      name: 'Hate Speech Filter',
      type: 'hate_speech',
      enabled: true,
      severity: 'high',
      action: 'block',
      patterns: ['hate term 1', 'discriminatory language'],
      description: 'Blocks hate speech and discriminatory content',
      detections: 12,
      accuracy: 95
    },
    {
      id: 4,
      name: 'Threat Detection',
      type: 'threats',
      enabled: true,
      severity: 'critical',
      action: 'block',
      patterns: ['threat patterns', 'violence indicators'],
      description: 'Detects threats and violent content',
      detections: 3,
      accuracy: 98
    }
  ];

  useEffect(() => {
    setFilterRules(defaultRules);
  }, []);

  const handleTestContent = async () => {
    if (!testContent.trim()) return;

    try {
      const results = await ContentModerationService.analyzeContent(testContent);
      setTestResults(results);
    } catch (error) {
      console.error('Content analysis failed:', error);
      setTestResults({ error: 'Analysis failed' });
    }
  };

  const handleSaveRule = (ruleData) => {
    if (editingRule) {
      setFilterRules(prev => prev.map(rule =>
        rule.id === editingRule.id ? { ...rule, ...ruleData } : rule
      ));
      setEditingRule(null);
    } else {
      const newRule = {
        ...ruleData,
        id: Date.now(),
        detections: 0,
        accuracy: 0
      };
      setFilterRules(prev => [...prev, newRule]);
    }
    setShowAddRule(false);
  };

  const handleDeleteRule = (ruleId) => {
    setFilterRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId) => {
    setFilterRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const RuleForm = ({ rule, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: rule?.name || '',
      type: rule?.type || 'custom',
      severity: rule?.severity || 'medium',
      action: rule?.action || 'flag',
      description: rule?.description || '',
      patterns: rule?.patterns?.join('\n') || '',
      enabled: rule?.enabled ?? true
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...formData,
        patterns: formData.patterns.split('\n').filter(p => p.trim())
      });
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {rule ? 'Edit Filter Rule' : 'Add Filter Rule'}
            </h3>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="profanity">Profanity</option>
                  <option value="spam">Spam</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="threats">Threats</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="flag">Flag for Review</option>
                  <option value="warn">Warn User</option>
                  <option value="block">Block Content</option>
                  <option value="restrict">Restrict User</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule detects"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Patterns (one per line)
              </label>
              <textarea
                value={formData.patterns}
                onChange={(e) => setFormData(prev => ({ ...prev, patterns: e.target.value }))}
                placeholder="Enter patterns, keywords, or phrases (one per line)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                Enable this rule
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Rule</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const RuleCard = ({ rule }) => {
    const getSeverityColor = (severity) => {
      const colors = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800'
      };
      return colors[severity] || colors.medium;
    };

    const getActionColor = (action) => {
      const colors = {
        flag: 'bg-blue-100 text-blue-800',
        warn: 'bg-yellow-100 text-yellow-800',
        block: 'bg-red-100 text-red-800',
        restrict: 'bg-purple-100 text-purple-800'
      };
      return colors[action] || colors.flag;
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              rule.enabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Shield className={`w-5 h-5 ${
                rule.enabled ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{rule.name}</h3>
              <p className="text-sm text-gray-600">{rule.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToggleRule(rule.id)}
              className={`p-1 rounded transition-colors ${
                rule.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setEditingRule(rule)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteRule(rule.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
            {rule.severity} severity
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(rule.action)}`}>
            {rule.action}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {rule.type}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Detections:</span>
            <span className="font-medium text-gray-900 ml-1">{rule.detections}</span>
          </div>
          <div>
            <span className="text-gray-600">Accuracy:</span>
            <span className="font-medium text-gray-900 ml-1">{rule.accuracy}%</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              View patterns ({rule.patterns?.length || 0})
            </summary>
            <div className="mt-2 text-gray-700">
              {rule.patterns?.map((pattern, index) => (
                <div key={index} className="bg-gray-50 px-2 py-1 rounded text-xs font-mono">
                  {pattern}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Content Filter Manager</h2>
          <p className="text-gray-600">Configure automated content filtering rules</p>
        </div>
        <button
          onClick={() => setShowAddRule(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'rules', label: 'Filter Rules', icon: Filter },
            { id: 'testing', label: 'Content Testing', icon: Activity },
            { id: 'settings', label: 'System Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filterRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}

      {activeTab === 'testing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Content Filtering</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Content
              </label>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="Enter content to test against filter rules..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={6}
              />
            </div>

            <button
              onClick={handleTestContent}
              disabled={!testContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Analyze Content</span>
            </button>

            {testResults && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Analysis Results</h4>

                {testResults.error ? (
                  <div className="text-red-600">Error: {testResults.error}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {Math.round(testResults.scores.profanity * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Profanity Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Math.round(testResults.scores.spam * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Spam Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(testResults.scores.toxicity * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Toxicity Score</div>
                      </div>
                    </div>

                    {testResults.violations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Violations Detected:</h5>
                        <div className="space-y-2">
                          {testResults.violations.map((violation, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-red-700">{violation.description}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                violation.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {violation.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Recommended Action:</h5>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        testResults.autoAction === 'block' ? 'bg-red-100 text-red-800' :
                        testResults.autoAction === 'flag_for_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {testResults.autoAction?.replace('_', ' ') || 'No action needed'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-Moderation</h4>
                <p className="text-sm text-gray-600">Enable automatic content moderation</p>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.autoModeration}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, autoModeration: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toxicity Threshold
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={systemSettings.toxicityThreshold}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, toxicityThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Current: {Math.round(systemSettings.toxicityThreshold * 100)}%
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Block Threshold
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={systemSettings.autoBlockThreshold}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, autoBlockThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Current: {Math.round(systemSettings.autoBlockThreshold * 100)}%
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'enableMLDetection', label: 'ML-based Detection', desc: 'Use machine learning for content analysis' },
                { key: 'enableProfanityFilter', label: 'Profanity Filter', desc: 'Filter inappropriate language' },
                { key: 'enableSpamDetection', label: 'Spam Detection', desc: 'Detect and block spam content' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{setting.label}</h4>
                    <p className="text-sm text-gray-600">{setting.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings[setting.key]}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rule Form Modal */}
      {(showAddRule || editingRule) && (
        <RuleForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowAddRule(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
};

export default ContentFilterManager;
import React, { useState, useEffect } from 'react';
import { useABTesting } from '../../hooks/useABTesting';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs } from '../ui/tabs';
import { Badge } from '../ui/badge';

const ABTestingDashboard = () => {
  const { experiments, featureFlags, service, isInitialized } = useABTesting();
  const [activeTab, setActiveTab] = useState('experiments');
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [experimentResults, setExperimentResults] = useState({});

  useEffect(() => {
    if (isInitialized && experiments.length > 0) {
      // Load results for all active experiments
      experiments.forEach(experiment => {
        if (experiment.status === 'active') {
          const results = service.getExperimentResults(experiment.id);
          setExperimentResults(prev => ({
            ...prev,
            [experiment.id]: results
          }));
        }
      });
    }
  }, [isInitialized, experiments, service]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const updateExperimentStatus = (experimentId, newStatus) => {
    service.updateExperimentStatus(experimentId, newStatus);
    // Refresh data
    window.location.reload();
  };

  const updateFeatureFlag = (flagId, updates) => {
    service.updateFeatureFlag(flagId, updates);
    // Refresh data
    window.location.reload();
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading A/B Testing Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">A/B Testing Dashboard</h1>
        <p className="text-gray-600">Manage experiments and feature flags</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'experiments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('experiments')}
            >
              Experiments ({experiments.length})
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flags'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('flags')}
            >
              Feature Flags ({featureFlags.length})
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Experiments List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {experiments.map((experiment) => (
                    <Card key={experiment.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {experiment.name}
                            </h3>
                            <Badge className={getStatusColor(experiment.status)}>
                              {experiment.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{experiment.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Traffic:</span>
                              <div>{formatPercentage(experiment.trafficAllocation)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Variants:</span>
                              <div>{experiment.variants.length}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Start:</span>
                              <div>{formatDate(experiment.startDate)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">End:</span>
                              <div>{formatDate(experiment.endDate)}</div>
                            </div>
                          </div>

                          {/* Variants */}
                          <div className="mt-4">
                            <span className="text-sm font-medium text-gray-700">Variants:</span>
                            <div className="flex gap-2 mt-1">
                              {experiment.variants.map((variant) => (
                                <Badge key={variant.id} variant="outline">
                                  {variant.name} ({formatPercentage(variant.allocation)})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExperiment(experiment)}
                          >
                            View Details
                          </Button>

                          {experiment.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateExperimentStatus(experiment.id, 'paused')}
                            >
                              Pause
                            </Button>
                          )}

                          {experiment.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateExperimentStatus(experiment.id, 'active')}
                            >
                              Resume
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Quick Results Preview */}
                      {experimentResults[experiment.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">Quick Results:</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {Object.entries(experimentResults[experiment.id].variants).map(([variantId, data]) => (
                              <div key={variantId} className="bg-gray-50 p-3 rounded">
                                <div className="font-medium">{data.name}</div>
                                {data.metrics[experiment.metrics.primary] && (
                                  <div className="text-gray-600">
                                    {experiment.metrics.primary}: {data.metrics[experiment.metrics.primary].average?.toFixed(2)}
                                    ({data.metrics[experiment.metrics.primary].count} samples)
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Experiment Details Sidebar */}
              <div>
                {selectedExperiment && (
                  <Card className="p-6 sticky top-6">
                    <h4 className="text-lg font-semibold mb-4">{selectedExperiment.name}</h4>

                    <div className="space-y-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Hypothesis:</span>
                        <p className="text-gray-600 mt-1">{selectedExperiment.hypothesis}</p>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Primary Metric:</span>
                        <p className="text-gray-600 mt-1">{selectedExperiment.metrics.primary}</p>
                      </div>

                      {selectedExperiment.metrics.secondary && (
                        <div>
                          <span className="font-medium text-gray-700">Secondary Metrics:</span>
                          <ul className="text-gray-600 mt-1 list-disc list-inside">
                            {selectedExperiment.metrics.secondary.map((metric) => (
                              <li key={metric}>{metric}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-gray-700">Targeting:</span>
                        <div className="text-gray-600 mt-1 space-y-1">
                          {selectedExperiment.targeting.userTypes && (
                            <div>User Types: {selectedExperiment.targeting.userTypes.join(', ')}</div>
                          )}
                          {selectedExperiment.targeting.pages && (
                            <div>Pages: {selectedExperiment.targeting.pages.join(', ')}</div>
                          )}
                          {selectedExperiment.targeting.newUsersOnly && (
                            <div>New users only</div>
                          )}
                        </div>
                      </div>

                      {experimentResults[selectedExperiment.id]?.significance && (
                        <div>
                          <span className="font-medium text-gray-700">Statistical Significance:</span>
                          <div className="text-gray-600 mt-1">
                            <div>P-value: {experimentResults[selectedExperiment.id].significance.pValue?.toFixed(4)}</div>
                            <div>Significant: {experimentResults[selectedExperiment.id].significance.significant ? 'Yes' : 'No'}</div>
                            {experimentResults[selectedExperiment.id].significance.liftPercentage && (
                              <div>Lift: {experimentResults[selectedExperiment.id].significance.liftPercentage.toFixed(1)}%</div>
                            )}
                          </div>
                        </div>
                      )}

                      {experimentResults[selectedExperiment.id]?.recommendations && (
                        <div>
                          <span className="font-medium text-gray-700">Recommendations:</span>
                          <div className="space-y-2 mt-1">
                            {experimentResults[selectedExperiment.id].recommendations.map((rec, index) => (
                              <div key={index} className={`p-2 rounded text-sm ${
                                rec.priority === 'high' ? 'bg-red-50 text-red-800' :
                                rec.priority === 'medium' ? 'bg-yellow-50 text-yellow-800' :
                                'bg-blue-50 text-blue-800'
                              }`}>
                                {rec.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setSelectedExperiment(null)}
                    >
                      Close
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'flags' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feature Flags List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <Card key={flag.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {flag.name}
                            </h3>
                            <Badge className={flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {flag.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{flag.description}</p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Rollout:</span>
                              <div>{flag.rolloutPercentage}%</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">User Types:</span>
                              <div>{flag.targeting.userTypes?.join(', ') || 'All'}</div>
                            </div>
                          </div>

                          {flag.targeting.premiumOnly && (
                            <div className="mt-2">
                              <Badge variant="outline">Premium Only</Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFlag(flag)}
                          >
                            Configure
                          </Button>

                          <Button
                            variant={flag.enabled ? "destructive" : "default"}
                            size="sm"
                            onClick={() => updateFeatureFlag(flag.id, { enabled: !flag.enabled })}
                          >
                            {flag.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Feature Flag Configuration Sidebar */}
              <div>
                {selectedFlag && (
                  <Card className="p-6 sticky top-6">
                    <h4 className="text-lg font-semibold mb-4">Configure {selectedFlag.name}</h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rollout Percentage
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedFlag.rolloutPercentage}
                          onChange={(e) => {
                            const newPercentage = parseInt(e.target.value);
                            updateFeatureFlag(selectedFlag.id, { rolloutPercentage: newPercentage });
                          }}
                          className="w-full"
                        />
                        <div className="text-sm text-gray-600 mt-1">
                          {selectedFlag.rolloutPercentage}% of eligible users
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedFlag.enabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateFeatureFlag(selectedFlag.id, { enabled: true })}
                          >
                            Enabled
                          </Button>
                          <Button
                            variant={!selectedFlag.enabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateFeatureFlag(selectedFlag.id, { enabled: false })}
                          >
                            Disabled
                          </Button>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Targeting:</span>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          {selectedFlag.targeting.userTypes && (
                            <div>User Types: {selectedFlag.targeting.userTypes.join(', ')}</div>
                          )}
                          {selectedFlag.targeting.premiumOnly && (
                            <div>Premium users only</div>
                          )}
                          {selectedFlag.targeting.countries && (
                            <div>Countries: {selectedFlag.targeting.countries.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setSelectedFlag(null)}
                    >
                      Close
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-2xl font-bold text-gray-900">
                  {experiments.filter(exp => exp.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Experiments</div>
              </Card>

              <Card className="p-6">
                <div className="text-2xl font-bold text-gray-900">
                  {featureFlags.filter(flag => flag.enabled).length}
                </div>
                <div className="text-sm text-gray-600">Enabled Flags</div>
              </Card>

              <Card className="p-6">
                <div className="text-2xl font-bold text-gray-900">
                  {experiments.filter(exp => experimentResults[exp.id]?.significance?.significant).length}
                </div>
                <div className="text-sm text-gray-600">Significant Results</div>
              </Card>

              <Card className="p-6">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(featureFlags.reduce((sum, flag) => sum + flag.rolloutPercentage, 0) / featureFlags.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg. Rollout</div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Experiment Performance</h3>
              <div className="space-y-4">
                {experiments.filter(exp => exp.status === 'active').map((experiment) => {
                  const results = experimentResults[experiment.id];
                  if (!results) return null;

                  return (
                    <div key={experiment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{experiment.name}</h4>
                        {results.significance?.significant && (
                          <Badge className="bg-green-100 text-green-800">Significant</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(results.variants).map(([variantId, data]) => (
                          <div key={variantId} className="bg-gray-50 p-3 rounded">
                            <div className="font-medium">{data.name}</div>
                            {data.metrics[experiment.metrics.primary] && (
                              <div className="text-gray-600">
                                <div>{experiment.metrics.primary}: {data.metrics[experiment.metrics.primary].average?.toFixed(2)}</div>
                                <div>Samples: {data.metrics[experiment.metrics.primary].count}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {results.significance && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span>Lift: {results.significance.liftPercentage?.toFixed(1)}%</span>
                          <span className="ml-4">P-value: {results.significance.pValue?.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default ABTestingDashboard;
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import gdprConsentService from '../../services/gdpr-consent-service';
const PrivacyPreferenceCenter = () => {
  const [consentStatus, setConsentStatus] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  useEffect(() => {
    loadPrivacyData();
    // Listen for consent changes
    const removeListener = gdprConsentService.addEventListener((eventType) => {
      if (eventType === 'consentChanged' || eventType === 'multipleConsentChanged') {
        loadPrivacyData();
      }
    });
    return removeListener;
  }, []);
  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      await gdprConsentService.init();
      const status = gdprConsentService.getConsentStatus();
      const audit = gdprConsentService.getAuditTrail(50);
      setConsentStatus(status);
      setAuditTrail(audit);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleConsentToggle = async (category, enabled) => {
    setSaving(true);
    try {
      gdprConsentService.setConsent(category, enabled, true);
      // Status will update via event listener
    } catch (error) {
      console.error('Failed to update consent:', error);
    } finally {
      setSaving(false);
    }
  };
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      // This would normally require user authentication
      const userId = 'current-user-id'; // Replace with actual user ID
      const exportData = await gdprConsentService.exportUserData(userId);
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privacy-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Your data has been exported and downloaded successfully.');
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };
  const handleDeleteData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your data? This action cannot be undone and you will be logged out.'
    );
    if (!confirmed) return;
    setDeleteLoading(true);
    try {
      const userId = 'current-user-id'; // Replace with actual user ID
      const result = await gdprConsentService.deleteUserData(userId);
      alert(`Data deletion initiated. Reference ID: ${result.deletionId}. You will receive confirmation within 30 days.`);
      // Redirect to logout or home page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to initiate data deletion:', error);
      alert('Failed to initiate data deletion. Please contact support.');
    } finally {
      setDeleteLoading(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  const getEventTypeColor = (eventType) => {
    if (eventType.includes('accept') || eventType.includes('consent_category_changed')) {
      return 'bg-green-100 text-green-800';
    }
    if (eventType.includes('reject') || eventType.includes('deletion')) {
      return 'bg-red-100 text-red-800';
    }
    if (eventType.includes('export') || eventType.includes('audit')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Privacy Preference Center</h1>
        <p className="mt-2 text-gray-600">
          Manage your privacy settings and data preferences. Changes take effect immediately.
        </p>
      </div>
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences">Cookie Preferences</TabsTrigger>
          <TabsTrigger value="rights">Data Rights</TabsTrigger>
          <TabsTrigger value="audit">Activity Log</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Info</TabsTrigger>
        </TabsList>
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Cookie & Data Collection Preferences</h2>
            <div className="space-y-4">
              {consentStatus && Object.entries(consentStatus.categories).map(([category, info]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{info.name}</h3>
                        {info.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                        {info.enabled && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{info.description}</p>
                      {info.purposes && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Used for:</p>
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {info.purposes.map((purpose, idx) => (
                              <li key={idx}>{purpose}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {info.timestamp && (
                        <p className="mt-2 text-xs text-gray-500">
                          Last updated: {formatDate(info.timestamp)}
                          {info.explicit && ' (Explicitly set by you)'}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={info.enabled}
                          disabled={info.required || saving}
                          onChange={(e) => handleConsentToggle(category, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {info.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {consentStatus && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Current Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Region:</span> {consentStatus.region}
                </div>
                <div>
                  <span className="font-medium">Consent ID:</span> {consentStatus.consentId}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {formatDate(consentStatus.timestamp)}
                </div>
                <div>
                  <span className="font-medium">Expires:</span> {formatDate(consentStatus.expires)}
                </div>
                <div>
                  <span className="font-medium">Explicit Consent:</span>{' '}
                  <Badge className={consentStatus.explicitConsentGiven ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {consentStatus.explicitConsentGiven ? 'Given' : 'Not Given'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Compliance:</span>{' '}
                  <Badge className="bg-blue-100 text-blue-800">
                    {consentStatus.requiresExplicitConsent ? 'GDPR' : 'Standard'}
                  </Badge>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="rights" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Your Data Rights</h2>
            <p className="text-gray-600 mb-6">
              Under privacy regulations, you have several rights regarding your personal data.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Export Your Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download a copy of all personal data we have collected about you, including
                  your consent preferences and activity history.
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {exportLoading ? 'Exporting...' : 'Export My Data'}
                </Button>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-2">Delete Your Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Request permanent deletion of all your personal data. This action cannot be undone
                  and you will be logged out immediately.
                </p>
                <Button
                  onClick={handleDeleteData}
                  disabled={deleteLoading}
                  variant="destructive"
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteLoading ? 'Processing...' : 'Delete All My Data'}
                </Button>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-2">Other Rights</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Correct inaccurate personal data</li>
                  <li>• Object to processing for legitimate interests</li>
                  <li>• Restrict processing under certain circumstances</li>
                  <li>• Data portability (included in export)</li>
                  <li>• Withdraw consent at any time</li>
                </ul>
                <p className="mt-4 text-sm text-gray-600">
                  To exercise these rights, please contact our support team at{' '}
                  <a href="mailto:privacy@trvl.com" className="text-blue-600 hover:underline">
                    privacy@trvl.com
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Privacy Activity Log</h2>
            <p className="text-gray-600 mb-6">
              A record of all privacy-related actions and consent changes for your account.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditTrail.length > 0 ? (
                auditTrail.map((event, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        {event.data && Object.keys(event.data).length > 0 && (
                          <div className="mt-2">
                            <details className="text-xs text-gray-600">
                              <summary className="cursor-pointer hover:text-gray-800">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No activity recorded yet.</p>
              )}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="compliance" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Compliance Information</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Data Retention Policies</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Analytics Data:</span>
                    <span className="text-gray-600">24 months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marketing Data:</span>
                    <span className="text-gray-600">12 months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Data:</span>
                    <span className="text-gray-600">Duration of account</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consent Records:</span>
                    <span className="text-gray-600">7 years (legal requirement)</span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-2">Legal Basis for Processing</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Essential:</strong> Necessary for contract performance</div>
                  <div><strong>Analytics:</strong> Legitimate interest (with opt-out)</div>
                  <div><strong>Marketing:</strong> Consent</div>
                  <div><strong>Functional:</strong> Consent</div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-2">Data Processors</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Mixpanel (Analytics) - Privacy Shield certified</div>
                  <div>• Sentry (Error monitoring) - GDPR compliant</div>
                  <div>• Datadog (Performance monitoring) - GDPR compliant</div>
                  <div>• Supabase (Database) - GDPR compliant</div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                <div className="text-sm text-gray-600">
                  <p>Data Protection Officer: <a href="mailto:dpo@trvl.com" className="text-blue-600 hover:underline">dpo@trvl.com</a></p>
                  <p>Privacy Questions: <a href="mailto:privacy@trvl.com" className="text-blue-600 hover:underline">privacy@trvl.com</a></p>
                  <p>Last Updated: {formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default PrivacyPreferenceCenter;
/**
 * ContentReporting Component
 * Handles user reporting of inappropriate content
 */
import React, { useState } from 'react';
import { AlertTriangle, Flag, X, Send } from 'lucide-react';
import ContentModerationService from '../../services/content-moderation-service';
const ContentReporting = ({
  isOpen,
  onClose,
  contentId,
  contentType = 'post',
  contentPreview = ''
}) => {
  const [reportData, setReportData] = useState({
    category: '',
    reason: '',
    description: '',
    severity: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const reportCategories = [
    {
      id: 'spam',
      label: 'Spam or Unwanted Commercial Content',
      description: 'Repetitive, promotional, or unsolicited content'
    },
    {
      id: 'harassment',
      label: 'Harassment or Bullying',
      description: 'Targeted attacks, threats, or intimidation'
    },
    {
      id: 'inappropriate',
      label: 'Inappropriate Content',
      description: 'Content that violates community standards'
    },
    {
      id: 'misinformation',
      label: 'False or Misleading Information',
      description: 'Deliberately false or misleading claims'
    },
    {
      id: 'hate_speech',
      label: 'Hate Speech',
      description: 'Content that attacks or demeans groups of people'
    },
    {
      id: 'threats',
      label: 'Threats or Violence',
      description: 'Threats of violence or self-harm'
    },
    {
      id: 'privacy',
      label: 'Privacy Violation',
      description: 'Sharing personal information without consent'
    },
    {
      id: 'copyright',
      label: 'Copyright Infringement',
      description: 'Unauthorized use of copyrighted material'
    },
    {
      id: 'illegal',
      label: 'Illegal Activity',
      description: 'Content promoting illegal activities'
    },
    {
      id: 'other',
      label: 'Other',
      description: 'Other violations not listed above'
    }
  ];
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportData.category || !reportData.reason) {
      alert('Please select a category and provide a reason for reporting.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await ContentModerationService.submitReport({
        contentId,
        contentType,
        reporterId: 'current_user', // This should come from auth context
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        severity: reportData.severity,
        metadata: {
          contentPreview: contentPreview.substring(0, 200),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setReportData({
            category: '',
            reason: '',
            description: '',
            severity: 'medium'
          });
        }, 2000);
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) {
      alert('An error occurred while submitting the report.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCategorySelect = (categoryId) => {
    setReportData(prev => ({
      ...prev,
      category: categoryId,
      reason: reportCategories.find(cat => cat.id === categoryId)?.label || ''
    }));
  };
  if (!isOpen) return null;
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flag className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Report Submitted
          </h3>
          <p className="text-gray-600 mb-4">
            Thank you for helping keep our community safe. We'll review this content and take appropriate action.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Report Content</h2>
              <p className="text-sm text-gray-600">Help us maintain community standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content Preview */}
          {contentPreview && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Content being reported:</h4>
              <p className="text-sm text-gray-600 italic line-clamp-3">
                "{contentPreview}"
              </p>
            </div>
          )}
          {/* Report Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of violation is this? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    reportData.category === category.id
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {category.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {category.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={reportData.description}
              onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide any additional context that might help our moderation team..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              rows={4}
            />
          </div>
          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How urgent is this issue?
            </label>
            <div className="flex space-x-4">
              {[
                { value: 'low', label: 'Low Priority', color: 'green' },
                { value: 'medium', label: 'Medium Priority', color: 'yellow' },
                { value: 'high', label: 'High Priority', color: 'red' }
              ].map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setReportData(prev => ({ ...prev, severity: level.value }))}
                  className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    reportData.severity === level.value
                      ? `border-${level.color}-300 bg-${level.color}-50 text-${level.color}-700`
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
          {/* Guidelines */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Reporting Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Only report content that genuinely violates our community standards</li>
              <li>• Provide accurate and honest information in your report</li>
              <li>• False reports may result in restrictions on your account</li>
              <li>• We review all reports carefully and take appropriate action</li>
            </ul>
          </div>
          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reportData.category}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ContentReporting;
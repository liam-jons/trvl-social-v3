/**
 * DisputeResolutionModal - Interface for handling booking modification and cancellation disputes
 * Provides structured workflow for dispute submission and resolution
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { notificationService } from '../../services/notification-service.js';

const DisputeResolutionModal = ({
  isOpen,
  onClose,
  bookingId,
  userId,
  relatedModificationId = null,
  disputeType = 'modification', // 'modification', 'cancellation', 'refund'
  onDisputeSubmitted
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: details, 3: evidence, 4: confirmation, 5: success
  const [disputeData, setDisputeData] = useState({
    type: disputeType,
    category: '',
    subject: '',
    description: '',
    requestedResolution: '',
    evidence: [],
    urgency: 'normal',
    contactPreference: 'email',
  });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [error, setError] = useState('');

  const disputeCategories = {
    modification: [
      { id: 'vendor_unresponsive', label: 'Vendor Not Responding', description: 'Vendor has not responded within the required timeframe' },
      { id: 'unreasonable_rejection', label: 'Unreasonable Rejection', description: 'Modification was rejected for unclear or unfair reasons' },
      { id: 'fee_dispute', label: 'Fee Dispute', description: 'Disagreement about modification fees charged' },
      { id: 'policy_violation', label: 'Policy Violation', description: 'Vendor is not following their stated policies' },
      { id: 'service_quality', label: 'Service Quality Issues', description: 'Issues with the quality of service provided' },
    ],
    cancellation: [
      { id: 'refund_denied', label: 'Refund Denied', description: 'Refund was denied despite policy compliance' },
      { id: 'partial_refund_dispute', label: 'Partial Refund Dispute', description: 'Disagreement about partial refund amount' },
      { id: 'policy_misrepresentation', label: 'Policy Misrepresentation', description: 'Cancellation policy was misrepresented' },
      { id: 'emergency_circumstances', label: 'Emergency Circumstances', description: 'Emergency situation not properly considered' },
      { id: 'vendor_cancelled', label: 'Vendor Cancelled', description: 'Vendor cancelled but not providing proper refund' },
    ],
    refund: [
      { id: 'delayed_processing', label: 'Delayed Processing', description: 'Refund is taking longer than stated timeframe' },
      { id: 'incorrect_amount', label: 'Incorrect Amount', description: 'Refund amount is incorrect' },
      { id: 'processing_fees', label: 'Unexpected Processing Fees', description: 'Unexpected fees deducted from refund' },
      { id: 'refund_failed', label: 'Refund Failed', description: 'Refund attempt failed or was reversed' },
    ]
  };

  const evidenceTypes = [
    { id: 'screenshots', label: 'Screenshots', description: 'Screenshots of communications or policies', accept: 'image/*' },
    { id: 'emails', label: 'Email Communications', description: 'Email threads with vendor or platform', accept: '.eml,.msg,.pdf' },
    { id: 'receipts', label: 'Receipts/Invoices', description: 'Payment receipts or booking confirmations', accept: '.pdf,image/*' },
    { id: 'medical', label: 'Medical Documentation', description: 'Medical certificates for emergency situations', accept: '.pdf,image/*' },
    { id: 'legal', label: 'Legal Documents', description: 'Legal notices or official documents', accept: '.pdf' },
    { id: 'other', label: 'Other Evidence', description: 'Any other supporting documentation', accept: '*' },
  ];

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (
            id,
            title,
            start_date,
            vendor_id,
            vendors (name, email)
          ),
          booking_modifications (
            id,
            modification_type,
            status,
            reason,
            created_at
          ),
          booking_cancellations (
            id,
            cancellation_type,
            reason,
            refund_eligible,
            created_at
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBookingDetails(booking);

    } catch (error) {
      setError(`Failed to load booking details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files, evidenceType) => {
    try {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `dispute-evidence/${bookingId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('dispute-documents')
          .upload(filePath, file);

        if (error) throw error;

        uploadedFiles.push({
          id: Math.random().toString(36).substring(7),
          type: evidenceType,
          name: file.name,
          path: data.path,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      setEvidenceFiles(prev => [...prev, ...uploadedFiles]);
      setDisputeData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...uploadedFiles]
      }));

    } catch (error) {
      setError(`Failed to upload files: ${error.message}`);
    }
  };

  const removeEvidence = (evidenceId) => {
    setEvidenceFiles(prev => prev.filter(file => file.id !== evidenceId));
    setDisputeData(prev => ({
      ...prev,
      evidence: prev.evidence.filter(e => e.id !== evidenceId)
    }));
  };

  const submitDispute = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate form
      if (!disputeData.category) {
        throw new Error('Please select a dispute category');
      }
      if (!disputeData.subject || !disputeData.description) {
        throw new Error('Please provide a subject and description');
      }
      if (!disputeData.requestedResolution) {
        throw new Error('Please specify your requested resolution');
      }

      // Create dispute record
      const { data: dispute, error: disputeError } = await supabase
        .from('booking_disputes')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          related_modification_id: relatedModificationId,
          dispute_type: disputeData.type,
          category: disputeData.category,
          subject: disputeData.subject,
          description: disputeData.description,
          requested_resolution: disputeData.requestedResolution,
          evidence_files: disputeData.evidence,
          urgency: disputeData.urgency,
          contact_preference: disputeData.contactPreference,
          status: 'open',
          created_at: new Date().toISOString(),
          metadata: {
            booking_title: bookingDetails?.adventures?.title,
            vendor_id: bookingDetails?.adventures?.vendor_id,
            submission_source: 'customer_portal',
          },
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Create dispute thread
      await supabase
        .from('dispute_threads')
        .insert({
          dispute_id: dispute.id,
          user_id: userId,
          message_type: 'initial_submission',
          message: disputeData.description,
          attachments: disputeData.evidence,
          created_at: new Date().toISOString(),
        });

      // Notify admin team
      await notifyAdminTeam(dispute);

      // Notify vendor
      await notifyVendor(dispute);

      setStep(5);
      if (onDisputeSubmitted) {
        onDisputeSubmitted(dispute);
      }

    } catch (error) {
      setError(`Failed to submit dispute: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const notifyAdminTeam = async (dispute) => {
    try {
      // Get admin users
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (!admins?.length) return;

      // Create notifications for admin team
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'dispute_submitted',
        title: 'New Booking Dispute',
        message: `A new ${disputeData.type} dispute has been submitted for booking ${bookingId}`,
        data: {
          dispute_id: dispute.id,
          booking_id: bookingId,
          dispute_type: disputeData.type,
          category: disputeData.category,
          urgency: disputeData.urgency,
        },
        channels: ['push', 'email'],
        priority: disputeData.urgency === 'urgent' ? 'high' : 'normal',
        created_at: new Date().toISOString(),
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify admin team:', error);
    }
  };

  const notifyVendor = async (dispute) => {
    try {
      const vendorId = bookingDetails?.adventures?.vendor_id;
      if (!vendorId) return;

      const notification = {
        user_id: vendorId,
        type: 'dispute_notification',
        title: 'Booking Dispute Filed',
        message: `A customer has filed a dispute regarding booking ${bookingId}. Please review and respond.`,
        data: {
          dispute_id: dispute.id,
          booking_id: bookingId,
          dispute_type: disputeData.type,
          category: disputeData.category,
        },
        channels: ['push', 'email'],
        priority: 'high',
        created_at: new Date().toISOString(),
      };

      await supabase.from('notifications').insert(notification);
    } catch (error) {
      console.error('Failed to notify vendor:', error);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dispute Category
        </h3>
        <div className="space-y-3">
          {disputeCategories[disputeData.type]?.map((category) => (
            <label key={category.id} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <input
                type="radio"
                name="disputeCategory"
                value={category.id}
                checked={disputeData.category === category.id}
                onChange={(e) => setDisputeData(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {category.label}
                </div>
                <div className="text-sm text-gray-500">
                  {category.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {bookingDetails && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Information</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Trip:</strong> {bookingDetails.adventures.title}</p>
            <p><strong>Vendor:</strong> {bookingDetails.adventures.vendors?.name}</p>
            <p><strong>Trip Date:</strong> {new Date(bookingDetails.adventures.start_date).toLocaleDateString()}</p>
            <p><strong>Booking Status:</strong> {bookingDetails.status}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dispute Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={disputeData.subject}
              onChange={(e) => setDisputeData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief summary of your dispute..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={disputeData.description}
              onChange={(e) => setDisputeData(prev => ({ ...prev, description: e.target.value }))}
              rows={5}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide a detailed explanation of the issue, including timeline of events, communications with vendor, and any relevant details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Resolution <span className="text-red-500">*</span>
            </label>
            <textarea
              value={disputeData.requestedResolution}
              onChange={(e) => setDisputeData(prev => ({ ...prev, requestedResolution: e.target.value }))}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="What specific resolution are you seeking? (e.g., full refund, modification approval, compensation, etc.)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                value={disputeData.urgency}
                onChange={(e) => setDisputeData(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <select
                value={disputeData.contactPreference}
                onChange={(e) => setDisputeData(prev => ({ ...prev, contactPreference: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="platform">Platform Messages</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Supporting Evidence
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload any supporting documents, screenshots, or communications that support your dispute.
          This evidence will help us resolve your case more effectively.
        </p>

        <div className="space-y-4">
          {evidenceTypes.map((type) => (
            <div key={type.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{type.label}</h4>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept={type.accept}
                    onChange={(e) => handleFileUpload(Array.from(e.target.files), type.id)}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    Upload
                  </span>
                </label>
              </div>

              {/* Show uploaded files for this type */}
              {evidenceFiles.filter(file => file.type === type.id).map((file) => (
                <div key={file.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded mt-2">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-gray-600">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    onClick={() => removeEvidence(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {evidenceFiles.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evidence uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">Upload supporting documents using the buttons above</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Review and Submit
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Dispute Type:</span>
            <span className="ml-2 text-sm text-gray-900 capitalize">{disputeData.type}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <span className="ml-2 text-sm text-gray-900">
              {disputeCategories[disputeData.type]?.find(c => c.id === disputeData.category)?.label}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Subject:</span>
            <span className="ml-2 text-sm text-gray-900">{disputeData.subject}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Urgency:</span>
            <span className="ml-2 text-sm text-gray-900 capitalize">{disputeData.urgency}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Evidence Files:</span>
            <span className="ml-2 text-sm text-gray-900">{evidenceFiles.length} file(s)</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              What happens next?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="space-y-1">
                <li>• Your dispute will be assigned to a specialist</li>
                <li>• We'll review all evidence and communications</li>
                <li>• You'll receive updates via your preferred contact method</li>
                <li>• We aim to resolve disputes within 5-7 business days</li>
                <li>• You can track progress in your account dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Dispute Submitted Successfully
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your dispute has been submitted and assigned a case number. You'll receive email updates as we investigate.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-700">
          <p><strong>Next Steps:</strong></p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Check your email for confirmation</li>
            <li>• Monitor your account for updates</li>
            <li>• Respond promptly to any requests for additional information</li>
            <li>• Continue communication through the dispute portal</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              File a Dispute
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {step < 5 && (
            <div className="mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((stepNum) => (
                  <React.Fragment key={stepNum}>
                    <div className={`h-2 w-2 rounded-full ${step >= stepNum ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    {stepNum < 4 && <div className={`h-0.5 w-8 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-300'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {!loading && (
            <>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
            </>
          )}
        </div>

        {!loading && step < 5 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              {step < 4 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !disputeData.category) ||
                    (step === 2 && (!disputeData.subject || !disputeData.description || !disputeData.requestedResolution))
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={submitDispute}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Dispute
                </button>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeResolutionModal;
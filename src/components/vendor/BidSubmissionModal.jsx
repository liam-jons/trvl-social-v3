import { useState, useEffect } from 'react';
import { X, Plus, Minus, Upload, FileText, Image, DollarSign, Calendar, MapPin, Users } from 'lucide-react';
import { vendorService } from '../../services/vendor-service';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
const BidSubmissionModal = ({ request, vendor, onClose, onBidSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // Bid form data
  const [bidData, setBidData] = useState({
    proposedPrice: '',
    message: '',
    validUntil: '',
    priceBreakdown: [
      { item: 'Base Adventure Fee', amount: '', description: '' },
      { item: 'Equipment Rental', amount: '', description: '' },
      { item: 'Transportation', amount: '', description: '' }
    ],
    customItinerary: {
      title: '',
      description: '',
      days: [
        {
          day: 1,
          title: 'Day 1',
          activities: [],
          meals: [],
          accommodation: '',
          notes: ''
        }
      ]
    },
    attachments: [],
    templateId: null
  });
  // Load bid templates
  useEffect(() => {
    const loadTemplates = async () => {
      const { data, error } = await vendorService.getBidTemplates(vendor.id, { isActive: true });
      if (!error && data) {
        setTemplates(data);
      }
    };
    loadTemplates();
  }, [vendor.id]);
  // Set default expiration (72 hours from now)
  useEffect(() => {
    const defaultExpiration = new Date();
    defaultExpiration.setHours(defaultExpiration.getHours() + 72);
    setBidData(prev => ({
      ...prev,
      validUntil: defaultExpiration.toISOString().slice(0, 16)
    }));
  }, []);
  // Handle template selection
  const handleTemplateSelect = (template) => {
    if (template) {
      setBidData(prev => ({
        ...prev,
        templateId: template.id,
        priceBreakdown: template.default_pricing ? JSON.parse(template.default_pricing) : prev.priceBreakdown,
        customItinerary: template.default_itinerary ? JSON.parse(template.default_itinerary) : prev.customItinerary,
        message: template.default_message || prev.message
      }));
    }
    setSelectedTemplate(template);
  };
  // Handle price breakdown updates
  const updatePriceBreakdown = (index, field, value) => {
    setBidData(prev => ({
      ...prev,
      priceBreakdown: prev.priceBreakdown.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };
  const addPriceBreakdownItem = () => {
    setBidData(prev => ({
      ...prev,
      priceBreakdown: [
        ...prev.priceBreakdown,
        { item: '', amount: '', description: '' }
      ]
    }));
  };
  const removePriceBreakdownItem = (index) => {
    if (bidData.priceBreakdown.length > 1) {
      setBidData(prev => ({
        ...prev,
        priceBreakdown: prev.priceBreakdown.filter((_, i) => i !== index)
      }));
    }
  };
  // Handle itinerary updates
  const updateItinerary = (field, value) => {
    setBidData(prev => ({
      ...prev,
      customItinerary: { ...prev.customItinerary, [field]: value }
    }));
  };
  const updateItineraryDay = (dayIndex, field, value) => {
    setBidData(prev => ({
      ...prev,
      customItinerary: {
        ...prev.customItinerary,
        days: prev.customItinerary.days.map((day, i) =>
          i === dayIndex ? { ...day, [field]: value } : day
        )
      }
    }));
  };
  const addItineraryDay = () => {
    const nextDay = bidData.customItinerary.days.length + 1;
    setBidData(prev => ({
      ...prev,
      customItinerary: {
        ...prev.customItinerary,
        days: [
          ...prev.customItinerary.days,
          {
            day: nextDay,
            title: `Day ${nextDay}`,
            activities: [],
            meals: [],
            accommodation: '',
            notes: ''
          }
        ]
      }
    }));
  };
  const removeItineraryDay = (dayIndex) => {
    if (bidData.customItinerary.days.length > 1) {
      setBidData(prev => ({
        ...prev,
        customItinerary: {
          ...prev.customItinerary,
          days: prev.customItinerary.days.filter((_, i) => i !== dayIndex)
        }
      }));
    }
  };
  // Handle file attachments
  const handleFileUpload = (files) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(file => {
      // Validate file type and size (max 10MB)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    setBidData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };
  const removeAttachment = (index) => {
    setBidData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };
  // Calculate total price
  const calculateTotal = () => {
    return bidData.priceBreakdown.reduce((total, item) => {
      return total + (parseFloat(item.amount) || 0);
    }, 0);
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidData.proposedPrice || bidData.proposedPrice <= 0) {
      setError('Please enter a valid proposed price');
      return;
    }
    if (!bidData.message.trim()) {
      setError('Please include a message to the client');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const total = calculateTotal();
      const proposedPrice = parseFloat(bidData.proposedPrice) || total;
      const submissionData = {
        tripRequestId: request.id,
        vendorId: vendor.id,
        proposedPrice,
        priceBreakdown: bidData.priceBreakdown.filter(item => item.item && item.amount),
        customItinerary: bidData.customItinerary,
        message: bidData.message,
        templateId: bidData.templateId,
        validUntil: bidData.validUntil,
        attachments: bidData.attachments
      };
      const { data, error: submitError } = await vendorService.submitBid(submissionData);
      if (submitError) {
        throw new Error(submitError);
      }
      // Success
      onBidSubmitted();
    } catch (err) {
      console.error('Bid submission error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };
  const totalPrice = calculateTotal();
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Submit Bid
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {request.title} - {request.destination}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Trip Summary */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{request.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{request.group_size} people</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {formatCurrency(request.budget_min)} - {formatCurrency(request.budget_max)}
                  </span>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <ErrorMessage message={error} onClose={() => setError(null)} />
              )}
              {/* Template Selection */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Use Template (Optional)
                  </label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      handleTemplateSelect(template);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.adventure_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Proposed Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Proposed Price *
                </label>
                <input
                  type="number"
                  value={bidData.proposedPrice}
                  onChange={(e) => setBidData(prev => ({ ...prev, proposedPrice: e.target.value }))}
                  placeholder={totalPrice > 0 ? formatCurrency(totalPrice) : "Enter total price"}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Price Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={addPriceBreakdownItem}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {bidData.priceBreakdown.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => updatePriceBreakdown(index, 'item', e.target.value)}
                          placeholder="Item name"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updatePriceBreakdown(index, 'amount', e.target.value)}
                          placeholder="Amount"
                          min="0"
                          step="0.01"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updatePriceBreakdown(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {bidData.priceBreakdown.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceBreakdownItem(index)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {totalPrice > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Calculated Total:
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {/* Custom Itinerary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Proposed Itinerary
                </label>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={bidData.customItinerary.title}
                    onChange={(e) => updateItinerary('title', e.target.value)}
                    placeholder="Itinerary title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={bidData.customItinerary.description}
                    onChange={(e) => updateItinerary('description', e.target.value)}
                    placeholder="Itinerary overview..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {/* Days */}
                  {bidData.customItinerary.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => updateItineraryDay(dayIndex, 'title', e.target.value)}
                          className="font-medium bg-transparent border-none text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                        />
                        {bidData.customItinerary.days.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItineraryDay(dayIndex)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <textarea
                          value={day.activities.join('\n')}
                          onChange={(e) => updateItineraryDay(dayIndex, 'activities', e.target.value.split('\n').filter(a => a.trim()))}
                          placeholder="Activities (one per line)..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={day.accommodation}
                          onChange={(e) => updateItineraryDay(dayIndex, 'accommodation', e.target.value)}
                          placeholder="Accommodation"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                          value={day.notes}
                          onChange={(e) => updateItineraryDay(dayIndex, 'notes', e.target.value)}
                          placeholder="Additional notes..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItineraryDay}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                    Add Day
                  </button>
                </div>
              </div>
              {/* Message to Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message to Client *
                </label>
                <textarea
                  value={bidData.message}
                  onChange={(e) => setBidData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Introduce yourself and explain why you're the best choice for this adventure..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments (Optional)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors duration-200"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Click to upload images, documents, or certificates
                    </span>
                  </label>
                  {bidData.attachments.length > 0 && (
                    <div className="space-y-2">
                      {bidData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {file.type.startsWith('image/') ? (
                              <Image className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Bid Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bid Valid Until
                </label>
                <input
                  type="datetime-local"
                  value={bidData.validUntil}
                  onChange={(e) => setBidData(prev => ({ ...prev, validUntil: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default: 72 hours from now
                </p>
              </div>
              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : null}
                  {loading ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BidSubmissionModal;
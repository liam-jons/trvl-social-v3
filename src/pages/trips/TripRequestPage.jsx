import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import { parseTripDescription, getConfidenceExplanation } from '../../services/nlp-service';

const TripRequestPage = () => {
  const [formData, setFormData] = useState({
    description: '',
    startDate: '',
    endDate: '',
    budget: 5000,
    groupSize: 2,
    inspirationImages: []
  });

  const [errors, setErrors] = useState({});
  const [characterCount, setCharacterCount] = useState(0);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showPreviousRequests, setShowPreviousRequests] = useState(false);
  const [nlpResult, setNlpResult] = useState(null);
  const [isParsingNLP, setIsParsingNLP] = useState(false);
  const [showNLPPreview, setShowNLPPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Draft auto-save functionality
  useEffect(() => {
    const savedDraft = localStorage.getItem('tripRequestDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        setCharacterCount(draft.description.length);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.description.length > 0) {
        localStorage.setItem('tripRequestDraft', JSON.stringify(formData));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};

    if (formData.description.length < 100) {
      newErrors.description = 'Please provide at least 100 characters to help us understand your adventure better';
    }

    if (formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.groupSize < 1 || formData.groupSize > 20) {
      newErrors.groupSize = 'Group size must be between 1 and 20 people';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
    setCharacterCount(value.length);

    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        inspirationImages: [...prev.inspirationImages, ...imageFiles].slice(0, 5)
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      inspirationImages: prev.inspirationImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsParsingNLP(true);

      // Parse the natural language description
      const parsedTrip = await parseTripDescription(formData.description);

      // Combine parsed data with form data
      const requestData = {
        ...formData,
        parsedDescription: parsedTrip,
        confidence: parsedTrip.overallConfidence,
        source: parsedTrip.source
      };

      // Clear draft on successful submission
      localStorage.removeItem('tripRequestDraft');

      // Log the parsed data for now (will integrate with backend later)
      console.log('Trip request submitted:', requestData);
      console.log('NLP Analysis:', parsedTrip);

      // Store the result for display
      setNlpResult(parsedTrip);
      setShowNLPPreview(true);

      alert(`Trip request parsed successfully!

Confidence: ${Math.round(parsedTrip.overallConfidence * 100)}%
Destination: ${parsedTrip.destinations.primary || 'Not specified'}
Activities: ${parsedTrip.activities.interests.slice(0, 3).join(', ') || 'Not specified'}
Source: ${parsedTrip.source}

We'll start finding perfect adventures for you!`);

    } catch (error) {
      console.error('Error parsing trip description:', error);
      setErrors({ submit: `Failed to parse trip description: ${error.message}` });
    } finally {
      setIsParsingNLP(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('tripRequestDraft');
    setFormData({
      description: '',
      startDate: '',
      endDate: '',
      budget: 5000,
      groupSize: 2,
      inspirationImages: []
    });
    setCharacterCount(0);
    setErrors({});
    setNlpResult(null);
    setShowNLPPreview(false);
  };

  // Preview NLP parsing without submitting
  const previewParsing = async () => {
    if (formData.description.length < 100) {
      setErrors({ description: 'Please provide at least 100 characters before previewing' });
      return;
    }

    try {
      setIsParsingNLP(true);
      setErrors({});

      const parsedTrip = await parseTripDescription(formData.description);
      setNlpResult(parsedTrip);
      setShowNLPPreview(true);
    } catch (error) {
      console.error('Error parsing trip description:', error);
      setErrors({ description: `Parsing error: ${error.message}` });
    } finally {
      setIsParsingNLP(false);
    }
  };

  const examplePrompts = [
    "I want a 5-day adventure in the Colorado Rockies this summer. Looking for hiking, camping, and rock climbing with a budget around $2000. Prefer small group experiences with experienced guides.",
    "Seeking a cultural immersion experience in Southeast Asia for 2 weeks. Interested in cooking classes, temple visits, local markets, and staying with families. Budget is flexible, around $3000.",
    "Planning a romantic getaway to the Mediterranean. Love wine tasting, coastal walks, historic sites, and luxury accommodations. 7-10 days, budget up to $8000 for two people.",
    "Adventure family trip with teens to Costa Rica. Want zip-lining, wildlife viewing, beach time, and eco-friendly lodges. 10 days, budget around $6000 for family of four."
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gradient">
          Plan Your Dream Adventure
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Describe your ideal adventure in your own words, and we'll connect you with expert vendors
          who can make it happen. The more details you share, the better we can match you!
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Description */}
              <div>
                <label className="block text-lg font-medium mb-2">
                  Describe Your Dream Adventure
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Tell us about your ideal trip. Include destinations, activities, dates, budget,
                  group size, and any special preferences or requirements.
                </p>

                <GlassInput
                  type="textarea"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  className="min-h-[200px]"
                  placeholder="I'm dreaming of an adventure where..."
                  error={errors.description}
                />

                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${
                    characterCount < 100 ? 'text-red-500' :
                    characterCount > 2000 ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {characterCount} / 2000 characters
                    {characterCount < 100 && ` (${100 - characterCount} more needed)`}
                  </span>
                  {isDraftSaved && (
                    <span className="text-sm text-green-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Draft saved
                    </span>
                  )}
                </div>
              </div>

              {/* Optional Details */}
              <div className="border-t border-white/20 pt-6">
                <h3 className="text-lg font-medium mb-4">Optional Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div>
                    <GlassInput
                      type="date"
                      label="Start Date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <GlassInput
                      type="date"
                      label="End Date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      error={errors.endDate}
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Budget (per person)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        name="budget"
                        min="500"
                        max="15000"
                        step="250"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="text-center font-medium text-lg">
                        ${formData.budget.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Group Size */}
                  <div>
                    <GlassInput
                      type="number"
                      label="Group Size"
                      name="groupSize"
                      min="1"
                      max="20"
                      value={formData.groupSize}
                      onChange={handleInputChange}
                      error={errors.groupSize}
                    />
                  </div>
                </div>
              </div>

              {/* Inspiration Images */}
              <div className="border-t border-white/20 pt-6">
                <h3 className="text-lg font-medium mb-2">Inspiration Images</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload up to 5 images that capture what you're looking for
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formData.inspirationImages.length >= 5}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Images ({formData.inspirationImages.length}/5)
                </GlassButton>

                {formData.inspirationImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {formData.inspirationImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Inspiration ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={isParsingNLP}
                >
                  {isParsingNLP ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Parsing Description...
                    </>
                  ) : (
                    'Submit Trip Request'
                  )}
                </GlassButton>

                <GlassButton
                  type="button"
                  variant="accent"
                  size="lg"
                  onClick={previewParsing}
                  disabled={isParsingNLP || characterCount < 100}
                  className="sm:w-auto"
                >
                  Preview Analysis
                </GlassButton>

                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={clearDraft}
                  className="sm:w-auto"
                  disabled={isParsingNLP}
                >
                  Clear Draft
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Example Prompts */}
          <GlassCard>
            <h3 className="text-lg font-medium mb-4">Need Inspiration?</h3>
            <div className="space-y-4">
              {examplePrompts.map((prompt, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {prompt}
                  </p>
                  <GlassButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, description: prompt }));
                      setCharacterCount(prompt.length);
                    }}
                  >
                    Use This Example
                  </GlassButton>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Previous Requests */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Your Requests</h3>
              <GlassButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowPreviousRequests(!showPreviousRequests)}
              >
                {showPreviousRequests ? 'Hide' : 'Show'} History
              </GlassButton>
            </div>

            {showPreviousRequests && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No previous requests yet. Your submitted requests will appear here.
                </p>
              </div>
            )}
          </GlassCard>

          {/* NLP Analysis Preview */}
          {showNLPPreview && nlpResult && (
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Analysis Preview</h3>
                <button
                  onClick={() => setShowNLPPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Confidence Score */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm font-medium">Overall Confidence</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          nlpResult.overallConfidence > 0.7 ? 'bg-green-500' :
                          nlpResult.overallConfidence > 0.4 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${nlpResult.overallConfidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(nlpResult.overallConfidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Key Findings */}
                {nlpResult.destinations.primary && (
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-blue-500">📍</span>
                      <span className="text-sm font-medium">Destination</span>
                    </div>
                    <p className="text-sm">{nlpResult.destinations.primary}</p>
                  </div>
                )}

                {nlpResult.activities.interests.length > 0 && (
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-green-500">🎯</span>
                      <span className="text-sm font-medium">Activities</span>
                    </div>
                    <p className="text-sm">{nlpResult.activities.interests.slice(0, 3).join(', ')}</p>
                  </div>
                )}

                {nlpResult.budget.amount && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-yellow-500">💰</span>
                      <span className="text-sm font-medium">Budget</span>
                    </div>
                    <p className="text-sm">
                      ${nlpResult.budget.amount.toLocaleString()} {nlpResult.budget.currency || 'USD'}
                      {nlpResult.budget.perPerson ? ' per person' : ' total'}
                    </p>
                  </div>
                )}

                {/* Source Info */}
                <div className="text-xs text-gray-500 text-center pt-2">
                  Analyzed using: {nlpResult.source === 'openai' ? 'OpenAI' : nlpResult.source === 'anthropic' ? 'Claude AI' : 'Pattern Matching'}
                </div>

                {/* Confidence Explanation */}
                {getConfidenceExplanation(nlpResult).length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <h4 className="text-sm font-medium mb-2">Analysis Quality:</h4>
                    <ul className="text-xs space-y-1">
                      {getConfidenceExplanation(nlpResult).map((explanation, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <span className="text-green-500">✓</span>
                          <span>{explanation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Tips */}
          <GlassCard>
            <h3 className="text-lg font-medium mb-4">Tips for Better Matches</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Be specific about activities you want to try</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Mention your experience level and comfort zone</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Include any dietary restrictions or accessibility needs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Share what kind of accommodation you prefer</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Mention if you want to meet other travelers</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default TripRequestPage;
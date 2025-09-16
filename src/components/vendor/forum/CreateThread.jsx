import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  Plus,
  X,
  Eye,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const CreateThread = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    { id: 'marketing', name: 'Marketing', description: 'Social media, advertising, and promotion strategies' },
    { id: 'safety', name: 'Safety', description: 'Safety protocols, risk management, and emergency procedures' },
    { id: 'customer_service', name: 'Customer Service', description: 'Guest relations, feedback handling, and service improvement' },
    { id: 'pricing_strategies', name: 'Pricing Strategies', description: 'Pricing models, seasonal adjustments, and revenue optimization' },
    { id: 'equipment_maintenance', name: 'Equipment Maintenance', description: 'Gear care, maintenance schedules, and equipment upgrades' },
    { id: 'legal_regulations', name: 'Legal & Regulations', description: 'Compliance, permits, and legal requirements' },
    { id: 'insurance', name: 'Insurance', description: 'Coverage options, claims, and risk protection' },
    { id: 'seasonal_tips', name: 'Seasonal Tips', description: 'Weather-specific advice and seasonal preparation' },
    { id: 'technology', name: 'Technology', description: 'Software tools, apps, and digital solutions' },
    { id: 'general_discussion', name: 'General Discussion', description: 'Open conversations and community topics' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'Add at least one tag to help others find your thread';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, this would create the thread via API
      console.log('Creating thread:', formData);

      // Redirect to the new thread
      navigate('/vendor/forum/thread/new-thread-id');
    } catch (error) {
      console.error('Error creating thread:', error);
      setErrors({ submit: 'Failed to create thread. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      marketing: 'bg-pink-100 text-pink-800 border-pink-200',
      safety: 'bg-red-100 text-red-800 border-red-200',
      customer_service: 'bg-blue-100 text-blue-800 border-blue-200',
      pricing_strategies: 'bg-green-100 text-green-800 border-green-200',
      equipment_maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      legal_regulations: 'bg-purple-100 text-purple-800 border-purple-200',
      insurance: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      seasonal_tips: 'bg-orange-100 text-orange-800 border-orange-200',
      technology: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      general_discussion: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors.general_discussion;
  };

  const selectedCategory = categories.find(cat => cat.id === formData.category);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/vendor/forum"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Forum
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Thread</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thread Preview</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {selectedCategory && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(formData.category)}`}>
                    {selectedCategory.name}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                {formData.title || 'Thread Title'}
              </h1>

              <div className="prose max-w-none">
                {formData.content ? (
                  formData.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Thread content will appear here...</p>
                )}
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thread Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="What's your question or topic?"
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.title.length}/200
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.category === category.id
                        ? `${getCategoryColor(category.id)} border-current`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={formData.category === category.id}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="text-sm text-red-600 mt-1">{errors.category}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags * (max 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add tags (e.g., marketing, safety, tips)"
                    disabled={formData.tags.length >= 5}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.includes(newTag.trim()) || formData.tags.length >= 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {errors.tags && (
                <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Tags help others find your thread. Use relevant keywords.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thread Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={12}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe your question, share your experience, or start a discussion. Be specific and provide context to help others understand and respond effectively."
            />
            <div className="flex justify-between mt-1">
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {formData.content.length} characters
              </p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-2">Community Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be respectful and professional in all interactions</li>
                  <li>• Share relevant experiences and constructive advice</li>
                  <li>• Search existing threads before posting duplicate questions</li>
                  <li>• Use clear, descriptive titles and appropriate categories</li>
                  <li>• Mark helpful replies as solutions to help others</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link
              to="/vendor/forum"
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </Link>

            <div className="flex items-center space-x-3">
              {errors.submit && (
                <p className="text-sm text-red-600">{errors.submit}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create Thread
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateThread;
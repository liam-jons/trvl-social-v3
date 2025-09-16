import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import BasicDetailsForm from './BasicDetailsForm';
import PricingConfiguration from './PricingConfiguration';
import MediaUpload from './MediaUpload';
import AvailabilityConfiguration from './AvailabilityConfiguration';
import ItineraryBuilder from './ItineraryBuilder';
import AdventurePreview from './AdventurePreview';
import useVendorDashboardStore from '../../../stores/vendorDashboardStore';
const WIZARD_STEPS = [
  { id: 'details', title: 'Basic Details', description: 'Adventure info & description' },
  { id: 'pricing', title: 'Pricing', description: 'Set rates & variations' },
  { id: 'media', title: 'Media', description: 'Photos & gallery' },
  { id: 'availability', title: 'Availability', description: 'Calendar & schedules' },
  { id: 'itinerary', title: 'Itinerary', description: 'Day-by-day activities' }
];
const AdventureWizard = ({ adventure, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    longDescription: '',
    adventureType: 'outdoor',
    duration: '',
    groupSizeMin: 2,
    groupSizeMax: 12,
    difficulty: 'moderate',
    basePrice: '',
    currency: 'USD',
    seasonalPricing: [],
    groupDiscounts: [],
    images: [],
    availability: {
      type: 'open',
      blackoutDates: [],
      schedules: []
    },
    itinerary: []
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { createAdventure, updateAdventure, isLoading } = useVendorDashboardStore();
  // Initialize form with existing adventure data
  useEffect(() => {
    if (adventure) {
      setFormData({
        ...formData,
        ...adventure
      });
    }
  }, [adventure]);
  // Track unsaved changes
  useEffect(() => {
    if (adventure) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify({
        ...formData,
        ...adventure
      });
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(Object.values(formData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.values(value).some(v => v);
        return value !== '' && value !== null && value !== undefined;
      }));
    }
  }, [formData, adventure]);
  const updateFormData = (stepData) => {
    setFormData(prev => ({
      ...prev,
      ...stepData
    }));
  };
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSave = async (isDraft = false) => {
    try {
      const adventureData = {
        ...formData,
        status: isDraft ? 'draft' : 'published',
        updatedAt: new Date().toISOString()
      };
      if (adventure) {
        await updateAdventure(adventure.id, adventureData);
      } else {
        await createAdventure({
          ...adventureData,
          createdAt: new Date().toISOString()
        });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save adventure:', error);
      // Could add toast notification here
    }
  };
  const renderStepContent = () => {
    if (isPreviewMode) {
      return <AdventurePreview adventureData={formData} />;
    }
    switch (WIZARD_STEPS[currentStep].id) {
      case 'details':
        return (
          <BasicDetailsForm
            data={formData}
            onChange={updateFormData}
          />
        );
      case 'pricing':
        return (
          <PricingConfiguration
            data={formData}
            onChange={updateFormData}
          />
        );
      case 'media':
        return (
          <MediaUpload
            data={formData}
            onChange={updateFormData}
          />
        );
      case 'availability':
        return (
          <AvailabilityConfiguration
            data={formData}
            onChange={updateFormData}
          />
        );
      case 'itinerary':
        return (
          <ItineraryBuilder
            data={formData}
            onChange={updateFormData}
          />
        );
      default:
        return null;
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {adventure ? 'Edit Adventure' : 'Create New Adventure'}
          </h2>
          {!isPreviewMode && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {isPreviewMode ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      {/* Progress Bar */}
      {!isPreviewMode && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index !== WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index === currentStep
                      ? 'bg-blue-500 text-white'
                      : index < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
                <div className="ml-2 flex-shrink-0">
                  <div className={`text-sm font-medium ${index === currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </div>
                </div>
                {index !== WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={isPreviewMode ? 'preview' : currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Footer */}
      {!isPreviewMode && (
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </button>
          <div className="flex items-center gap-3">
            {/* Save as Draft */}
            <button
              onClick={() => handleSave(true)}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            {/* Next/Publish */}
            {currentStep === WIZARD_STEPS.length - 1 ? (
              <button
                onClick={() => handleSave(false)}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Publish Adventure'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="absolute bottom-20 left-6 right-6 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            You have unsaved changes. Make sure to save your progress before closing.
          </p>
        </div>
      )}
    </div>
  );
};
export default AdventureWizard;
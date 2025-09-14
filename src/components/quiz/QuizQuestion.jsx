import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

export default function QuizQuestion({
  question,
  selectedOption,
  onSelectOption,
  onNext,
  onPrevious,
  isFirst,
  isLast
}) {
  const canProceed = selectedOption !== null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="mb-8">
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            <img
              src={question.imageUrl}
              alt={question.text}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                {question.text}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {question.options.map((option) => (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassCard
                onClick={() => onSelectOption(option)}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedOption?.id === option.id
                    ? 'ring-2 ring-blue-500 dark:ring-purple-500 bg-blue-50/30 dark:bg-purple-900/30'
                    : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {option.imageUrl && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                      <img
                        src={option.imageUrl}
                        alt={option.text}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className={`w-5 h-5 rounded-full border-2 mt-1 mr-3 flex-shrink-0 transition-all ${
                        selectedOption?.id === option.id
                          ? 'border-blue-500 dark:border-purple-500 bg-blue-500 dark:bg-purple-500'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {selectedOption?.id === option.id && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {option.text}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isFirst
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            Previous
          </button>

          <button
            onClick={() => selectedOption && onNext()}
            disabled={!canProceed}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLast ? 'See Results' : 'Next Question'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

QuizQuestion.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    imageUrl: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        traitScores: PropTypes.object.isRequired,
      })
    ).isRequired,
  }).isRequired,
  selectedOption: PropTypes.object,
  onSelectOption: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
  isFirst: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
};
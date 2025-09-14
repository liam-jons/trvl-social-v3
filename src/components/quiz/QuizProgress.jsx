import PropTypes from 'prop-types';

export default function QuizProgress({ currentQuestion, totalQuestions }) {
  const progress = ((currentQuestion) / totalQuestions) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden backdrop-blur-sm bg-opacity-30">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="h-full bg-white/20 backdrop-blur-sm"></div>
        </div>
      </div>
    </div>
  );
}

QuizProgress.propTypes = {
  currentQuestion: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
};
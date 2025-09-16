import { forwardRef } from 'react';

const GlassInput = forwardRef(({
  className = '',
  type = 'text',
  error,
  label,
  required = false,
  ...props
}, ref) => {
  const baseClasses = `
    w-full px-4 py-2
    bg-white/10 dark:bg-white/5
    border border-white/20 dark:border-white/10
    rounded-lg backdrop-blur-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all duration-200
    placeholder:text-gray-500 dark:placeholder:text-gray-400
    text-gray-900 dark:text-white
    ${error ? 'border-red-500/50 focus:ring-red-500' : ''}
  `;

  const inputElement = type === 'textarea' ? (
    <textarea
      ref={ref}
      className={`${baseClasses} resize-vertical min-h-[120px] ${className}`}
      {...props}
    />
  ) : (
    <input
      ref={ref}
      type={type}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );

  if (label) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {inputElement}
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {inputElement}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;
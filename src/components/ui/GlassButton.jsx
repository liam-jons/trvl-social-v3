import { forwardRef } from 'react';

const GlassButton = forwardRef(({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const variantClasses = {
    default: `
      glass-blur-sm bg-white/10 dark:bg-white/5
      border border-white/20 dark:border-white/10
      hover:bg-white/20 dark:hover:bg-white/10
      active:bg-white/30 dark:active:bg-white/20
      text-gray-900 dark:text-white
    `,
    primary: `
      glass-blur-sm bg-primary-500/20
      border border-primary-500/30
      hover:bg-primary-500/30
      active:bg-primary-500/40
      text-primary-900 dark:text-primary-100
    `,
    secondary: `
      glass-blur-sm bg-secondary-500/20
      border border-secondary-500/30
      hover:bg-secondary-500/30
      active:bg-secondary-500/40
      text-secondary-900 dark:text-secondary-100
    `,
    accent: `
      glass-blur-sm bg-accent-500/20
      border border-accent-500/30
      hover:bg-accent-500/30
      active:bg-accent-500/40
      text-accent-900 dark:text-accent-100
    `,
    ghost: `
      bg-transparent
      border border-transparent
      hover:bg-white/10 dark:hover:bg-white/5
      active:bg-white/20 dark:active:bg-white/10
      text-gray-900 dark:text-white
    `,
    danger: `
      glass-blur-sm bg-red-500/20
      border border-red-500/30
      hover:bg-red-500/30
      active:bg-red-500/40
      text-red-900 dark:text-red-100
    `,
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabledClasses}
        rounded-lg font-medium
        transition-all duration-200 ease-in-out
        transform hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

GlassButton.displayName = 'GlassButton';

export default GlassButton;
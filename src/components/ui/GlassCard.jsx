import { forwardRef } from 'react';

const GlassCard = forwardRef(({
  children,
  className = '',
  variant = 'default',
  blur = 'md',
  padding = 'md',
  ...props
}, ref) => {
  const blurClasses = {
    xs: 'glass-blur-xs',
    sm: 'glass-blur-sm',
    md: 'glass-blur-md',
    lg: 'glass-blur-lg',
    xl: 'glass-blur-xl',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',   // 16px - 2 grid units
    md: 'p-6',   // 24px - 3 grid units
    lg: 'p-8',   // 32px - 4 grid units
    xl: 'p-12',  // 48px - 6 grid units
  };

  const variantClasses = {
    default: 'bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10',
    light: 'bg-white/20 dark:bg-white/5 border-white/30 dark:border-white/10',
    dark: 'bg-black/20 dark:bg-black/40 border-black/20 dark:border-white/10',
    primary: 'bg-primary-500/10 border-primary-500/20',
    secondary: 'bg-secondary-500/10 border-secondary-500/20',
    accent: 'bg-accent-500/10 border-accent-500/20',
  };

  return (
    <div
      ref={ref}
      className={`
        ${blurClasses[blur]}
        ${paddingClasses[padding]}
        ${variantClasses[variant]}
        border rounded-xl shadow-lg
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
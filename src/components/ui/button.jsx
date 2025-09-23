import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-token-md font-medium interactive-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-token-sm hover:shadow-token-md",
        destructive: "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-token-sm hover:shadow-token-md",
        outline: "border border-base bg-surface-base hover:bg-surface-raised text-primary border-primary-300 hover:border-primary-400",
        secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700",
        ghost: "hover:bg-surface-raised text-primary hover:text-primary-600 active:bg-secondary-200 dark:hover:bg-secondary-800",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm touch-target-sm",
        sm: "h-9 rounded-token-sm px-3 text-xs touch-target-sm",
        lg: "h-12 rounded-token-lg px-6 text-base touch-target-md",
        icon: "h-10 w-10 touch-target-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
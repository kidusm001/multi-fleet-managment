import { cn } from '@lib/utils';
import React from 'react';
import PropTypes from 'prop-types';

const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-[var(--disabled-opacity)]";

const variants = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--button-hover)]",
  secondary: "bg-[var(--secondary)] text-white hover:opacity-90",
  accent: "bg-[var(--accent)] text-white hover:opacity-90",
  outline: "border border-[var(--input-border)] bg-transparent hover:bg-[var(--hover-overlay)] text-[var(--text-primary)]",
  ghost: "hover:bg-[var(--hover-overlay)] text-[var(--text-primary)]",
  link: "text-[var(--primary)] underline-offset-4 hover:underline",
  destructive: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

function buttonVariants({ variant = "primary", size = "default", className } = {}) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

const Button = React.forwardRef(({ 
  className, 
  variant = "primary", 
  size = "default", 
  disabled,
  children,
  ...props 
}, ref) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })} 
      ref={ref}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'outline', 'ghost', 'link', 'destructive']),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Button;
export { buttonVariants, Button };
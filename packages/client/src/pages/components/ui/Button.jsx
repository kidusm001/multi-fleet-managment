import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/30 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/40',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-sm',
  destructive: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg shadow-red-500/20 dark:shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/30 dark:hover:shadow-red-500/20',
  outline: 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded-lg',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        'transform hover:scale-[1.02] active:scale-[0.98]',
        'select-none relative',
        'after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none',
        'after:transition-[shadow,opacity] after:duration-500',
        'after:opacity-0 hover:after:opacity-100',
        'after:shadow-[0_0_12px_3px_rgba(59,130,246,0.3)] dark:after:shadow-[0_0_12px_3px_rgba(59,130,246,0.2)]',
        (disabled || loading) && 'after:hidden pointer-events-none',
        loading && 'relative !text-transparent',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        </div>
      )}
      {children}
    </button>
  );
}

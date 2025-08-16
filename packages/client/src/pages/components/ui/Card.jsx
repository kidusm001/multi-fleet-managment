import { cn } from '@/lib/utils';

export function Card({ children, className, title, action }) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800/95 rounded-xl',
      'border border-gray-200/50 dark:border-gray-700/50',
      'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/30',
      'backdrop-blur-sm backdrop-filter',
      'transition-all duration-300 ease-in-out',
      'hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/40',
      'dark:ring-1 dark:ring-inset dark:ring-white/5',
      className
    )}>
      {(title || action) && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          {title && (
            <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              {title}
            </h2>
          )}
          {action && (
            <div className="flex items-center space-x-2">
              {action}
            </div>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
} 
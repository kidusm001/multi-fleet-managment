import { cn } from "@/lib/utils";

export function Select({
  label,
  error,
  className,
  fullWidth,
  children,
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <select
        className={cn(
          "form-select block rounded-lg border border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "appearance-none bg-no-repeat",
          "[background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")]",
          "[background-position:right_0.75rem_center] [background-size:1.5em_1.5em]",
          "hover:border-gray-300 dark:hover:border-gray-600",
          "dark:[background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")]",
          error && "border-red-500 dark:border-red-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

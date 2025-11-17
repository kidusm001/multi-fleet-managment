import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(
  (
    {
      className,
      error,
      icon: Icon,
      iconPosition = "left",
      label,
      fullWidth,
      type = "text",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputStyles = cn(
      "block rounded-lg border transition-colors",
      "text-sm text-gray-900 dark:text-gray-100",
      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
      {
        "w-full": fullWidth,
        "pl-10": Icon && iconPosition === "left",
        "pr-10": Icon && iconPosition === "right",
        "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800":
          !error,
        "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10":
          error,
        "focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400":
          !error,
        "focus:border-red-500 focus:ring-red-500 dark:focus:border-red-400 dark:focus:ring-red-400":
          error,
        "hover:border-gray-400 dark:hover:border-gray-500": !disabled && !error,
        "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800": disabled,
      },
      "py-2 px-4",
      className
    );

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={inputStyles}
            disabled={disabled}
            ref={ref}
            {...props}
          />
          {Icon && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2",
                iconPosition === "left" ? "left-3" : "right-3"
              )}
            >
              <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

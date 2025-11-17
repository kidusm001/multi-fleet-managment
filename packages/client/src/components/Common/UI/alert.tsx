import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green-500/50 text-green-700 dark:border-green-500/30 dark:text-green-400 [&>svg]:text-green-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

interface AlertComponentProps {
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const ErrorAlert: React.FC<AlertComponentProps> = ({ 
  title = "Error", 
  children, 
  onClose,
  className 
}) => (
  <Alert 
    variant="destructive" 
    className={cn("flex items-start justify-between gap-2", className)}
  >
    <div className="flex gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5" />
      <div>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </div>
    </div>
    {onClose && (
      <button 
        onClick={onClose}
        aria-label="Close error message"
        className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </Alert>
);

const SuccessAlert: React.FC<AlertComponentProps> = ({ 
  title = "Success", 
  children, 
  onClose,
  className 
}) => (
  <Alert 
    variant="success" 
    className={cn("flex items-start justify-between gap-2", className)}
  >
    <div className="flex gap-2">
      <CheckCircle className="h-4 w-4 mt-0.5" />
      <div>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </div>
    </div>
    {onClose && (
      <button 
        onClick={onClose}
        aria-label="Close success message"
        className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </Alert>
);

export { Alert, AlertTitle, AlertDescription, ErrorAlert, SuccessAlert }

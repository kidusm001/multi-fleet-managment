import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#3b82f6] text-white shadow hover:bg-[#2563eb]",
        secondary:
          "bg-[#f1f5f9] text-[#64748b] dark:bg-[#1e293b] dark:text-[#94a3b8] border border-[#e2e8f0] dark:border-[#334155] hover:bg-[#e2e8f0] dark:hover:bg-[#334155]",
        destructive:
          "border-transparent bg-[#ef4444] text-white shadow hover:bg-[#dc2626]",
        outline: "border-2 text-[#3b82f6] dark:text-[#60a5fa] hover:bg-[#3b82f6]/10 dark:hover:bg-[#3b82f6]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

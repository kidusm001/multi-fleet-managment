import { cva } from "class-variance-authority";
import { cn } from "@utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--button-hover)]",
        secondary:
          "border-transparent bg-[var(--secondary)] text-white hover:opacity-90",
        accent:
          "border-transparent bg-[var(--accent)] text-white hover:opacity-90",
        subtle:
          "border-transparent bg-[var(--subtle)] text-[var(--text-primary)] hover:opacity-90",
        outline: "border-[var(--input-border)] text-[var(--text-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
export { Badge, badgeVariants };


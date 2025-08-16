import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform",
  {
    variants: {
      variant: {
        default: "btn-primary shadow-brand hover:shadow-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "btn-outline font-semibold relative z-10",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover transition-all",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "btn-primary text-xl px-12 py-6 rounded-2xl font-bold tracking-wide",
        glass: "backdrop-blur-md bg-white/10 text-foreground border border-white/20 hover:bg-white/15",
        "ghost-primary": "text-primary hover:text-white hover:bg-primary/90",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-8 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-10 text-lg font-semibold",
        icon: "h-12 w-12 rounded-2xl",
        hero: "h-16 px-12 text-2xl font-extrabold tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariantProps = Parameters<typeof buttonVariants>[0];

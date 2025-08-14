import React from "react";
import { cn } from "@lib/utils";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-[var(--text-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-[var(--disabled-opacity)]",
      className
    )}
    {...props}
  />
));

Label.displayName = "Label";

export { Label };
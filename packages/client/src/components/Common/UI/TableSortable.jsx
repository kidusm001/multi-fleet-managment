import React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef((props, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", props.className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef((props, ref) => (
  <thead ref={ref} className={cn(props.className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef((props, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", props.className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef((props, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
      props.className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef((props, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      props.className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef((props, ref) => (
  <th
    ref={ref}
    className={cn(
      "sticky top-0 z-10 bg-background", // <-- Added sticky classes and background
      "h-12 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:w-px [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
      props.className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef((props, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
      props.className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef((props, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", props.className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};

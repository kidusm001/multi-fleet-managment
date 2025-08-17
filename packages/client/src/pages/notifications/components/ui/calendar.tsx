"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";
import "../../styles/notifications.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center px-10",
        caption_label: "text-sm font-semibold text-slate-900 dark:text-slate-100",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 opacity-75 hover:opacity-100",
          "text-slate-600 hover:text-slate-900 hover:bg-orange-50",
          "dark:text-slate-400 dark:hover:text-orange-200 dark:hover:bg-orange-950/30"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between",
        head_cell: "w-10 h-10 font-semibold text-slate-500 dark:text-slate-400 text-[0.8rem]",
        row: "flex w-full mt-2 gap-px",
        cell: cn(
          "relative w-10 h-10 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range" && "[&:has([aria-selected])]:bg-transparent [&:has(.day_range_start)]:!bg-transparent [&:has(.day_range_end)]:!bg-transparent"
        ),
        day: cn(
          "w-10 h-10 p-0 font-normal transition-all duration-200",
          "hover:bg-orange-100 hover:text-orange-900",
          "dark:hover:bg-orange-950/50 dark:hover:text-orange-100",
          "focus:bg-orange-100 focus:text-orange-900",
          "dark:focus:bg-orange-950/50 dark:focus:text-orange-100"
        ),
        day_selected: cn(
          "rdp-day_selected",
          "!bg-orange-200 !text-white font-bold",
          "hover:!bg-[#dd3f14] hover:!text-white"
        ),
        day_today: cn(
          "border-2 border-orange-500 text-orange-600 font-semibold",
          "dark:border-orange-400 dark:text-orange-300"
        ),
        day_outside: "text-slate-400 dark:text-slate-500 opacity-50",
        day_disabled: "text-slate-400 dark:text-slate-500 opacity-50",
        day_range_start: cn(
          "rdp-day_range_start",
          "!bg-[#dd3f14] !text-white font-bold",
          "hover:!bg-[#dd3f14] hover:!text-white",
          "!rounded-l-md !rounded-r-none"
        ),
        day_range_end: cn(
          "rdp-day_range_end",
          "!bg-[#dd3f14] !text-white font-bold",
          "hover:!bg-[#dd3f14] hover:!text-white",
          "!rounded-r-md !rounded-l-none"
        ),
        day_range_middle: cn(
          "range-middle-date !rounded-none !border-0 bg-orange-100 text-orange-900",
          "hover:bg-orange-200 hover:text-orange-900",
          "dark:bg-orange-900/20 dark:text-orange-100",
          "dark:hover:bg-orange-900/30 dark:hover:text-orange-50"
        ),
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        ...components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
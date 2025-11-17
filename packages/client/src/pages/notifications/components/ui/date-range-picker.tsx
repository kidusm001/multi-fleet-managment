"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface DateRangePickerProps {
  date?: DateRange;
  onDateChange: (date?: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !date && "text-slate-500 dark:text-slate-400",
              "bg-white/90 dark:bg-slate-900/90",
              "border-slate-200 dark:border-slate-700",
              "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              "hover:border-[#f97316] dark:hover:border-[#fdba74]"
            )}
          >
            <span className={cn("truncate flex-1", !date && "text-slate-500 dark:text-slate-400")}>
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {date && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateChange(undefined);
                      }}
                      className={cn(
                        "rounded-md p-1 transition-colors",
                        "text-slate-400 dark:text-slate-500",
                        "hover:bg-[#f97316]/10 hover:text-[#f97316]",
                        "dark:hover:bg-[#fdba74]/10 dark:hover:text-[#fdba74]",
                        "cursor-pointer"
                      )}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    Clear dates
                  </TooltipContent>
                </Tooltip>
              )}
              <CalendarIcon
                size={16}
                strokeWidth={2}
                className="text-[#f97316] dark:text-[#fdba74]"
                aria-hidden="true"
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="end"
          sideOffset={8}
        >
          <div className={cn(
            "rounded-lg border",
            "bg-white/95 dark:bg-slate-900/95", 
            "border-slate-200 dark:border-slate-700",
            "shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50",
            "backdrop-blur-sm dark:backdrop-blur-sm" 
          )}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

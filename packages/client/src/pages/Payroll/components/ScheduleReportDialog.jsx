import { useState } from "react";
import PropTypes from "prop-types";
import { payrollService } from "@/services/payrollService";
import { useToast } from "@/components/Common/UI/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Common/UI/dialog";
import { Button } from "@/components/Common/UI/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import { Calendar } from "@/components/Common/UI/calendar";
import { PopoverTrigger, Popover, PopoverContent } from "@/components/Common/UI/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ScheduleReportDialog({ open, onOpenChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toast } = useToast();
  const [date, setDate] = useState();
  const [frequency, setFrequency] = useState("monthly");
  const [time, setTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const scheduleConfig = {
        startDate: format(date, "yyyy-MM-dd"),
        time,
        frequency,
        reportType: "payroll"
      };

      await payrollService.scheduleReport(scheduleConfig);
      
      toast({
        title: "Success",
        description: "Report scheduled successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[425px]",
        isDark ? "bg-gray-800 border-gray-700" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
            Schedule Payroll Report
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-500"}>
            Set up automated payroll report generation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-300" : "text-gray-900"
            )}>
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    isDark ? (
                      !date ? "text-gray-400 border-gray-700" : "text-white border-gray-700"
                    ) : (
                      !date ? "text-gray-500" : "text-gray-900"
                    )
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className={cn(
                  "w-auto p-0",
                  isDark ? "bg-gray-800 border-gray-700" : "bg-white"
                )} 
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={isDark ? "bg-gray-800" : ""}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <label className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-300" : "text-gray-900"
            )}>
              Time
            </label>
            <div className="flex items-center gap-2">
              <Clock className={isDark ? "text-gray-400" : "text-gray-500"} />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors",
                  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isDark ? (
                    "bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  ) : (
                    "bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
                  )
                )}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-300" : "text-gray-900"
            )}>
              Frequency
            </label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className={cn(
                isDark ? "border-gray-700 bg-gray-800 text-white" : ""
              )}>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className={cn(
                isDark ? "bg-gray-800 border-gray-700" : ""
              )}>
                <SelectItem value="daily" className={isDark ? "text-white focus:bg-gray-700" : ""}>Daily</SelectItem>
                <SelectItem value="weekly" className={isDark ? "text-white focus:bg-gray-700" : ""}>Weekly</SelectItem>
                <SelectItem value="monthly" className={isDark ? "text-white focus:bg-gray-700" : ""}>Monthly</SelectItem>
                <SelectItem value="quarterly" className={isDark ? "text-white focus:bg-gray-700" : ""}>Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className={isDark ? "border-gray-700 hover:bg-gray-700 text-white" : ""}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={isSubmitting}
            className={isDark ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {isSubmitting ? "Scheduling..." : "Schedule Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ScheduleReportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
};
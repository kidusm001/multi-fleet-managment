import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export default function TimeInput({
  value,
  onChange,
  className,
  isDark,
  showTimezone,
  timezone = "Africa/Addis_Ababa", // Default to Addis Ababa
  error
}) {
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState("AM");

  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          let hours24 = date.getHours();
          const minutes = date.getMinutes();
          const period = hours24 >= 12 ? "PM" : "AM";
          let hours12 = hours24 % 12;
          hours12 = hours12 || 12; // Convert 0 to 12

          setHours(hours12.toString().padStart(2, '0'));
          setMinutes(minutes.toString().padStart(2, '0'));
          setPeriod(period);
        }
      } catch (error) {
        console.error("Error parsing date in TimeInput:", error);
      }
    }
  }, [value]);

  const handleChange = (type, val) => {
    try {
      let newHours = parseInt(hours) || 1;
      let newMinutes = parseInt(minutes) || 0;
      let newPeriod = period;

      if (type === 'hours') {
        newHours = parseInt(val) || 1;
        if (newHours > 12) newHours = 12;
        if (newHours < 1) newHours = 1;
        setHours(newHours.toString().padStart(2, '0'));
      } else if (type === 'minutes') {
        newMinutes = parseInt(val) || 0;
        if (newMinutes > 59) newMinutes = 59;
        if (newMinutes < 0) newMinutes = 0;
        setMinutes(newMinutes.toString().padStart(2, '0'));
      } else if (type === 'period') {
        newPeriod = val;
        setPeriod(val);
      }

      // Convert to 24-hour format
      let hours24 = newHours;
      if (newPeriod === "PM" && hours24 !== 12) hours24 += 12;
      if (newPeriod === "AM" && hours24 === 12) hours24 = 0;

      // Create a new date with the current date (for timezone handling)
      const now = new Date();
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours24,
        newMinutes,
        0
      );
      
      // Ensure the date is valid before calling onChange
      if (!isNaN(date.getTime())) {
        onChange(date.toISOString());
      }
    } catch (error) {
      console.error("Error handling time change:", error);
    }
  };

  const containerClass = cn(
    "group relative flex items-center p-3 rounded-lg border transition-all duration-200 w-full max-w-[280px]",
    error && "border-red-500",
    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    className
  );

  const inputClass = cn(
    "w-[3.5rem] text-center bg-transparent border rounded-md transition-all duration-200 py-1.5 text-base",
    isDark 
      ? "text-gray-200 border-gray-700 focus:border-blue-500/50" 
      : "text-gray-900 border-gray-200 focus:border-blue-500",
    "focus:outline-none focus:ring-1",
    isDark ? "focus:ring-blue-500/20" : "focus:ring-blue-500/30"
  );

  const periodClass = cn(
    "px-2 py-0.5 rounded-md cursor-pointer transition-all duration-200 text-[11px] font-medium",
    isDark 
      ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" 
      : "text-gray-600 hover:bg-gray-100"
  );

  const activePeriodClass = cn(
    periodClass,
    isDark 
      ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/60" 
      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
  );

  return (
    <div className="space-y-2 w-full">
      <div className={containerClass}>
        {/* Clock icon */}
        <Clock className={cn(
          "w-4 h-4 mr-2 transition-colors",
          isDark ? "text-gray-400 group-focus-within:text-blue-400" : "text-gray-500 group-focus-within:text-blue-500"
        )} />
        
        {/* Time inputs with consistent spacing */}
        <div className="flex items-center justify-center flex-grow">
          {/* Hours input */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            max="12"
            value={hours}
            onChange={(e) => handleChange('hours', e.target.value)}
            className={inputClass}
          />
          
          {/* Colon separator */}
          <span className={`text-lg font-medium mx-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>:</span>
          
          {/* Minutes input */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => handleChange('minutes', e.target.value)}
            className={inputClass}
          />
        </div>
        
        {/* AM/PM buttons with consistent spacing */}
        <div className="flex items-center gap-1 ml-3">
          <button
            type="button"
            onClick={() => handleChange('period', 'AM')}
            className={period === 'AM' ? activePeriodClass : periodClass}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleChange('period', 'PM')}
            className={period === 'PM' ? activePeriodClass : periodClass}
          >
            PM
          </button>
        </div>
      </div>

      {showTimezone && timezone && (
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {timezone.replace(/_/g, " ").replace(/\//g, " / ")}
        </p>
      )}
    </div>
  );
}
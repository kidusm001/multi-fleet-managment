import { cn } from "@/lib/utils";

export default function EmployeeStatsCard({ 
  title, 
  value, 
  icon, 
  subtitle,
  isDark,
  color = "blue", // blue, green, amber, purple
  loading = false
}) {
  // Create color variants
  const getColorClass = () => {
    const colorClasses = {
      blue: {
        bg: isDark ? "bg-blue-900/30" : "bg-blue-100",
        text: isDark ? "text-blue-400" : "text-blue-600",
        dot: isDark ? "bg-blue-400" : "bg-blue-500"
      },
      green: {
        bg: isDark ? "bg-green-900/30" : "bg-green-100",
        text: isDark ? "text-green-400" : "text-green-600",
        dot: isDark ? "bg-green-400" : "bg-green-500"
      },
      amber: {
        bg: isDark ? "bg-amber-900/30" : "bg-amber-100",
        text: isDark ? "text-amber-400" : "text-amber-600",
        dot: isDark ? "bg-amber-400" : "bg-amber-500"
      },
      purple: {
        bg: isDark ? "bg-purple-900/30" : "bg-purple-100",
        text: isDark ? "text-purple-400" : "text-purple-600",
        dot: isDark ? "bg-purple-400" : "bg-purple-500"
      }
    };
    
    return colorClasses[color] || colorClasses.blue;
  };
  
  const colorClass = getColorClass();
  
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
      isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white/80 border-gray-100"
    )}>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-600")}>
            {title}
          </span>
          {icon && (
            <div className={cn("ml-auto", colorClass.text)}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-end gap-2">
          {loading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          ) : (
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {value != null ? value.toLocaleString() : '-'}
            </span>
          )}
          
          {subtitle && !loading && (
            <span className="text-xs text-[var(--text-secondary)] mb-1">
              {subtitle}
            </span>
          )}
          
          {!subtitle && !loading && (
            <div className={cn("h-3 w-3 rounded-full animate-pulse mb-1", colorClass.dot)}></div>
          )}
        </div>
      </div>
    </div>
  );
}

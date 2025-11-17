import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Overview Chart Component
 * 
 * Renders a responsive bar chart showing employee and driver trends over time.
 * Supports dynamic data updates and theme changes.
 * 
 * @param {Array} data - Chart data containing month, employee count and driver count
 */
export function Overview({ data = [] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Use provided data or empty array if none is available
  const chartData = data.length > 0 ? data : [];
  
  // Custom tooltip formatter to show both metrics clearly
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-md shadow-md ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
          <p className={`font-medium text-sm mb-1 ${isDark ? "text-gray-200" : "text-gray-800"}`}>{label}</p>
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.fill }} 
              />
              <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                {entry.name}: 
              </span>
              <span className="font-medium">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart 
        data={chartData}
        margin={{ top: 10, right: 25, left: 5, bottom: 5 }}
      >
        <XAxis 
          dataKey="name" 
          stroke={isDark ? "#888888" : "#64748b"}
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke={isDark ? "#888888" : "#64748b"}
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}`} 
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
        />
        <Legend
          wrapperStyle={{
            paddingTop: 15,
            fontSize: 12
          }}
        />
        <Bar 
          name="Employees"
          dataKey="employees" 
          fill={isDark ? "#60a5fa" : "#3b82f6"} 
          radius={[4, 4, 0, 0]} 
          barSize={24}
          animationDuration={1500}
        />
        <Bar 
          name="Drivers"
          dataKey="drivers" 
          fill={isDark ? "#34d399" : "#10b981"} 
          radius={[4, 4, 0, 0]} 
          barSize={24}
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
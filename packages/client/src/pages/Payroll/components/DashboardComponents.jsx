import { TrendingUp, AlertTriangle, Clock } from "lucide-react";
import PropTypes from "prop-types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/Common/UI/Card";

export const QuickMetricCard = ({ title, value, trend, icon, trendUp, theme }) => {
  const isDark = theme === 'dark';
  
  return (
    <Card className={`${
      isDark 
        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/80' 
        : 'bg-white hover:bg-gray-50'
    } transition-all duration-300 backdrop-blur-sm`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">{title}</p>
            <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{value}</p>
          </div>
          <div
            className={`p-3 rounded-full ${
              trendUp ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <TrendingUp
            className={`h-4 w-4 mr-1 ${
              trendUp ? "text-green-500" : "text-red-500"
            }`}
          />
          <span
            className={`text-sm ${trendUp ? "text-green-500" : "text-red-500"}`}
          >
            {trend} vs last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export function AlertsCard({ alerts }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  alert.type === "warning"
                    ? "text-yellow-500"
                    : alert.type === "info"
                    ? "text-blue-500"
                    : "text-green-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs text-gray-500">{alert.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineCard() {
  const timelineEvents = [
    { time: "09:00", event: "Daily fleet inspection completed" },
    { time: "10:30", event: "Maintenance schedule updated" },
    { time: "13:45", event: "Cost report generated" },
    { time: "15:00", event: "Fleet efficiency review" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Today&apos;s Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium">{event.time}</p>
                <p className="text-sm text-gray-600">{event.event}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

QuickMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  trend: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  trendUp: PropTypes.bool.isRequired,
};

AlertsCard.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ).isRequired,
};

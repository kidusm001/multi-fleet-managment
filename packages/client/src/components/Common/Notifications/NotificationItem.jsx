import { CheckCircle, AlertCircle, Info } from "lucide-react";

export default function NotificationItem({
  type = "info",
  title,
  message,
  time,
}) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "hover:bg-green-50 dark:hover:bg-green-900/10",
    error: "hover:bg-red-50 dark:hover:bg-red-900/10",
    info: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
  };

  return (
    <div className={`p-2 rounded-lg cursor-pointer ${bgColors[type]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </p>
          {message && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          )}
          {time && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {typeof time === "string" ? time : time.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

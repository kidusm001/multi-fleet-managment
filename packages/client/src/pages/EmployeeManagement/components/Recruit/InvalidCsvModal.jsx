import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/Common/UI/dialog";
import { Button } from "@components/Common/UI/Button";
import { useTheme } from "@contexts/ThemeContext";
import { AlertCircle, FileWarning, XCircle } from "lucide-react";
import PropTypes from "prop-types";

export function InvalidCsvModal({ onClose, description, title = "Invalid File Format", severity = "error" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getIcon = () => {
    switch (severity) {
      case "warning":
        return <FileWarning className="w-6 h-6 text-yellow-500" />;
      case "info":
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
      default:
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getSeverityStyles = () => {
    switch (severity) {
      case "warning":
        return isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-100";
      case "info":
        return isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100";
      default:
        return isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100";
    }
  };

  const formatDescription = (desc) => {
    if (!desc.includes('\n')) {
      return <span className="text-sm">{desc}</span>;
    }

    return (
      <div className="space-y-1">
        {desc.split('\n').map((line, index) => {
          if (line.startsWith('  - ')) {
            // Error details indented
            return (
              <span key={index} className="block ml-6 text-sm text-gray-600 dark:text-gray-300">
                • {line.substring(4)}
              </span>
            );
          } else if (line.startsWith('Row ')) {
            // Row headers
            const [rowPart, ...rest] = line.split(':');
            return (
              <span key={index} className="block mt-2 mb-1">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{rowPart}:</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{rest.join(':')}</span>
              </span>
            );
          } else if (line.endsWith(':')) {
            // Section headers
            return (
              <span key={index} className="block mt-4 mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                {line}
              </span>
            );
          } else if (line.trim() === '') {
            // Spacing
            return <span key={index} className="block h-2" />;
          } else if (line.includes('valid entries found')) {
            // Success message
            return (
              <span key={index} className="block mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {line}
              </span>
            );
          } else {
            // Regular text
            return (
              <span key={index} className="block text-sm">
                {line}
              </span>
            );
          }
        })}
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={`rounded-xl p-6 shadow-lg border ${getSeverityStyles()} animate-in fade-in-0 zoom-in-95 max-h-[80vh] overflow-y-auto`}
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <DialogTitle
              className={`text-xl font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className={`mt-2 ${isDark ? "text-white/80" : "text-gray-600"}`}>
              {formatDescription(description)}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              severity === "error"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : severity === "warning"
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

InvalidCsvModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  title: PropTypes.string,
  severity: PropTypes.oneOf(["error", "warning", "info"]),
};

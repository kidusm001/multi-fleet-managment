import { AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ValidationErrors({ 
  isDark, 
  errorMessage, 
  validationErrors 
}) {
  if (!errorMessage && validationErrors.length === 0) return null;

  return (
    <div className="mt-4">
      {errorMessage && (
        <div className={cn(
          "p-4 rounded-lg border flex items-start gap-3 mb-4",
          isDark 
            ? "bg-red-900/20 border-red-900/30 text-red-400" 
            : "bg-red-50 border-red-200 text-red-800"
        )}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className={cn(
          "p-4 rounded-lg border",
          isDark 
            ? "bg-amber-900/20 border-amber-900/30 text-amber-400" 
            : "bg-amber-50 border-amber-200 text-amber-800"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h4 className="font-medium">Validation Issues ({validationErrors.length})</h4>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
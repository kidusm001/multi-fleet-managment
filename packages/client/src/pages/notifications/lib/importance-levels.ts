import { ImportanceLevel } from "../types/notifications";

export const IMPORTANCE_LEVELS: Record<number, ImportanceLevel> = {
  5: {
    level: 5,
    label: "Urgent",
    description: "Critical actions required immediately",
    color: "text-red-600 dark:text-red-400",
    gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))",
    animation: "pulse",
  },
  4: {
    level: 4,
    label: "High",
    description: "Important actions needed soon",
    color: "text-orange-600 dark:text-orange-400",
    gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.04))",
  },
  3: {
    level: 3,
    label: "Medium",
    description: "Action required",
    color: "text-amber-600 dark:text-amber-400",
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.03))",
  },
  2: {
    level: 2,
    label: "Low",
    description: "For your information",
    color: "text-blue-600 dark:text-blue-400",
    gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))",
  },
  1: {
    level: 1,
    label: "Info",
    description: "General update",
    color: "text-gray-600 dark:text-gray-400",
    gradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.06), rgba(107, 114, 128, 0.02))",
  },
};

export const getImportanceLevel = (level: 1 | 2 | 3 | 4 | 5): ImportanceLevel => {
  return IMPORTANCE_LEVELS[level];
};

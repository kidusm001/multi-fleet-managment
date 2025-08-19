import { useTheme } from "@contexts/ThemeContext";
// import { cn } from "@/lib/utils";
import AnimatedBackground from "./ui/animated-tabs";
import { Button } from "./ui/button";

interface NotificationFiltersProps {
  total: number;
  read: number;
  unread: number;
  currentFilter: string;
  onFilterChange: (value: string) => void;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void; // Add this prop
  selectedCount: number;
}

export function NotificationFilters({
  total,
  read,
  unread,
  currentFilter,
  onFilterChange,
  onMarkRead,
  onMarkUnread,
  onSelectAll,
  onClearSelection, // Add this prop
  selectedCount,
}: NotificationFiltersProps) {
  const TABS = [
    { id: "all", label: `All (${total})` },
    { id: "read", label: `Read (${read})` },
    { id: "unread", label: `Unread (${unread})` },
  ];

  const isAllSelected = selectedCount === total && total > 0;
  const hasSelection = selectedCount > 0;

  // Use the theme from your context
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="p-2 border-b backdrop-blur-sm transition-all duration-300 ease-in-out"
      style={{
        backgroundImage: isDark
          ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95))"
          : "linear-gradient(to bottom, rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95))",
        borderColor: isDark
          ? "rgba(107, 114, 128, 0.8)"
          : "rgba(203, 213, 225, 0.8)",
        boxShadow: isDark
          ? "0 1px 3px -1px rgb(0 0 0 / 0.2)"
          : "0 1px 3px -1px rgb(0 0 0 / 0.05)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div
            className="relative grid w-full grid-cols-3 overflow-hidden rounded-xl p-1 transition-all duration-300 ease-in-out border"
            style={{
              background: isDark
                ? "linear-gradient(to right, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8))"
                : "linear-gradient(to right, rgba(248, 250, 252, 0.8), rgba(248, 250, 252, 0.8))",
              borderColor: isDark
                ? "rgba(107, 114, 128, 0.6)"
                : "rgba(203, 213, 225, 0.6)",
              boxShadow: isDark
                ? "inset 0 1px 0 0 rgb(255 255 255 / 0.05)"
                : "inset 0 1px 0 0 rgb(255 255 255 / 0.1)",
            }}
          >
            <AnimatedBackground
              defaultValue={currentFilter}
              onValueChange={(value) => onFilterChange(value || "all")}
              className="absolute inset-0 rounded-lg"
              style={{
                // Keeping the animated background constant;
                // adjust these values if you also want dark/light variations.
                background: "linear-gradient(to right, #3b82f6, #2563eb)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.3,
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  data-id={tab.id}
                  type="button"
                  style={{
                    color: tab.id === currentFilter ? "#ffffff" : "#475569",
                  }}
                  className="relative z-10 flex items-center justify-center w-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:text-white"
                >
                  {tab.label}
                </button>
              ))}
            </AnimatedBackground>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {!hasSelection && (
              <Button
                variant="default"
                size="sm"
                onClick={onSelectAll}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s ease",
                }}
                className="text-sm font-medium hover:opacity-90"
              >
                Select all ({total})
              </Button>
            )}
            {hasSelection && !isAllSelected && (
              <Button
                variant="default"
                size="sm"
                onClick={onSelectAll}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s ease",
                }}
                className="text-sm font-medium hover:opacity-90"
              >
                Select all ({total - selectedCount})
              </Button>
            )}
            {hasSelection && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearSelection} // Use the new clear selection handler
                style={{
                  background: "#ef4444",
                  color: "white",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s ease",
                }}
                className="text-sm font-medium hover:opacity-90"
              >
                Clear selection ({selectedCount})
              </Button>
            )}
          </div>
          <div
            className="h-4 w-[1px]"
            style={{
              backgroundColor: isDark
                ? "rgba(107, 114, 128, 0.6)"
                : "rgba(203, 213, 225, 0.6)",
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkRead}
            disabled={selectedCount === 0}
            style={{
              color:
                selectedCount > 0
                  ? isDark
                    ? "#f1f5f9"
                    : "#1e293b"
                  : isDark
                  ? "#94a3b8"
                  : "#cbd5e1",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
            }}
            className="text-sm font-medium transition-all duration-200"
          >
            Mark as read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkUnread}
            disabled={selectedCount === 0}
            style={{
              color:
                selectedCount > 0
                  ? isDark
                    ? "#ffffff"
                    : "#1e293b"
                  : isDark
                  ? "#94a3b8"
                  : "#cbd5e1",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
            }}
            className="text-sm font-medium transition-all duration-200"
          >
            Mark as unread
          </Button>
        </div>
      </div>
    </div>
  );
}

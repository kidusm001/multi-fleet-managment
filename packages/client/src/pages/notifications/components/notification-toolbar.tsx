import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

type SortOption = "time" | "importance";

interface NotificationToolbarProps {
  selectedCount: number;
  totalCount: number;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  allSelected: boolean;
  sortBy?: SortOption;
  onSortChange?: (value: SortOption) => void;
}

export function NotificationToolbar({
  selectedCount,
  onMarkRead,
  onMarkUnread,
  onSelectAll,
  onClearSelection,
  allSelected,
}: NotificationToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center space-x-4 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <Button
        variant={allSelected ? "destructive" : "default"}
        size="sm"
        onClick={allSelected ? onClearSelection : onSelectAll}
        className="min-w-[100px] transition-all duration-200"
      >
        {allSelected ? "Clear Selection" : "Select All"}
      </Button>
      <Separator orientation="vertical" className="toolbar-separator h-4" />
      <span className="toolbar-counter text-sm font-medium px-3 py-1 rounded-full">
        {selectedCount} selected
      </span>
      <Separator orientation="vertical" className="toolbar-separator h-4" />
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkRead}
        disabled={selectedCount === 0}
        className="transition-all duration-200"
      >
        Mark as Read
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkUnread}
        disabled={selectedCount === 0}
        className="transition-all duration-200"
      >
        Mark as Unread
      </Button>
    </div>
  );
}

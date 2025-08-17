import { motion } from "framer-motion";
import { cn } from "@lib/utils"; 
import { Button } from "@components/Common/UI/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/Common/UI/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { LayoutGrid, LayoutList, SlidersHorizontal, Table } from "lucide-react";
import PropTypes from "prop-types";
import { useTheme } from "@contexts/ThemeContext/index";

/**
 * Header component for the Route Management view
 * Provides controls for switching view modes and adjusting display settings
 */
const Header = ({
  viewMode,
  onViewModeChange,
  itemsPerPage,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
}) => {
  // Get theme state from context
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-foreground">Route Management</h1>
      </motion.div>
      <div className="flex items-center gap-3">
        {/* Mode Switcher */}
        <div className="bg-background/70 backdrop-blur-md p-1 rounded-xl border border-border/30 shadow-sm flex gap-1">
          {/* Grid button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-200",
              viewMode === "grid" 
                ? isDark
                  ? "bg-primary/25 text-primary ring-1 ring-primary/30 font-medium"
                  : "bg-blue-500/90 text-white font-medium" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
            aria-label="Switch to grid view"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm font-medium">Grid</span>
          </Button>

          {/* List button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-200",
              viewMode === "list" 
                ? isDark
                  ? "bg-primary/25 text-primary ring-1 ring-primary/30 font-medium"
                  : "bg-blue-500/90 text-white font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
            aria-label="Switch to list view"
          >
            <LayoutList className="h-4 w-4" />
            <span className="text-sm font-medium">List</span>
          </Button>

          {/* Table mode button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("table")}
            className={cn(
              "h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-200",
              viewMode === "table" 
                ? isDark
                  ? "bg-primary/25 text-primary ring-1 ring-primary/30 font-medium"
                  : "bg-blue-500/90 text-white font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
            aria-label="Switch to table view"
          >
            <Table className="h-4 w-4" />
            <span className="text-sm font-medium">Table</span>
          </Button>
        </div>

        {/* Only show view options if items per page selector should be visible */}
        {showItemsPerPageSelector && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-border/30 bg-background/80 shadow-sm backdrop-blur hover:bg-background/90 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium">View Options</span>
              </Button>
            </PopoverTrigger>
            {/* PopoverContent with isDark conditional styles */}
            <PopoverContent 
              style={{
                backgroundColor: isDark ? '#1e1e2d' : 'white',
                color: isDark ? '#e1e1e6' : '#18181b',
                borderColor: isDark ? '#2e2e3d' : '#e2e8f0'
              }}
              className="w-80 rounded-xl border p-0 overflow-hidden shadow-lg"
            >
              <div 
                style={{
                  borderBottomColor: isDark ? '#2e2e3d' : '#e2e8f0'
                }}
                className="p-4 border-b"
              >
                <h4 className="font-medium text-sm">
                  Display Settings
                </h4>
                <p 
                  style={{
                    color: isDark ? '#9ca3af' : '#64748b'
                  }}
                  className="text-xs mt-1"
                >
                  Adjust how items are displayed on the page
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <label
                    htmlFor="items-per-page"
                    className="text-sm flex justify-between"
                  >
                    <span>Items per page</span>
                    <span
                      style={{
                        color: isDark ? '#9ca3af' : '#64748b'
                      }}
                    >
                      {itemsPerPage} items
                    </span>
                  </label>
                  <Select
                    id="items-per-page"
                    value={itemsPerPage.toString()}
                    onValueChange={(value) =>
                      onItemsPerPageChange(parseInt(value, 10))
                    }
                  >
                    <SelectTrigger 
                      style={{
                        backgroundColor: isDark ? '#1e1e2d' : 'white',
                        color: isDark ? '#e1e1e6' : '#18181b',
                        borderColor: isDark ? '#2e2e3d' : '#e2e8f0'
                      }}
                      className="rounded-lg w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      style={{
                        backgroundColor: isDark ? '#1e1e2d' : 'white',
                        color: isDark ? '#e1e1e6' : '#18181b',
                        borderColor: isDark ? '#2e2e3d' : '#e2e8f0'
                      }}
                      className="rounded-xl min-w-[180px] border"
                    >
                      {/* Fix item text color in dark mode */}
                      <SelectItem 
                        style={{
                          color: isDark ? '#e1e1e6' : '#18181b',
                        }}
                        className={cn(
                          "rounded-md my-1",
                          isDark ? "data-[highlighted]:bg-slate-700 data-[highlighted]:text-white" : "data-[highlighted]:bg-slate-100"
                        )}
                        value="6"
                      >
                        6 items
                      </SelectItem>
                      <SelectItem 
                        style={{
                          color: isDark ? '#e1e1e6' : '#18181b',
                        }}
                        className={cn(
                          "rounded-md my-1",
                          isDark ? "data-[highlighted]:bg-slate-700 data-[highlighted]:text-white" : "data-[highlighted]:bg-slate-100"
                        )}
                        value="9"
                      >
                        9 items
                      </SelectItem>
                      <SelectItem 
                        style={{
                          color: isDark ? '#e1e1e6' : '#18181b',
                        }}
                        className={cn(
                          "rounded-md my-1",
                          isDark ? "data-[highlighted]:bg-slate-700 data-[highlighted]:text-white" : "data-[highlighted]:bg-slate-100"
                        )}
                        value="12"
                      >
                        12 items
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </>
  );
};

Header.propTypes = {
  viewMode: PropTypes.oneOf(["grid", "list", "table"]).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onItemsPerPageChange: PropTypes.func.isRequired,
  showItemsPerPageSelector: PropTypes.bool,
};

export default Header;

import { useState } from 'react';
import { Upload, Plus, FileSpreadsheet, Users, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/Common/UI/dropdown-menu";

const QUICK_ACTION_CARDS = [
  {
    title: "Upload Employees",
    description: "Upload multiple employees at once using Excel or CSV",
    icon: <Upload className="h-6 w-6" />,
    color: "blue"
  },
  {
    title: "Add Employee",
    description: "Add a single employee with detailed information",
    icon: <Plus className="h-6 w-6" />,
    color: "green"
  },
  {
    title: "Download Template",
    description: "Download Excel template for bulk uploading employees",
    icon: <FileSpreadsheet className="h-6 w-6" />,
    color: "amber",
    hasDropdown: true
  },
  {
    title: "Manage Employees",
    description: "View assigned/unassigned employees and manage details",
    icon: <Users className="h-6 w-6" />,
    color: "indigo"
  }
];

export default function QuickActionsTab({ 
  isDark, 
  onUploadClick, 
  onAddSingleClick, 
  onDownloadTemplate,
  onManageEmployeesClick
}) {
  const [_dropdownOpen, _setDropdownOpen] = useState(false);
  
  const getColorClasses = (color) => {
    const baseClasses = "relative p-6 rounded-lg border transition-all cursor-pointer";
    const lightClasses = {
      blue: "hover:border-blue-200 hover:bg-blue-50/50",
      green: "hover:border-green-200 hover:bg-green-50/50",
      amber: "hover:border-amber-200 hover:bg-amber-50/50",
      indigo: "hover:border-indigo-200 hover:bg-indigo-50/50"
    };
    const darkClasses = {
      blue: "hover:bg-blue-900/20 border-gray-700 hover:border-blue-800",
      green: "hover:bg-green-900/20 border-gray-700 hover:border-green-800",
      amber: "hover:bg-amber-900/20 border-gray-700 hover:border-amber-800",
      indigo: "hover:bg-indigo-900/20 border-gray-700 hover:border-indigo-800"
    };
    
    return cn(
      baseClasses,
      isDark ? darkClasses[color] : lightClasses[color]
    );
  };

  const getIconColorClasses = (color) => {
    return isDark 
      ? `text-${color}-400` 
      : `text-${color}-600`;
  };

  const handleAction = (title, hasDropdown) => {
    if (hasDropdown) {
      // Let dropdown handle it
      return;
    }
    
    switch (title) {
      case "Upload Employees":
        onUploadClick();
        break;
      case "Add Employee":
        onAddSingleClick();
        break;
      case "Manage Employees":
        onManageEmployeesClick();
        break;
      default:
        break;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {QUICK_ACTION_CARDS.map((card) => (
        <div key={card.title}>
          {card.hasDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={getColorClasses(card.color)}
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg",
                      isDark ? "bg-gray-800" : "bg-white"
                    )}>
                      <div className={getIconColorClasses(card.color)}>
                        {card.icon}
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <h3 className={cn(
                        "flex items-center gap-2 font-medium",
                        isDark ? "text-gray-200" : "text-gray-700"
                      )}>
                        {card.title}
                        <ChevronDown className="h-4 w-4" />
                      </h3>
                      <p className={cn(
                        "text-sm",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                <DropdownMenuItem 
                  onClick={() => onDownloadTemplate('xlsx')} 
                  className={isDark ? "hover:bg-gray-700 focus:bg-gray-700" : ""}
                >
                  Download Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDownloadTemplate('csv')} 
                  className={isDark ? "hover:bg-gray-700 focus:bg-gray-700" : ""}
                >
                  Download CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => handleAction(card.title)}
              className={getColorClasses(card.color)}
            >
              <div className="flex flex-col items-start gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  isDark ? "bg-gray-800" : "bg-white"
                )}>
                  <div className={getIconColorClasses(card.color)}>
                    {card.icon}
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <h3 className={cn(
                    "font-medium",
                    isDark ? "text-gray-200" : "text-gray-700"
                  )}>
                    {card.title}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {card.description}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
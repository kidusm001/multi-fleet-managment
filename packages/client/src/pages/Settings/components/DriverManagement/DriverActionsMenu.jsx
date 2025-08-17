import React, { useState } from 'react';
import { MoreVertical, Trash2, Edit2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/Common/UI/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Driver Actions Menu Component
 * Provides contextual actions for drivers
 */
export default function DriverActionsMenu({
  driver,
  isDark,
  onAction,
}) {
  const [open, setOpen] = useState(false);
  
  // Helper function to close dropdown and perform action
  const handleAction = (action) => {
    setOpen(false);
    // Use setTimeout to ensure dropdown closes before action is triggered
    setTimeout(() => onAction(action, driver), 100);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`h-8 w-8 rounded-md inline-flex items-center justify-center transition-colors ${
            isDark
              ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <span className="sr-only">Open driver menu</span>
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className={isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""}
      >
        <DropdownMenuItem
          onClick={() => handleAction('view')}
          className={cn(
            "cursor-pointer",
            isDark 
              ? "hover:bg-gray-700/70 focus:bg-gray-700/70" 
              : "hover:bg-amber-50 hover:text-amber-900 focus:bg-amber-50 focus:text-amber-900"
          )}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>View Details</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleAction('edit')}
          className={cn(
            "cursor-pointer",
            isDark 
              ? "hover:bg-gray-700/70 focus:bg-gray-700/70" 
              : "hover:bg-amber-50 hover:text-amber-900 focus:bg-amber-50 focus:text-amber-900"
          )}
        >
          <Edit2 className="mr-2 h-4 w-4" />
          <span>Edit Driver</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className={isDark ? "bg-gray-700" : ""} />
        
        <DropdownMenuItem
          onClick={() => handleAction('delete')}
          className={cn(
            'cursor-pointer',
            isDark 
              ? "hover:bg-gray-700/70 focus:bg-gray-700/70 text-red-400 hover:text-red-300" 
              : "hover:bg-red-50 text-red-600 hover:text-red-700"
          )}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Driver</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
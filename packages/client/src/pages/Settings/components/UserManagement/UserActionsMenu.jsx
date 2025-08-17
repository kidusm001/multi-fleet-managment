import { 
  Edit2, Trash2, Ban, CheckCircle, 
  RefreshCcw, Key, UserCog 
} from "lucide-react";
import Button from "@/components/Common/UI/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/Common/UI/dropdown-menu";
import { getUserStatus } from "./constants";

export default function UserActionsMenu({ user, session, isDark, onAction }) {
  const status = getUserStatus(user);
  const isCurrentUser = session?.user?.id === user.id;
  const isCurrentUserAdmin = isCurrentUser && user.role === 'admin';

  // Apply enhanced theme-specific styles with better hover states
  const menuItemStyles = isDark 
    ? "transition-all duration-200 hover:bg-gray-700/70 focus:bg-gray-700 rounded-md my-0.5 py-2" 
    : "transition-all duration-200 hover:bg-gray-100 focus:bg-gray-100 hover:text-gray-900 focus:text-gray-900 rounded-md my-0.5 py-2";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={`rounded-full h-8 w-8 ${isDark 
            ? "bg-gray-800 border-gray-700 hover:bg-gray-700/80 text-gray-300 hover:text-blue-300 hover:border-blue-500/30" 
            : "bg-gray-50 border-gray-200 hover:bg-blue-50/80 hover:text-blue-600 hover:border-blue-300/70"
          } transition-all duration-200 hover:scale-105 shadow-sm hover:shadow`}
        >
          <UserCog className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`w-56 p-2 ${isDark 
          ? "bg-gray-800 border-gray-700 text-gray-200 shadow-lg shadow-black/20" 
          : "bg-white border-gray-200 shadow-xl shadow-gray-200/40"
        } rounded-xl backdrop-blur-sm backdrop-saturate-150`}
      >
        <DropdownMenuLabel className={`${isDark ? "text-gray-300" : "text-gray-700"} font-medium px-3 py-2 text-sm`}>
          User Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={isDark ? "bg-gray-700 my-1" : "bg-gray-200 my-1"} />
        
        {/* Edit user - disabled if current user is admin */}
        {!isCurrentUserAdmin && (
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              onAction('edit');
            }}
            className={`${menuItemStyles} px-3 flex items-center`}
          >
            <div className={`p-1.5 rounded-md mr-2 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
              <Edit2 className={`w-3.5 h-3.5 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
            </div>
            <span>Edit User</span>
          </DropdownMenuItem>
        )}
        
        {/* Reset Password */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onAction('resetPassword');
          }}
          className={`${menuItemStyles} px-3 flex items-center ${isDark 
            ? "text-blue-400 hover:text-blue-300" 
            : "text-blue-600 hover:text-blue-700"}`}
        >
          <div className={`p-1.5 rounded-md mr-2 ${isDark ? "bg-blue-900/40" : "bg-blue-100"}`}>
            <RefreshCcw className="w-3.5 h-3.5" />
          </div>
          <span>Reset Password</span>
        </DropdownMenuItem>
        
        {/* Reset 2FA if enabled */}
        {user.isTwoFactorEnabled && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onAction('reset2fa');
            }}
            className={`${menuItemStyles} px-3 flex items-center ${isDark 
              ? "text-amber-400 hover:text-amber-300" 
              : "text-amber-600 hover:text-amber-700"}`}
          >
            <div className={`p-1.5 rounded-md mr-2 ${isDark ? "bg-amber-900/40" : "bg-amber-100"}`}>
              <Key className="w-3.5 h-3.5" />
            </div>
            <span>Reset 2FA</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className={isDark ? "bg-gray-700 my-1.5" : "bg-gray-200 my-1.5"} />
        
        {/* Ban/Unban option */}
        {status.type === "banned" ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onAction('unban');
            }}
            className={`${menuItemStyles} px-3 flex items-center ${isDark 
              ? "text-green-400 hover:text-green-300" 
              : "text-green-600 hover:text-green-700"}`}
          >
            <div className={`p-1.5 rounded-md mr-2 ${isDark ? "bg-green-900/40" : "bg-green-100"}`}>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <span>Unban User</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onAction('ban');
            }}
            className={`${menuItemStyles} px-3 flex items-center ${isDark 
              ? "text-red-400 hover:text-red-300" 
              : "text-red-600 hover:text-red-700"}`}
            disabled={isCurrentUser}
          >
            <div className={`p-1.5 rounded-md mr-2 ${isDark ? "bg-red-900/40" : "bg-red-100"}`}>
              <Ban className="w-3.5 h-3.5" />
            </div>
            <span>Ban User</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className={isDark ? "bg-gray-700 my-1.5" : "bg-gray-200 my-1.5"} />
        
        {/* Delete option */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onAction('delete');
          }}
          className={`${menuItemStyles} px-3 flex items-center ${isDark 
            ? "text-red-400 hover:text-red-300" 
            : "text-red-600 hover:text-red-700"}`}
          disabled={isCurrentUser}
        >
          <div className={`p-1.5 rounded-md mr-2 ${isDark ? "bg-red-900/40" : "bg-red-100"}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </div>
          <span>Delete User</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
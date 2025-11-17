import { cn } from "@/lib/utils";
import { UserCog, Activity, Search, Plus, Shield } from "lucide-react";
import { formatDate, getUserStatus } from "./constants";
import Button from "@/components/Common/UI/Button";
import { Badge } from "@/components/Common/UI/Badge";
import { Avatar } from "@/components/Common/UI/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import UserActionsMenu from "./UserActionsMenu";

export default function UsersTable({ 
  users, 
  loading, 
  error, 
  session,
  isDark,
  onViewDetails, 
  onAction 
}) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50/80 border-gray-100'
      }`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-[var(--primary)] animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-[var(--primary)] animate-pulse" />
            </div>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200/70'
    } shadow-sm hover:shadow-md`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className={`${isDark 
              ? 'bg-gray-800/70 border-b border-gray-700' 
              : 'bg-gradient-to-r from-gray-50/90 to-slate-50/80 border-b border-gray-200/80'
            }`}>
              <TableHead className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}`} style={{ width: '35%' }}>
                <div className="flex items-center gap-2">
                  <UserCog className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} /> 
                  <span>User</span>
                </div>
              </TableHead>
              <TableHead className={`py-4 ${isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}`} style={{ width: '20%' }}>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <span>Role & Status</span>
                </div>
              </TableHead>
              <TableHead className={`py-4 ${isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}`} style={{ width: '20%' }}>
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <span>Last Active</span>
                </div>
              </TableHead>
              <TableHead className={`py-4 ${isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}`} style={{ width: '15%' }}>Security</TableHead>
              <TableHead className={`text-right py-4 ${isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}`} style={{ width: '10%' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length > 0 ? (
              users.map((user) => {
                const status = getUserStatus(user);
                const isCurrentUser = session?.user?.id === user.id;
                
                return (
                  <TableRow 
                    key={user.id} 
                    className={cn(
                      "transition-all duration-200",
                      isDark && "hover:bg-gray-800/50 border-b border-gray-700/50",
                      !isDark && "hover:bg-gray-50/80 border-b border-gray-200/50",
                      status.type === "banned" && (isDark 
                        ? "bg-red-950/10 hover:bg-red-950/20" 
                        : "bg-red-50/40 hover:bg-red-50/60"),
                      isCurrentUser && (isDark 
                        ? "bg-blue-950/10 hover:bg-blue-950/20" 
                        : "bg-blue-50/30 hover:bg-blue-50/40"),
                      "hover:-translate-y-[1px]"
                    )}
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <Avatar className={`ring-2 ring-offset-2 ${
                          isDark 
                            ? `${user.role === 'admin' ? 'ring-red-500/30' : user.role === 'manager' ? 'ring-blue-500/30' : 'ring-green-500/30'} ring-offset-gray-900` 
                            : `${user.role === 'admin' ? 'ring-red-200' : user.role === 'manager' ? 'ring-blue-200' : 'ring-green-200'} ring-offset-white`
                        } transition-all duration-200`}>
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                            user.role === 'admin' 
                              ? 'from-rose-500 to-orange-500'
                              : user.role === 'manager'
                                ? 'from-sky-500 to-indigo-600' 
                                : 'from-emerald-500 to-teal-600'
                          } flex items-center justify-center text-white text-sm font-medium shadow-md`}>
                            {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium text-[var(--text-primary)] flex items-center">
                            {user.name}
                            {isCurrentUser && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                isDark 
                                  ? "bg-blue-900/30 text-blue-300" 
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-[var(--text-secondary)]">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "w-fit px-2.5 py-0.5 text-xs font-medium transition-colors",
                            user.role === "admin" && (isDark 
                              ? "border-red-400/40 text-red-400 bg-red-900/20 shadow-sm shadow-red-950/20" 
                              : "border-red-300 text-red-600 bg-red-50 shadow-sm"),
                            user.role === "manager" && (isDark 
                              ? "border-blue-400/40 text-blue-400 bg-blue-900/20 shadow-sm shadow-blue-950/20"
                              : "border-blue-300 text-blue-600 bg-blue-50 shadow-sm"),
                            
                          )}
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Badge 
                          variant={status.type === "banned" ? "destructive" : "secondary"}
                          className={cn(
                            "w-fit px-2 py-0.5 text-xs font-medium transition-colors",
                            status.type === "active" && (isDark 
                              ? "bg-green-900/30 text-green-400 border-green-400/30 shadow-sm shadow-green-950/20"
                              : "bg-green-100 text-green-700 border-green-200 shadow-sm"),
                            status.type === "banned" && (isDark 
                              ? "bg-red-900/30 text-red-400 border-red-400/30 shadow-sm shadow-red-950/20"
                              : "bg-red-100 text-red-700 border-red-200 shadow-sm")
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className={`py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium ${
                          Date.parse(user.lastActive) > Date.now() - 86400000 
                            ? isDark ? 'text-green-400' : 'text-green-600' 
                            : ''
                        }`}>
                          {formatDate(user.lastActive)}
                        </span>
                        {Date.parse(user.lastActive) > Date.now() - 86400000 && (
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            isDark ? 'bg-green-400 animate-pulse' : 'bg-green-500 animate-pulse'
                          }`}></span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {user.isTwoFactorEnabled ? (
                          <Badge className={`
                            text-xs font-medium px-2.5 py-0.5 transition-all duration-200 ${isDark 
                              ? "bg-green-900/50 text-green-300 border border-green-600/30 shadow-inner shadow-green-950/10" 
                              : "bg-green-100 text-green-700 border border-green-200 shadow-sm"
                            } hover:-translate-y-0.5 hover:shadow-md`}
                          >
                            2FA Enabled
                          </Badge>
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs font-medium px-2.5 py-0.5 transition-all duration-200 ${isDark 
                              ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600/50 shadow-inner shadow-black/10" 
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 border border-gray-200/80 shadow-sm"
                            } hover:-translate-y-0.5 hover:shadow-md`}
                          >
                            No 2FA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-4">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(user)}
                          className={`text-xs px-4 py-1.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[100px] border ${
                            isDark 
                              ? "text-blue-300 border-gray-700 bg-gray-800/50 hover:bg-gray-700/70 hover:text-blue-200 hover:border-blue-500/30" 
                              : "text-blue-600 border-gray-200/70 bg-gray-50/50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          } shadow-sm hover:shadow`}
                        >
                          View Details
                        </Button>
                        <UserActionsMenu 
                          user={user} 
                          session={session}
                          isDark={isDark}
                          onAction={(action) => onAction(action, user)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700/30 rounded-full animate-ping opacity-25"></div>
                      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/60">
                        <UserCog className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
                      </div>
                    </div>
                    <p className="text-lg font-medium">{error ? 'Failed to load users' : 'No users found'}</p>
                    <p className="text-sm max-w-md text-center">
                      {error 
                        ? 'Please try again or contact support if the issue persists' 
                        : 'Try adjusting your search or filters to find what you\'re looking for'
                      }
                    </p>
                    {!error && (
                      <div className="flex items-center gap-4 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`gap-2 px-4 py-1.5 text-xs shadow-sm hover:shadow ${isDark 
                            ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200" 
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
                          onClick={() => {
                            // handleSearch("");
                            // handleRoleFilter("all");
                          }}
                        >
                          <Search className="w-3.5 h-3.5" />
                          Clear Search
                        </Button>
                        <Button 
                          className="gap-2 px-4 py-1.5 text-xs shadow-sm hover:shadow-md bg-[var(--primary)] hover:bg-[var(--button-hover)] text-white hover:-translate-y-0.5 transition-all duration-200"
                          size="sm"
                          onClick={() => {/* handleAdd */}}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add User
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
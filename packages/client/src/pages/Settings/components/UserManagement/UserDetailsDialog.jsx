import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "./constants";
import { permissions } from "./constants";
import {
  UserCog,
  Clock,
  Activity,
  Key,
  Shield,
  Ban,
  CheckCircle,
  RefreshCcw,
} from "lucide-react";
import Button from "@/components/Common/UI/Button";
import { Badge } from "@/components/Common/UI/Badge";
import { Avatar } from "@/components/Common/UI/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/Common/UI/dialog";

// Stats Card Component 
const StatsCard = ({ icon, label, value, valueClass, isDark }) => (
  <div className={`flex flex-col p-4 rounded-xl border transition-all duration-200 ${
    isDark 
      ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/80" 
      : "bg-gray-50 hover:bg-gray-100/80 border-gray-200/80"
  } hover:shadow-md hover:-translate-y-0.5`}>
    <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--text-secondary)]">
      {icon}
      <span>{label}</span>
    </div>
    <div className={`text-sm font-semibold ${valueClass || "text-[var(--text-primary)]"}`}>
      {value}
    </div>
  </div>
);

export default function UserDetailsDialog({ user, isOpen, isDark, onClose, onAction }) {
  const [detailedUser, setDetailedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Load user details
  useEffect(() => {
    if (user && isOpen) {
      // In a real app, you might fetch more details here
      // For demo purposes, we'll just use the user as is
      setDetailedUser(user);
      setLoadingDetails(false);
    }
  }, [user, isOpen]);

  // Cleanup on close
  const handleClose = () => {
    setDetailedUser(null);
    setLoadingDetails(false);
    onClose();
  };

  // Handle action with proper cleanup
  const handleAction = (actionType) => {
    setDetailedUser(null);
    setLoadingDetails(false);
    onClose();
    onAction(actionType);
  };

  if (!detailedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 ${
        isDark 
          ? "bg-gray-900 border-gray-700 text-gray-100" 
          : "bg-white"
      }`}>
        {loadingDetails ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]" />
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                <UserCog className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-[var(--primary)]"}`} />
                <span className="bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent font-bold">
                  User Details
                </span>
              </DialogTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                View detailed information and manage user access
              </p>
            </DialogHeader>
            <div className="grid gap-6 mt-2">
              {/* User Profile Section */}
              <div className={`flex items-center gap-4 p-5 rounded-xl transition-all ${
                isDark 
                  ? "bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50" 
                  : "bg-gradient-to-br from-gray-50 to-slate-100/90 border border-gray-200"
              } hover:shadow-md`}>
                <Avatar className="h-16 w-16 border-2 border-white/10 shadow-xl">
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${
                    detailedUser.role === 'admin' 
                      ? 'from-rose-500 to-orange-500'
                      : detailedUser.role === 'manager'
                        ? 'from-sky-500 to-indigo-600' 
                        : 'from-emerald-500 to-teal-600'
                  } flex items-center justify-center text-white text-xl font-medium`}>
                    {detailedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{detailedUser.name}</h3>
                  <p className="text-[var(--text-secondary)]">{detailedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn(
                      "transition-colors",
                      detailedUser.role === "admin" && (isDark 
                        ? "border-red-400/70 text-red-400 bg-red-950/20" 
                        : "border-red-500/30 text-red-600 bg-red-50"),
                      detailedUser.role === "manager" && (isDark 
                        ? "border-blue-400/70 text-blue-400 bg-blue-950/20" 
                        : "border-blue-500/30 text-blue-600 bg-blue-50"),
                       false
                    )}>
                      {detailedUser.role}
                    </Badge>
                    {detailedUser.banned && (
                      <Badge variant="destructive" className={`animate-pulse ${isDark ? "bg-red-900/60 text-red-300" : ""}`}>
                        Banned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Last Active"
                  value={formatDate(detailedUser.lastActive)}
                  isDark={isDark}
                />
                <StatsCard
                  icon={<Activity className="w-4 h-4" />}
                  label="Login Attempts"
                  value={detailedUser.loginAttempts || 0}
                  isDark={isDark}
                />
                <StatsCard
                  icon={<Key className="w-4 h-4" />}
                  label="Password Changed"
                  value={formatDate(detailedUser.lastPasswordChange)}
                  isDark={isDark}
                />
                <StatsCard
                  icon={<Shield className="w-4 h-4" />}
                  label="2FA Status"
                  value={detailedUser.isTwoFactorEnabled ? "Enabled" : "Disabled"}
                  valueClass={detailedUser.isTwoFactorEnabled 
                    ? isDark ? "text-green-400" : "text-green-600" 
                    : isDark ? "text-yellow-400" : "text-yellow-600"}
                  isDark={isDark}
                />
              </div>

              {/* Permissions Section */}
              <div className={`p-4 rounded-xl ${
                isDark ? "bg-gray-800/40 border border-gray-700/50" : "bg-gray-50/80 border border-gray-200/50"
              }`}>
                <h4 className="font-medium mb-3 text-[var(--text-primary)] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Permissions</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detailedUser.role && permissions[detailedUser.role.toLowerCase()]?.map((permission) => (
                    <Badge 
                      key={permission} 
                      variant="secondary" 
                      className={`transition-all duration-200 ${
                        isDark 
                          ? "bg-gray-700/70 hover:bg-gray-600/90 text-gray-300" 
                          : "bg-[var(--accent-background)] text-gray-700 hover:bg-gray-200/80"
                      } hover:-translate-y-0.5 hover:shadow-sm`}
                    >
                      {permission.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions Section */}
              <div className={`flex flex-wrap gap-3 p-4 rounded-xl ${
                isDark ? "bg-gray-800/40 border border-gray-700/50" : "bg-gray-50/80 border border-gray-200/50"
              }`}>
                {!detailedUser?.banned ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction("ban")}
                    className={`gap-2 transition-all duration-200 hover:-translate-y-0.5 ${
                      isDark 
                        ? "bg-red-900/80 hover:bg-red-800 text-red-100 shadow-md shadow-red-900/20" 
                        : "shadow-md shadow-red-500/10 hover:shadow-red-500/20"
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    Ban User
                  </Button>
                ) : (
                  <Button
                    variant={isDark ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAction("unban")}
                    className={`gap-2 transition-all duration-200 hover:-translate-y-0.5 ${
                      isDark 
                        ? "bg-green-900/70 text-green-100 hover:bg-green-800 shadow-md shadow-green-900/20" 
                        : "text-green-700 border-green-200 hover:bg-green-50 shadow-md shadow-green-500/10"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Unban User
                  </Button>
                )}
                <Button
                  variant={isDark ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAction("resetPassword")}
                  className={`gap-2 transition-all duration-200 hover:-translate-y-0.5 ${
                    isDark 
                      ? "bg-blue-900/40 text-blue-100 hover:bg-blue-900/60 shadow-md shadow-blue-900/20" 
                      : "text-blue-700 border-blue-200 hover:bg-blue-50 shadow-md shadow-blue-500/10"
                  }`}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Reset Password
                </Button>
                {detailedUser.isTwoFactorEnabled && (
                  <Button
                    variant={isDark ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAction("reset2fa")}
                    className={`gap-2 transition-all duration-200 hover:-translate-y-0.5 ${
                      isDark 
                        ? "bg-amber-900/40 text-amber-100 hover:bg-amber-900/60 shadow-md shadow-amber-900/20" 
                        : "text-amber-700 border-amber-200 hover:bg-amber-50 shadow-md shadow-amber-500/10"
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    Reset 2FA
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
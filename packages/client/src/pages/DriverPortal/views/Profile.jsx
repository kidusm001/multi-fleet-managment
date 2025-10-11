import React from 'react';
import { LogOut, User, Mail } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { authClient } from '@lib/auth-client';

function ProfileView() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Clear any local state
            window.location.href = '/auth/login';
          },
          onError: (ctx) => {
            console.error('Logout error:', ctx.error);
            // Still redirect even if error
            window.location.href = '/auth/login';
          }
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: force redirect anyway
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className="py-4 space-y-4">
      {/* Profile Card */}
      <div className={cn(
        "rounded-xl border p-6",
        isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center",
            isDark ? "bg-gray-700" : "bg-gray-200"
          )}>
            <User className={cn(
              "w-10 h-10",
              isDark ? "text-gray-400" : "text-gray-600"
            )} />
          </div>
          
          <div className="text-center">
            <h2 className={cn(
              "text-xl font-bold mb-1",
              isDark ? "text-gray-100" : "text-gray-900"
            )}>
              {session?.user?.name || 'Driver'}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <Mail className={cn(
                "w-4 h-4",
                isDark ? "text-gray-400" : "text-gray-600"
              )} />
              <p className={cn(
                "text-sm",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Placeholder */}
      <div className={cn(
        "rounded-xl border p-6 text-center",
        isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      )}>
        <p className={cn(
          "text-sm",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          Performance stats coming soon...
        </p>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={cn(
          "w-full py-3 px-4 rounded-lg font-semibold",
          "flex items-center justify-center gap-2",
          "transition-colors",
          "bg-red-500 hover:bg-red-600 text-white"
        )}
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}

export default ProfileView;

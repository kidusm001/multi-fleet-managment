import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useRole } from '@contexts/RoleContext';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { authClient } from '@lib/auth-client';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Shield, 
  Edit2, 
  Save, 
  X, 
  LogOut,
  Camera,
  Calendar,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Common/UI/Card';
import { Button } from '@/components/Common/UI/Button';
import { Badge } from '@/components/Common/UI/Badge';
import { ROLES } from '@data/constants';

export default function Profile() {
  const { session } = useAuth();
  const { role } = useRole();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
      });
    }
  }, [session]);

  const canEdit = () => {
    // Superadmin and Owner can edit everything
    if (role === ROLES.SUPERADMIN || role === ROLES.OWNER) return true;
    // Admin can edit their own info
    if (role === ROLES.ADMIN) return true;
    // Manager can edit their own basic info
    if (role === ROLES.MANAGER) return true;
    // Driver and Employee can only view
    return false;
  };

  const canEditEmail = () => {
    // Only superadmin and owner can change email
    return role === ROLES.SUPERADMIN || role === ROLES.OWNER;
  };

  const handleSave = async () => {
    try {
      // TODO: Implement profile update API call
      console.log('Updating profile:', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: session?.user?.phone || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/auth/login';
          },
          onError: (ctx) => {
            console.error('Logout error:', ctx.error);
            window.location.href = '/auth/login';
          }
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/auth/login';
    }
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case ROLES.SUPERADMIN: return 'bg-purple-500/20 text-purple-600 dark:text-purple-400';
      case ROLES.OWNER: return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
      case ROLES.ADMIN: return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400';
      case ROLES.MANAGER: return 'bg-teal-500/20 text-teal-600 dark:text-teal-400';
      case ROLES.DRIVER: return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
      case ROLES.EMPLOYEE: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case ROLES.SUPERADMIN: return 'Super Admin';
      case ROLES.OWNER: return 'Owner';
      case ROLES.ADMIN: return 'Administrator';
      case ROLES.MANAGER: return 'Fleet Manager';
      case ROLES.DRIVER: return 'Driver';
      case ROLES.EMPLOYEE: return 'Employee';
      default: return 'User';
    }
  };

  return (
    <div className={cn(
      "min-h-screen p-4 md:p-6 lg:p-8",
      isDark ? "bg-[#0c1222]" : "bg-gray-50"
    )}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            Profile
          </h1>
          {canEdit() && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <Card className={cn(
          "relative overflow-hidden",
          isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
        )}>
          {/* Background Gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20" />
          
          <CardContent className="pt-20 pb-6">
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className={cn(
                  "w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4",
                  isDark 
                    ? "bg-gray-700 border-gray-600" 
                    : "bg-gray-200 border-white"
                )}>
                  <User className={cn(
                    "w-12 h-12 md:w-16 md:h-16",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )} />
                </div>
                {isEditing && (
                  <button className={cn(
                    "absolute bottom-0 right-0 p-2 rounded-full transition-colors",
                    isDark 
                      ? "bg-gray-600 hover:bg-gray-500 text-gray-200" 
                      : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                  )}>
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-4 w-full">
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "text-2xl md:text-3xl font-bold px-3 py-1 rounded border-2 border-blue-500 outline-none w-full md:w-auto",
                        isDark 
                          ? "bg-gray-700 text-gray-100" 
                          : "bg-white text-gray-900"
                      )}
                    />
                  ) : (
                    <h2 className={cn(
                      "text-2xl md:text-3xl font-bold",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      {session?.user?.name || 'User'}
                    </h2>
                  )}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                    <Badge className={cn(
                      "gap-1.5 px-3 py-1",
                      getRoleBadgeColor()
                    )}>
                      <Shield className="w-3.5 h-3.5" />
                      {getRoleLabel()}
                    </Badge>
                    {session?.user?.organizationName && (
                      <Badge variant="outline" className="gap-1.5 px-3 py-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {session.user.organizationName}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg",
                    isDark ? "bg-gray-700/50" : "bg-gray-50"
                  )}>
                    <Mail className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )} />
                    {isEditing && canEditEmail() ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={cn(
                          "flex-1 bg-transparent outline-none",
                          isDark ? "text-gray-200" : "text-gray-800"
                        )}
                      />
                    ) : (
                      <span className={cn(
                        "text-sm",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}>
                        {session?.user?.email}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg",
                    isDark ? "bg-gray-700/50" : "bg-gray-50"
                  )}>
                    <Phone className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )} />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Add phone number"
                        className={cn(
                          "flex-1 bg-transparent outline-none",
                          isDark ? "text-gray-200 placeholder-gray-500" : "text-gray-800 placeholder-gray-400"
                        )}
                      />
                    ) : (
                      <span className={cn(
                        "text-sm",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}>
                        {session?.user?.phone || 'Not set'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Info */}
          <Card className={cn(
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  Member Since
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className={cn(
                    "text-sm font-medium",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}>
                    {session?.user?.createdAt 
                      ? new Date(session.user.createdAt).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  Last Updated
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={cn(
                    "text-sm font-medium",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}>
                    {session?.user?.updatedAt 
                      ? new Date(session.user.updatedAt).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card className={cn(
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Access & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn(
                "text-sm mb-3",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                Your role grants you access to:
              </p>
              <div className="space-y-2">
                {role === ROLES.SUPERADMIN && (
                  <Badge variant="outline" className="w-full justify-start">Full System Access</Badge>
                )}
                {(role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.SUPERADMIN) && (
                  <>
                    <Badge variant="outline" className="w-full justify-start">User Management</Badge>
                    <Badge variant="outline" className="w-full justify-start">Route Management</Badge>
                    <Badge variant="outline" className="w-full justify-start">Vehicle Management</Badge>
                    <Badge variant="outline" className="w-full justify-start">Organization Settings</Badge>
                  </>
                )}
                {role === ROLES.MANAGER && (
                  <>
                    <Badge variant="outline" className="w-full justify-start">Route Management</Badge>
                    <Badge variant="outline" className="w-full justify-start">Employee Management</Badge>
                    <Badge variant="outline" className="w-full justify-start">Vehicle Viewing</Badge>
                  </>
                )}
                {role === ROLES.DRIVER && (
                  <Badge variant="outline" className="w-full justify-start">Driver Portal Access</Badge>
                )}
                {role === ROLES.EMPLOYEE && (
                  <Badge variant="outline" className="w-full justify-start">Dashboard Access</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card className={cn(
          isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
        )}>
          <CardContent className="pt-6">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
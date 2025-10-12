import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "@/contexts/ThemeContext";
import { adminService } from "../../services/adminService";
import { Plus, Search, Filter, Users, X, RefreshCw } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { useOrganizations } from "@/contexts/OrganizationContext";
import { useRole } from "@/contexts/RoleContext";
import { ROLES } from "@data/constants";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";

// Import our sub-components
import UsersTable from "./UsersTable";
import UserDetailsDialog from "./UserDetailsDialog";
import UserActionDialog from "./UserActionDialog";
import UserFormDialog from "./UserFormDialog";
import UserDeleteDialog from "./UserDeleteDialog";

// Import constants
// roles import is unused here; removing to satisfy no-unused-vars

export default function UserManagement() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { role: effectiveRole } = useRole();
  const { members, loadMembers } = useOrganizations();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [organizations, setOrganizations] = useState([]);
  const [_availableRoles, setAvailableRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  // Selected items
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "manager",
    isActive: true,
    password: ""
  });

  // Close all dialogs helper - updated with cleanup
  const closeAllDialogs = () => {
    setShowAddModal(false);
    setShowActionDialog(false);
    setShowDeleteDialog(false);
    setShowUserDetails(false);
    // Reset states
    setSelectedUser(null);
    setSelectedAction(null);
    setEditMode(false);
    setFormData({
      name: "",
      email: "",
      role: "manager",
      isActive: true,
      password: ""
    });
  };

  // Load users when component mounts
  useEffect(() => {
    if (session?.user) {
      loadUsers();
    }
  }, [session, /* eslint-disable-line react-hooks/exhaustive-deps */]);

  // Load organizations for superadmin
  useEffect(() => {
    if (effectiveRole === ROLES.SUPERADMIN) {
      loadOrganizations();
    }
  }, [effectiveRole]);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }
    if (effectiveRole && effectiveRole !== ROLES.SUPERADMIN) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, effectiveRole]);

  // Load organizations (superadmin only)
  const loadOrganizations = async () => {
    try {
      const response = await axios.get('/api/organization/admin/organizations');
      setOrganizations(response.data?.data || []);
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  // Load users with optional query
  const loadUsers = useCallback(async (query = {}) => {
    try {
      setLoading(true);
      setError(null);
      const usersList = await adminService.listUsers({
        query: {
          searchField: query.searchField || undefined,
          searchOperator: query.searchOperator || "contains",
          searchValue: query.searchValue || searchQuery,
          limit: 100,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
          filterField: roleFilter !== "all" ? "role" : undefined,
          filterOperator: "eq",
          filterValue: roleFilter !== "all" ? roleFilter : undefined
        }
      });
    setUsers(usersList);
      
      // Extract unique roles from users
      const roles = [...new Set(usersList.map(user => user.role))];
      setAvailableRoles(roles);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users. Please try again.");
      setLoading(false);
    }
  }, [roleFilter, searchQuery]);

  // Add new user
  const handleAdd = () => {
    setEditMode(false);
    setFormData({
      name: "",
      email: "",
      role: "manager",
      isActive: true,
      password: ""
    });
    setShowAddModal(true);
  };

  // Removed unused handleEdit and handleDelete to satisfy lint

  // Confirm delete with cleanup
  const confirmDelete = async () => {
    try {
      await adminService.removeUser({
        userId: selectedUser.id
      });
      setUsers(users.filter(u => u.id !== selectedUser.id));
      closeAllDialogs();
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user. Please try again.");
      return false;
    }
  };

  // Submit form (add or edit) with cleanup
  const handleSubmit = async (formData, editMode) => {
    try {
      if (editMode) {
        const success = await handleEditSubmit(formData);
        if (success) {
          closeAllDialogs();
          await refreshPage();
        }
        return success;
      } else {
        const success = await handleCreateSubmit(formData);
        if (success) {
          closeAllDialogs();
          await loadUsers();
        }
        return success;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to save user. Please try again.");
      return false;
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (formData) => {
    if (session?.user?.id === formData.id && formData.role !== 'admin') {
      setError("You cannot change your own admin role.");
      return false;
    }

    try {
      await adminService.setRole({
        userId: formData.id,
        role: formData.role
      });

      const currentUser = users.find(u => u.id === formData.id);
      if (!formData.isActive !== currentUser?.banned) {
        if (!formData.isActive) {
          await adminService.banUser({
            userId: formData.id,
            banReason: "Disabled by admin"
          });
        } else {
          await adminService.unbanUser({
            userId: formData.id
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user. Please try again.");
      return false;
    }
  };

  // Handle create submit
  const handleCreateSubmit = async (formData) => {
    try {
      await adminService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user. Please try again.");
      return false;
    }
  };

  // User actions (ban, reset password, etc.)
  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setSelectedAction(action);
    setShowActionDialog(true);
  };

  // Refresh page
  const refreshPage = async () => {
    setLoading(true);
    await loadUsers();
    setLoading(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setOrgFilter("all");
    setCurrentPage(1);
    loadUsers({ searchValue: "", filterField: undefined });
  };

  // Confirm action with cleanup
  const confirmAction = async () => {
    try {
      switch (selectedAction) {
        case 'ban':
          await adminService.banUser({
            userId: selectedUser.id,
            banReason: "Banned by administrator"
          });
          break;
        case 'unban':
          await adminService.unbanUser({
            userId: selectedUser.id
          });
          break;
        case 'revoke-sessions':
          await adminService.revokeUserSessions({
            userId: selectedUser.id
          });
          break;
        case 'reset2fa':
          // Implement this when API is available
          break;
        case 'resetPassword':
          // Implement this when API is available
          break;
      }
      closeAllDialogs(); // Use the enhanced closeAllDialogs
      await refreshPage();
      return true;
    } catch (error) {
      console.error("Error performing action:", error);
      setError(`Failed to ${selectedAction}. Please try again.`);
      return false;
    }
  };

  // Handle dropdown actions with cleanup
  const handleDropdownAction = (action, user) => {
    closeAllDialogs(); // First clean up all states

    switch (action) {
      case 'edit':
        setEditMode(true);
        setFormData({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: !user.banned
        });
        setShowAddModal(true);
        break;
      case 'delete':
        setSelectedUser(user);
        setShowDeleteDialog(true);
        break;
      case 'ban':
      case 'unban':
      case 'reset2fa':
      case 'resetPassword':
        setSelectedUser(user);
        setSelectedAction(action);
        setShowActionDialog(true);
        break;
      default:
        break;
    }
  };

  // Filter functionality - client-side filtering
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Role filtering functionality
  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  // Organization filtering functionality (superadmin only)
  const handleOrgFilter = (orgId) => {
    setOrgFilter(orgId);
    setCurrentPage(1);
  };

  const accessibleUserIds = useMemo(() => {
    if (!effectiveRole || effectiveRole === ROLES.SUPERADMIN) {
      return null;
    }
    const ids = new Set();
    members?.forEach((member) => {
      if (member?.userId) {
        ids.add(member.userId);
      }
      if (member?.user?.id) {
        ids.add(member.user.id);
      }
    });
    if (session?.user?.id) {
      ids.add(session.user.id);
    }
    return ids;
  }, [effectiveRole, members, session?.user?.id]);

  const accessibleUsers = useMemo(() => {
    if (!accessibleUserIds) {
      return users;
    }
    return users.filter((user) => accessibleUserIds.has(user.id));
  }, [users, accessibleUserIds]);

  const filteredUsers = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();
    return accessibleUsers.filter((user) => {
      const matchesSearch = !lowerQuery ||
        user.name?.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Organization filter (superadmin only)
      let matchesOrg = true;
      if (effectiveRole === ROLES.SUPERADMIN && orgFilter !== "all") {
        const org = organizations.find(o => o.id === orgFilter);
        if (org) {
          const userIds = org.members?.map(m => m.userId || m.user?.id).filter(Boolean) || [];
          matchesOrg = userIds.includes(user.id);
        } else {
          matchesOrg = false;
        }
      }

      return matchesSearch && matchesRole && matchesOrg;
    });
  }, [accessibleUsers, searchQuery, roleFilter, orgFilter, effectiveRole, organizations]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  }, [filteredUsers.length, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const handleRowsPerPageChange = (value) => {
    const next = Number(value);
    setRowsPerPage(next);
    setCurrentPage(1);
  };

  const paginationVisibleCount = filteredUsers.length;
  const paginationStart = paginationVisibleCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const paginationEnd = paginationVisibleCount === 0 ? 0 : Math.min(currentPage * rowsPerPage, paginationVisibleCount);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button 
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`flex flex-col p-4 rounded-xl border ${
          isDark 
            ? "bg-gray-800/50 border-gray-700/50" 
            : "bg-white/80 border-gray-100"
        } transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
          <span className="text-[var(--text-secondary)] text-sm font-medium">Total Users</span>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{accessibleUsers.length}</span>
            <Users className="w-4 h-4 text-[var(--primary)] mb-1" />
          </div>
        </div>
        
        <div className={`flex flex-col p-4 rounded-xl border ${
          isDark 
            ? "bg-gray-800/50 border-gray-700/50" 
            : "bg-white/80 border-gray-100"
        } transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
          <span className="text-[var(--text-secondary)] text-sm font-medium">Admin Users</span>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {accessibleUsers.filter(u => u.role === 'admin').length}
            </span>
            <div className="h-4 w-4 rounded-full bg-rose-500 mb-1 animate-pulse"></div>
          </div>
        </div>
        
        <div className={`flex flex-col p-4 rounded-xl border ${
          isDark 
            ? "bg-gray-800/50 border-gray-700/50" 
            : "bg-white/80 border-gray-100"
        } transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
          <span className="text-[var(--text-secondary)] text-sm font-medium">Active Users</span>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {accessibleUsers.filter(u => !u.banned).length}
            </span>
            <div className="h-4 w-4 rounded-full bg-green-500 mb-1 animate-pulse"></div>
          </div>
        </div>
        
        <div className={`flex flex-col p-4 rounded-xl border ${
          isDark 
            ? "bg-gray-800/50 border-gray-700/50" 
            : "bg-white/80 border-gray-100"
        } transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
          <span className="text-[var(--text-secondary)] text-sm font-medium">Banned Users</span>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {accessibleUsers.filter(u => u.banned).length}
            </span>
            <div className="h-4 w-4 rounded-full bg-red-500 mb-1 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Show error state with improved styling */}
      {error && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isDark ? "bg-red-950/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"
        } animate-in fade-in-50 duration-300`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <X className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className={`p-1.5 rounded-md ${isDark ? "hover:bg-red-900/50" : "hover:bg-red-100"}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div className={`p-4 rounded-xl border ${
        isDark 
          ? "bg-gray-800/30 border-gray-700/50" 
          : "bg-white border-gray-200/70"
      } transition-all duration-300 hover:shadow-md shadow-sm`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={`pl-10 bg-[var(--input-background)] border-[var(--input-border)] transition-all duration-200 ${
                isDark ? "text-gray-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" : "text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              } ${searchQuery ? "pr-10" : ""}`}
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearch("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                  isDark ? "hover:bg-gray-700/80" : "hover:bg-gray-100"
                } transition-all duration-200`}
              >
                <X className="w-3 h-3 text-[var(--text-secondary)]" />
              </button>
            )}
          </div>
          <Select
            value={roleFilter}
            onValueChange={handleRoleFilter}
          >
            <SelectTrigger className={`w-[180px] rounded-md transition-all duration-200 bg-[var(--input-background)] border-[var(--input-border)] ${
              isDark 
                ? "text-gray-200 hover:bg-gray-700/50 hover:border-gray-600" 
                : "text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            } ${roleFilter !== "all" ? "border-blue-500/50 dark:border-blue-500/30 shadow-sm" : ""}`}>
              <div className="flex items-center">
                <Filter className="w-3.5 h-3.5 mr-2 text-[var(--text-secondary)]" />
                <SelectValue placeholder="Filter by role" />
              </div>
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
              <SelectItem value="all" className={isDark ? "text-gray-200 focus:bg-gray-700" : ""}>
                All Roles
              </SelectItem>
              <SelectItem value="admin" className={isDark ? "text-gray-200 focus:bg-gray-700" : ""}>
                Admin
              </SelectItem>
              <SelectItem value="manager" className={isDark ? "text-gray-200 focus:bg-gray-700" : ""}>
                Manager
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Organization Filter (Superadmin only) */}
          {effectiveRole === ROLES.SUPERADMIN && (
            <Select
              value={orgFilter}
              onValueChange={handleOrgFilter}
            >
              <SelectTrigger className={`w-[200px] rounded-md transition-all duration-200 bg-[var(--input-background)] border-[var(--input-border)] ${
                isDark 
                  ? "text-gray-200 hover:bg-gray-700/50 hover:border-gray-600" 
                  : "text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              } ${orgFilter !== "all" ? "border-blue-500/50 dark:border-blue-500/30 shadow-sm" : ""}`}>
                <div className="flex items-center">
                  <Filter className="w-3.5 h-3.5 mr-2 text-[var(--text-secondary)]" />
                  <SelectValue placeholder="Filter by organization" />
                </div>
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                <SelectItem value="all" className={isDark ? "text-gray-200 focus:bg-gray-700" : ""}>
                  All Organizations
                </SelectItem>
                {organizations.map((org) => (
                  <SelectItem 
                    key={org.id} 
                    value={org.id} 
                    className={isDark ? "text-gray-200 focus:bg-gray-700" : ""}
                  >
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Refresh and Reset Filter Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={resetFilters}
              disabled={!searchQuery && roleFilter === "all" && orgFilter === "all"}
              title="Reset filters"
              className={`transition-all duration-200 ${
                isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : ""
              } ${(!searchQuery && roleFilter === "all" && orgFilter === "all") ? "opacity-50" : "hover:-translate-y-0.5"}`}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={refreshPage}
              title="Refresh"
              className={`transition-all duration-200 ${
                isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : ""
              } hover:-translate-y-0.5 hover:shadow-sm`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(searchQuery || roleFilter !== "all" || orgFilter !== "all") && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Active filters:</span>
            {searchQuery && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                isDark 
                  ? "bg-gray-700/70 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200/80"
              } transition-all cursor-pointer`} onClick={() => handleSearch("")}>
                Search: {searchQuery}
                <X className="w-3 h-3" />
              </span>
            )}
            {roleFilter !== "all" && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                isDark 
                  ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/30"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              } transition-all cursor-pointer`} onClick={() => handleRoleFilter("all")}>
                Role: {roleFilter}
                <X className="w-3 h-3" />
              </span>
            )}
            {orgFilter !== "all" && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                isDark 
                  ? "bg-purple-900/20 text-purple-400 hover:bg-purple-900/30"
                  : "bg-purple-50 text-purple-600 hover:bg-purple-100"
              } transition-all cursor-pointer`} onClick={() => handleOrgFilter("all")}>
                Org: {organizations.find(o => o.id === orgFilter)?.name || orgFilter}
                <X className="w-3 h-3" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Users Table */}
      <UsersTable
        users={paginatedUsers}
        loading={loading}
        error={error}
        session={session}
        isDark={isDark}
        onViewDetails={(user) => {
          closeAllDialogs();
          setSelectedUser(user);
          setShowUserDetails(true);
        }}
        onAction={handleDropdownAction}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-[var(--text-secondary)]">
          Showing {paginationStart} – {paginationEnd} of {paginationVisibleCount} users
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>Rows per page</span>
            <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <span className="text-sm text-[var(--text-secondary)]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>
      
      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        isOpen={showUserDetails}
        isDark={isDark}
        onClose={() => {
          closeAllDialogs();
        }}
        onAction={(action) => {
          setShowUserDetails(false);
          handleUserAction(selectedUser, action);
        }}
      />

      {/* User Action Dialog */}
      <UserActionDialog
        isOpen={showActionDialog}
        isDark={isDark}
        user={selectedUser}
        action={selectedAction}
        onConfirm={confirmAction}
        onCancel={() => closeAllDialogs()}
      />

      {/* User Form Dialog */}
      <UserFormDialog
        isOpen={showAddModal}
        isDark={isDark}
        editMode={editMode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={() => handleSubmit(formData, editMode)}
        onCancel={() => closeAllDialogs()}
      />

      {/* User Delete Dialog */}
      <UserDeleteDialog
        isOpen={showDeleteDialog}
        isDark={isDark}
        user={selectedUser}
        onConfirm={confirmDelete}
        onCancel={() => closeAllDialogs()}
      />
    </div>
  );
}
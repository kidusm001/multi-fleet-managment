import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Common/UI/Card";
import { Button } from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { Skeleton } from "@/components/Common/UI/skeleton";
import Modal from "@/components/Common/UI/Modal";
import { useTheme } from "@/contexts/ThemeContext";
import { useRole } from "@/contexts/RoleContext";
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  LogOut,
  Shield,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import Settings from "@/pages/Settings";

// Use auth hooks from the configured client
const { useSession, useListOrganizations, useActiveOrganization } = authClient;

/**
 * Organization Selection Page
 *
 * Allows users to view, select, and manage their organizations using better-auth
 * organization plugin functionality.
 */
export default function OrganizationSelection() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { role } = useRole();
  const isDark = theme === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("organizations");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [adminOrgs, setAdminOrgs] = useState(null);
  const [adminOrgsLoading, setAdminOrgsLoading] = useState(false);
  const [adminOrgsError, setAdminOrgsError] = useState(null);
  const [editOrg, setEditOrg] = useState(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgSlug, setEditOrgSlug] = useState("");
  const [editOrgError, setEditOrgError] = useState("");
  const [deleteOrg, setDeleteOrg] = useState(null);
  const [deleteOrgError, setDeleteOrgError] = useState("");
  const [ownerModalOrg, setOwnerModalOrg] = useState(null);
  const [ownerModalMember, setOwnerModalMember] = useState(null);
  const [ownerModalAction, setOwnerModalAction] = useState("assign");
  const [ownerModalEmail, setOwnerModalEmail] = useState("");
  const [ownerModalError, setOwnerModalError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [superadminCreateOpen, setSuperadminCreateOpen] = useState(false);
  const [superadminCreateName, setSuperadminCreateName] = useState("");
  const [superadminCreateSlug, setSuperadminCreateSlug] = useState("");
  const [superadminCreateOwnerEmail, setSuperadminCreateOwnerEmail] =
    useState("");
  const [superadminCreateError, setSuperadminCreateError] = useState("");

  // Auth hooks
  const { data: session } = useSession();
  const {
    data: organizations,
    isLoading: orgsLoading,
    error: orgsError,
    refetch: refetchOrganizations,
  } = useListOrganizations();
  const {
    data: activeOrganization,
    isLoading: activeOrgLoading,
    refetch: refetchActiveOrg,
  } = useActiveOrganization();

  // Track session stability to prevent premature API calls
  const [sessionStable, setSessionStable] = useState(false);
  const sessionStableRef = useRef(false);

  const isSuperadmin = role === "superadmin";

  const fetchAdminOrganizations = useCallback(async () => {
    if (!isSuperadmin || !sessionStable || !session) return;

    setAdminOrgsLoading(true);
    setAdminOrgsError(null);

    try {
      const response = await axios.get("/api/organization/admin/organizations");
      setAdminOrgs(response.data.data);
      console.log(
        "Loaded all organizations for superadmin:",
        response.data.data
      );
    } catch (error) {
      console.error("Failed to load admin organizations:", error);
      setAdminOrgsError(error);
    } finally {
      setAdminOrgsLoading(false);
    }
  }, [isSuperadmin, sessionStable, session]);

  useEffect(() => {
    fetchAdminOrganizations();
  }, [fetchAdminOrganizations]);

  // Use admin orgs if superadmin, otherwise use user orgs
  const displayOrganizations = isSuperadmin ? adminOrgs : organizations;
  const displayOrgsLoading = isSuperadmin ? adminOrgsLoading : orgsLoading;
  const displayOrgsError = isSuperadmin ? adminOrgsError : orgsError;

  const superadminGroups = useMemo(() => {
    if (!isSuperadmin || !adminOrgs) {
      return [];
    }

    const groupMap = new Map();

    adminOrgs.forEach((org) => {
      const ownerKey = org.owner?.id || "unassigned-owner";
      if (!groupMap.has(ownerKey)) {
        groupMap.set(ownerKey, {
          owner: org.owner,
          organizations: [],
        });
      }

      const group = groupMap.get(ownerKey);
      group.organizations.push(org);
    });

    const groups = Array.from(groupMap.values()).map((group) => ({
      owner: group.owner,
      organizations: [...group.organizations].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }),
    }));

    groups.sort((a, b) => {
      const ownerNameA = (
        a.owner?.name ||
        a.owner?.email ||
        "Unassigned"
      ).toLowerCase();
      const ownerNameB = (
        b.owner?.name ||
        b.owner?.email ||
        "Unassigned"
      ).toLowerCase();
      return ownerNameA.localeCompare(ownerNameB);
    });

    return groups;
  }, [adminOrgs, isSuperadmin]);

  const filteredSuperadminGroups = useMemo(() => {
    if (!isSuperadmin) {
      return [];
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return superadminGroups;
    }

    return superadminGroups
      .map((group) => {
        const ownerMatches = group.owner
          ? `${group.owner.name || ""} ${group.owner.email || ""}`
              .toLowerCase()
              .includes(term)
          : "unassigned".includes(term);

        const matchedOrganizations = group.organizations.filter((org) => {
          const nameMatch = org.name?.toLowerCase().includes(term);
          const slugMatch = org.slug?.toLowerCase().includes(term);
          return nameMatch || slugMatch;
        });

        if (ownerMatches && matchedOrganizations.length === 0) {
          return { ...group };
        }

        return {
          ...group,
          organizations: matchedOrganizations,
        };
      })
      .filter(
        (group) => group.organizations.length > 0 || (group.owner && searchTerm)
      );
  }, [isSuperadmin, searchTerm, superadminGroups]);

  // Ensure session is stable before attempting organization fetches
  useEffect(() => {
    if (session) {
      // Give session a moment to stabilize
      const timer = setTimeout(() => {
        setSessionStable(true);
        sessionStableRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSessionStable(false);
      sessionStableRef.current = false;
    }
  }, [session]);

  // Debug logging for troubleshooting (can be removed in production)
  useEffect(() => {
    if (displayOrganizations || activeOrganization) {
      console.log("OrganizationSelection - Active org status:", {
        isSuperadmin,
        organizationsCount: displayOrganizations?.length || 0,
        activeOrganization: activeOrganization?.name || "None",
        activeOrgId: activeOrganization?.id || "None",
        sessionStable,
      });
    }
  }, [displayOrganizations, activeOrganization, sessionStable, isSuperadmin]);

  // Check if this is the user's first organization (not applicable to superadmin)
  const isFirstOrganization =
    !isSuperadmin &&
    !displayOrgsLoading &&
    (!displayOrganizations || displayOrganizations.length === 0);

  // Show organizations list if not loading and organizations exist
  const shouldShowOrganizations = isSuperadmin
    ? !adminOrgsLoading &&
      (filteredSuperadminGroups.length > 0 ||
        (searchTerm.trim().length > 0 && superadminGroups.length > 0))
    : !displayOrgsLoading &&
      displayOrganizations &&
      displayOrganizations.length > 0;

  // Auto-retry loading if no organizations are loaded after initial load (not for superadmin)
  useEffect(() => {
    if (isSuperadmin) return; // Superadmin uses separate fetch

    const timer = setTimeout(() => {
      if (
        !orgsLoading &&
        !organizations &&
        !orgsError &&
        session &&
        sessionStable &&
        refetchOrganizations
      ) {
        console.log("Auto-retrying organization fetch...");
        refetchOrganizations();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    isSuperadmin,
    orgsLoading,
    organizations,
    orgsError,
    session,
    sessionStable,
    refetchOrganizations,
  ]);

  // Force initial fetch if needed (not for superadmin)
  useEffect(() => {
    if (isSuperadmin) return; // Superadmin uses separate fetch

    if (
      session &&
      sessionStable &&
      !orgsLoading &&
      !organizations &&
      !orgsError &&
      refetchOrganizations
    ) {
      console.log("Force initial organization fetch...");
      refetchOrganizations();
    }
  }, [
    isSuperadmin,
    session,
    sessionStable,
    organizations,
    orgsError,
    orgsLoading,
    refetchOrganizations,
  ]);

  // Aggressive retry when session becomes stable (not for superadmin)
  useEffect(() => {
    if (isSuperadmin) return; // Superadmin uses separate fetch

    if (
      session &&
      sessionStable &&
      !organizations &&
      !orgsLoading &&
      !orgsError
    ) {
      console.log("Session stable, attempting immediate organization fetch...");
      // Try multiple times with increasing delays
      const attempts = [0, 1000, 2000, 3000];
      attempts.forEach((delay, index) => {
        setTimeout(() => {
          if (!organizations && !orgsLoading && refetchOrganizations) {
            console.log(`Organization fetch attempt ${index + 1}...`);
            refetchOrganizations();
          }
        }, delay);
      });
    }
  }, [
    isSuperadmin,
    session,
    sessionStable,
    organizations,
    orgsLoading,
    orgsError,
    refetchOrganizations,
  ]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isSuperadmin) {
        // Refetch admin organizations
        await fetchAdminOrganizations();
      } else {
        // Refetch user organizations
        await refetchOrganizations?.();
      }
      await refetchActiveOrg?.();
      console.log("Refreshed organizations and active organization");
    } catch (error) {
      console.error("Failed to refresh organizations:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (newOrgName) {
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setNewOrgSlug(slug);
    } else {
      setNewOrgSlug("");
    }
  }, [newOrgName]);

  // Filter organizations based on search for non-superadmin roles
  const filteredOrganizations = useMemo(() => {
    if (isSuperadmin) {
      return [];
    }

    if (!displayOrganizations) {
      return [];
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return displayOrganizations;
    }

    return displayOrganizations.filter(
      (org) =>
        org.name.toLowerCase().includes(term) ||
        org.slug.toLowerCase().includes(term)
    );
  }, [displayOrganizations, isSuperadmin, searchTerm]);

  // Determine which organization should be considered active
  // If no explicit active organization, consider the first one as potentially active (only for non-superadmin)
  const effectiveActiveOrg =
    activeOrganization ||
    (!isSuperadmin && displayOrganizations && displayOrganizations.length > 0
      ? displayOrganizations[0]
      : null);

  // Handle organization selection
  const handleSelectOrganization = async (org) => {
    try {
      if (isSuperadmin) {
        toast.info(
          "Superadmin can manage this organization using the actions menu."
        );
        return;
      }

      const isAlreadyActive =
        activeOrganization &&
        (activeOrganization.id === org.id ||
          String(activeOrganization.id) === String(org.id));

      if (isAlreadyActive) {
        console.log(
          `Organization ${org.name} is already active, navigating to appropriate dashboard...`
        );
      } else {
        console.log(
          `Setting organization ${org.name} (${org.id}) as active...`
        );

        // Set the selected organization as active
        await authClient.organization.setActive({
          organizationId: org.id,
        });

        console.log("Organization set as active, navigating to appropriate dashboard...");
      }

      // Navigate to the appropriate dashboard based on role
      // For employees, navigate to employee portal; for others, navigate to dashboard
      const dashboardRoute = role === 'employee' ? '/employee-portal' : '/dashboard';
      navigate(dashboardRoute);
    } catch (error) {
      console.error("Failed to set active organization:", error);
      // Optional: Show a toast notification about the error
    }
  };

  const openEditOrganization = (org) => {
    setEditOrg(org);
    setEditOrgName(org.name || "");
    setEditOrgSlug(org.slug || "");
    setEditOrgError("");
  };

  const openDeleteOrganization = (org) => {
    setDeleteOrg(org);
    setDeleteOrgError("");
  };

  const openAssignOwnerModal = (org) => {
    setOwnerModalOrg(org);
    setOwnerModalMember(null);
    setOwnerModalAction("assign");
    setOwnerModalEmail("");
    setOwnerModalError("");
  };

  const openRemoveOwnerModal = (org, member) => {
    setOwnerModalOrg(org);
    setOwnerModalMember(member);
    setOwnerModalAction("remove");
    setOwnerModalEmail("");
    setOwnerModalError("");
  };

  const closeEditModal = () => {
    if (actionBusy) return;
    setEditOrg(null);
    setEditOrgName("");
    setEditOrgSlug("");
    setEditOrgError("");
  };

  const closeDeleteModal = () => {
    if (actionBusy) return;
    setDeleteOrg(null);
    setDeleteOrgError("");
  };

  const closeOwnerModal = () => {
    if (actionBusy) return;
    setOwnerModalOrg(null);
    setOwnerModalMember(null);
    setOwnerModalEmail("");
    setOwnerModalError("");
  };

  const handleUpdateOrganization = async (event) => {
    event.preventDefault();
    if (!editOrg) return;

    const trimmedName = editOrgName.trim();
    const trimmedSlug = editOrgSlug.trim();

    if (!trimmedName || !trimmedSlug) {
      setEditOrgError("Name and slug are required");
      return;
    }

    try {
      setActionBusy(true);
      setEditOrgError("");

      await axios.put(`/api/organization/${editOrg.id}`, {
        name: trimmedName,
        slug: trimmedSlug,
      });

      toast.success("Organization updated");
      await fetchAdminOrganizations();
      closeEditModal();
    } catch (error) {
      console.error("Failed to update organization:", error);
      setEditOrgError(
        error?.response?.data?.message || "Failed to update organization"
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!deleteOrg) return;

    try {
      setActionBusy(true);
      setDeleteOrgError("");

      await axios.delete(`/api/organization/${deleteOrg.id}`);

      toast.success("Organization removed");
      await fetchAdminOrganizations();
      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete organization:", error);
      setDeleteOrgError(
        error?.response?.data?.message || "Failed to delete organization"
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleOwnerModalSubmit = async (event) => {
    event.preventDefault();
    if (!ownerModalOrg) return;

    try {
      setActionBusy(true);
      setOwnerModalError("");

      if (ownerModalAction === "assign") {
        const trimmedEmail = ownerModalEmail.trim();
        if (!trimmedEmail) {
          setOwnerModalError("Owner email is required");
          return;
        }

        await axios.put(`/api/organization/${ownerModalOrg.id}/owner`, {
          email: trimmedEmail,
        });
        toast.success("Owner updated");
      } else if (ownerModalAction === "remove" && ownerModalMember) {
        await axios.delete(`/api/organization/${ownerModalOrg.id}/owner`, {
          data: { memberId: ownerModalMember.id },
        });
        toast.success("Owner removed");
      }

      await fetchAdminOrganizations();
      closeOwnerModal();
    } catch (error) {
      console.error("Failed to manage owner:", error);
      setOwnerModalError(
        error?.response?.data?.message || "Failed to update owner"
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleSuperadminCreateOrganization = async (event) => {
    event.preventDefault();

    if (!superadminCreateName.trim() || !superadminCreateSlug.trim()) {
      setSuperadminCreateError("Organization name and slug are required");
      return;
    }

    try {
      setActionBusy(true);
      setSuperadminCreateError("");

      // Create organization via backend
      await axios.post("/api/organization/create", {
        name: superadminCreateName.trim(),
        slug: superadminCreateSlug.trim(),
      });

      // If owner email provided, assign owner
      if (superadminCreateOwnerEmail.trim()) {
        // Get the created org to assign owner
        const orgsResponse = await axios.get(
          "/api/organization/admin/organizations"
        );
        const createdOrg = orgsResponse.data.data.find(
          (org) => org.slug === superadminCreateSlug.trim()
        );

        if (createdOrg) {
          await axios.put(`/api/organization/${createdOrg.id}/owner`, {
            email: superadminCreateOwnerEmail.trim(),
          });
        }
      }

      toast.success("Organization created successfully");
      await fetchAdminOrganizations();
      closeSuperadminCreateModal();
    } catch (error) {
      console.error("Failed to create organization:", error);
      setSuperadminCreateError(
        error?.response?.data?.message || "Failed to create organization"
      );
    } finally {
      setActionBusy(false);
    }
  };

  const closeSuperadminCreateModal = () => {
    setSuperadminCreateOpen(false);
    setSuperadminCreateName("");
    setSuperadminCreateSlug("");
    setSuperadminCreateOwnerEmail("");
    setSuperadminCreateError("");
  };

  // Handle creating new organization
  const handleCreateOrganization = async (e) => {
    e.preventDefault();

    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      // Create the organization using better-auth
      const metadata = {
        createdAt: new Date().toISOString(),
      };

      const { data: _data, error } = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim(),
        metadata,
        keepCurrentActiveOrganization: false,
      });

      if (error) {
        setCreateError(error.message || "Failed to create organization");
        return;
      }

      // Reset form
      setNewOrgName("");
      setNewOrgSlug("");

      // Refresh organizations list
      window.location.reload();
    } catch (error) {
      console.error("Error creating organization:", error);
      setCreateError(error.message || "Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      navigate("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Authentication Required
              </h2>
              <p className="text-muted-foreground mb-4">
                You need to be logged in to view organizations.
              </p>
              <Button onClick={() => navigate("/auth/login")}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while session stabilizes
  if (!sessionStable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary mb-4 animate-spin" />
              <h2 className="text-xl font-semibold mb-2">
                Preparing Organizations
              </h2>
              <p className="text-muted-foreground">
                Setting up your session...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300",
        isDark ? "bg-slate-900" : "bg-gray-50"
      )}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Sign Out Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">
            {isSuperadmin ? (
              <span className="flex items-center justify-center gap-2">
                <Shield className="w-8 h-8" />
                Superadmin Portal
              </span>
            ) : isFirstOrganization ? (
              "Welcome to Fleet Management!"
            ) : (
              "Select Organization"
            )}
          </h1>
          <p className="text-muted-foreground">
            {isSuperadmin
              ? "Manage organizations and system settings"
              : isFirstOrganization
              ? "Let's create your first organization to get started"
              : "Choose an organization to continue or create a new one"}
          </p>
          {/* Active Organization Status */}
          {activeOrgLoading ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading active organization...</span>
            </div>
          ) : effectiveActiveOrg ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <Building2 className="w-4 h-4" />
              <span>Current: {effectiveActiveOrg.name}</span>
            </div>
          ) : (
            !isSuperadmin &&
            displayOrganizations &&
            displayOrganizations.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>No active organization set</span>
              </div>
            )
          )}
        </div>

        {/* Superadmin Tabs */}
        {isSuperadmin && (
          <div className="mb-6 border-b border-[var(--divider)]">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("organizations")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all",
                  activeTab === "organizations"
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Building2 className="w-4 h-4" />
                <span>Organizations</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all",
                  activeTab === "settings"
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Shield className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {isSuperadmin && activeTab === "settings" ? (
          <Settings />
        ) : (
          <>
        {/* Search and Refresh - Show when we have or expect organizations */}
        {(shouldShowOrganizations ||
          (!orgsLoading && !isFirstOrganization)) && (
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isSuperadmin && (
              <Button
                variant="primary"
                size="default"
                onClick={() => setSuperadminCreateOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Organization</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              onClick={handleRefresh}
              disabled={refreshing || orgsLoading}
              className="flex items-center space-x-2"
            >
              <Loader2
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        )}

        {/* Organizations List - Show when we have or expect organizations */}
        {(shouldShowOrganizations ||
          (!displayOrgsLoading && !isFirstOrganization)) && (
          <div className="space-y-4 mb-8">
            {displayOrgsLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="w-full">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="w-24 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : displayOrgsError ? (
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Error Loading Organizations
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {displayOrgsError.message ||
                        "Failed to load organizations"}
                    </p>
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center space-x-2"
                    >
                      <Loader2
                        className={`w-4 h-4 ${
                          refreshing ? "animate-spin" : ""
                        }`}
                      />
                      <span>Try Again</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : !displayOrganizations ? (
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Organizations Not Loaded
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Organization data failed to load. This might be a network
                      issue.
                    </p>
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center space-x-2"
                    >
                      <Loader2
                        className={`w-4 h-4 ${
                          refreshing ? "animate-spin" : ""
                        }`}
                      />
                      <span>Load Organizations</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : isSuperadmin ? (
              // Superadmin grouped view
              filteredSuperadminGroups.length === 0 ? (
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchTerm
                          ? "No organizations found"
                          : "No organizations yet"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "No organizations have been created yet"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredSuperadminGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          {group.owner ? (
                            <>
                              {group.owner.name || group.owner.email}
                              <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({group.organizations.length} org
                                {group.organizations.length !== 1 ? "s" : ""})
                              </span>
                            </>
                          ) : (
                            <>
                              Unassigned
                              <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({group.organizations.length} org
                                {group.organizations.length !== 1 ? "s" : ""})
                              </span>
                            </>
                          )}
                        </h3>
                      </div>
                      {group.organizations.map((org) => (
                        <Card
                          key={org.id}
                          className="w-full transition-all duration-200 hover:shadow-lg"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                                    isDark ? "bg-slate-700" : "bg-gray-100"
                                  )}
                                >
                                  {org.logo ? (
                                    <img
                                      src={org.logo}
                                      alt={org.name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <Building2 className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">
                                    {org.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    @{org.slug}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {org.memberCount} member
                                    {org.memberCount !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditOrganization(org);
                                  }}
                                  className="text-xs"
                                  title="Edit organization"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAssignOwnerModal(org);
                                  }}
                                  className="text-xs"
                                  title="Assign/update owner"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                                {org.owner && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const ownerMember = org.members?.find(
                                        (m) => {
                                          const roles =
                                            m.role
                                              ?.split(",")
                                              .map((r) =>
                                                r.trim().toLowerCase()
                                              ) || [];
                                          return roles.includes("owner");
                                        }
                                      );
                                      if (ownerMember) {
                                        openRemoveOwnerModal(org, ownerMember);
                                      }
                                    }}
                                    className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Remove owner"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteOrganization(org);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete organization"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              )
            ) : filteredOrganizations.length === 0 ? (
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm
                        ? "No organizations found"
                        : "No organizations yet"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first organization to get started"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredOrganizations.map((org) => {
                // More robust active organization comparison
                const isActive =
                  effectiveActiveOrg &&
                  org &&
                  (effectiveActiveOrg.id === org.id ||
                    String(effectiveActiveOrg.id) === String(org.id));

                return (
                  <Card
                    key={org.id}
                    className={cn(
                      "w-full cursor-pointer transition-all duration-200 hover:shadow-lg",
                      isActive &&
                        "ring-2 ring-primary bg-primary/5 border-primary/20"
                    )}
                    onClick={() => handleSelectOrganization(org)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Organization Avatar */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              isDark ? "bg-slate-700" : "bg-gray-100"
                            )}
                          >
                            {org.logo ? (
                              <img
                                src={org.logo}
                                alt={org.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Organization Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">
                                {org.name}
                              </h3>
                              {isActive && (
                                <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              @{org.slug}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-4 text-sm">
                          {!isActive && !isSuperadmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOrganization(org);
                              }}
                              className="text-xs"
                            >
                              Set Active
                            </Button>
                          )}
                          {!isSuperadmin && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Create New Organization - Hide for superadmin */}
        {!isSuperadmin && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>
                  {isFirstOrganization
                    ? "Create Your Organization"
                    : "Create New Organization"}
                </span>
              </CardTitle>
              {isFirstOrganization && (
                <p className="text-sm text-muted-foreground mt-2">
                  This will be your main organization for managing your fleet
                  operations.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Organization Name *
                    </label>
                    <Input
                      placeholder="Enter organization name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Slug *
                    </label>
                    <Input
                      placeholder="organization-slug"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used in URLs and must be unique
                    </p>
                  </div>
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    isCreating || !newOrgName.trim() || !newOrgSlug.trim()
                  }
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {isFirstOrganization
                        ? "Create Organization & Get Started"
                        : "Create Organization"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        </>
        )}

        {/* Edit Organization Modal - Beautiful Modern Design */}
        <Modal isOpen={!!editOrg} onClose={closeEditModal}>
          <div className="flex flex-col w-full max-w-full h-full max-h-[85vh] overflow-hidden box-border">
            {/* Header with gradient background - Sticky */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 px-6 py-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate">
                    Edit Organization
                  </h2>
                  <p className="text-sm text-white/80 mt-0.5 truncate">
                    Update organization details
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleUpdateOrganization}
              className="flex-1 w-[80%] max-w-[80%] mx-auto overflow-y-auto overflow-x-hidden p-5 space-y-4 box-border"
            >
              {/* Organization Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  Organization Name
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Input
                  placeholder="Enter organization name"
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  required
                  disabled={actionBusy}
                  className="w-full h-11 text-base"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  URL Slug
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Input
                  placeholder="organization-slug"
                  value={editOrgSlug}
                  onChange={(e) =>
                    setEditOrgSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                    )
                  }
                  required
                  disabled={actionBusy}
                  className="w-full h-11 font-mono text-sm"
                />
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Slug is used in URLs. Only lowercase letters, numbers, and
                    hyphens are allowed.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {editOrgError && (
                <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {editOrgError}
                  </p>
                </div>
              )}

              {/* Action Buttons - Sticky at bottom */}
              <div className="flex gap-3 pt-4 border-t border-[var(--divider)] sticky bottom-0 bg-[var(--card-background)] -mx-5 px-5 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={actionBusy}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    actionBusy || !editOrgName.trim() || !editOrgSlug.trim()
                  }
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {actionBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Update Organization
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Superadmin Create Organization Modal - Beautiful Modern Design */}
        <Modal
          isOpen={superadminCreateOpen}
          onClose={closeSuperadminCreateModal}
        >
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header with gradient background - Sticky */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 px-6 py-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate">
                    Create New Organization
                  </h2>
                  <p className="text-sm text-white/80 mt-0.5 truncate">
                    Add a new organization to the system
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <form
              onSubmit={handleSuperadminCreateOrganization}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {/* Organization Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  Organization Name
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Input
                  placeholder="e.g., Acme Corporation"
                  value={superadminCreateName}
                  onChange={(e) => setSuperadminCreateName(e.target.value)}
                  required
                  disabled={actionBusy}
                  className="w-full h-11 text-base"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  URL Slug
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Input
                  placeholder="acme-corporation"
                  value={superadminCreateSlug}
                  onChange={(e) =>
                    setSuperadminCreateSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                    )
                  }
                  required
                  disabled={actionBusy}
                  className="w-full h-11 font-mono text-sm"
                />
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Slug is used in URLs. Only lowercase letters, numbers, and
                    hyphens are allowed.
                  </p>
                </div>
              </div>

              {/* Owner Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <UserPlus className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Owner Email
                  <span className="text-xs text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <Input
                  type="email"
                  placeholder="owner@example.com"
                  value={superadminCreateOwnerEmail}
                  onChange={(e) =>
                    setSuperadminCreateOwnerEmail(e.target.value)
                  }
                  disabled={actionBusy}
                  className="w-full h-11 text-base"
                />
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Assign an owner now, or leave empty and assign later from
                    the organization list.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {superadminCreateError && (
                <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {superadminCreateError}
                  </p>
                </div>
              )}

              {/* Action Buttons - Sticky at bottom */}
              <div className="flex gap-3 pt-4 border-t border-[var(--divider)] sticky bottom-0 bg-[var(--card-background)] -mx-5 px-5 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSuperadminCreateModal}
                  disabled={actionBusy}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    actionBusy ||
                    !superadminCreateName.trim() ||
                    !superadminCreateSlug.trim()
                  }
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {actionBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Organization
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Delete Organization Modal */}
        <Modal
          isOpen={!!deleteOrg}
          onClose={closeDeleteModal}
          title="Delete Organization"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                Are you sure you want to delete{" "}
                <strong>{deleteOrg?.name}</strong>? This action cannot be undone
                and will remove all associated data.
              </p>
            </div>
            {deleteOrgError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{deleteOrgError}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteModal}
                disabled={actionBusy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteOrganization}
                disabled={actionBusy}
              >
                {actionBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Organization"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Owner Management Modal */}
        <Modal
          isOpen={!!ownerModalOrg}
          onClose={closeOwnerModal}
          title={
            ownerModalAction === "assign" ? "Assign Owner" : "Remove Owner"
          }
        >
          <form onSubmit={handleOwnerModalSubmit} className="space-y-4">
            {ownerModalAction === "assign" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Assign or update the owner for{" "}
                  <strong>{ownerModalOrg?.name}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Owner Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="owner@example.com"
                    value={ownerModalEmail}
                    onChange={(e) => setOwnerModalEmail(e.target.value)}
                    required
                    disabled={actionBusy}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The user must already exist in the system
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-700">
                  Are you sure you want to remove{" "}
                  <strong>
                    {ownerModalMember?.user?.name ||
                      ownerModalMember?.user?.email}
                  </strong>{" "}
                  as owner of <strong>{ownerModalOrg?.name}</strong>?
                </p>
              </div>
            )}
            {ownerModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{ownerModalError}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeOwnerModal}
                disabled={actionBusy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  actionBusy ||
                  (ownerModalAction === "assign" && !ownerModalEmail.trim())
                }
                variant={
                  ownerModalAction === "remove" ? "destructive" : "primary"
                }
              >
                {actionBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {ownerModalAction === "assign"
                      ? "Assigning..."
                      : "Removing..."}
                  </>
                ) : ownerModalAction === "assign" ? (
                  "Assign Owner"
                ) : (
                  "Remove Owner"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

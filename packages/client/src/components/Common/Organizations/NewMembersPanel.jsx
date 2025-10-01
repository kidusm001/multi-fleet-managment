import React, { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Crown, 
  Shield, 
  User, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import { Card, CardContent, CardHeader, CardTitle } from '@components/Common/UI/Card';
import { Button } from '@components/Common/UI/Button';
import { Input } from '@components/Common/UI/Input';
import { Badge } from '@components/Common/UI/Badge';
import { Skeleton } from '@components/Common/UI/skeleton';
// Removed dropdown menu import to avoid potential performance issues
import { cn } from '@lib/utils';
import { toast } from 'sonner';

// Role configuration
const ROLE_CONFIG = {
  owner: { 
    label: 'Owner', 
    icon: Crown, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    priority: 1
  },
  admin: { 
    label: 'Admin', 
    icon: Shield, 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    priority: 2
  },
  manager: { 
    label: 'Manager', 
    icon: User, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    priority: 3
  },
  driver: { 
    label: 'Driver', 
    icon: User, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    priority: 4
  },
  employee: { 
    label: 'Employee', 
    icon: User, 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    priority: 5
  }
};

const AVAILABLE_ROLES = ['owner', 'admin', 'manager', 'driver', 'employee'];

export default function NewMembersPanel() {
  const { useActiveOrganization } = authClient;
  const { data: activeOrganization, isLoading: orgLoading } = useActiveOrganization();
  
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [lastLoadedOrgId, setLastLoadedOrgId] = useState(null);

  // Memoized loadMembers function to prevent infinite re-renders
  const loadMembers = useCallback(async (organizationId) => {
    if (!organizationId || isLoading || lastLoadedOrgId === organizationId) return;
    
    console.log('Loading members for organization:', organizationId);
    setIsLoading(true);
    setError(null);
    setLastLoadedOrgId(organizationId);
    
    try {
      // First try to get full organization data which includes members
      const { data: fullOrgData, error: fullOrgError } = await authClient.organization.getFullOrganization({
        organizationId: organizationId
      });

      if (fullOrgError) {
        console.error('Failed to get full organization:', fullOrgError);
        // Fallback to list members API
        const { data: membersList, error: membersError } = await authClient.organization.listMembers({
          organizationId: organizationId
        });

        if (membersError) {
          throw new Error(membersError.message || 'Failed to load members');
        }

        const formattedMembers = membersList?.map(member => ({
          id: member.id,
          userId: member.user?.email || member.userId,
          email: member.user?.email || member.userId,
          name: member.user?.name || member.user?.email?.split('@')[0] || 'Unknown User',
          role: member.role,
          joinedAt: member.createdAt || new Date().toISOString(),
          status: 'active',
          avatar: member.user?.image
        })) || [];

        setMembers(formattedMembers);
        setFilteredMembers(formattedMembers);
      } else {
        // Use full organization data
        const formattedMembers = fullOrgData?.members?.map(member => ({
          id: member.id,
          userId: member.user?.email || member.userId,
          email: member.user?.email || member.userId,
          name: member.user?.name || member.user?.email?.split('@')[0] || 'Unknown User',
          role: member.role,
          joinedAt: member.createdAt || new Date().toISOString(),
          status: 'active',
          avatar: member.user?.image
        })) || [];

        setMembers(formattedMembers);
        setFilteredMembers(formattedMembers);
        console.log('Successfully loaded members:', formattedMembers.length);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      setError(err.message || 'Failed to load organization members');
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, lastLoadedOrgId]);

  // Load members when organization changes
  useEffect(() => {
    if (activeOrganization?.id && activeOrganization.id !== lastLoadedOrgId && !isLoading) {
      loadMembers(activeOrganization.id);
    }
  }, [activeOrganization?.id, loadMembers, lastLoadedOrgId, isLoading]);

  // Filter members based on search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredMembers(members);
      } else {
        const term = searchTerm.toLowerCase();
        const filtered = members.filter(member => {
          // Simple string matching to avoid performance issues
          return (
            member.name?.toLowerCase().includes(term) ||
            member.email?.toLowerCase().includes(term) ||
            member.role?.toLowerCase().includes(term)
          );
        });
        setFilteredMembers(filtered);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, members]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      console.log('Updating member role:', { memberId, newRole });
      
      const { error } = await authClient.organization.updateMemberRole({
        memberId: memberId,
        role: newRole,
        organizationId: activeOrganization.id
      });

      if (error) {
        throw new Error(error.message || 'Failed to update member role');
      }
      
      // Update local state
      const updatedMembers = members.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers.filter(member =>
        !searchTerm.trim() || 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      toast.success('Member role updated successfully');
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error(error.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      console.log('Removing member:', memberId);
      
      const memberToRemove = members.find(m => m.id === memberId);
      if (!memberToRemove) {
        throw new Error('Member not found');
      }

      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberToRemove.email || memberToRemove.userId,
        organizationId: activeOrganization.id
      });

      if (error) {
        throw new Error(error.message || 'Failed to remove member');
      }
      
      // Update local state
      const updatedMembers = members.filter(member => member.id !== memberId);
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers.filter(member =>
        !searchTerm.trim() || 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleAddMember = async (userIdOrEmail, role, teamId) => {
    try {
      console.log('Adding member:', { userIdOrEmail, role, teamId });
      
      // Make API call to our custom endpoint
      const response = await fetch('/api/organization/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          userId: userIdOrEmail,
          role: role,
          organizationId: activeOrganization.id,
          teamId: teamId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add member');
      }

      // Reload members to get updated list - reset lastLoadedOrgId to force reload
      setLastLoadedOrgId(null);
      await loadMembers(activeOrganization.id);
      setShowAddMemberModal(false);
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  if (orgLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="p-6 text-center">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Organization Selected</h3>
        <p className="text-muted-foreground">
          Please select an organization to manage members.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-muted-foreground">
            Manage organization members and their roles
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAddMemberModal(true)}
          >
            <User className="w-4 h-4 mr-2" />
            Add Member
          </Button>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{filteredMembers.length} of {members.length} members</span>
        </div>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Organization Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Members</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadMembers} variant="outline">
                <Loader2 className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No members found' : 'No members yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Invite your first member to get started'
                }
              </p>
              {!searchTerm && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.employee;
                const RoleIcon = roleConfig.icon;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{member.name || member.userId}</h4>
                          {member.role === 'owner' && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{member.email}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Role Badge */}
                      <Badge className={cn("flex items-center gap-1", roleConfig.color)}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig.label}
                      </Badge>

                      {/* Simple Action Buttons */}
                      {member.role !== 'owner' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newRole = prompt('Enter new role (owner, admin, manager, driver, employee):');
                              if (newRole && AVAILABLE_ROLES.includes(newRole)) {
                                handleRoleChange(member.id, newRole);
                              }
                            }}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Remove ${member.name || member.userId} from the organization?`)) {
                                handleRemoveMember(member.id);
                              }
                            }}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={async (email, role) => {
            try {
              console.log('Inviting member:', { email, role });
              
              const { error } = await authClient.organization.inviteMember({
                email: email,
                role: role,
                organizationId: activeOrganization.id
              });

              if (error) {
                throw new Error(error.message || 'Failed to invite member');
              }

              // Reload members to get updated list - reset lastLoadedOrgId to force reload
              setLastLoadedOrgId(null);
              await loadMembers(activeOrganization.id);
              setShowInviteModal(false);
              toast.success('Member invited successfully');
            } catch (error) {
              console.error('Failed to invite member:', error);
              toast.error(error.message || 'Failed to invite member');
            }
          }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
        />
      )}
    </div>
  );
}

// Simple invite modal component
function InviteMemberModal({ isOpen, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
      setRole('employee');
    } catch (error) {
      // Error is already handled in onInvite
      console.error('Invitation error:', error);
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-lg font-semibold mb-4">Invite Member</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@company.com"
              disabled={isInviting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isInviting}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={isInviting}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isInviting}>
            {isInviting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Invite
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
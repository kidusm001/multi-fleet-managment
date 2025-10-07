import React, { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@components/Common/UI/Button';
import { Input } from '@components/Common/UI/Input';
import { toast } from 'sonner';

export default function AddMemberModal({ isOpen, onClose, onAddMember }) {
  const [userIdOrEmail, setUserIdOrEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [teamId, setTeamId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const validateUserIdOrEmail = (value) => {
    // Accept both user IDs and email addresses (email preferred)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && value.trim().length > 0 && (
      emailRegex.test(value) || // Valid email (preferred)
      value.trim().length >= 3  // Or user ID (at least 3 characters)
    );
  };

  const handleAddMember = async () => {
    if (!validateUserIdOrEmail(userIdOrEmail)) {
      toast.error('Please enter a valid email address or user ID (min 3 characters)');
      return;
    }
    if (!role) {
      toast.error('Role is required');
      return;
    }

    setIsAdding(true);
    try {
      await onAddMember(userIdOrEmail.trim(), role, teamId || undefined);
      setUserIdOrEmail('');
      setRole('employee');
      setTeamId('');
    } catch (error) {
      // Error is already handled in onAddMember
      console.error('Add member error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setUserIdOrEmail('');
    setRole('employee');
    setTeamId('');
    setIsAdding(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-lg font-semibold mb-4">Add Member</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              User ID or Email Address
            </label>
            <Input
              type="text"
              value={userIdOrEmail}
              onChange={(e) => setUserIdOrEmail(e.target.value)}
              placeholder="user@company.com (recommended) or user123"
              disabled={isAdding}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email address is recommended - user IDs are hard to remember!
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isAdding}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Team ID (Optional)
            </label>
            <Input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Enter team ID (optional)"
              disabled={isAdding}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAddMember} disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
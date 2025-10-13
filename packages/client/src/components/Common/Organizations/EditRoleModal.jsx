import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Shield } from 'lucide-react';
import { Button } from '@components/Common/UI/Button';
import { toast } from 'sonner';

const AVAILABLE_ROLES = ['owner', 'admin', 'manager', 'driver', 'employee'];

export default function EditRoleModal({ isOpen, onClose, onUpdateRole, member }) {
  const [role, setRole] = useState('employee');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role || 'employee');
    }
  }, [member]);

  const handleUpdate = async () => {
    if (!role) {
      toast.error('Role is required');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateRole(member.id, role);
      onClose();
    } catch (error) {
      console.error('Update role error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setRole('employee');
    setIsUpdating(false);
    onClose();
  };

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const modal = (
    <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Change Member Role</h3>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-4">
            Update role for <strong>{member.name || member.userId}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isUpdating}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Update Role
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

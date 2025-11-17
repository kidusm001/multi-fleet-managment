import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@components/Common/UI/Button';

export default function DeleteMemberModal({ isOpen, onClose, onDelete, member }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(member.id);
      onClose();
    } catch (error) {
      console.error('Delete member error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsDeleting(false);
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
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Remove Member</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <strong>{member.name || member.userId}</strong> from the organization?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Remove Member
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

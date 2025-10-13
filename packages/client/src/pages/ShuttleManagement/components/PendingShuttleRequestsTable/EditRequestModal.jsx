import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/Common/UI/Button';
import { Card } from '@/components/Common/UI/Card';
import { Input } from '../ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function EditRequestModal({ request, onClose, onSave }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    model: '',
    capacity: '',
    type: 'IN_HOUSE',
    vendor: '',
    dailyRate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setFormData({
        name: request.name || '',
        licensePlate: request.licensePlate || '',
        model: request.model || '',
        capacity: request.capacity ?? '',
        type: request.type || 'IN_HOUSE',
        vendor: request.vendor || '',
        dailyRate: request.dailyRate ?? '',
      });
    }
  }, [request]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Parse numeric values before saving
      const dataToSave = {
        ...formData,
        capacity: parseInt(formData.capacity, 10) || 0,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving request:', error);
      alert(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="relative">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Edit Vehicle Request
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vehicle Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="License Plate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                  <Input
                    label="Capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "bg-white dark:bg-gray-900",
                        "border-gray-300 dark:border-gray-700",
                        "text-gray-900 dark:text-gray-100"
                      )}
                    >
                      <option value="IN_HOUSE">In-House</option>
                      <option value="OUTSOURCED">Outsourced</option>
                    </select>
                  </div>
                  <Input
                    label="Daily Rate"
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>

                {formData.type === 'OUTSOURCED' && (
                  <Input
                    label="Vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Enter vendor name"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save & Approve'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>,
    document.body
  );
}

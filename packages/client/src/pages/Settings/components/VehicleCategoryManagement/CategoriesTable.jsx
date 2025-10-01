import { Edit2, Trash2, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";

/**
 * Categories Table Component
 * Displays vehicle categories in a table format
 */
export default function CategoriesTable({ categories, onEdit, onDelete }) {
  if (categories.length === 0) {
    return (
      <div className="bg-[var(--card-background)] rounded-lg border border-[var(--divider)] p-12">
        <div className="text-center">
          <Car className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No categories found
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Get started by creating your first vehicle category
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-background)] rounded-lg border border-[var(--divider)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--divider)] bg-[var(--background)]">
              <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                Category Name
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                Capacity
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                Created
              </th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divider)]">
            {categories.map((category) => (
              <tr
                key={category.id}
                className="hover:bg-[var(--hover-bg)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-blue-100 dark:bg-blue-900/20"
                    )}>
                      <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {category.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                    "bg-green-100 dark:bg-green-900/20",
                    "text-green-700 dark:text-green-400"
                  )}>
                    {category.capacity} {category.capacity === 1 ? 'seat' : 'seats'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(category)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(category)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Badge } from './Badge';
import { Input } from './Input';

/**
 * MultiSelect component for selecting multiple options from a list
 * @param {Array} options - Array of {value, label} objects
 * @param {Array} selected - Array of selected values
 * @param {Function} onChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text
 */
export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select items...',
  className,
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value, e) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const getLabel = (value) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-auto min-h-10', className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length > 0 ? (
              selected.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {getLabel(value)}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRemove(value, e);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(value, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  selected.includes(option.value) && 'bg-accent'
                )}
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selected.includes(option.value)
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {option.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

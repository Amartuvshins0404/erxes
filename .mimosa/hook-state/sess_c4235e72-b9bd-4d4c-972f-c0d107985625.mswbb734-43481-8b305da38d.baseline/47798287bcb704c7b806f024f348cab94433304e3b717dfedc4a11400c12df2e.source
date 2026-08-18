import { Button, Popover } from 'erxes-ui';
import { IconFilter2, IconX } from '@tabler/icons-react';
import { ReactNode, useState } from 'react';

interface OneFitFilterBaseProps<TFilters> {
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
  children: ReactNode;
  excludeKeysFromCount?: (keyof TFilters)[];
  onClear?: () => void;
}

export function OneFitFilterBase<TFilters extends Record<string, any>>({
  filters,
  onFiltersChange,
  children,
  excludeKeysFromCount = [],
  onClear,
}: OneFitFilterBaseProps<TFilters>) {
  const [isOpen, setIsOpen] = useState(false);

  const clearFilters = () => {
    if (onClear) {
      onClear();
    } else {
      onFiltersChange({} as TFilters);
    }
    setIsOpen(false);
  };

  const activeFilterKeys = Object.keys(filters).filter(
    (key) => !excludeKeysFromCount.includes(key as keyof TFilters),
  );
  const hasActiveFilters = activeFilterKeys.length > 0;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <Button variant="outline" className="gap-2">
            <IconFilter2 />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFilterKeys.length}
              </span>
            )}
          </Button>
        </Popover.Trigger>
        <Popover.Content className="w-80" align="start">
          <div className="flex flex-col gap-4">
            {children}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <IconX />
                Clear Filters
              </Button>
            )}
          </div>
        </Popover.Content>
      </Popover>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <IconX />
          Clear
        </Button>
      )}
    </div>
  );
}

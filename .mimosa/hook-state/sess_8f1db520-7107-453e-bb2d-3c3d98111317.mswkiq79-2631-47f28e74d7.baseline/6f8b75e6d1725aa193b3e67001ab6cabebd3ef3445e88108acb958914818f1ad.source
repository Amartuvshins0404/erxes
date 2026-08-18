import { Button, Command, Popover, SelectTree } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { ONE_FIT_ACTIVITY_CATEGORIES } from '../graphql/categoryQueries';
import { generateOrderPath } from '../utils/generateOrderPath';
import { getLocalizedString } from '../utils/localization';
import { cn } from 'erxes-ui/lib';

const VALUE_ALL = '__all__';
const VALUE_ROOT = '__root__';

export type NestedCategoryFilterVariant = 'parent' | 'category';

export interface NestedCategoryFilterProps {
  variant: NestedCategoryFilterVariant;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  id: string;
  disabled?: boolean;
}

export function NestedCategoryFilter({
  variant,
  value,
  onChange,
  id,
  disabled = false,
}: NestedCategoryFilterProps) {
  const [open, setOpen] = useState(false);

  const { data: categoriesData } = useQuery(ONE_FIT_ACTIVITY_CATEGORIES, {
    variables: {},
  });

  const categories = categoriesData?.oneFitActivityCategories || [];
  const categoriesWithOrder = generateOrderPath(categories);

  const displayValue =
    variant === 'parent'
      ? value === undefined
        ? VALUE_ALL
        : value === ''
        ? VALUE_ROOT
        : value
      : value === undefined
      ? VALUE_ALL
      : value;

  const getCategoryPath = (categoryId: string): string => {
    const byId = new Map(
      categoriesWithOrder.map((c) => [
        c._id,
        {
          name:
            typeof c.name === 'object'
              ? getLocalizedString(c.name)
              : c.name || '',
          parentId: c.parentId,
        },
      ]),
    );
    const path: string[] = [];
    let currentId: string | undefined = categoryId;
    while (currentId) {
      const item = byId.get(currentId);
      if (!item) break;
      path.unshift(item.name);
      currentId = item.parentId;
    }
    return path.join(' > ');
  };

  const getDisplayLabel = (): string => {
    if (variant === 'parent') {
      if (value === undefined) return 'All';
      if (value === '') return 'Root only';
    } else {
      if (value === undefined) return 'All';
    }
    const category = categoriesWithOrder.find((c) => c._id === value);
    if (!category) return value ?? 'All';
    return getCategoryPath(value);
  };

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === VALUE_ALL) {
      onChange(undefined);
    } else if (variant === 'parent' && selectedValue === VALUE_ROOT) {
      onChange('');
    } else {
      onChange(selectedValue);
    }
    setOpen(false);
  };

  const isSelected = (categoryId: string) =>
    variant === 'parent' ? value === categoryId : value === categoryId;

  const initialHiddenOrders = categoriesWithOrder
    .filter((c) => c.hasChildren)
    .map((c) => c.order);

  return (
    <SelectTree.Provider
      id={id}
      ordered
      length={categoriesWithOrder.length}
      initialHiddenOrders={initialHiddenOrders}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal h-9 px-3',
              displayValue === VALUE_ALL && 'text-muted-foreground',
            )}
          >
            {getDisplayLabel()}
          </Button>
        </Popover.Trigger>
        <Popover.Content
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <Command.List className="max-h-[300px] overflow-y-auto p-1">
              <Command.Item
                value={VALUE_ALL}
                onSelect={() => handleSelect(VALUE_ALL)}
              >
                All
              </Command.Item>
              {variant === 'parent' && (
                <Command.Item
                  value={VALUE_ROOT}
                  onSelect={() => handleSelect(VALUE_ROOT)}
                >
                  Root only
                </Command.Item>
              )}
              {categoriesWithOrder.map((category) => {
                const name =
                  typeof category.name === 'object'
                    ? getLocalizedString(category.name)
                    : category.name || '';
                return (
                  <SelectTree.Item
                    key={category._id}
                    _id={category._id}
                    order={category.order}
                    hasChildren={category.hasChildren}
                    name={name}
                    value={category._id}
                    onSelect={() => handleSelect(category._id)}
                    selected={isSelected(category._id)}
                  >
                    {name}
                  </SelectTree.Item>
                );
              })}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover>
    </SelectTree.Provider>
  );
}

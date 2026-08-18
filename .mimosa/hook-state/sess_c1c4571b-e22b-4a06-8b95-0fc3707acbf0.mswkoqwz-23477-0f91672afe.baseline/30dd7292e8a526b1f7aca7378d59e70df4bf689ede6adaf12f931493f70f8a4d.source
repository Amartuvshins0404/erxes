import { Checkbox, ScrollArea, Button } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ONE_FIT_ACTIVITY_CATEGORIES } from '~/modules/category/graphql/categoryQueries';
import { generateOrderPath } from '~/modules/category/utils/generateOrderPath';
import { getLocalizedString } from '~/modules/category/utils/localization';

interface SelectCategoriesProps {
  selected?: string[];
  onSelect: (categoryIds: string[]) => void;
  disabled?: boolean;
}

export const SelectCategories = ({
  selected = [],
  onSelect,
  disabled = false,
}: SelectCategoriesProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data, loading } = useQuery(ONE_FIT_ACTIVITY_CATEGORIES, {
    variables: {},
  });

  const categories = data?.oneFitActivityCategories || [];
  const categoriesWithOrder = generateOrderPath(categories);

  const toggleExpand = (categoryId: string) => {
    const newExpandedIds = new Set(expandedIds);
    if (newExpandedIds.has(categoryId)) {
      newExpandedIds.delete(categoryId);
    } else {
      newExpandedIds.add(categoryId);
    }
    setExpandedIds(newExpandedIds);
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (disabled) return;

    const isSelected = selected.includes(categoryId);
    if (isSelected) {
      onSelect(selected.filter((id) => id !== categoryId));
    } else {
      onSelect([...selected, categoryId]);
    }
  };

  const getCategoryDisplayName = (
    category: (typeof categoriesWithOrder)[0],
    level: number = 0,
  ): string => {
    const indent = '  '.repeat(level);
    const name =
      typeof category.name === 'object'
        ? getLocalizedString(category.name)
        : category.name || '';
    return `${indent}${name}`;
  };

  const renderCategoryOptions = (
    parentId: string | undefined = undefined,
    level: number = 0,
  ) => {
    const children = categoriesWithOrder.filter((cat) =>
      parentId ? cat.parentId === parentId : !cat.parentId,
    );

    return children.map((category) => {
      const categoryChildren = categoriesWithOrder.filter(
        (c) => c.parentId === category._id,
      );
      const isSelected = selected.includes(category._id);
      const hasChildren = categoryChildren.length > 0;
      const isExpanded = expandedIds.has(category._id);

      return (
        <div key={category._id} className="space-y-1">
          <div
            className="flex items-center space-x-2 py-1"
            style={{ marginLeft: `${level * 16}px` }}
          >
            {hasChildren ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(category._id);
                }}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <IconChevronDown className="h-3 w-3" />
                ) : (
                  <IconChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <div className="w-4" />
            )}
            <Checkbox
              id={category._id}
              checked={isSelected}
              onCheckedChange={() => handleCategoryToggle(category._id)}
              disabled={disabled}
            />
            <label
              htmlFor={category._id}
              className="text-sm font-medium leading-none cursor-pointer select-none flex-1"
            >
              {typeof category.name === 'object'
                ? getLocalizedString(category.name)
                : category.name || ''}
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderCategoryOptions(category._id, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Loading categories...
      </div>
    );
  }

  if (categoriesWithOrder.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        No categories available
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4">
      <ScrollArea className="h-[200px]">
        <div className="space-y-1">{renderCategoryOptions()}</div>
      </ScrollArea>
      {selected.length > 0 && (
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {selected.length} categor{selected.length === 1 ? 'y' : 'ies'}{' '}
          selected
        </div>
      )}
    </div>
  );
};

import { Select } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { ONE_FIT_ACTIVITY_CATEGORIES } from '../graphql/categoryQueries';
import { generateOrderPath } from '../utils/generateOrderPath';
import { getLocalizedString } from '../utils/localization';

interface SelectCategoryProps {
  selected?: string;
  onSelect: (categoryId: string | undefined) => void;
  excludeId?: string;
}

export const SelectCategory = ({
  selected,
  onSelect,
  excludeId,
}: SelectCategoryProps) => {
  const { data } = useQuery(ONE_FIT_ACTIVITY_CATEGORIES, {
    variables: {},
  });

  const categories = data?.oneFitActivityCategories || [];
  const categoriesWithOrder = generateOrderPath(categories);

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

  const getDescendantIds = (categoryId: string): string[] => {
    const descendants: string[] = [];
    const findChildren = (parentId: string) => {
      const children = categoriesWithOrder.filter(
        (c) => c.parentId === parentId,
      );
      children.forEach((child) => {
        descendants.push(child._id);
        findChildren(child._id);
      });
    };
    findChildren(categoryId);
    return descendants;
  };

  const excludedIds = excludeId
    ? [excludeId, ...getDescendantIds(excludeId)]
    : [];

  const renderCategoryOptions = (
    parentId: string | undefined = undefined,
    level: number = 0,
  ) => {
    const children = categoriesWithOrder.filter(
      (cat) =>
        (parentId ? cat.parentId === parentId : !cat.parentId) &&
        !excludedIds.includes(cat._id),
    );

    return children.map((category) => {
      const categoryChildren = categoriesWithOrder.filter(
        (c) => c.parentId === category._id && !excludedIds.includes(c._id),
      );

      return (
        <div key={category._id}>
          <Select.Item value={category._id}>
            {getCategoryDisplayName(category, level)}
          </Select.Item>
          {categoryChildren.length > 0 &&
            renderCategoryOptions(category._id, level + 1)}
        </div>
      );
    });
  };

  const ROOT_VALUE = '__root__';

  const handleValueChange = (value: string) => {
    if (value === ROOT_VALUE) {
      onSelect(undefined);
    } else {
      onSelect(value);
    }
  };

  return (
    <Select value={selected || ROOT_VALUE} onValueChange={handleValueChange}>
      <Select.Trigger>
        <Select.Value placeholder="Select parent category (optional)" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ROOT_VALUE}>None (Root Category)</Select.Item>
        {renderCategoryOptions()}
      </Select.Content>
    </Select>
  );
};

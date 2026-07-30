import { Label, MultipleSelector, MultiSelectOption } from 'erxes-ui';
import { useMemo } from 'react';
import { MtoCategory } from '@/category/types/category';

interface EventCategoryMultiSelectProps {
  label: string;
  options: MtoCategory[];
  selectedIds: string[];
  getLabel: (category: MtoCategory) => string;
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function EventCategoryMultiSelect({
  label,
  options,
  selectedIds,
  getLabel,
  onChange,
  placeholder,
}: EventCategoryMultiSelectProps) {
  const selectOptions = useMemo<MultiSelectOption[]>(
    () =>
      options.map((category) => ({
        value: category._id,
        label: getLabel(category),
      })),
    [getLabel, options],
  );

  const selectedOptions = useMemo(
    () =>
      selectOptions.filter((option) => selectedIds.includes(option.value)),
    [selectOptions, selectedIds],
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <MultipleSelector
        value={selectedOptions}
        options={selectOptions}
        placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
        hidePlaceholderWhenSelected
        emptyIndicator="No categories found"
        onChange={(nextOptions) =>
          onChange(nextOptions.map((option) => option.value))
        }
      />
    </div>
  );
}

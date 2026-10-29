import { TagsSelect } from './TagsSelect';

type SelectTagsProps = {
  tagType?: string;
  value?: string[] | string;
  onValueChange?: (value: string[] | string) => void;
  mode?: 'single' | 'multiple';
  targetIds?: string[];
  scope?: string;
  className?: string;
};

const toIds = (value?: string[] | string) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const SelectTags = ({
  tagType,
  value,
  onValueChange,
  mode = 'single',
  targetIds,
  scope,
  className,
}: SelectTagsProps) => {
  if (mode === 'multiple') {
    return (
      <TagsSelect
        type={tagType || null}
        mode="multiple"
        value={toIds(value)}
        onValueChange={(next) => onValueChange?.(next)}
        targetIds={targetIds}
        scope={scope}
        variant="outline"
        className={className}
        showValue
      />
    );
  }

  return (
    <TagsSelect
      type={tagType || null}
      mode="single"
      value={toIds(value)[0]}
      onValueChange={(next) => onValueChange?.(next || '')}
      targetIds={targetIds}
      scope={scope}
      variant="outline"
      className={className}
      showValue
    />
  );
};

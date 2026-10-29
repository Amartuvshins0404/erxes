import { IconChevronRight, IconTrash } from '@tabler/icons-react';
import { Badge, Button } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useSegmentNodeValue } from '../../hooks/useSegmentNodeValue';
import { TNodePath } from '../../types';
import { TSegmentNode } from '../../types/segmentNode';

export const SegmentGroupSummary = ({
  path,
  onEnter,
  onRemove,
}: {
  path: TNodePath;
  onEnter: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation('segment', { keyPrefix: 'detail' });

  const node = useSegmentNodeValue<TSegmentNode>(path);

  const children = node?.kind === 'group' ? node.children.length : 0;
  const isAnd = node?.kind === 'group' ? node.conjunction !== 'or' : true;

  return (
    <div className="flex flex-row items-center gap-2 py-1">
      <Button
        variant="outline"
        onClick={onEnter}
        className="h-auto min-w-0 flex-auto justify-start gap-2 rounded-lg px-3 py-2 text-left font-normal"
      >
        <Badge
          variant={isAnd ? 'success' : 'warning'}
          className="shrink-0 rounded-full uppercase"
        >
          {isAnd ? t('and') : t('or')}
        </Badge>
        <span className="flex-auto truncate text-muted-foreground">
          {t('group-of-conditions', { count: children })}
        </span>
        <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        type="button"
        title={t('remove-group')}
        onClick={onRemove}
        className="shrink-0 text-destructive"
      >
        <IconTrash />
      </Button>
    </div>
  );
};

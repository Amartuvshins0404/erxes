import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, DragHandle } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { TNodePath } from '../../types';

export const SegmentSortableNode = ({
  path,
  children,
}: {
  path: TNodePath;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation('segment', { keyPrefix: 'detail' });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: path });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex items-start gap-1 group/sortable',
        isDragging && 'relative z-10 opacity-60',
      )}
    >
      <DragHandle
        title={t('move-condition')}
        className={cn(
          'mt-2.5 touch-none opacity-0 transition-opacity focus-visible:opacity-100 group-hover/sortable:opacity-100',
          isDragging && 'opacity-100',
        )}
        {...attributes}
        {...listeners}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  rectIntersection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';
import {
  BoardCardProps,
  BoardColumnProps,
  BoardContextProps,
  BoardHeaderProps,
  BoardItemProps,
  BoardProps,
  BoardProviderProps,
} from '../types/boardTypes';
import { Portal } from 'radix-ui';
import { type HTMLAttributes, useContext } from 'react';
import { BoardContext } from '../contexts/BoardContext';
import {
  activeCardIdState,
  dragOverBoardColumnIdState,
} from '../states/boardStates';
import { useAtomValue, useSetAtom } from 'jotai';
import { AnimatePresence, motion } from 'motion/react';
export type { DragEndEvent } from '@dnd-kit/core';

const BoardCards = ({
  id,
  children,
  className,
  items,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  id: string;
  children: React.ReactNode;
  className?: string;
  items: string[];
}) => {
  return (
    <ScrollArea className="overflow-hidden">
      <SortableContext items={items}>
        <div
          className={cn(
            'flex grow flex-col gap-2 p-2 pt-px relative',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SortableContext>
      <ScrollArea.Bar orientation="vertical" />
    </ScrollArea>
  );
};

const BoardCard = <T extends BoardItemProps = BoardItemProps>({
  id,
  children,
  className,
}: BoardCardProps<T>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'card',
      id,
    },
  });
  const { boardId } = useContext(BoardContext) as BoardContextProps;
  const activeCardId = useAtomValue(activeCardIdState(boardId));
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };
  return (
    <>
      <div
        style={style}
        {...listeners}
        {...attributes}
        ref={setNodeRef}
        data-type="card"
      >
        <div
          className={cn(
            'gap-4 rounded-xl bg-card shadow-card outline-hidden transition-shadow hover:shadow-sm',
            isDragging && 'pointer-events-none cursor-grabbing opacity-30',
            className,
          )}
        >
          {children}
        </div>
      </div>
      {activeCardId === id && (
        <Portal.Root asChild>
          <div>
            <DragOverlay>
              <div
                className={cn(
                  'cursor-grab gap-4 rounded-xl bg-card shadow-lg',
                  isDragging && 'cursor-grabbing',
                  className,
                )}
              >
                {children}
              </div>
            </DragOverlay>
          </div>
        </Portal.Root>
      )}
    </>
  );
};

const BoardProvider = <
  T extends BoardItemProps = BoardItemProps,
  C extends BoardColumnProps = BoardColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  boardId,
  emptyUrl,
  fallbackComponent,
  ...props
}: BoardProviderProps<T, C>) => {
  const setActiveCardId = useSetAtom(activeCardIdState(boardId));
  const setDragOverBoardColumnId = useSetAtom(
    dragOverBoardColumnIdState(boardId),
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = data.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(event.active.id as string);
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItem = data.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overItem = data.find((item) => item.id === over.id);

    if (overItem) {
      setDragOverBoardColumnId(overItem.column as string);
    } else {
      setDragOverBoardColumnId(null);
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    setDragOverBoardColumnId(null);
    onDragEnd?.(event);
  };

  if (!columns || columns.length === 0) {
    if (!fallbackComponent) return null;
    return fallbackComponent;
  }

  return (
    <BoardContext.Provider value={{ columns, data, boardId }}>
      <DndContext
        collisionDetection={rectIntersection}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
        {...props}
      >
        <div
          className={cn(
            'flex flex-auto gap-3 overflow-x-auto p-4 pb-0 styled-scroll',
            className,
          )}
        >
          {columns.map((column) => children(column))}
        </div>
      </DndContext>
    </BoardContext.Provider>
  );
};

export const BoardHeader = ({ className, ...props }: BoardHeaderProps) => (
  <div
    className={cn(
      'm-0 px-3 min-h-11 flex-none font-medium text-sm flex items-center justify-between',
      className,
    )}
    {...props}
  />
);

export const BoardRoot = ({
  id,
  children,
  className,
  sortBy,
  isSorted,
}: BoardProps & { sortBy?: string; isSorted?: boolean }) => {
  const { boardId } = useContext(BoardContext) as BoardContextProps;
  const dragOverBoardColumnId = useAtomValue(
    dragOverBoardColumnIdState(boardId),
  );
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      id,
    },
  });

  const isActive = isOver || dragOverBoardColumnId === id;

  return (
    <div
      ref={setNodeRef}
      data-type="column"
      className={cn(
        'relative flex min-h-[400px] min-w-80 flex-col overflow-hidden rounded-2xl bg-muted/50 transition-shadow',
        isActive && 'shadow-subtle',
        className,
      )}
    >
      {children}
      {!isSorted && (
        <AnimatePresence>
          {(isOver || dragOverBoardColumnId === id) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 top-11 flex items-center justify-center rounded-2xl bg-background/40 text-sm text-muted-foreground backdrop-blur-xs"
            >
              Board ordered by
              <span className="ml-1 font-medium capitalize text-foreground">
                {sortBy}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export const Board = Object.assign(BoardRoot, {
  Provider: BoardProvider,
  Header: BoardHeader,
  Cards: BoardCards,
  Card: BoardCard,
});

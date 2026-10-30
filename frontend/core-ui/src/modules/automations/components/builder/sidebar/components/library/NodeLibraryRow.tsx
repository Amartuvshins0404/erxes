import {
  useDnDActions,
  useDnDMetaState,
} from '@/automations/context/AutomationBuilderDnDProvider';
import { TDraggingNode } from '@/automations/components/builder/sidebar/states/automationNodeLibrary';
import { AutomationNodeType } from '@/automations/types';
import { getNodeColor } from '@/automations/utils/automationBuilderUtils/getNodeColor';
import { cn, Command, IconComponent, Tooltip } from 'erxes-ui';
import React from 'react';

export type TNodeLibraryRowItem = {
  type: string;
  label: string;
  description?: string;
  icon?: string;
} & Record<string, any>;

interface NodeLibraryRowProps {
  item: TNodeLibraryRowItem;
  nodeType: AutomationNodeType;
  draggable?: boolean;
  rightElement?: React.ReactNode;
  onDragStart?: (
    event: React.DragEvent<HTMLDivElement>,
    node: TDraggingNode,
  ) => void;
  onSelectNode: (
    node: TNodeLibraryRowItem & { nodeType: AutomationNodeType },
  ) => void;
}

const createDragGhost = ({
  label,
  nodeType,
  iconMarkup,
}: {
  label: string;
  nodeType: AutomationNodeType;
  iconMarkup: string;
}) => {
  const ghost = document.createElement('div');
  ghost.className =
    'pointer-events-none fixed -left-[1000px] -top-[1000px] z-[9999]';

  const card = document.createElement('div');
  card.className =
    'flex min-w-40 items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground shadow-lg';

  const icon = document.createElement('div');
  icon.className = cn(
    'flex size-8 items-center justify-center rounded-lg [&>svg]:size-4',
    getNodeColor(nodeType),
  );
  icon.innerHTML = iconMarkup;

  const text = document.createElement('div');
  text.className = 'flex min-w-0 flex-col gap-0.5';

  const kind = document.createElement('div');
  kind.className = 'text-[11px] uppercase leading-none text-muted-foreground';
  kind.textContent = nodeType;

  const name = document.createElement('div');
  name.className = 'truncate text-[13px] font-semibold';
  name.textContent = label;

  text.append(kind, name);
  card.append(icon, text);
  ghost.append(card);
  document.body.appendChild(ghost);

  return ghost;
};

export const NodeLibraryRow = ({
  item,
  onDragStart,
  onSelectNode,
  nodeType,
  draggable = true,
  rightElement,
}: NodeLibraryRowProps) => {
  const { icon: iconName, label, description } = item;
  const { hoveredRowId, draggingNode } = useDnDMetaState();
  const { setHoveredRowId, startDragging, reset } = useDnDActions();
  const rowId = `${nodeType}-${label}`;
  const isHovered = hoveredRowId === rowId;
  const isDragging =
    draggingNode?.nodeType === nodeType &&
    'label' in draggingNode &&
    draggingNode.label === label;

  return (
    <Command.Item
      value={label}
      onSelect={() => onSelectNode({ nodeType, ...item })}
      className={cn(
        'relative !h-auto w-full rounded-lg border border-border/60 bg-background !p-0 transition-[border-color,background-color] duration-150 ease-out data-[selected=true]:bg-background',
        {
          'cursor-grab': draggable && !isDragging,
          'cursor-grabbing': draggable && isDragging,
          'cursor-pointer': !draggable,
          'border-success/20 bg-success/[0.035] data-[selected=true]:bg-success/[0.035]':
            nodeType === AutomationNodeType.Action && isHovered,
          'border-primary/20 bg-primary/[0.035] data-[selected=true]:bg-primary/[0.035]':
            nodeType === AutomationNodeType.Trigger && isHovered,
          'border-info/20 bg-info/[0.035] data-[selected=true]:bg-info/[0.035]':
            nodeType === AutomationNodeType.Workflow && isHovered,
          'border-success/30 bg-success/5 data-[selected=true]:bg-success/5':
            nodeType === AutomationNodeType.Action && isDragging,
          'border-primary/30 bg-primary/5 data-[selected=true]:bg-primary/5':
            nodeType === AutomationNodeType.Trigger && isDragging,
        },
      )}
      draggable={draggable}
      onMouseEnter={() => setHoveredRowId(rowId)}
      onMouseLeave={() => {
        setHoveredRowId(null);
      }}
      onDragStart={
        draggable
          ? (event) => {
              const draggingNode = { nodeType, ...item } as TDraggingNode;

              startDragging(draggingNode);

              const iconElement = event.currentTarget.querySelector(
                '.node-library-row-icon',
              ) as HTMLElement | null;

              const ghost = createDragGhost({
                label,
                nodeType,
                iconMarkup: iconElement?.innerHTML || '<span>+</span>',
              });

              event.dataTransfer.setDragImage(ghost, 24, 20);
              onDragStart?.(event, draggingNode);

              window.setTimeout(() => {
                ghost.remove();
              }, 0);
            }
          : undefined
      }
      onDragEnd={
        draggable
          ? () => {
              setHoveredRowId(null);
              reset();
            }
          : undefined
      }
    >
      <div className="flex min-h-16 w-full items-center gap-3.5 px-4 py-1.5">
        <div
          className={cn(
            'node-library-row-icon flex size-10 shrink-0 items-center justify-center rounded-lg transition-[background-color,color] duration-150 ease-out [&>svg]:size-5',
            getNodeColor(nodeType),
          )}
        >
          <IconComponent name={iconName} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium leading-5 text-foreground">
            {label || ''}
          </div>
          {description ? (
            <Tooltip.Provider>
              <Tooltip delayDuration={400}>
                <Tooltip.Trigger asChild>
                  <p className="mt-0.5 truncate text-xs leading-4 text-muted-foreground">
                    {description}
                  </p>
                </Tooltip.Trigger>
                <Tooltip.Content
                  side="left"
                  align="start"
                  className="max-w-72 leading-4"
                >
                  {description}
                </Tooltip.Content>
              </Tooltip>
            </Tooltip.Provider>
          ) : null}
        </div>
        {rightElement}
      </div>
    </Command.Item>
  );
};

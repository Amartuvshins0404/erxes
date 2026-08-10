import {
  Icon,
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from '@tabler/icons-react';
import {
  Badge,
  cn,
  Combobox,
  Command,
  Popover,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { SortState } from './useTableSort';

// Shared record-table cells and columns for plugin resources.

// ─── Identity cell ──────────────────────────────────────────────────────────────
//
// Token-based tints for the leading glyph tile — every value is a CSS variable, so
// the tile follows the active light/dark theme with no extra wiring.

export type Tone =
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

const TILE_TINT: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

/**
 * Leading "object" cell shared by every list's primary column: a tinted glyph
 * tile whose icon + tone encode the row's kind, beside a name line and an
 * optional sub line. `name`/`sub` are nodes so callers can pass links, buttons
 * or composed text.
 */
export const IdentityCell = ({
  icon: TileIcon,
  tone = 'muted',
  name,
  sub,
}: {
  icon: Icon;
  tone?: Tone;
  name: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <RecordTableInlineCell>
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          TILE_TINT[tone],
        )}
      >
        <TileIcon className="size-4" />
      </span>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="truncate">{name}</span>
        {sub != null && sub !== '' && (
          <span className="text-xs text-muted-foreground truncate">{sub}</span>
        )}
      </div>
    </div>
  </RecordTableInlineCell>
);

// ─── Iconed badge ────────────────────────────────────────────────────────────────

/** A Badge with a leading glyph — turns flat gray chips into scannable, semantic
 *  labels. (Badge already lays out as inline-flex with a gap.) */
export const IconBadge = ({
  icon: BadgeIcon,
  variant,
  children,
  className,
}: {
  icon: Icon;
  variant?: React.ComponentProps<typeof Badge>['variant'];
  children: React.ReactNode;
  className?: string;
}) => (
  <Badge variant={variant} className={className}>
    <BadgeIcon className="size-3" />
    {children}
  </Badge>
);

// ─── Sortable header ─────────────────────────────────────────────────────────────

/** Clickable column header with a sort caret. Pairs with `useTableSort`, which
 *  sorts the data array (the RecordTable provider omits getSortedRowModel). */
export const SortableHead = ({
  icon,
  label,
  columnId,
  sort,
  onSort,
}: {
  icon?: Icon;
  label: string;
  columnId: string;
  sort: SortState;
  onSort: (id: string) => void;
}) => {
  const active = sort?.id === columnId;
  const Caret = !active
    ? IconSelector
    : sort?.desc
    ? IconChevronDown
    : IconChevronUp;
  return (
    <button
      type="button"
      onClick={() => onSort(columnId)}
      className="flex items-center gap-1 w-full h-full cursor-pointer select-none group"
      aria-label={`Sort by ${label}`}
    >
      <RecordTable.InlineHead icon={icon} label={label} />
      <Caret
        className={cn(
          'size-3.5 shrink-0 transition-opacity',
          active
            ? 'text-foreground'
            : 'text-muted-foreground/50 opacity-0 group-hover:opacity-100',
        )}
      />
    </button>
  );
};

/** Popover-anchored "more" menu shared by every list's actions column. */
export const RowActionsMenu = ({ children }: { children: React.ReactNode }) => (
  <Popover>
    <Popover.Trigger asChild>
      <RecordTable.MoreButton className="w-full h-full" />
    </Popover.Trigger>
    <Combobox.Content
      side="right"
      align="start"
      avoidCollisions={false}
      className="w-44 min-w-0 [&>button]:cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <Command>
        <Command.List>{children}</Command.List>
      </Command>
    </Combobox.Content>
  </Popover>
);

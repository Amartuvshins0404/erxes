import { IconChevronRight, type Icon } from '@tabler/icons-react';

export const KbRow = ({
  title,
  description,
  meta,
  icon: RowIcon,
  onClick,
}: {
  title: string;
  description?: string | null;
  meta?: string;
  icon?: Icon;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus"
  >
    {RowIcon && (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <RowIcon className="size-4" />
      </span>
    )}
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-foreground">
        {title}
      </span>
      {description && (
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
          {description}
        </span>
      )}
      {meta && (
        <span className="mt-1 block text-xs text-muted-foreground">{meta}</span>
      )}
    </span>
    <IconChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
  </button>
);

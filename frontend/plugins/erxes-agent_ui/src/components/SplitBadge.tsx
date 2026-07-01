import { cva } from 'class-variance-authority';
import { cn } from 'erxes-ui';

type SplitBadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

// ── Per-layer CVA classes ──────────────────────────────────────────────────────
//
// Four distinct layers:
//   outer   — rounded border container (shape + border color)
//   label   — left segment: anchor; heavier bg, semibold text
//   divider — 1 px vertical separator
//   name    — right segment: recedes from anchor; lighter bg + weight

const outerVariants = cva(
  'inline-flex items-center rounded-sm border overflow-hidden h-6 text-xs whitespace-nowrap w-fit',
  {
    variants: {
      variant: {
        default:     'border-primary/25',
        secondary:   'border-border',
        success:     'border-success/25',
        warning:     'border-warning/25',
        destructive: 'border-destructive/25',
        info:        'border-info/25',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const labelVariants = cva(
  'px-2 flex items-center font-semibold select-none',
  {
    variants: {
      variant: {
        default:     'bg-primary/15 text-primary',
        secondary:   'bg-accent text-foreground',
        success:     'bg-success/15 text-success',
        warning:     'bg-warning/15 text-warning',
        destructive: 'bg-destructive/15 text-destructive',
        info:        'bg-info/15 text-info',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const dividerVariants = cva('self-stretch w-px shrink-0', {
  variants: {
    variant: {
      default:     'bg-primary/20',
      secondary:   'bg-border',
      success:     'bg-success/20',
      warning:     'bg-warning/20',
      destructive: 'bg-destructive/20',
      info:        'bg-info/20',
    },
  },
  defaultVariants: { variant: 'default' },
});

const nameVariants = cva('px-2 flex items-center font-medium', {
  variants: {
    variant: {
      default:     'bg-primary/5   text-primary/75',
      secondary:   'bg-accent/50   text-foreground/65',
      success:     'bg-success/5   text-success/75',
      warning:     'bg-warning/5   text-warning/75',
      destructive: 'bg-destructive/5 text-destructive/75',
      info:        'bg-info/5      text-info/75',
    },
  },
  defaultVariants: { variant: 'default' },
});

// ── Public API ─────────────────────────────────────────────────────────────────

export interface SplitBadgeProps {
  /** Scope-type label in the left (anchor) segment — e.g. "Department". */
  label: string;
  /** Entity name in the right segment — e.g. "Sales". Omit for label-only. */
  name?: string | null;
  /** Color variant, matching Badge variant names. Defaults to 'default'. */
  variant?: SplitBadgeVariant;
  className?: string;
}

/**
 * Connected pill that shows scope type and entity name as one visual unit:
 * [ Department | Sales ]. When `name` is absent the right segment and divider
 * are omitted, rendering as a plain single-segment badge.
 */
export const SplitBadge = ({
  label,
  name,
  variant = 'default',
  className,
}: SplitBadgeProps) => {
  return (
    <div
      role="img"
      className={cn(outerVariants({ variant }), className)}
      aria-label={name ? `${label}: ${name}` : label}
    >
      <span className={labelVariants({ variant })}>{label}</span>
      {name && (
        <>
          <span className={dividerVariants({ variant })} aria-hidden />
          <span className={nameVariants({ variant })}>{name}</span>
        </>
      )}
    </div>
  );
};

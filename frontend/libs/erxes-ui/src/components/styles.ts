export const fieldClassName =
  'flex w-full min-w-0 items-center rounded-lg bg-card text-sm text-foreground shadow-button-outline outline-hidden transition-[color,background-color,box-shadow] ease-out placeholder:text-muted-foreground hover:shadow-[0_0_0_1px_var(--border-strong),0_1px_2px_var(--shadow)] focus-visible:shadow-focus aria-invalid:shadow-focus-destructive disabled:cursor-not-allowed disabled:opacity-50';

export const floatingAnimationClassName =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 duration-150 ease-out';

export const floatingSurfaceClassName =
  'z-50 rounded-2xl bg-popover text-popover-foreground shadow-lg outline-hidden';

export const menuContentClassName =
  'z-50 min-w-48 overflow-hidden rounded-2xl bg-popover p-1.5 text-sm text-popover-foreground shadow-lg outline-hidden';

export const menuItemClassName =
  'relative flex h-8 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-sm text-popover-foreground outline-hidden transition-colors ease-out focus:bg-accent data-highlighted:bg-accent data-[state=open]:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

export const menuLabelClassName =
  'px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted-foreground';

export const menuSeparatorClassName = '-mx-1.5 my-1.5 h-px bg-border';

export const fieldSizeClassNames = {
  sm: 'h-7 px-2.5',
  default: 'h-8 px-3',
  lg: 'h-9 px-3.5',
} as const;

export type FieldSize = keyof typeof fieldSizeClassNames;

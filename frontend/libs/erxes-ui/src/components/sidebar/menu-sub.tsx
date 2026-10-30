import * as React from 'react';

import { SidebarTreeIndicator } from 'erxes-ui/components/sidebar-tree-indicator';
import { Slot } from 'radix-ui';
import { cn } from 'erxes-ui/lib/utils';
import { useComposedRef } from './hooks';

export const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, children, ...props }, ref) => {
  const [subRef, setRefs] = useComposedRef(ref);

  return (
    <ul
      ref={setRefs}
      data-sidebar="menu-sub"
      className={cn(
        'relative ml-4 flex min-w-0 translate-x-px flex-col gap-0.5 border-l border-border py-0.5 pl-2',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    >
      <SidebarTreeIndicator as="li" containerRef={subRef} />
      {children}
    </ul>
  );
});
SidebarMenuSub.displayName = 'SidebarMenuSub';

export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

export const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<'a'> & {
    asChild?: boolean;
    size?: 'sm' | 'md';
    isActive?: boolean;
  }
>(({ asChild = false, size = 'md', isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'flex h-7 min-w-0 -translate-x-px cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-2.5 text-muted-foreground outline-hidden transition-colors ease-out hover:bg-accent hover:text-foreground focus-visible:shadow-focus active:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground [&>svg]:transition-transform active:[&>svg]:scale-90',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

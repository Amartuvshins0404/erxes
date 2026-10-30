import { Separator, Tabs, Tooltip } from 'erxes-ui/components';
import {
  SideMenuContext,
  useSideMenuContext,
} from '../context/SideMenuContext';
import { forwardRef, useState } from 'react';

import { Icon } from '@tabler/icons-react';
import { cn } from 'erxes-ui/lib/utils';

export const SideMenuRoot = forwardRef<
  React.ElementRef<typeof Tabs>,
  React.ComponentProps<typeof Tabs>
>(({ className, defaultValue, ...props }, ref) => {
  const [activeTab, setActiveTab] = useState<string | undefined>(defaultValue);
  return (
    <SideMenuContext.Provider value={{ activeTab, setActiveTab }}>
      <Tabs
        ref={ref}
        className={cn('flex', className)}
        orientation="horizontal"
        value={activeTab || undefined}
        {...props}
      >
        {props.children}
      </Tabs>
    </SideMenuContext.Provider>
  );
});
SideMenuRoot.displayName = 'SideMenuRoot';

export const SideMenuContent = forwardRef<
  React.ElementRef<typeof Tabs.Content>,
  React.ComponentProps<typeof Tabs.Content>
>(({ className, children, ...props }, ref) => {
  const { activeTab } = useSideMenuContext();
  if (!activeTab) {
    return null;
  }

  return (
    <Tabs.Content
      ref={ref}
      className={cn(
        'w-full flex-col overflow-hidden bg-background transition-[width] data-[state=active]:flex data-[state=active]:w-80 data-[state=active]:border-l',
        className,
      )}
      {...props}
    >
      {children}
    </Tabs.Content>
  );
});
SideMenuContent.displayName = 'SideMenuContent';

export const SideMenuContentHeader = forwardRef<
  React.ElementRef<'div'>,
  React.ComponentProps<'div'> & {
    Icon?: Icon;
    label?: string;
    hideSeparator?: boolean;
  }
>(({ className, Icon, label, children, hideSeparator, ...props }, ref) => {
  return (
    <>
      <div
        ref={ref}
        data-side-menu-header=""
        className={cn(
          'flex h-11 flex-none items-center gap-2 bg-background px-4',
          className,
        )}
        {...props}
      >
        {!!Icon && (
          <Icon className="size-4 flex-none text-muted-foreground" />
        )}
        <div className="mr-auto text-sm font-semibold tracking-tight">{label}</div>
        {children}
      </div>
      {!hideSeparator && <Separator />}
    </>
  );
});
SideMenuContentHeader.displayName = 'SideMenuContentHeader';

export const SideMenuSidebar = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Tabs.List>
>(({ className, ...props }, ref) => {
  return (
    <Tabs.List
      ref={ref}
      className={cn(
        'flex h-full w-12 flex-none flex-col items-center justify-start gap-1 border-l bg-background py-2',
        className,
      )}
      {...props}
    >
      <Tooltip.Provider>{props.children}</Tooltip.Provider>
    </Tabs.List>
  );
});
SideMenuSidebar.displayName = 'SideMenuSidebar';

export const SideMenuTrigger = forwardRef<
  React.ElementRef<typeof Tabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof Tabs.Trigger> & {
    label?: string;
    Icon?: Icon;
  }
>(({ className, Icon, label, ...props }, ref) => {
  const { activeTab, setActiveTab } = useSideMenuContext();
  return (
    <Tooltip>
      <Tabs.Trigger
        ref={ref}
        className={cn(
          'size-9 rounded-xl bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:after:hidden data-[state=active]:hover:bg-primary/15 [&_svg]:size-[18px]',
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          setActiveTab(activeTab === props.value ? undefined : props.value);
        }}
        {...props}
        asChild
      >
        <Tooltip.Trigger>
          {!!Icon && <Icon className="flex-none" />}
        </Tooltip.Trigger>
      </Tabs.Trigger>

      <Tooltip.Content side="left">{label}</Tooltip.Content>
    </Tooltip>
  );
});

export const SideMenu = Object.assign(SideMenuRoot, {
  Sidebar: SideMenuSidebar,
  Content: SideMenuContent,
  Header: SideMenuContentHeader,
  Trigger: SideMenuTrigger,
});

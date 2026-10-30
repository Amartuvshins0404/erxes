import React from 'react';
import { cn } from 'erxes-ui/lib';

export const PagePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-page-panel=""
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden text-card-foreground not-has-[[data-app-layout]]:rounded-2xl not-has-[[data-app-layout]]:bg-card not-has-[[data-app-layout]]:shadow-card not-has-[[data-app-layout]]:[--background:var(--card)]',
        className,
      )}
      {...props}
    />
  );
});

PagePanel.displayName = 'PagePanel';

export const PageContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
  }
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  );
});

PageContainer.displayName = 'PageContainer';

export const PageSubHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-auto min-h-11 flex-none items-center gap-2 border-b px-3 py-1.5',
        className,
      )}
      {...props}
    />
  );
});

PageSubHeader.displayName = 'PageSubHeader';

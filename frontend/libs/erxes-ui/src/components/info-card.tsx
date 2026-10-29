import { IconInfoCircle } from '@tabler/icons-react';
import { cn } from 'erxes-ui/lib';
import { Button } from './button';
import { Tooltip } from './tooltip';
import React from 'react';

const InfoCardRoot = ({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-muted p-1 pt-0 shadow-2xs',
        className,
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between pl-3 pr-1">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {!!description && (
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                >
                  <IconInfoCircle className="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>{description}</Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        )}
      </div>
      {children}
    </div>
  );
};

const InfoCardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-auto flex-col gap-3 rounded-xl bg-card p-4 shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
InfoCardContent.displayName = 'InfoCardContent';

export const InfoCard = Object.assign(InfoCardRoot, {
  Content: InfoCardContent,
});

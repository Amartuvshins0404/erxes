import { buttonVariants } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { mergeRefs } from 'react-merge-refs';

export const SuggestionMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      'w-72 overflow-hidden rounded-2xl bg-popover p-1.5 shadow-lg outline-hidden',
      className,
    )}
  >
    <div className="flex h-full flex-col gap-0.5 overflow-auto">{children}</div>
  </div>
));

export const SuggestionMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isSelected: boolean }
>(({ isSelected, ...props }, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const { ref: inViewRef, inView } = useInView();
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (isSelected && !inView && isMounted) {
      itemRef.current?.scrollIntoView({
        block: 'nearest',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected]);

  return (
    <div
      ref={mergeRefs([itemRef, inViewRef, ref])}
      {...props}
      onMouseDown={(e) => {
        e.preventDefault();
        props.onMouseDown?.(e);
      }}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'lg' }),
        'h-auto min-h-8 justify-between rounded-lg px-2 py-1.5 font-normal [&>svg]:size-4 hover:bg-accent',
        isSelected && 'bg-accent text-foreground',
        props.className,
      )}
    />
  );
});

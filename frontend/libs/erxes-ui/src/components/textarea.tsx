import * as React from 'react';

import { cn } from 'erxes-ui/lib/utils';
import { fieldClassName } from './styles';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        fieldClassName,
        'block min-h-20 resize-y px-3 py-2 leading-relaxed',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

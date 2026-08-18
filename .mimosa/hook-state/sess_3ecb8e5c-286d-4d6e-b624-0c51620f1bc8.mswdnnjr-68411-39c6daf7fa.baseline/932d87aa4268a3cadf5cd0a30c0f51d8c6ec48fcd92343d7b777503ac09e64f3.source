import { BlockStatusIcons } from '@/status/constants';
import { type Icon } from '@tabler/icons-react';
import { cn } from 'erxes-ui';
import React from 'react';

export const StatusInlineIcon = ({
  statusType,
  className,
  color,
  ...props
}: React.ComponentProps<Icon> & { statusType?: string }) => {
  const IconComponent = statusType ? BlockStatusIcons[statusType] : null;

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      {...props}
      color={color ? color : undefined}
      className={cn('size-4 flex-none', className)}
    />
  );
};

StatusInlineIcon.displayName = 'StatusInlineIcon';

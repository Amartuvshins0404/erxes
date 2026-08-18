import { BlockContractStatusIcons } from '@/contract-status/constants';
import { type Icon } from '@tabler/icons-react';
import { cn } from 'erxes-ui';
import React from 'react';

export const ContractStatusInlineIcon = ({
  statusType,
  className,
  color,
  ...props
}: React.ComponentProps<Icon> & { statusType?: string }) => {
  const IconComponent = statusType ? BlockContractStatusIcons[statusType] : null;

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

ContractStatusInlineIcon.displayName = 'ContractStatusInlineIcon';

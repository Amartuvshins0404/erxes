import { IconDotsVertical } from '@tabler/icons-react';
import { Button, DropdownMenu } from 'erxes-ui';
import DeveloperVisibilityControl from '@/developer/components/control/DeveloperVisibilityControl';

export const DeveloperDetailActions = () => {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">
          <IconDotsVertical />
          Actions
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-48" align="end">
        <DeveloperVisibilityControl />
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { useUpdateDeveloperInfo } from '@/block/hooks/useUpdateDeveloperInfo';
import { IconArrowUp, IconDotsVertical } from '@tabler/icons-react';
import { Button, DropdownMenu } from 'erxes-ui';
import { useParams } from 'react-router';

export const DeveloperDetailActions = () => {
  const { id } = useParams();
  const { developerInfo } = useDeveloperInfo(id);

  const { updateDeveloperInfoMutation } = useUpdateDeveloperInfo();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">
          <IconDotsVertical />
          Actions
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-48" align="end">
        <DropdownMenu.Item
          onClick={() => {
            updateDeveloperInfoMutation(developerInfo?._id || '', {
              isFeatured: !developerInfo?.isFeatured,
            });
          }}
        >
          <IconArrowUp />
          {developerInfo?.isFeatured ? 'Unfeature Developer' : 'Feature Developer'}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

import { IconArrowUp, IconDotsVertical } from '@tabler/icons-react';
import { Button, DropdownMenu } from 'erxes-ui';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';

export const ProjectDetailActions = () => {
  const { project } = useProjectDetail();

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

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
            updateProjectGeneralInfo(project?._id || '', {
              isPublished: false,
            });
          }}
        >
          <IconArrowUp />
          Unpublish Project
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={() => {
            updateProjectGeneralInfo(project?._id || '', {
              isFeatured: !project?.isFeatured,
            });
          }}
        >
          <IconArrowUp />
          {project?.isFeatured ? 'Unfeature Project' : 'Feature Project'}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

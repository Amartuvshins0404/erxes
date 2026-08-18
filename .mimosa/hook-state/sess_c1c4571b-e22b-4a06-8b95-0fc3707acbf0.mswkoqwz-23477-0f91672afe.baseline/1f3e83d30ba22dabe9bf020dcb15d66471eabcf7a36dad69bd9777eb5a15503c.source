import { BLOCK_GET_PROJECT_LIST } from '@/project/graphql/projectQueries';
import { useRemoveProject } from '@/project/hooks/useRemoveProject';
import { IconArrowUp, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { Button, DropdownMenu, toast, useConfirm } from 'erxes-ui';
import { useNavigate, useParams } from 'react-router-dom';
import { usePublishProject } from '../hooks/usePublishProject';
import { useProjectDetail } from '../hooks/useProjectDetail';

export const ProjectDetailActions = () => {
  const { project } = useProjectDetail();
  const { confirm } = useConfirm();
  const { removeProject } = useRemoveProject();
  const { publishProject } = usePublishProject();
  const navigate = useNavigate();

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
            publishProject(project?._id || '', !project?.isPublished);
          }}
        >
          <IconArrowUp />
          {project?.isPublished ? 'Unpublish Project' : 'Publish Project'}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          className="text-destructive"
          onClick={() =>
            confirm({
              message: 'Are you sure you want to delete this project?',
              options: {
                okLabel: 'Delete',
              },
            }).then(() => {
              removeProject({
                variables: { id: project?._id || '' },
                refetchQueries: [{ query: BLOCK_GET_PROJECT_LIST }],
                onCompleted: () => {
                  navigate('/block/projects');
                  toast({
                    title: 'Success',
                    description: 'Project deleted successfully',
                  });
                },
                onError: (error) => {
                  toast({
                    title: 'Error',
                    description: error.message,
                    variant: 'destructive',
                  });
                },
              });
            })
          }
        >
          <IconTrash />
          Delete Project
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

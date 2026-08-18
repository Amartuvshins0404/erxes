import { useProjects } from '@/project/hooks/useProjects';
import {
  Breadcrumb,
  Input,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
  Select,
  Skeleton,
  Tooltip,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';

export const ProjectDetailNameBreadcrumb = () => {
  const { projects, loading: projectsLoading } = useProjects(true);
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  if (projectsLoading) return <Skeleton className="w-32 h-4" />;

  if (!projects) return null;

  return (
    <>
      <Breadcrumb.Separator />
      <Breadcrumb.Page className="font-medium px-3">
        <Select
          value={projectId}
          onValueChange={(value) => {
            navigate(`/block/projects/${value}`);
          }}
        >
          <Select.Trigger className="min-w-32 bg-background">
            <Select.Value placeholder="Select project" />
          </Select.Trigger>
          <Select.Content>
            {projects?.map((project) => (
              <Select.Item key={project._id} value={project._id}>
                {project.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </Breadcrumb.Page>
    </>
  );
};

export const ProjectDetailName = ({
  name,
  id,
}: {
  name: string;
  id: string;
}) => {
  const [nameValue, setNameValue] = useState(name);
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  useEffect(() => {
    if (name) {
      setNameValue(name);
    }
  }, [name]);

  return (
    <PopoverScoped
      closeOnEnter
      onOpenChange={(open) => {
        if (!open && nameValue !== name) {
          updateProjectGeneralInfo(id || '', { name: nameValue || '' });
        }
      }}
    >
      <Tooltip.Provider delayDuration={0}>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <h1 className="text-xl font-medium leading-none hover:bg-accent">
                {name}
              </h1>
            </Popover.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>Вэб дээр харагдах албан нэр</p>
          </Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>
      <RecordTableInlineCell.Content sideOffset={-24}>
        <Input
          placeholder="Төслийн нэрийг оруулна уу"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};

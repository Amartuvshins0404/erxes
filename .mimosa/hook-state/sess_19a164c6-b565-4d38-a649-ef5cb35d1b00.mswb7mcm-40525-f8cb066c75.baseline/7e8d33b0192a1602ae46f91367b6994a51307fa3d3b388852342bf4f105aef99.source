import { useProjects } from '@/project/hooks/useProjects';
import { Breadcrumb, Select, Skeleton, Tooltip } from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
            navigate(`/blockadmin/projects/${value}`);
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

  useEffect(() => {
    if (name) {
      setNameValue(name);
    }
  }, [name]);

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <h1 className="text-xl font-medium leading-none hover:bg-accent">
            {name}
          </h1>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Edit project name</p>
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};

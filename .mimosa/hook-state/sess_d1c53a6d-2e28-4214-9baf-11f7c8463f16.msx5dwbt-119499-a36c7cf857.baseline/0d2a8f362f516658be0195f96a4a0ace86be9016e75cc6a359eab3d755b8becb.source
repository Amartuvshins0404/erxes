import { useProjects } from '@/project/hooks/useProjects';
import { IProject } from '@/project/types/projectTypes';
import { IconCheck } from '@tabler/icons-react';
import {
  Button,
  cn,
  SkeletonArray,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { useEffect } from 'react';

export const ProjectList = () => {
  const { projects, loading } = useProjects(true);
  const [projectId, setProjectId] = useQueryState<string>('projectId');

  useEffect(() => {
    if (!projectId && projects && projects.length > 0) {
      setProjectId(projects[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, setProjectId]);

  if (loading) {
    return (
      <div className="space-y-2 ml-4">
        <SkeletonArray className="w-32 h-4" count={4} />
      </div>
    );
  }

  return projects?.map((project) => (
    <ProjectItem key={project._id} {...project} />
  ));
};

export const ProjectItem = ({ _id, name }: IProject) => {
  const [{ projectId }, setQueries] = useMultiQueryState<{
    projectId: string;
    buildingId: string;
  }>(['projectId', 'buildingId']);
  const isActive = projectId === _id;

  const handleClick = () =>
    setQueries({
      projectId: _id === projectId ? null : _id,
      buildingId: null,
    });

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'justify-start pl-7 relative overflow-hidden text-left flex-auto ml-1',
        isActive && 'bg-primary/10 hover:bg-primary/10',
      )}
      onClick={handleClick}
    >
      {isActive && <IconCheck className="absolute left-1.5" />}
      {name}
    </Button>
  );
};

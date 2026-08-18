import { IconClipboardText } from '@tabler/icons-react';
import { Empty, Spinner } from 'erxes-ui';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';

export const Projects = () => {
  const { projects, loading } = useProjects();

  if (loading) {
    return <Spinner containerClassName="blk:py-32" />;
  }

  if (projects?.length === 0) {
    return (
      <Empty>
        <Empty.Header />
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconClipboardText />
          </Empty.Media>
          <Empty.Title>No projects found</Empty.Title>
          <Empty.Description>There seems to be no projects.</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-8">
      {projects?.map((project) => (
        <ProjectCard key={project._id} {...project} />
      ))}
    </div>
  );
};

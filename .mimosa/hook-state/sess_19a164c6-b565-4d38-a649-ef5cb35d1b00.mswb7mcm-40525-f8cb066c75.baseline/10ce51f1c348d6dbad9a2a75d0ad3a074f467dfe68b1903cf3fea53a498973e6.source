import { Badge, Spinner, cn } from 'erxes-ui';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { IconShieldFilled } from '@tabler/icons-react';
import { ProjectDetailName } from './ProjectDetailName';
import { ProjectDetailActions } from '@/project/components/ProjectDetailActions';

export const ProjectDetailProfile = () => {
  const { project, loading } = useProjectDetail();

  if (loading) return <Spinner containerClassName="py-12" />;

  return (
    <div className="flex border-b">
      <div className="p-8 space-y-3">
        <div className="flex items-center gap-3">
          <ProjectDetailName
            id={project?._id || ''}
            name={project?.name || ''}
          />
          <Badge
            variant={project?.status === 'on_sale' ? 'default' : 'secondary'}
          >
            <IconShieldFilled
              className={cn(
                'size-3.5',
                project?.status !== 'on_sale' && 'text-accent-foreground',
              )}
            />
            {project?.status}
          </Badge>
        </div>
        {/* <div className="flex items-center gap-2 text-accent-foreground">
          <IconClockFilled className="size-4" />
          <p className="text-sm">Last updated by Carl Marx, 2024-12-01 14:30</p>
        </div> */}
      </div>
      <div className="ml-auto p-8">
        <ProjectDetailActions />
      </div>
    </div>
  );
};

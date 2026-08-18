import { Button, Empty, Spinner } from 'erxes-ui';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { BuildingsCard } from '@/building/components/BuildingsCard';
import { Link } from 'react-router-dom';
import { IconCoin, IconPlus } from '@tabler/icons-react';

export const ProjectDetailBuildings = () => {
  const { loading, project } = useProjectDetail();

  if (loading) return <Spinner containerClassName="py-32" />;

  if (!project)
    return (
      <Empty>
        <Empty.Header>
          <Empty.Title>No project found</Empty.Title>
          <Empty.Description>There seems to be no project.</Empty.Description>
        </Empty.Header>
      </Empty>
    );

  if (!project.mainPrice) {
    return (
      <Empty>
        <Empty.Header />
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconCoin />
          </Empty.Media>
          <Empty.Title>No main price found</Empty.Title>
          <Empty.Description>Please enter main price.</Empty.Description>
          <Button variant="secondary" asChild className="bg-border">
            <Link to={`/block/projects/${project._id}?activeTab=pricing`}>
              <IconPlus />
              Add main price
            </Link>
          </Button>
        </Empty.Header>
      </Empty>
    );
  }
  return (
    <div className="p-8">
      <BuildingsCard project={project} />
    </div>
  );
};

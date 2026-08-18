import { Card, InfoCard } from 'erxes-ui';
import type { IDashboardItem } from '../types/dashboard';
import { DASHBOARD_TABS } from '../constants/dashboard';

interface CardProps extends IDashboardItem {
  children: React.ReactNode;
}

export const AgencyProfileDashboard = () => {
  return (
    <InfoCard title="dashboard">
      <InfoCard.Content>
        <div className="p-2 grid grid-cols-3 gap-4">
          {DASHBOARD_TABS.map((tab) => (
            <DashboardCard
              key={tab.title}
              title={tab.title}
              description={tab.description}
            >
              <div>---</div>
            </DashboardCard>
          ))}
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};

export const DashboardCard = ({
  title,
  description,
  children,
  ...props
}: CardProps &
  Omit<React.ComponentPropsWithoutRef<typeof Card>, 'children'>) => {
  return (
    <Card {...props}>
      <Card.Header>{title}</Card.Header>
      <Card.Content>{children}</Card.Content>
      <Card.Footer>
        <Card.Description>{description}</Card.Description>
      </Card.Footer>
    </Card>
  );
};

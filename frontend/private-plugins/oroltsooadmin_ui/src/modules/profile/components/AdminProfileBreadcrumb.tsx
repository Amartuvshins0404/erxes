import { IconShieldCheck } from '@tabler/icons-react';
import { Breadcrumb, Button } from 'erxes-ui';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const AdminProfileBreadcrumb = ({
  children,
}: {
  children?: ReactNode;
}) => (
  <Breadcrumb>
    <Breadcrumb.List className="gap-1">
      <Breadcrumb.Item>
        <Button variant="ghost" asChild>
          <Link to="/oroltsooadmin/profiles">
            <IconShieldCheck className="text-accent-foreground" />
            Улс төрчид
          </Link>
        </Button>
      </Breadcrumb.Item>
      {children}
    </Breadcrumb.List>
  </Breadcrumb>
);

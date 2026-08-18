import { IconClipboardTextFilled } from '@tabler/icons-react';
import { Breadcrumb, Button } from 'erxes-ui';
import { Link } from 'react-router-dom';

export const DevelopersBreadcrumb = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <Breadcrumb>
      <Breadcrumb.List className="gap-1">
        <Breadcrumb.Item>
          <Button variant="ghost" asChild>
            <Link to="/blockadmin/developers">
              <IconClipboardTextFilled className="text-accent-foreground" />
              Developers
            </Link>
          </Button>
        </Breadcrumb.Item>
        {children}
      </Breadcrumb.List>
    </Breadcrumb>
  );
};

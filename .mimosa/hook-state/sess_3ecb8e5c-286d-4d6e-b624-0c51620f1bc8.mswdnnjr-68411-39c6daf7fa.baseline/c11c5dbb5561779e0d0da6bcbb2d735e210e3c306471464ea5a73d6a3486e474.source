import { Breadcrumb, Button } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { IconClipboardTextFilled } from '@tabler/icons-react';

export const ProjectBreadcrumb = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <Breadcrumb>
      <Breadcrumb.List className="gap-1">
        <Breadcrumb.Item>
          <Button variant="ghost" asChild>
            <Link to="/block/projects">
              <IconClipboardTextFilled className="text-accent-foreground" />
              Projects
            </Link>
          </Button>
        </Breadcrumb.Item>
        {children}
      </Breadcrumb.List>
    </Breadcrumb>
  );
};

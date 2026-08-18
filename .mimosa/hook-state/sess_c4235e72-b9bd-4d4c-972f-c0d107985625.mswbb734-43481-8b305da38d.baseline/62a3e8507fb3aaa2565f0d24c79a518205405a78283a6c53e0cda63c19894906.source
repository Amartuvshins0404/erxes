import { Breadcrumb, Button } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { IconClipboardTextFilled } from '@tabler/icons-react';

export const NewsBreadcrumb = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <Breadcrumb>
      <Breadcrumb.List className="gap-1">
        <Breadcrumb.Item>
          <Button variant="ghost" asChild>
            <Link to="/btkadmin/news">
              <IconClipboardTextFilled className="text-accent-foreground" />
              News
            </Link>
          </Button>
        </Breadcrumb.Item>
        {children}
      </Breadcrumb.List>
    </Breadcrumb>
  );
};

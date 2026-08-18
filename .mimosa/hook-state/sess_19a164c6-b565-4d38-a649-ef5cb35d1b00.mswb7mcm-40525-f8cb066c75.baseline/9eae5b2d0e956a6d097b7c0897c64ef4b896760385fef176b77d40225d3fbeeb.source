import {
  IconActivity,
  IconSettings,
  IconCaretDownFilled,
} from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface MtoPageLayoutProps {
  pageName: string;
  pageIcon?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function MtoPageLayout({
  pageName,
  pageIcon,
  headerActions,
  children,
}: MtoPageLayoutProps) {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/settings/mto">
                    <IconActivity />
                    Mto
                  </Link>
                </Button>
              </Breadcrumb.Item>
              {pageName && (
                <>
                  <Breadcrumb.Separator />
                  <Breadcrumb.Item>
                    <Button variant="ghost" disabled>
                      {pageIcon}
                      {pageName}
                    </Button>
                  </Breadcrumb.Item>
                </>
              )}
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          {headerActions}
          <Button variant="outline" asChild>
            <Link to="/settings/mto">
              <IconSettings />
              Go to settings
            </Link>
          </Button>
          <Button>
            More <IconCaretDownFilled />
          </Button>
        </PageHeader.End>
      </PageHeader>
      {children}
    </PageContainer>
  );
}

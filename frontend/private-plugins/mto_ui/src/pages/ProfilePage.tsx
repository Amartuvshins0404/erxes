import { IconUser } from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer, Separator } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { ProfileForm } from '@/profile/components/ProfileForm';

export function ProfilePage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mto/profile">
                    <IconUser />
                    Profile
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex-1 overflow-auto">
        <ProfileForm />
      </div>
    </PageContainer>
  );
}

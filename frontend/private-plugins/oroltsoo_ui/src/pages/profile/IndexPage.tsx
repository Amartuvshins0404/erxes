import { IconUserStar } from '@tabler/icons-react';
import { Breadcrumb, Button, Empty, Separator, Spinner } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

import { ProfileEditor } from '@/profile/components/ProfileEditor';
import { useProfileInfo } from '@/profile/hooks/useProfileInfo';

export const IndexPage = () => {
  const { profile, loading, error } = useProfileInfo();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/oroltsoo/profile">
                    <IconUserStar />
                    Улс төрчийн профайл
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Улс төрчийн профайл']}
            icon="IconUserStar"
          />
        </PageHeader.Start>
      </PageHeader>

      {loading && !profile && <Spinner containerClassName="py-32" />}

      {error && (
        <Empty className="py-32">
          <Empty.Header>
            <Empty.Title>Профайл ачаалж чадсангүй</Empty.Title>
            <Empty.Description>{error.message}</Empty.Description>
          </Empty.Header>
        </Empty>
      )}

      {profile && <ProfileEditor profile={profile} />}
    </div>
  );
};

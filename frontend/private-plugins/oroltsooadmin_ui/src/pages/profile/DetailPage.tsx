import { IconShieldCheck } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  Empty,
  PageContainer,
  ScrollArea,
  Separator,
  Spinner,
} from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

import { AdminProfileBreadcrumb } from '@/profile/components/AdminProfileBreadcrumb';
import { AdminProfileReviewActions } from '@/profile/components/AdminProfileReviewActions';
import { AdminProfileContent } from '@/profile/components/detail/AdminProfileContent';
import { AdminProfileHeader } from '@/profile/components/detail/AdminProfileHeader';
import { useAdminProfileDetail } from '@/profile/hooks/useAdminProfileDetail';

export const DetailPage = () => {
  const { profileId } = useParams();
  const { profile, loading, error } = useAdminProfileDetail(profileId);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <AdminProfileBreadcrumb>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <span className="inline-flex items-center gap-1 px-2 text-sm">
                <IconShieldCheck className="size-4" />
                {profile?.fullName || 'Профайл'}
              </span>
            </Breadcrumb.Item>
          </AdminProfileBreadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Улс төрчид', profile?.fullName || 'Профайл']}
            icon="IconShieldCheck"
          />
        </PageHeader.Start>
        <PageHeader.End>
          {profile && (
            <AdminProfileReviewActions
              profileId={profile._id}
              reviewStatus={profile.reviewStatus}
            />
          )}
        </PageHeader.End>
      </PageHeader>

      <ScrollArea className="flex-auto bg-sidebar">
        {loading && !profile && <Spinner containerClassName="py-32" />}

        {error && (
          <Empty className="py-32">
            <Empty.Header>
              <Empty.Title>Профайл ачаалж чадсангүй</Empty.Title>
              <Empty.Description>{error.message}</Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button asChild variant="secondary">
                <Link to="/oroltsooadmin/profiles">Жагсаалт руу буцах</Link>
              </Button>
            </Empty.Content>
          </Empty>
        )}

        {profile && (
          <div className="mx-auto flex max-w-4xl flex-col gap-4 p-8">
            <AdminProfileHeader profile={profile} />
            <AdminProfileContent profile={profile} />
          </div>
        )}
        <ScrollArea.Bar orientation="horizontal" />
      </ScrollArea>
    </PageContainer>
  );
};

import { IconUserHexagon } from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer, Separator } from 'erxes-ui';
import { PageHeader, createFavoriteBreadcrumb } from 'ui-modules';
import { MemberProfile } from '~/modules/member/components/MemberProfile';

export const MemberIndexPage = () => {
  const favoriteBreadcrumb = createFavoriteBreadcrumb('Profile');

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost">
                  <IconUserHexagon />
                  Profile
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={favoriteBreadcrumb}
            icon="IconUserHexagon"
          />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex flex-1 overflow-hidden">
        <MemberProfile />
      </div>
    </PageContainer>
  );
};

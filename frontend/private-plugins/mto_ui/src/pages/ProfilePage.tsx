import { IconPlus, IconUser } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  Separator,
  Spinner,
} from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { useMtoMode } from '@/config/hooks/useMtoMode';
import { ProfileFilters } from '@/profile/components/ProfileFilters';
import { ProfileForm } from '@/profile/components/ProfileForm';
import { ProfileFormSheet } from '@/profile/components/ProfileFormSheet';
import { ProfilesRecordTable } from '@/profile/components/ProfilesRecordTable';
import { useProfiles } from '@/profile/hooks/useProfiles';

function ProfilePageHeader() {
  return (
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
  );
}

function SlaveProfilePage() {
  return (
    <PageContainer>
      <PageHeader>
        <ProfilePageHeader />
      </PageHeader>
      <div className="flex-1 overflow-auto">
        <ProfileForm />
      </div>
    </PageContainer>
  );
}

function MasterProfilesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { refetch } = useProfiles();

  return (
    <PageContainer>
      <PageHeader>
        <ProfilePageHeader />
        <PageHeader.End>
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus />
            Add Profile
          </Button>
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <ProfileFilters />
      </PageSubHeader>
      <ProfilesRecordTable />
      <ProfileFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => void refetch()}
      />
    </PageContainer>
  );
}

export function ProfilePage() {
  const { isSlaveMode, loading } = useMtoMode();

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>
          <ProfilePageHeader />
        </PageHeader>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  if (isSlaveMode) {
    return <SlaveProfilePage />;
  }

  return <MasterProfilesPage />;
}

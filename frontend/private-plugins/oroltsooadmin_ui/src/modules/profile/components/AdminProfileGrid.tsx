import { IconInbox } from '@tabler/icons-react';
import { Button, Empty, Spinner, useMultiQueryState } from 'erxes-ui';

import { useAdminProfiles } from '../hooks/useAdminProfiles';
import { AdminProfileCard } from './AdminProfileCard';

export const AdminProfileGrid = () => {
  const { profiles, pageInfo, loading, error, handleFetchMore } =
    useAdminProfiles();
  const [queries] = useMultiQueryState<{
    searchValue: string;
    reviewStatus: string;
    subdomain: string;
    synced: string;
  }>(['searchValue', 'reviewStatus', 'subdomain', 'synced']);

  const isFiltered = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  if (loading && !profiles) {
    return <Spinner containerClassName="py-32" />;
  }

  if (error) {
    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Title>Мэдээлэл ачаалж чадсангүй</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  if (!profiles?.length) {
    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Media>
            <IconInbox className="size-10 text-muted-foreground" />
          </Empty.Media>
          <Empty.Title>
            {isFiltered
              ? 'Хайлтад тохирох профайл олдсонгүй'
              : 'Ирсэн профайл алга байна'}
          </Empty.Title>
          <Empty.Description>
            {isFiltered
              ? 'Шүүлтүүрээ өөрчилж үзнэ үү.'
              : 'Улс төрч oroltsoo дээрээ профайлаа хадгалмагц энд автоматаар нэмэгдэнэ.'}
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <AdminProfileCard key={profile._id} profile={profile} />
        ))}
      </div>

      {pageInfo?.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            onClick={handleFetchMore}
            disabled={loading}
          >
            {loading && <Spinner size="sm" />}
            Цааш нь ачаалах
          </Button>
        </div>
      )}
    </div>
  );
};

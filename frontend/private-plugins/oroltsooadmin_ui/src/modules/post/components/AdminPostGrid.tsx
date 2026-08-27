import { IconInbox } from '@tabler/icons-react';
import { Button, Empty, Spinner, useMultiQueryState } from 'erxes-ui';

import { useAdminPosts } from '../hooks/useAdminPosts';
import { AdminPostCard } from './AdminPostCard';

export const AdminPostGrid = () => {
  const { posts, pageInfo, loading, error, handleFetchMore } = useAdminPosts();
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    subdomain: string;
    tag: string;
  }>(['searchValue', 'status', 'subdomain', 'tag']);

  const isFiltered = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  if (loading && !posts) {
    return <Spinner containerClassName="py-32" />;
  }

  if (error) {
    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Title>Пост ачаалж чадсангүй</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  if (!posts?.length) {
    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Media>
            <IconInbox className="size-10 text-muted-foreground" />
          </Empty.Media>
          <Empty.Title>
            {isFiltered
              ? 'Хайлтад тохирох пост олдсонгүй'
              : 'Ирсэн пост алга байна'}
          </Empty.Title>
          <Empty.Description>
            {isFiltered
              ? 'Шүүлтүүрээ өөрчилж үзнэ үү.'
              : 'Улс төрч oroltsoo дээрээ пост хадгалмагц энд автоматаар нэмэгдэнэ.'}
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <AdminPostCard key={post._id} post={post} />
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

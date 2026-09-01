import { IconCalendar, IconWorld, IconWriting } from '@tabler/icons-react';
import {
  Badge,
  BlockEditorReadOnly,
  Breadcrumb,
  Button,
  Empty,
  PageContainer,
  readImage,
  ScrollArea,
  Separator,
  Spinner,
} from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

import { AdminPostBreadcrumb } from '@/post/components/AdminPostBreadcrumb';
import { formatDate } from '@/shared/utils/format';
import { POST_STATUS_OPTIONS } from '@/post/constants/postConstants';
import { useAdminPostDetail } from '@/post/hooks/useAdminPosts';

export const DetailPage = () => {
  const { postId } = useParams();
  const { post, loading, error } = useAdminPostDetail(postId);

  const status = POST_STATUS_OPTIONS.find(
    (option) => option.value === post?.status,
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <AdminPostBreadcrumb>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <span className="inline-flex items-center gap-1 px-2 text-sm">
                <IconWriting className="size-4" />
                {post?.title || 'Пост'}
              </span>
            </Breadcrumb.Item>
          </AdminPostBreadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Постууд', post?.title || 'Пост']}
            icon="IconWriting"
          />
        </PageHeader.Start>
      </PageHeader>

      <ScrollArea className="flex-auto bg-sidebar">
        {loading && !post && <Spinner containerClassName="py-32" />}

        {error && (
          <Empty className="py-32">
            <Empty.Header>
              <Empty.Title>Пост ачаалж чадсангүй</Empty.Title>
              <Empty.Description>{error.message}</Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button asChild variant="secondary">
                <Link to="/oroltsooadmin/posts">Жагсаалт руу буцах</Link>
              </Button>
            </Empty.Content>
          </Empty>
        )}

        {post && (
          <article className="mx-auto w-full max-w-3xl p-8">
            {post.coverImage && (
              <img
                src={readImage(post.coverImage)}
                alt={post.title}
                className="mb-6 aspect-2/1 w-full rounded-lg object-cover"
              />
            )}

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{post.title}</h1>
              {status && <Badge variant={status.badge}>{status.label}</Badge>}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {post.subdomain && (
                <span className="inline-flex items-center gap-1.5">
                  <IconWorld className="size-4" />
                  {post.subdomain}
                </span>
              )}
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <IconCalendar className="size-4" />
                  {formatDate(post.publishedAt)}
                </span>
              )}
            </div>

            {!!post.tags?.length && (
              <div className="mt-3 flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {post.excerpt && (
              <p className="mt-4 text-base text-muted-foreground">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 rounded-lg border bg-background p-6">
              {post.content ? (
                <BlockEditorReadOnly content={post.content} />
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Агуулга оруулаагүй байна.
                </p>
              )}
            </div>
          </article>
        )}
        <ScrollArea.Bar orientation="horizontal" />
      </ScrollArea>
    </PageContainer>
  );
};

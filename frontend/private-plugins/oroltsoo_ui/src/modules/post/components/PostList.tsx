import {
  IconCalendar,
  IconEdit,
  IconPhotoCirclePlus,
  IconTrash,
  IconWriting,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  Empty,
  EnumCursorDirection,
  readImage,
  Spinner,
  useConfirm,
} from 'erxes-ui';

import { formatDate } from '@/shared/utils/format';
import { POST_STATUS_OPTIONS } from '../constants/postConstants';
import { usePostMutations } from '../hooks/usePostMutations';
import { usePosts } from '../hooks/usePosts';
import { IPost } from '../types/post';

const PostRow = ({
  post,
  onEdit,
}: {
  post: IPost;
  onEdit: (post: IPost) => void;
}) => {
  const { removePosts, loading } = usePostMutations();
  const { confirm } = useConfirm();
  const status = POST_STATUS_OPTIONS.find(
    (option) => option.value === post.status,
  );

  const handleDelete = () =>
    confirm({ message: `"${post.title}" постыг устгах уу?` }).then(() =>
      removePosts([post._id]),
    );

  return (
    <li className="flex gap-4 rounded-lg border bg-background p-4">
      <div className="relative flex size-24 flex-none items-center justify-center overflow-hidden rounded-md bg-accent">
        {post.coverImage ? (
          <img
            src={readImage(post.coverImage)}
            alt={post.title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <IconPhotoCirclePlus className="size-6 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-auto">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{post.title}</span>
          {status && <Badge variant={status.badge}>{status.label}</Badge>}
          {post.publishedAt && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <IconCalendar className="size-4" />
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>

        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        {!!post.tags?.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-none items-start gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(post)}>
          <IconEdit />
          Засах
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          <IconTrash />
          Устгах
        </Button>
      </div>
    </li>
  );
};

export const PostList = ({
  searchValue,
  status,
  onAdd,
  onEdit,
}: {
  searchValue?: string;
  status?: string;
  onAdd: () => void;
  onEdit: (post: IPost) => void;
}) => {
  const { posts, pageInfo, loading, error, handleFetchMore } = usePosts({
    variables: {
      searchValue: searchValue || undefined,
      status: status || undefined,
    },
  });

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
    const isFiltered = Boolean(searchValue || status);

    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Media>
            <IconWriting className="size-10 text-muted-foreground" />
          </Empty.Media>
          <Empty.Title>
            {isFiltered
              ? 'Хайлтад тохирох пост олдсонгүй'
              : 'Пост бичээгүй байна'}
          </Empty.Title>
          <Empty.Description>
            {isFiltered
              ? 'Хайлтын үг эсвэл шүүлтүүрээ өөрчилж үзнэ үү.'
              : 'Эхний нийтлэлээ бичиж эхлээрэй.'}
          </Empty.Description>
        </Empty.Header>
        {!isFiltered && (
          <Empty.Content>
            <Button onClick={onAdd}>
              <IconWriting />
              Пост нэмэх
            </Button>
          </Empty.Content>
        )}
      </Empty>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <PostRow key={post._id} post={post} onEdit={onEdit} />
        ))}
      </ul>

      {pageInfo?.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() =>
              handleFetchMore({ direction: EnumCursorDirection.FORWARD })
            }
          >
            {loading && <Spinner size="sm" />}
            Цааш нь ачаалах
          </Button>
        </div>
      )}
    </div>
  );
};

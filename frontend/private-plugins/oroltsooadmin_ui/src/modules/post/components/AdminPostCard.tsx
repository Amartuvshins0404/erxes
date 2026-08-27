import {
  IconCalendar,
  IconPhotoCirclePlus,
  IconWorld,
} from '@tabler/icons-react';
import { Badge, readImage } from 'erxes-ui';
import { Link } from 'react-router-dom';

import { formatDate } from '@/shared/utils/format';
import { POST_STATUS_OPTIONS } from '../constants/postConstants';
import { IAdminPost } from '../types/post';

export const AdminPostCard = ({ post }: { post: IAdminPost }) => {
  const status = POST_STATUS_OPTIONS.find(
    (option) => option.value === post.status,
  );

  return (
    <Link
      to={`/oroltsooadmin/posts/${post._id}`}
      className="flex flex-col gap-3 rounded-[1.25rem] border bg-accent p-2 transition-colors hover:bg-accent/70"
    >
      <div className="relative flex aspect-2/1 w-full items-center justify-center overflow-hidden rounded-xl">
        {post.coverImage ? (
          <img
            src={readImage(post.coverImage)}
            alt={post.title}
            className="absolute inset-0 object-cover object-center"
          />
        ) : (
          <IconPhotoCirclePlus className="size-8 text-muted-foreground" />
        )}
        <div className="absolute inset-0 rounded-xl border border-foreground/10" />
      </div>

      <div className="space-y-2 p-3 pt-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-medium leading-6">
            {post.title || 'Гарчиггүй'}
          </h3>
          {status && (
            <Badge variant={status.badge} className="flex-none">
              {status.label}
            </Badge>
          )}
        </div>

        {post.excerpt && (
          <p className="line-clamp-2 text-sm text-accent-foreground">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-accent-foreground">
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
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

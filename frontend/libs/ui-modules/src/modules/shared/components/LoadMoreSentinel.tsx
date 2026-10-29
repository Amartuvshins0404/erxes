import { cn, Spinner } from 'erxes-ui';
import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export const LoadMoreSentinel = ({
  hasMore,
  loading,
  onLoadMore,
  className,
  rootMargin = '200px',
}: {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  className?: string;
  rootMargin?: string;
}) => {
  const { ref, inView } = useInView({ rootMargin, skip: !hasMore });
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (inView && hasMore && !loading) onLoadMoreRef.current();
  }, [inView, hasMore, loading]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      className={cn('flex h-12 w-full items-center justify-center', className)}
    >
      {loading && <Spinner size="sm" />}
    </div>
  );
};

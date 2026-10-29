import { cn, Spinner } from 'erxes-ui';
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
  const { ref } = useInView({
    rootMargin,
    skip: !hasMore,
    onChange: (inView) => {
      if (inView && !loading) onLoadMore();
    },
  });

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

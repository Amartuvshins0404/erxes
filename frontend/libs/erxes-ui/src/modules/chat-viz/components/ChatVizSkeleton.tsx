import { Skeleton } from 'erxes-ui/components/skeleton';
import { cn } from 'erxes-ui/lib/utils';

export function ChatVizSkeleton({
  shape = 'wide',
}: Readonly<{ shape?: 'wide' | 'square' }>) {
  return (
    <Skeleton
      className={cn(
        'w-full rounded-xl',
        shape === 'square' ? 'aspect-square max-w-[300px]' : 'aspect-video',
      )}
      aria-hidden
    />
  );
}

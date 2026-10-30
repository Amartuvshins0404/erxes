import { Empty, cn } from 'erxes-ui';
import { IconFolderOpen } from '@tabler/icons-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = IconFolderOpen,
  title,
  description,
  className,
}: Readonly<EmptyStateProps>) {
  return (
    <Empty className={cn('h-[60vh]', className)}>
      <Empty.Header>
        <Empty.Media
          variant="icon"
          className="size-12 rounded-full text-muted-foreground shadow-none"
        >
          <Icon />
        </Empty.Media>
        {title && <Empty.Title>{title}</Empty.Title>}
        {description && <Empty.Description>{description}</Empty.Description>}
      </Empty.Header>
    </Empty>
  );
}

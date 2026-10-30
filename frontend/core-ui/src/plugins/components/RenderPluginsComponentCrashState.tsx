import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { FallbackProps } from 'react-error-boundary';

export const RenderPluginsComponentCrashState = ({
  resetErrorBoundary,
}: FallbackProps) => (
  <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
    <IconAlertTriangle className="size-4 shrink-0 text-warning" />
    <span className="flex-1">This part failed to show</span>
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={resetErrorBoundary}
    >
      <IconRefresh />
      Try again
    </Button>
  </div>
);

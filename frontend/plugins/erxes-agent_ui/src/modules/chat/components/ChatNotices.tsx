import {
  IconAlertTriangle,
  IconFileUpload,
  IconMessageCircle,
  IconReload,
  IconSparkles,
} from '@tabler/icons-react';
import { Button, Empty } from 'erxes-ui';

// Drag-over affordance shown while files are dragged onto the chat area.
export const DropOverlay = () => (
  <div className="ea-pop absolute inset-3 z-20 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/6 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 pointer-events-none">
    <IconFileUpload className="size-9 text-primary" />
    <p className="text-sm font-medium text-primary">Drop files to attach</p>
    <p className="text-xs text-muted-foreground">
      images · PDF · Excel · Word · CSV
    </p>
  </div>
);

// Ambient blob backdrop shown behind the chat while a reply streams.
export const AmbientBackdrop = () => (
  <div
    aria-hidden
    className="ea-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden"
  >
    <span className="ea-ambient-blob ea-ambient-blob-1" />
    <span className="ea-ambient-blob ea-ambient-blob-2" />
  </div>
);

// Empty state shown before an agent is selected.
export const SelectAgentEmpty = () => (
  <div className="flex-1 flex items-center justify-center">
    <Empty>
      <Empty.Header>
        <Empty.Media variant="icon">
          <IconMessageCircle />
        </Empty.Media>
        <Empty.Title>Select an agent</Empty.Title>
        <Empty.Description>
          Choose an agent from the sidebar to start a conversation.
        </Empty.Description>
      </Empty.Header>
    </Empty>
  </div>
);

// Inline banner for a turn that errored mid-stream, with a retry action.
export const ChatErrorBanner = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) => (
  <div className="max-w-3xl mx-auto w-full px-3 pb-1.5">
    <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/8 px-3 py-2 text-xs">
      <IconAlertTriangle className="size-4 shrink-0 text-destructive" />
      <span
        className="min-w-0 flex-1 truncate text-destructive"
        title={message}
      >
        {message || 'Something went wrong generating a response.'}
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="h-6 shrink-0"
        onClick={onRetry}
      >
        <IconReload className="size-3.5" />
        Retry
      </Button>
    </div>
  </div>
);

// Banner surfacing a draft skill the make_skill tool produced mid-conversation.
export const SkillDraftBanner = ({
  name,
  onReview,
  onDismiss,
}: {
  name?: string;
  onReview: () => void;
  onDismiss: () => void;
}) => (
  <div className="max-w-3xl mx-auto w-full px-3 pb-1.5">
    <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/8 px-3 py-1.5 text-xs">
      <IconSparkles className="size-4 text-primary" />
      <span className="flex-1 text-primary">
        A draft skill
        {name ? <span className="font-mono"> /{name}</span> : null}{' '}
        was created from this conversation.
      </span>
      <Button size="sm" variant="secondary" className="h-6" onClick={onReview}>
        Review
      </Button>
      <Button size="sm" variant="ghost" className="h-6" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  </div>
);

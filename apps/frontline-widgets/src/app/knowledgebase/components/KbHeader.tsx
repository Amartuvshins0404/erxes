import { IconArrowLeft, IconSearch, IconX } from '@tabler/icons-react';
import { Button, Input, cn } from 'erxes-ui';
import { TKbTopic } from '../types/knowledgeBaseTypes';
import { postToHost } from '../utils/knowledgeBaseUtils';

const HEADER_BUTTON_CLASS =
  'size-8 rounded-full text-primary-foreground hover:bg-primary-foreground/15';

export const KbHeader = ({
  topic,
  heading,
  canGoBack,
  isFloating,
  term,
  onBack,
  onTermChange,
}: {
  topic?: TKbTopic;
  heading: string;
  canGoBack: boolean;
  isFloating: boolean;
  term: string;
  onBack: () => void;
  onTermChange: (term: string) => void;
}) => (
  <header
    className="shrink-0 bg-primary px-4 pb-4 pt-3 text-primary-foreground"
    style={topic?.color ? { backgroundColor: topic.color } : undefined}
  >
    <div className="flex min-h-8 items-center gap-2">
      {canGoBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back"
          className={cn('-ml-1', HEADER_BUTTON_CLASS)}
        >
          <IconArrowLeft />
        </Button>
      )}
      <span className="min-w-0 flex-1 truncate text-base font-semibold">
        {heading}
      </span>
      {isFloating && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => postToHost({ type: 'close' })}
          aria-label="Close"
          className={cn('-mr-1', HEADER_BUTTON_CLASS)}
        >
          <IconX />
        </Button>
      )}
    </div>

    {!canGoBack && topic?.description && (
      <p className="mt-1 line-clamp-2 text-xs text-primary-foreground/80">
        {topic.description}
      </p>
    )}

    {!canGoBack && (
      <div className="mt-3 flex h-10 items-center gap-2 rounded-full bg-card px-4 text-card-foreground shadow-card">
        <IconSearch className="size-4 shrink-0 text-muted-foreground" />
        <Input
          type="search"
          value={term}
          onChange={(event) => onTermChange(event.target.value)}
          placeholder="Search for help"
          aria-label="Search articles"
          className="h-auto min-w-0 flex-1 bg-transparent px-0 shadow-none focus-visible:shadow-none"
        />
      </div>
    )}
  </header>
);

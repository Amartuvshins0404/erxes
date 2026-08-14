import { useState } from 'react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { IconWorld } from '@tabler/icons-react';
import { ToolShell } from '~/modules/chat/assistant/ToolFallback';
import { JsonBlock } from '~/modules/chat/assistant/toolValue';

interface FetchUrlResult {
  url?: string;
  title?: string;
  siteName?: string;
  favicon?: string;
  content?: string;
}

const isFetchUrlResult = (value: unknown): value is FetchUrlResult =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as FetchUrlResult).content === 'string';

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const PREVIEW_CHARS = 700;

const PageContent = ({ content }: { content: string }) => {
  const [expanded, setExpanded] = useState(false);
  const long = content.length > PREVIEW_CHARS;
  return (
    <div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed ea-text-90">
        {expanded || !long ? content : `${content.slice(0, PREVIEW_CHARS)}…`}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

// fetchUrl gets the same search-engine shell as webSearch: "Fetching <host>"
// while running, then "Fetched <title>" expanding to the readable page card —
// favicon, linked title, site name, plain-text content behind "Read more".
export const FetchUrlTool = ({
  toolName,
  args,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = status?.type === 'running' || result === undefined;
  const parsed = isFetchUrlResult(result) ? result : undefined;

  const argUrl =
    args && typeof args === 'object' && 'url' in args
      ? String((args as { url?: unknown }).url ?? '')
      : '';
  const target = parsed?.url || argUrl;
  const host = target ? hostname(target) : '';

  const label = running ? (
    <>
      Fetching {host && <span className="ea-muted-80">{host}</span>}
    </>
  ) : (
    <>
      Fetched{' '}
      <span className="ea-muted-80">
        {parsed?.title || host || 'page'}
      </span>
    </>
  );

  return (
    <ToolShell
      toolName={toolName}
      label={label}
      icon={IconWorld}
      runningState="connecting"
      isError={isError}
      running={running}
      incomplete={status?.type === 'incomplete'}
    >
      {parsed ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            {parsed.favicon ? (
              <img
                src={parsed.favicon}
                alt=""
                className="size-4 shrink-0 rounded-sm"
                loading="lazy"
              />
            ) : (
              <IconWorld className="size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              {parsed.url ? (
                <a
                  href={parsed.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {parsed.title || parsed.url}
                </a>
              ) : (
                <span className="block truncate text-sm">{parsed.title}</span>
              )}
              {parsed.siteName && (
                <span className="block text-xs text-muted-foreground">
                  {parsed.siteName}
                </span>
              )}
            </div>
          </div>
          {parsed.content && <PageContent content={parsed.content} />}
        </div>
      ) : result !== undefined ? (
        <JsonBlock
          value={
            typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        />
      ) : undefined}
    </ToolShell>
  );
};

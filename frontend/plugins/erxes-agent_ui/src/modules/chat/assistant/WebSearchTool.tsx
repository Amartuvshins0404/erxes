import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { IconExternalLink, IconWorld } from '@tabler/icons-react';
import { ToolShell } from '~/modules/chat/assistant/ToolFallback';
import { JsonBlock } from '~/modules/chat/assistant/toolValue';

interface WebSearchResultItem {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  favicon?: string;
}

interface WebSearchResult {
  engine?: { name?: string; icon?: string };
  results?: WebSearchResultItem[];
}

const isWebSearchResult = (value: unknown): value is WebSearchResult =>
  !!value &&
  typeof value === 'object' &&
  Array.isArray((value as WebSearchResult).results);

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const SOURCES_CAP = 8;

// One source row, search-engine style: favicon, dimmed site line, bold linked
// title, clamped snippet.
const SourceRow = ({ item }: { item: WebSearchResultItem }) => (
  <li className="flex items-start gap-2.5">
    {item.favicon ? (
      <img
        src={item.favicon}
        alt=""
        className="mt-0.5 size-4 shrink-0 rounded-sm"
        loading="lazy"
      />
    ) : (
      <IconExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    )}
    <div className="min-w-0">
      <span className="block text-xs leading-5 text-muted-foreground">
        {item.source || (item.url ? hostname(item.url) : '')}
      </span>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="ea-clamp-2 text-sm font-medium text-foreground hover:underline"
        >
          {item.title || hostname(item.url)}
        </a>
      ) : (
        <span className="ea-clamp-2 text-sm font-medium">{item.title}</span>
      )}
      {item.snippet && (
        <span className="ea-clamp-2 text-xs leading-5 text-muted-foreground">
          {item.snippet}
        </span>
      )}
    </div>
  </li>
);

// webSearch gets the search-engine treatment: a shimmering "Searching <query>"
// line while running, then "Searched <query> · N sources" expanding to the
// source list — never the raw JSON payload.
export const WebSearchTool = ({
  toolName,
  args,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = status?.type === 'running' || result === undefined;
  const parsed = isWebSearchResult(result) ? result : undefined;
  const query =
    args && typeof args === 'object' && 'query' in args
      ? String((args as { query?: unknown }).query ?? '')
      : '';

  const results = parsed?.results ?? [];
  const shown = results.slice(0, SOURCES_CAP);

  const label = (
    <>
      {running ? 'Searching' : 'Searched'}{' '}
      {query && <span className="ea-muted-80">“{query}”</span>}
      {!running && results.length > 0 && (
        <span className="ea-muted-80">
          {' '}
          · {results.length} {results.length === 1 ? 'source' : 'sources'}
        </span>
      )}
    </>
  );

  return (
    <ToolShell
      toolName={toolName}
      label={label}
      icon={IconWorld}
      runningState="searching"
      isError={isError}
      running={running}
      incomplete={status?.type === 'incomplete'}
    >
      {parsed ? (
        <ul className="flex flex-col gap-3">
          {shown.map((item, i) => (
            <SourceRow key={item.url ?? i} item={item} />
          ))}
          {results.length > shown.length && (
            <li className="text-xs text-muted-foreground">
              +{results.length - shown.length} more{' '}
              {results.length - shown.length === 1 ? 'source' : 'sources'}
            </li>
          )}
        </ul>
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

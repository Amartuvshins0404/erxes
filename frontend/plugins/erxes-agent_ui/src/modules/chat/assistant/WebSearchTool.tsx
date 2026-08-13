import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { IconExternalLink } from '@tabler/icons-react';
import { JsonBlock, ToolShell } from '~/modules/chat/assistant/ToolFallback';

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

// webSearch gets a dedicated renderer: the result list is sources, not JSON —
// favicon, linked title, snippet, and the bare query as context.
export const WebSearchTool = ({
  toolName,
  args,
  argsText,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = status?.type === 'running' || result === undefined;
  const parsed = isWebSearchResult(result) ? result : undefined;
  const query =
    args && typeof args === 'object' && 'query' in args
      ? String((args as { query?: unknown }).query ?? '')
      : undefined;

  return (
    <ToolShell
      toolName={toolName}
      isError={isError}
      running={running}
      incomplete={status?.type === 'incomplete'}
    >
      {query ? (
        <p className="text-xs text-muted-foreground">“{query}”</p>
      ) : argsText ? (
        <JsonBlock value={argsText} />
      ) : undefined}
      {parsed ? (
        <ul className="flex flex-col gap-2.5">
          {(parsed.results ?? []).map((item, i) => (
            <li key={item.url ?? i} className="flex items-start gap-2.5">
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
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm text-primary hover:underline"
                  >
                    {item.title || hostname(item.url)}
                  </a>
                ) : (
                  <span className="block truncate text-sm">{item.title}</span>
                )}
                <span className="block text-xs text-muted-foreground">
                  {item.source || (item.url ? hostname(item.url) : '')}
                  {item.snippet ? ` — ${item.snippet}` : ''}
                </span>
              </div>
            </li>
          ))}
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

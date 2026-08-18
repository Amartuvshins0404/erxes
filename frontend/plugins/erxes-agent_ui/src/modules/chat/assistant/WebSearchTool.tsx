import { IconExternalLink } from '@tabler/icons-react';

// webSearch result plumbing shared by the preview panel's tool-activity view —
// the inline per-call renderer is gone (the turn's activity renders behind the
// single process line), so only the sources list remains.

export interface WebSearchResultItem {
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

export const isWebSearchResult = (value: unknown): value is WebSearchResult =>
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

// The capped sources list — used by the preview panel's tool-activity view.
export const SourcesList = ({
  results,
}: {
  results: WebSearchResultItem[];
}) => {
  const shown = results.slice(0, SOURCES_CAP);
  return (
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
  );
};

import { useState } from 'react';
import { IconChevronRight, IconWorld } from '@tabler/icons-react';
import { ToolPartView, hostnameOf } from '~/modules/chat/lib/uiParts';
import { Favicon } from './Favicon';

// One fetched page flattened for a row (read defensively from the tool I/O).
interface FetchRow {
  url?: string;
  title: string;
  domain: string;
  favicon?: string;
  isError: boolean;
  pending: boolean;
}

const readFetch = (call: ToolPartView, streaming?: boolean): FetchRow => {
  const out =
    call.output && typeof call.output === 'object'
      ? (call.output as {
          url?: string;
          title?: string;
          siteName?: string;
          favicon?: string;
        })
      : null;
  const inputUrl =
    call.input && typeof call.input === 'object'
      ? (call.input as { url?: string }).url
      : undefined;
  const url = out?.url || inputUrl;
  const domain = out?.siteName || hostnameOf(out?.url || inputUrl || '');
  return {
    url,
    title: out?.title || domain || 'web page',
    domain,
    favicon: out?.favicon,
    isError: call.isError,
    pending: !!(call.pending && streaming),
  };
};

// A run of `fetch-url` calls rendered as one card, like the search-results card:
// a collapsed header says WHAT it's doing (reading N pages); expand to the list
// of pages, each its real site favicon + title + domain.
export const FetchGroupCard = ({
  calls,
  streaming,
}: {
  calls: ToolPartView[];
  streaming?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const rows = calls.map((c) => readFetch(c, streaming));
  const anyPending = rows.some((r) => r.pending);
  const count = rows.length;

  return (
    <div className={`ea-pop ea-websearch ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ea-websearch-head"
        aria-expanded={open}
      >
        <IconWorld className="size-3.5 shrink-0 text-primary" />
        <span className="ea-websearch-query min-w-0 flex-1 truncate">
          {anyPending ? (
            <span className="ea-shimmer-text font-medium">
              Reading {count} page{count !== 1 ? 's' : ''}…
            </span>
          ) : (
            <>
              Read {count} page{count !== 1 ? 's' : ''}
            </>
          )}
        </span>
        <IconChevronRight
          className={`size-3 shrink-0 text-muted-foreground opacity-50 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      {open && (
        <ul className="ea-websearch-list">
          {rows.map((r, i) => (
            <li key={r.url || i}>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="ea-websearch-row"
                title={r.title}
              >
                <Favicon
                  src={r.favicon}
                  domain={r.domain}
                  alt={r.domain}
                  size={16}
                />
                <span className="ea-websearch-title min-w-0 flex-1 truncate">
                  {r.isError ? (
                    <span className="text-destructive">
                      Couldn’t read {r.domain || r.title}
                    </span>
                  ) : (
                    r.title
                  )}
                </span>
                {r.domain && (
                  <span className="ea-websearch-domain shrink-0 truncate">
                    {r.domain}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

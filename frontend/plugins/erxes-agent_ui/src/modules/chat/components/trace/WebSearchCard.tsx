import { useState } from 'react';
import { IconChevronRight, IconSearch } from '@tabler/icons-react';
import { ToolPartView, toolHint, hostnameOf } from '~/modules/chat/lib/uiParts';
import { Favicon } from './Favicon';

// The `web-search` tool output. Read defensively — a contract drift renders an
// empty/looser card rather than crashing the turn.
interface WebResult {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  favicon?: string;
}
interface WebSearchOutput {
  engine?: { name?: string; icon?: string };
  results?: WebResult[];
}

const asWebSearch = (output: unknown): WebSearchOutput | null => {
  if (!output || typeof output !== 'object') return null;
  const o = output as WebSearchOutput;
  return Array.isArray(o.results) ? o : null;
};

// A web search rendered like Claude: a collapsed header showing WHAT is being
// researched (engine favicon + the query + result count). Click it to expand the
// result rows — each its real site favicon + title + domain.
export const WebSearchCard = ({
  call,
  streaming,
  nested,
}: {
  call: ToolPartView;
  streaming?: boolean;
  // Rendered inside a search group — drop the card chrome so it reads as a row.
  nested?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const out = asWebSearch(call.output);
  const query = toolHint(call.input); // the `query` arg
  const pending = call.pending && streaming;
  const results = out?.results ?? [];
  const canExpand = results.length > 0;

  return (
    <div
      className={`ea-websearch ${nested ? 'is-nested' : 'ea-pop'} ${
        open ? 'is-open' : ''
      }`}
    >
      {/* Header — engine identity + what it's researching + count; the toggle. */}
      <button
        type="button"
        onClick={() => canExpand && setOpen((v) => !v)}
        className="ea-websearch-head"
        aria-expanded={open}
      >
        {out?.engine?.icon ? (
          <Favicon
            src={out.engine.icon}
            domain="duckduckgo.com"
            alt={out.engine.name ?? ''}
            size={14}
          />
        ) : (
          <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="ea-websearch-query min-w-0 flex-1 truncate">
          {query || 'Web search'}
        </span>
        {call.isError ? (
          <span className="shrink-0 text-[11px] text-destructive">failed</span>
        ) : pending ? (
          <span className="ea-shimmer-text shrink-0 text-[11px] font-medium">
            Searching…
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        )}
        {canExpand && (
          <IconChevronRight
            className={`size-3 shrink-0 text-muted-foreground opacity-50 transition-transform duration-200 ${
              open ? 'rotate-90' : ''
            }`}
          />
        )}
      </button>

      {/* Result rows (revealed on expand) */}
      {open && canExpand && (
        <ul className="ea-websearch-list">
          {results.map((r, i) => {
            // Prefer the backend-provided domain; fall back to the result URL's
            // host so the domain + site favicon still show against an old backend.
            const domain = r.source || hostnameOf(r.url || '');
            return (
              <li key={r.url || i}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ea-websearch-row"
                  title={r.title || r.url}
                >
                  <Favicon
                    src={r.favicon}
                    domain={domain}
                    alt={domain}
                    size={16}
                  />
                  <span className="ea-websearch-title min-w-0 flex-1 truncate">
                    {r.title || r.url}
                  </span>
                  {domain && (
                    <span className="ea-websearch-domain shrink-0 truncate">
                      {domain}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

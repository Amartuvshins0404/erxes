import { useState } from 'react';
import { IconChevronRight, IconSearch } from '@tabler/icons-react';
import { ToolPartView } from '~/modules/chat/lib/uiParts';
import { WebSearchCard } from './WebSearchCard';

// A run of consecutive `web-search` calls (the model fans out several queries)
// rendered as ONE collapsible group: a header says what it's doing (searched the
// web · N searches); expand to the individual searches, each itself a nested,
// expandable card (query → its result rows). A nested expandable.
export const SearchGroupCard = ({
  calls,
  streaming,
}: {
  calls: ToolPartView[];
  streaming?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const count = calls.length;
  const anyPending = !!streaming && calls.some((c) => c.pending);

  return (
    <div className={`ea-pop ea-websearch ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ea-websearch-head"
        aria-expanded={open}
      >
        <IconSearch className="size-3.5 shrink-0 text-primary" />
        <span className="ea-websearch-query min-w-0 flex-1 truncate">
          {anyPending ? (
            <span className="ea-shimmer-text font-medium">
              Searching the web…
            </span>
          ) : (
            'Searched the web'
          )}
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {count} search{count !== 1 ? 'es' : ''}
        </span>
        <IconChevronRight
          className={`size-3 shrink-0 text-muted-foreground opacity-50 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      {open && (
        <div className="ea-nestlist">
          {calls.map((c, i) => (
            <WebSearchCard
              key={c.toolCallId ?? `search-${i}`}
              call={c}
              streaming={streaming}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
};

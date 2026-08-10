import { IconExternalLink } from '@tabler/icons-react';
import { ToolPartView, toolHint, hostnameOf } from '~/modules/chat/lib/uiParts';
import { Favicon } from './Favicon';

// The `fetch-url` tool output (read defensively).
interface FetchOutput {
  url?: string;
  title?: string;
  siteName?: string;
  favicon?: string;
}

const asFetch = (output: unknown): FetchOutput | null => {
  if (!output || typeof output !== 'object') return null;
  return output as FetchOutput;
};

// A fetched web page rendered like Claude's "reading" pill: the page favicon,
// "Reading <title or site>", and the domain — linking out to the source.
export const FetchUrlChip = ({
  call,
  streaming,
}: {
  call: ToolPartView;
  streaming?: boolean;
}) => {
  const out = asFetch(call.output);
  const pending = call.pending && streaming;
  const hint = toolHint(call.input); // the url arg, scheme stripped
  // Prefer the backend domain; fall back to the fetched URL's host so the domain +
  // site favicon still show against an old backend.
  const siteName = out?.siteName || hostnameOf(out?.url || '');
  const label = out?.title || siteName || hint || 'web page';

  const body = (
    <>
      <Favicon
        src={out?.favicon}
        domain={siteName}
        alt={siteName}
        size={16}
      />
      <span className="ea-readchip-label min-w-0 flex-1 truncate">
        {call.isError ? (
          <span className="text-destructive">Couldn’t read {label}</span>
        ) : pending ? (
          <>
            Reading <span className="ea-shimmer-text font-medium">{label}</span>
          </>
        ) : (
          <>
            Read <span className="text-foreground">{label}</span>
          </>
        )}
      </span>
      {out?.siteName && !pending && (
        <span className="ea-readchip-domain shrink-0 truncate">
          {out.siteName}
        </span>
      )}
    </>
  );

  return out?.url ? (
    <a
      href={out.url}
      target="_blank"
      rel="noreferrer"
      className="ea-readchip"
      title={out.url}
    >
      {body}
      <IconExternalLink className="size-3 shrink-0 text-muted-foreground opacity-50" />
    </a>
  ) : (
    <div className="ea-readchip">{body}</div>
  );
};

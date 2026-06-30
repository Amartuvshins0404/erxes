import { useState } from 'react';
import { IconWorld } from '@tabler/icons-react';

// A site favicon for a web-search result / fetched page. Sources, in order:
//   1. the URL the tool returned (the search provider's favicon — never faked),
//   2. the site's own /favicon.ico (so we still get the real icon when the
//      provider has none — "get the favicon from that site"),
//   3. a neutral globe, so the row never breaks.
export const Favicon = ({
  src,
  domain,
  alt = '',
  size = 16,
}: {
  src?: string;
  domain?: string;
  alt?: string;
  size?: number;
}) => {
  const candidates = [
    src,
    domain ? `https://${domain}/favicon.ico` : '',
  ].filter((u): u is string => !!u);
  const [stage, setStage] = useState(0);
  const url = candidates[stage];

  if (!url) {
    return (
      <IconWorld
        className="ea-favicon shrink-0 text-muted-foreground"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setStage((s) => s + 1)}
      className="ea-favicon shrink-0"
    />
  );
};

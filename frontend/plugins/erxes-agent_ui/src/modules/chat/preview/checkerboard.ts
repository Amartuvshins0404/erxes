import { type CSSProperties } from 'react';

// Checkerboard backdrop so a transparent PNG's cut-out edge is visible. Inline
// style (not a Tailwind utility) — plugin-unique utilities are purged from the
// production host CSS. Shared by ImageViewer and the inline ImageCard.
export const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.06) 75%), linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.06) 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px',
};

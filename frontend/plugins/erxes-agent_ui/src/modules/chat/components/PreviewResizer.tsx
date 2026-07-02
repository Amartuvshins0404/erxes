import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';

// Persisted width of the docked Preview panel (px). One key for the whole
// plugin — the preferred split reads as an app setting, not per-agent state.
const STORAGE_KEY = 'erxes-agent:preview-width';
const MIN_WIDTH = 320;
const KEY_STEP = 24;

// localStorage may be unavailable (private mode / SSR) — same best-effort
// contract as chatStore's loaders.
const loadSavedWidth = (): number | null => {
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  } catch {
    return null;
  }
};
const saveWidth = (px: number | null) => {
  try {
    if (px === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(px));
  } catch {
    /* best-effort */
  }
};

// The chat column never goes below this — the preview's max width follows.
const CHAT_MIN = 360;
// The agents/sessions column (matches .ea-side-panel's 15rem).
const SIDE_WIDTH = 240;
// Auto-collapse hysteresis, both measured as the chat width WITH the side
// panel open: collapse before the chat hits its floor; re-expand only once
// restoring the column keeps the chat comfortably wide. The 60px dead band
// between them means one drag can't flap the panel open and shut.
const COLLAPSE_AT = 460;
const EXPAND_AT = 520;

// The draggable divider between the chat column and the docked Preview panel.
// The grab pill is always visible and shifts to a "ready" state on hover —
// styling lives in chat.css as .ea-split-handle. The width is applied as a
// CSS variable on the split container (consumed by .ea-preview-dock) so
// dragging never re-renders the React tree. Double-click resets to the
// default split; arrow keys resize. When a drag squeezes the chat column the
// side panel auto-collapses (and re-expands on the way back) via
// onSideCollapsedChange.
export const PreviewResizer = ({
  splitRef,
  sideCollapsed,
  onSideCollapsedChange,
}: {
  splitRef: RefObject<HTMLDivElement>;
  sideCollapsed: boolean;
  onSideCollapsedChange: (collapsed: boolean) => void;
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const widthRef = useRef<number | null>(null);
  // Mirror of the prop so pointer-move math never reads a stale closure —
  // it's also flipped eagerly when this component requests a change.
  const collapsedRef = useRef(sideCollapsed);
  useEffect(() => {
    collapsedRef.current = sideCollapsed;
  }, [sideCollapsed]);

  // Collapse/expand the side panel based on where the chat width would land.
  const syncSidePanel = (previewWidth: number, total: number) => {
    const chatWithSide = total - SIDE_WIDTH - previewWidth;
    if (!collapsedRef.current && chatWithSide < COLLAPSE_AT) {
      collapsedRef.current = true;
      onSideCollapsedChange(true);
    } else if (collapsedRef.current && chatWithSide >= EXPAND_AT) {
      collapsedRef.current = false;
      onSideCollapsedChange(false);
    }
  };

  const applyWidth = (px: number) => {
    const container = splitRef.current;
    if (!container) return;
    const total = container.getBoundingClientRect().width;
    // Side panel first: if this width squeezes the chat, reclaim the column
    // before clamping so the drag continues smoothly into the freed space.
    syncSidePanel(px, total);
    const side = collapsedRef.current ? 0 : SIDE_WIDTH;
    const max = Math.max(total - side - CHAT_MIN, MIN_WIDTH);
    const width = Math.round(Math.min(Math.max(px, MIN_WIDTH), max));
    container.style.setProperty('--ea-preview-w', `${width}px`);
    // Remember the REQUESTED width (lower-bounded only), not the clamp: a
    // window shrink must not permanently degrade the preference — growing the
    // window back re-applies the desired width via the resize recheck.
    widthRef.current = Math.round(Math.max(px, MIN_WIDTH));
    // Value semantics for the focusable separator, kept in sync imperatively
    // (this path runs per drag frame — no re-render).
    const handle = handleRef.current;
    if (handle) {
      handle.setAttribute('aria-valuenow', String(width));
      handle.setAttribute('aria-valuemin', String(MIN_WIDTH));
      handle.setAttribute('aria-valuemax', String(Math.round(max)));
    }
  };

  const persist = () => {
    if (widthRef.current) saveWidth(widthRef.current);
  };

  // The dock's rendered width — source of truth for keyboard stepping and the
  // default 42% state, where no explicit pixel width has been set yet.
  const dockWidth = () =>
    splitRef.current
      ?.querySelector('.ea-preview-dock')
      ?.getBoundingClientRect().width ?? 0;

  // Restore the saved split when the docked panel (re)opens, and keep the
  // clamp + side-panel state honest across window resizes. Layout effect, not
  // rAF-deferred: the saved width must land BEFORE first paint or every panel
  // open (and fullscreen exit, which remounts this) flashes the 42% default.
  useLayoutEffect(() => {
    const recheck = () => {
      if (widthRef.current !== null) {
        applyWidth(widthRef.current);
        return;
      }
      const container = splitRef.current;
      if (container)
        syncSidePanel(dockWidth(), container.getBoundingClientRect().width);
    };
    const saved = loadSavedWidth();
    if (saved) applyWidth(saved);
    else recheck();
    window.addEventListener('resize', recheck);
    return () => window.removeEventListener('resize', recheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Capturing keeps move/up events on the handle even when the pointer
    // crosses iframes or canvases inside the preview. Guarded: capture is
    // best-effort and throws if the pointer is already gone.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* drag still works while the pointer stays over the handle */
    }
    draggingRef.current = true;
    handleRef.current?.classList.add('is-dragging');
    // If capture failed (or is lost), a pointerup outside the 9px handle
    // would never reach the element handlers and the drag would stick armed.
    // One-shot window fallbacks end it wherever the pointer lands; endDrag is
    // idempotent, so the normal captured path firing both is harmless.
    window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', endDrag, { once: true });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const rect = splitRef.current?.getBoundingClientRect();
    if (rect) applyWidth(rect.right - e.clientX);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    handleRef.current?.classList.remove('is-dragging');
    persist();
  };

  // Back to the pre-drag default: 42% split, side panel restored.
  const reset = () => {
    splitRef.current?.style.removeProperty('--ea-preview-w');
    widthRef.current = null;
    saveWidth(null);
    collapsedRef.current = false;
    onSideCollapsedChange(false);
    // On a narrow window the restored default + side column can squeeze the
    // chat below its floor — re-run the same check a fresh mount does, next
    // frame so the dock has re-laid-out at its default width first. Clamping
    // via applyWidth sets an in-session width but deliberately does NOT
    // persist (storage stays cleared — that's what reset means).
    requestAnimationFrame(() => {
      const container = splitRef.current;
      if (!container) return;
      const total = container.getBoundingClientRect().width;
      const dock = dockWidth();
      syncSidePanel(dock, total);
      const side = collapsedRef.current ? 0 : SIDE_WIDTH;
      if (total - side - dock < CHAT_MIN) applyWidth(dock);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    applyWidth(dockWidth() + (e.key === 'ArrowLeft' ? KEY_STEP : -KEY_STEP));
    persist();
  };

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize preview panel"
      aria-valuemin={MIN_WIDTH}
      tabIndex={0}
      className="ea-split-handle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={reset}
      onKeyDown={onKeyDown}
    />
  );
};

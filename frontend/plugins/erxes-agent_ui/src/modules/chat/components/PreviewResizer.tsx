import { RefObject, useCallback, useLayoutEffect, useRef } from 'react';

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

// The draggable divider between the chat column and the docked Preview panel.
// The grab pill is always visible and shifts to a "ready" state on hover —
// styling lives in chat.css as .ea-split-handle. The width is applied as a
// CSS variable on the split container (consumed by .ea-preview-dock) so
// dragging never re-renders the React tree. Double-click resets to the
// default split; arrow keys resize.
export const PreviewResizer = ({
  splitRef,
}: {
  splitRef: RefObject<HTMLDivElement>;
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const widthRef = useRef<number | null>(null);

  const applyWidth = useCallback(
    (px: number) => {
      const container = splitRef.current;
      if (!container) return;
      const total = container.getBoundingClientRect().width;
      const max = Math.max(total - CHAT_MIN, MIN_WIDTH);
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
    },
    [splitRef],
  );

  const persist = () => {
    if (widthRef.current) saveWidth(widthRef.current);
  };

  // The dock's rendered width — source of truth for keyboard stepping and the
  // default 42% state, where no explicit pixel width has been set yet.
  const dockWidth = useCallback(
    () =>
      splitRef.current
        ?.querySelector('.ea-preview-dock')
        ?.getBoundingClientRect().width ?? 0,
    [splitRef],
  );

  // Restore the saved split when the docked panel (re)opens. Layout effect,
  // not rAF-deferred: the saved width must land BEFORE first paint or every
  // panel open (and fullscreen exit, which remounts this) flashes the 42%
  // default.
  useLayoutEffect(() => {
    const saved = loadSavedWidth();
    if (saved) applyWidth(saved);
  }, [applyWidth]);

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

  // Back to the pre-drag default: 42% split. On a narrow window the restored
  // default can squeeze the chat below its floor — clamp next frame so the
  // dock has re-laid-out first (in-session only; storage stays cleared).
  const reset = () => {
    splitRef.current?.style.removeProperty('--ea-preview-w');
    widthRef.current = null;
    saveWidth(null);
    requestAnimationFrame(() => {
      const container = splitRef.current;
      if (!container) return;
      const dock = dockWidth();
      if (container.getBoundingClientRect().width - dock < CHAT_MIN)
        applyWidth(dock);
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

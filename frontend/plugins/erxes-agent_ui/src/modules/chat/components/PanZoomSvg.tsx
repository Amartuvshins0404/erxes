import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IconMinus, IconPlus, IconMaximize } from '@tabler/icons-react';

interface View { scale: number; x: number; y: number }
interface PanZoomSvgProps {
  svgHtml: string;
  height?: number | string;
  className?: string;
}

const MIN_SCALE   = 0.05;
const MAX_SCALE   = 12;
const ZOOM_FACTOR = 1.15;
const ANIM_MS     = 280;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// CSS injected inside the SVG to improve typography, add hover/selection
// effects, and ensure text renders crisply across both themes.
const NODE_HOVER_CSS = `<style id="panzoom-hover">
/* ── Typography ─────────────────────────────────────────────────────────── */
text, tspan, .label, .nodeLabel, .edgeLabel, .messageText, .actor-label {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}
.nodeLabel { font-weight: 500; letter-spacing: -0.01em; }
.edgeLabel .label { font-size: 11.5px; font-weight: 500; }
.cluster-label text, .cluster text { font-size: 11.5px; font-weight: 600; letter-spacing: .02em; text-transform: uppercase; }

/* ── Borders & strokes ───────────────────────────────────────────────────── */
.node > rect,.node > circle,.node > ellipse,.node > polygon {
  stroke-width: 1.5px !important;
  rx: 6; ry: 6;
}
.edgePath .path { stroke-width: 1.5px; }
.arrowheadPath { stroke-width: 1.5px; }
.cluster rect { stroke-width: 1.5px !important; stroke-dasharray: 5,3; }

/* ── Hover — indigo glow ─────────────────────────────────────────────────── */
.node > rect,.node > circle,.node > ellipse,.node > polygon,
.node .label-container { transition: filter .18s ease, opacity .18s ease; cursor: pointer; }
.node:hover > rect,.node:hover > circle,.node:hover > ellipse,
.node:hover > polygon,.node:hover .label-container {
  filter: brightness(1.12) drop-shadow(0 0 8px rgba(99,102,241,.55));
}
.actor rect,.actor circle { transition: filter .18s ease; cursor: pointer; }
.actor:hover rect,.actor:hover circle { filter: brightness(1.1) drop-shadow(0 0 6px rgba(99,102,241,.45)); }
.edgePath path { transition: stroke-width .15s ease; }
.edgePath:hover path { stroke-width: 2.5px !important; }

/* ── Selected node — persistent indigo ring ─────────────────────────────── */
.selected-node > rect,.selected-node > circle,.selected-node > ellipse,
.selected-node > polygon,.selected-node .label-container {
  filter: brightness(1.18) drop-shadow(0 0 12px rgba(99,102,241,.75)) !important;
}
</style>`;

// Classes that mark a clickable node across all Mermaid diagram types.
const NODE_CLASSES = new Set([
  'node', 'cluster', 'actor', 'entity', 'statediagram-state',
  'classGroup', 'task', 'section', 'mindmap-node',
]);

function findNodeEl(target: EventTarget | null, root: Element): Element | null {
  let el = target as Element | null;
  while (el && el !== root) {
    for (const cls of NODE_CLASSES) {
      if (el.classList?.contains(cls)) return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Adds full pan/zoom interactivity to any raw SVG string.
 *
 * Interactions:
 *  - Scroll wheel       → zoom toward cursor
 *  - Drag               → pan
 *  - Click a node       → smooth-animate to centre on that node
 *  - Double-click       → reset / fit
 *  - +/– buttons        → animated zoom
 *  - +/–/0/R/arrows     → keyboard shortcuts (when diagram is in focus)
 *  - Hover on nodes     → CSS glow (injected `<style>` inside the SVG)
 */
export const PanZoomSvg = ({ svgHtml, height = 340, className }: PanZoomSvgProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLDivElement>(null);
  const view        = useRef<View>({ scale: 1, x: 0, y: 0 });
  const dragging    = useRef(false);
  const didDrag     = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const animFrame      = useRef<number>(0);
  // Tracks whether the user has interacted yet; resets on each new SVG so the
  // ResizeObserver can re-fit while the preview panel is animating open.
  const hasInteracted  = useRef(false);
  const [scaleLabel, setScaleLabel] = useState('100%');

  // Inject hover CSS into the SVG HTML once per svgHtml change.
  const processedSvg = useMemo(() => {
    if (!svgHtml) return '';
    return svgHtml.includes('id="panzoom-hover"')
      ? svgHtml
      : svgHtml.replace('</svg>', `${NODE_HOVER_CSS}</svg>`);
  }, [svgHtml]);

  // ── Apply transform without triggering a re-render ────────────────────────
  const applyTransform = useCallback((v: View) => {
    view.current = v;
    const el = canvasRef.current;
    if (el) el.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.scale})`;
    setScaleLabel(`${Math.round(v.scale * 100)}%`);
  }, []);

  // ── Smooth animation (cubic ease-out) ─────────────────────────────────────
  const animateTo = useCallback((target: View, duration = ANIM_MS) => {
    cancelAnimationFrame(animFrame.current);
    const start     = { ...view.current };
    const startTime = performance.now();
    const tick = (now: number) => {
      const t    = Math.min((now - startTime) / duration, 1);
      const ease = 1 - (1 - t) ** 3;
      applyTransform({
        scale: start.scale + (target.scale - start.scale) * ease,
        x:     start.x     + (target.x     - start.x)     * ease,
        y:     start.y     + (target.y     - start.y)     * ease,
      });
      if (t < 1) animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [applyTransform]);

  // ── Fit-to-viewport calculation ───────────────────────────────────────────
  const calcFit = useCallback((): View => {
    const vp     = viewportRef.current;
    const canvas = canvasRef.current;
    if (!vp || !canvas) return view.current;
    const svgEl = canvas.querySelector('svg');
    if (!svgEl) return view.current;
    // If the viewport has no size yet (panel still animating, flex not resolved),
    // return the current view unchanged so we don't write a broken transform.
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    if (!vpW || !vpH) return view.current;
    const vb   = (svgEl as SVGSVGElement).viewBox?.baseVal;
    const svgW = (vb && vb.width  > 0) ? vb.width  : svgEl.getBoundingClientRect().width  || 600;
    const svgH = (vb && vb.height > 0) ? vb.height : svgEl.getBoundingClientRect().height || 400;
    const pad  = 24;
    const scale = clamp(Math.min((vpW - pad * 2) / svgW, (vpH - pad * 2) / svgH), MIN_SCALE, 1);
    return { scale, x: (vpW - svgW * scale) / 2, y: (vpH - svgH * scale) / 2 };
  }, []);

  useEffect(() => () => cancelAnimationFrame(animFrame.current), []);

  // ── Auto-fit on first render ───────────────────────────────────────────────
  // Two nested RAFs are required:
  //   Frame 1 – browser applies CSS (flexbox resolves heights, SVG is in DOM).
  //   Frame 2 – browser computes layout so clientWidth/Height and viewBox are
  //             readable. A single RAF often measures 0 on flex children.
  useLayoutEffect(() => {
    if (!svgHtml) return;
    hasInteracted.current = false;
    let id2: number;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => applyTransform(calcFit()));
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [svgHtml, calcFit, applyTransform]);

  // ── Re-fit as the preview panel CSS-animates to its final size ───────────
  // ResizeObserver fires on every animation frame while the panel slides open.
  // hasInteracted prevents it from fighting the user after they've panned/zoomed.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => {
      if (!hasInteracted.current) applyTransform(calcFit());
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [calcFit, applyTransform]);

  // ── Wheel → zoom toward cursor ────────────────────────────────────────────
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      hasInteracted.current = true;
      e.preventDefault();
      cancelAnimationFrame(animFrame.current);
      const rect   = vp.getBoundingClientRect();
      const cx     = e.clientX - rect.left;
      const cy     = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const v      = view.current;
      const ns     = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
      applyTransform({ scale: ns, x: cx - (cx - v.x) * (ns / v.scale), y: cy - (cy - v.y) * (ns / v.scale) });
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [applyTransform]);

  // ── Pointer → drag to pan ─────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    hasInteracted.current = true;
    dragging.current = true;
    didDrag.current  = false;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (viewportRef.current) viewportRef.current.style.cursor = 'grabbing';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag.current = true;
    cancelAnimationFrame(animFrame.current);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    const v = view.current;
    applyTransform({ ...v, x: v.x + dx, y: v.y + dy });
  }, [applyTransform]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = 'grab';
  }, []);

  // ── Click node → animate to centre it in the viewport ────────────────────
  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore if the user was dragging.
    if (didDrag.current) { didDrag.current = false; return; }

    const canvas = canvasRef.current;
    const vp     = viewportRef.current;
    if (!canvas || !vp) return;

    const nodeEl = findNodeEl(e.target, canvas);
    if (!nodeEl) return;

    // Toggle selection highlight
    const wasSelected = nodeEl.classList.contains('selected-node');
    canvas.querySelectorAll('.selected-node').forEach((el) => el.classList.remove('selected-node'));
    if (!wasSelected) nodeEl.classList.add('selected-node');

    // Resolve node centre in canvas (unscaled) space.
    const nRect  = nodeEl.getBoundingClientRect();
    const vpRect = vp.getBoundingClientRect();
    // Screen coords of node centre relative to viewport top-left:
    const nScreenX = nRect.left + nRect.width  / 2 - vpRect.left;
    const nScreenY = nRect.top  + nRect.height / 2 - vpRect.top;
    // Invert current transform to get canvas-space coords:
    const v = view.current;
    const canvasX = (nScreenX - v.x) / v.scale;
    const canvasY = (nScreenY - v.y) / v.scale;

    const vpCX = vpRect.width  / 2;
    const vpCY = vpRect.height / 2;
    const targetScale = clamp(Math.max(v.scale, 1.4), MIN_SCALE, MAX_SCALE);

    animateTo({
      scale: targetScale,
      x: vpCX - canvasX * targetScale,
      y: vpCY - canvasY * targetScale,
    });
  }, [animateTo]);

  // ── Double-click → reset to fit ───────────────────────────────────────────
  const onDoubleClick = useCallback(() => {
    canvasRef.current?.querySelectorAll('.selected-node').forEach((el) => el.classList.remove('selected-node'));
    animateTo(calcFit());
  }, [animateTo, calcFit]);

  // ── Button helpers ─────────────────────────────────────────────────────────
  const zoomBy = useCallback((factor: number) => {
    const vp = viewportRef.current;
    const v  = view.current;
    const cx = (vp?.clientWidth  ?? 600) / 2;
    const cy = (vp?.clientHeight ?? 340) / 2;
    const ns = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
    animateTo({ scale: ns, x: cx - (cx - v.x) * (ns / v.scale), y: cy - (cy - v.y) * (ns / v.scale) });
  }, [animateTo]);

  const resetFit = useCallback(() => {
    canvasRef.current?.querySelectorAll('.selected-node').forEach((el) => el.classList.remove('selected-node'));
    animateTo(calcFit());
  }, [animateTo, calcFit]);

  // ── Keyboard shortcuts (scoped to viewport focus) ─────────────────────────
  // Attached via onKeyDown on the viewport div (tabIndex={0}) so arrow keys and
  // zoom shortcuts only fire when the diagram is actually focused, preventing
  // interference with chat scroll, modals, and other keyboard-driven UI.
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const PAN = 50;
    switch (e.key) {
      case '+': case '=': e.preventDefault(); zoomBy(ZOOM_FACTOR);       break;
      case '-':           e.preventDefault(); zoomBy(1 / ZOOM_FACTOR);   break;
      case '0': case 'r': case 'R': e.preventDefault(); resetFit();      break;
      case 'ArrowLeft':   e.preventDefault(); applyTransform({ ...view.current, x: view.current.x + PAN }); break;
      case 'ArrowRight':  e.preventDefault(); applyTransform({ ...view.current, x: view.current.x - PAN }); break;
      case 'ArrowUp':     e.preventDefault(); applyTransform({ ...view.current, y: view.current.y + PAN }); break;
      case 'ArrowDown':   e.preventDefault(); applyTransform({ ...view.current, y: view.current.y - PAN }); break;
    }
  }, [zoomBy, resetFit, applyTransform]);

  // Auto-focus the viewport when SVG loads so keyboard shortcuts work immediately.
  useEffect(() => {
    if (svgHtml) viewportRef.current?.focus({ preventScroll: true });
  }, [svgHtml]);

  return (
    <div className={`relative select-none ${className ?? ''}`} style={{ height }}>
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/85 backdrop-blur-sm p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => zoomBy(ZOOM_FACTOR)}
          title="Zoom in (+)"
          className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <IconPlus className="size-3.5" />
        </button>
        <span className="px-1 text-[10px] font-mono text-muted-foreground min-w-[34px] text-center tabular-nums">
          {scaleLabel}
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1 / ZOOM_FACTOR)}
          title="Zoom out (–)"
          className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <IconMinus className="size-3.5" />
        </button>
        <div className="w-px h-3.5 bg-border/60 mx-0.5" />
        <button
          type="button"
          onClick={resetFit}
          title="Fit to view (R)"
          className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <IconMaximize className="size-3.5" />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-muted-foreground/45 pointer-events-none select-none leading-none">
        scroll · drag · click node · R to reset
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        tabIndex={0}
        className="absolute inset-0 overflow-hidden cursor-grab outline-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      >
        {/* Canvas — transformed layer; transformOrigin 0 0 makes math trivial */}
        <div
          ref={canvasRef}
          style={{ transformOrigin: '0 0', willChange: 'transform' }}
          onClick={onCanvasClick}
          // Override any hardcoded background Mermaid bakes into the SVG root.
          className="[&_svg]:block [&_svg]:!bg-transparent"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: processedSvg }}
        />
      </div>
    </div>
  );
};

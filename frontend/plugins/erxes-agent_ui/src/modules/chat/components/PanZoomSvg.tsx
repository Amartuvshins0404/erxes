import { IconMinus, IconPlus, IconMaximize } from '@tabler/icons-react';
import { usePanZoom, ZOOM_FACTOR } from '../hooks/usePanZoom';

interface PanZoomSvgProps {
  svgHtml: string;
  height?: number | string;
  className?: string;
}

interface PanZoomControlsProps {
  scaleLabel: string;
  zoomBy: (factor: number) => void;
  resetFit: () => void;
}

const PanZoomControls = ({ scaleLabel, zoomBy, resetFit }: PanZoomControlsProps) => (
  <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg border ea-border-60 ea-bg-85 backdrop-blur-sm p-0.5 shadow-sm">
    <button
      type="button"
      onClick={() => zoomBy(ZOOM_FACTOR)}
      title="Zoom in (+)"
      className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <IconPlus className="size-3.5" />
    </button>
    <span className="ea-text-10 ea-scale-label px-1 font-mono text-muted-foreground text-center tabular-nums">
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
    <div className="w-px h-3.5 ea-bg-border-60 mx-0.5" />
    <button
      type="button"
      onClick={resetFit}
      title="Fit to view (R)"
      className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <IconMaximize className="size-3.5" />
    </button>
  </div>
);

/**
 * Adds full pan/zoom interactivity to any raw SVG string. All state and
 * interaction wiring live in {@link usePanZoom}; this component is the view.
 */
export const PanZoomSvg = ({ svgHtml, height = 340, className }: PanZoomSvgProps) => {
  const {
    canvasRef,
    processedSvg,
    scaleLabel,
    setViewportRef,
    zoomBy,
    resetFit,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCanvasClick,
    onDoubleClick,
    onKeyDown,
  } = usePanZoom(svgHtml);

  return (
    <div className={`relative select-none ${className ?? ''}`} style={{ height }}>
      <PanZoomControls scaleLabel={scaleLabel} zoomBy={zoomBy} resetFit={resetFit} />

      {/* Keyboard hint */}
      <div className="ea-text-10 ea-hint absolute bottom-2 left-2 z-10 pointer-events-none select-none leading-none">
        scroll · drag · click node · R to reset
      </div>

      {/* Viewport */}
      <div
        ref={setViewportRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive diagram — scroll to zoom, drag to pan, click a node to focus it"
        className="absolute inset-0 overflow-hidden cursor-grab outline-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onCanvasClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      >
        {/* Canvas — transformed layer; transformOrigin 0 0 makes math trivial */}
        <div
          ref={canvasRef}
          style={{ transformOrigin: '0 0' }}
          // Override any hardcoded background Mermaid bakes into the SVG root.
          className="ea-svg-canvas"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: processedSvg }}
        />
      </div>
    </div>
  );
};

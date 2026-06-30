import { IconLoader2 } from '@tabler/icons-react';
import { useIsDark } from '~/lib/useIsDark';
import { PanZoomSvg } from '~/modules/chat/components/PanZoomSvg';
import { useMermaidRender } from '~/modules/chat/hooks/useMermaidRender';

interface MermaidViewerProps {
  definition: string;
  /** Height passed straight to PanZoomSvg. Default '100%'. */
  height?: number | string;
  /** Debounce in ms before triggering a render. Default 0 (render immediately). */
  debounceMs?: number;
}

/** Renders a Mermaid diagram definition to an interactive SVG. */
export const MermaidViewer = ({ definition, height = '100%', debounceMs = 0 }: MermaidViewerProps) => {
  const isDark = useIsDark();

  const { phase, svgHtml, errorMsg, cleaned } = useMermaidRender(
    definition,
    isDark,
    debounceMs,
  );

  return (
    <div className="relative w-full h-full" style={{ minHeight: 200 }}>
      {phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {phase === 'error' && (
        <div className="p-4 space-y-2">
          <p className="text-sm font-medium text-destructive/80">
            Diagram syntax error
            {errorMsg ? ': ' : ''}
            <span className="font-mono text-xs">{errorMsg}</span>
          </p>
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Show source
            </summary>
            <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/40 rounded-lg p-3">
              {cleaned}
            </pre>
          </details>
        </div>
      )}
      {phase === 'ready' && svgHtml && (
        <PanZoomSvg svgHtml={svgHtml} height={height} />
      )}
    </div>
  );
};

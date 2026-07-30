import { useEffect, useRef, useState } from 'react';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import '@js-preview/excel/lib/index.css';
import { DocumentArtifact, documentUrl } from '~/modules/chat/lib/artifacts';

// Inline document rendering in the Preview panel — fully client-side (no
// external service, no CDN), so private files never leave the instance:
//   • PDF  → fetch bytes → same-origin blob: URL → native <iframe> viewer.
//   • DOCX → docx-preview (jszip + DOM, browser-native, no Node polyfills).
//   • XLSX → @js-preview/excel (x-data-spreadsheet grid).
//   • PPTX → @aiden0z/pptx-renderer (parses OOXML → HTML/SVG, browser-native).
// The heavy renderers are loaded on demand (dynamic import).

type Phase = 'loading' | 'ready' | 'error';

interface DocPreviewer {
  preview: (src: ArrayBuffer | Blob | string) => Promise<unknown>;
  destroy: () => void;
}

interface Disposable {
  destroy?: () => void;
  dispose?: () => void;
}

export const DocumentViewer = ({ artifact }: { artifact: DocumentArtifact }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let viewer: DocPreviewer | null = null;
    let pptxViewer: Disposable | null = null;
    let objectUrl: string | null = null;
    const container = containerRef.current;
    setPhase('loading');
    setPdfUrl(null);

    (async () => {
      try {
        const res = await fetch(documentUrl(artifact), {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        if (artifact.format === 'pdf') {
          const blob = await res.blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
          setPhase('ready');
          return;
        }

        const buffer = await res.arrayBuffer();
        if (cancelled || !container) return;
        container.innerHTML = '';

        if (artifact.format === 'docx') {
          const { renderAsync } = await import('docx-preview');
          // Library options make it flow to the container width (responsive)
          // instead of a fixed A4 page that overflows/clips the panel.
          await renderAsync(buffer, container, undefined, {
            inWrapper: false,
            ignoreWidth: true,
            ignoreHeight: true,
            breakPages: false,
          });
        } else if (artifact.format === 'pptx') {
          const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import(
            '@aiden0z/pptx-renderer'
          );
          // Renders the actual .pptx (OOXML → HTML/SVG) — no server/LibreOffice.
          pptxViewer = (await PptxViewer.open(buffer, container, {
            zipLimits: RECOMMENDED_ZIP_LIMITS,
          })) as Disposable;
        } else {
          const { default: jsPreviewExcel } = await import('@js-preview/excel');
          viewer = jsPreviewExcel.init(container);
          await viewer.preview(buffer);
        }
        if (!cancelled) setPhase('ready');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      try {
        viewer?.destroy();
        pptxViewer?.destroy?.();
        pptxViewer?.dispose?.();
      } catch {
        /* viewer already torn down */
      }
      if (container) container.innerHTML = '';
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [artifact.fileKey, artifact.format]);

  return (
    <div className="relative h-full w-full bg-white">
      {artifact.format === 'pdf'
        ? pdfUrl && (
            <iframe
              src={pdfUrl}
              title={artifact.title}
              className="h-full w-full border-0"
            />
          )
        : null}
      {artifact.format === 'pptx' && (
        // Slide deck: a calm brand stage with each slide framed as a card. The
        // renderer draws into the inner "deck" (width-capped + centered); the
        // card styling and the no-clip width rule live in chat.css. We must NOT
        // put max-width on the slides themselves or their layout collapses.
        <div className="ea-pptx-stage h-full w-full overflow-auto">
          <div ref={containerRef} className="ea-pptx-deck" />
        </div>
      )}
      {artifact.format !== 'pdf' && artifact.format !== 'pptx' && (
        <div
          ref={containerRef}
          className={
            artifact.format === 'docx'
              ? 'h-full w-full overflow-auto px-6 py-5 text-sm leading-relaxed [&_*]:max-w-full'
              : 'h-full w-full overflow-auto'
          }
        />
      )}

      {phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {phase === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn’t render this preview.
          </p>
          <Button asChild>
            <a
              href={documentUrl(artifact)}
              download={artifact.fileName}
              target="_blank"
              rel="noreferrer"
            >
              <IconDownload className="size-4" />
              Download {artifact.format.toUpperCase()}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

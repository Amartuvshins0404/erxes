import { useEffect, useRef, useState } from 'react';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import '@js-preview/excel/lib/index.css';
import {
  DocumentArtifact,
  documentUrl,
  slideUrls,
} from '~/modules/chat/lib/artifacts';

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

// A generated pptx deck arrives as per-slide PNGs (artifact.slides). Render them
// directly as framed cards — no OOXML parsing, pixel-faithful to the backend's
// render — and keep @aiden0z as the fallback for older decks with no slides.
const SlideImageDeck = ({ artifact }: { artifact: DocumentArtifact }) => {
  const urls = slideUrls(artifact);
  return (
    <div className="ea-scroll ea-pptx-stage h-full w-full overflow-auto">
      <div className="ea-pptx-deck">
        {urls.map((url, i) => (
          <img
            key={url}
            src={url}
            alt={`Slide ${i + 1}`}
            className="ea-slide-img"
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
};

export const DocumentViewer = ({ artifact }: { artifact: DocumentArtifact }) => {
  if (artifact.format === 'pptx' && artifact.slides?.length) {
    return <SlideImageDeck artifact={artifact} />;
  }
  return <DocumentRenderer artifact={artifact} />;
};

type DocSource =
  | { kind: 'pdf'; blob: Blob }
  | { kind: 'buffer'; buffer: ArrayBuffer };

// The one network read for a document artifact. Lives outside React so no raw
// fetch runs inside an effect; the AbortSignal wires cancellation through.
const fetchDocumentSource = async (
  artifact: DocumentArtifact,
  signal: AbortSignal,
): Promise<DocSource> => {
  const res = await fetch(documentUrl(artifact), {
    credentials: 'include',
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (artifact.format === 'pdf') return { kind: 'pdf', blob: await res.blob() };
  return { kind: 'buffer', buffer: await res.arrayBuffer() };
};

interface DocSourceState {
  source: DocSource | null;
  error: boolean;
}

// Data-fetching hook: fetches the artifact bytes with abort-on-unmount and
// no double-fire/race leak. Rendering the bytes stays in the component.
const useDocumentSource = (artifact: DocumentArtifact): DocSourceState => {
  const [state, setState] = useState<DocSourceState>({
    source: null,
    error: false,
  });

  const [prevArtifact, setPrevArtifact] = useState(artifact);
  if (artifact !== prevArtifact) {
    setPrevArtifact(artifact);
    setState({ source: null, error: false });
  }

  useEffect(() => {
    const controller = new AbortController();

    fetchDocumentSource(artifact, controller.signal)
      .then((source) => {
        if (!controller.signal.aborted) setState({ source, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ source: null, error: true });
      });

    return () => controller.abort();
  }, [artifact]);

  return state;
};

const DocumentRenderer = ({ artifact }: { artifact: DocumentArtifact }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { source, error } = useDocumentSource(artifact);

  useEffect(() => {
    if (error) {
      setPhase('error');
      return;
    }
    if (!source) {
      setPhase('loading');
      setPdfUrl(null);
      return;
    }

    if (source.kind === 'pdf') {
      const objectUrl = URL.createObjectURL(source.blob);
      setPdfUrl(objectUrl);
      setPhase('ready');
      return () => URL.revokeObjectURL(objectUrl);
    }

    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let viewer: DocPreviewer | null = null;
    let pptxViewer: Disposable | null = null;
    container.innerHTML = '';
    setPhase('loading');

    (async () => {
      try {
        const { buffer } = source;
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
    };
  }, [source, error, artifact.format]);

  return (
    <div className="relative h-full w-full bg-white">
      {artifact.format === 'pdf'
        ? pdfUrl && (
            <iframe
              src={pdfUrl}
              title={artifact.title}
              className="h-full w-full border-0"
              sandbox="allow-same-origin allow-popups allow-downloads"
            />
          )
        : null}
      {artifact.format === 'pptx' && (
        // Slide deck: a calm brand stage with each slide framed as a card. The
        // renderer draws into the inner "deck" (width-capped + centered); the
        // card styling and the no-clip width rule live in chat.css. We must NOT
        // put max-width on the slides themselves or their layout collapses.
        <div className="ea-scroll ea-pptx-stage h-full w-full overflow-auto">
          <div ref={containerRef} className="ea-pptx-deck" />
        </div>
      )}
      {artifact.format !== 'pdf' && artifact.format !== 'pptx' && (
        <div
          ref={containerRef}
          className={
            artifact.format === 'docx'
              ? 'ea-scroll h-full w-full overflow-auto px-6 py-5 text-sm leading-relaxed [&_*]:max-w-full'
              : 'ea-scroll h-full w-full overflow-auto'
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

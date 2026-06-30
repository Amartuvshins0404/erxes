import { memo, useEffect, useRef } from 'react';
import {
  IconChartBar,
  IconDownload,
  IconHierarchy,
  IconLayoutSidebarRightExpand,
  IconMaximize,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { EChart } from '~/modules/chat/charts';
import {
  artifactIcon,
  type Artifact,
  type ChartArtifact,
  type DiagramArtifact,
  type DocumentArtifact,
  documentUrl,
} from '~/modules/chat/lib/artifacts';
import { formatFileSize } from '~/modules/chat/lib/attachments';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { MermaidViewer } from '~/modules/chat/preview/MermaidViewer';

// Registers the artifact in the Files list (without auto-opening the panel) on
// the first live render. Shared by all artifact card variants.
function usePresentIfLive(artifact: Artifact, live?: boolean) {
  const presentIfNew = previewStore((s) => s.presentIfNew);
  // A streaming turn hands us a fresh `artifact` object on every throttled tick,
  // so depending on the object itself would re-fire this effect ~20×/s. Key it on
  // the stable id instead — `presentIfNew` is a one-shot (guarded by `seen`), and
  // a settled artifact's content never changes for a given id.
  const artifactRef = useRef(artifact);
  artifactRef.current = artifact;
  useEffect(() => {
    if (live) presentIfNew(artifactRef.current);
  }, [live, artifact.id, presentIfNew]);
}

// ── Chart card (inline EChart + open in preview) ──────────────────────────────
const ChartPreview = ({ artifact, live }: { artifact: ChartArtifact; live?: boolean }) => {
  const openArtifact = previewStore((s) => s.openArtifact);
  usePresentIfLive(artifact, live);

  return (
    <div className="ea-pop my-2 overflow-hidden rounded-xl border border-border/70 bg-background">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
        <IconChartBar className="size-4 text-primary shrink-0" />
        <p className="flex-1 min-w-0 truncate text-sm font-medium">{artifact.title}</p>
        <Button variant="ghost" size="sm" onClick={() => openArtifact(artifact)}>
          <IconLayoutSidebarRightExpand className="size-3.5" />
          Open
        </Button>
      </div>
      {/* Inline chart */}
      <div className="px-2 py-1" style={{ height: 380 }}>
        <EChart spec={artifact.spec} height="100%" />
      </div>
    </div>
  );
};

// ── Diagram card (inline Mermaid + open in preview) ───────────────────────────
const DiagramPreview = ({ artifact, live }: { artifact: DiagramArtifact; live?: boolean }) => {
  const openArtifact = previewStore((s) => s.openArtifact);
  usePresentIfLive(artifact, live);

  return (
    <div className="ea-pop my-2 overflow-hidden rounded-xl border border-border/70 bg-background">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
        <IconHierarchy className="size-4 text-primary shrink-0" />
        <p className="flex-1 min-w-0 truncate text-sm font-medium">{artifact.title}</p>
        <Button variant="ghost" size="sm" onClick={() => openArtifact(artifact)}>
          <IconLayoutSidebarRightExpand className="size-3.5" />
          Open
        </Button>
      </div>
      <div style={{ height: 300 }}>
        <MermaidViewer definition={artifact.definition} height="100%" />
      </div>
    </div>
  );
};

// ── Document card (no inline rendering — PDF/DOCX/XLSX aren't embeddable) ─────
const DocumentCard = ({ artifact, live }: { artifact: DocumentArtifact; live?: boolean }) => {
  const openArtifact = previewStore((s) => s.openArtifact);
  usePresentIfLive(artifact, live);

  const Icon = artifactIcon(artifact);
  const subtitle = [artifact.format.toUpperCase(), formatFileSize(artifact.size)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="ea-pop my-2 flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 hover:border-border transition-colors">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{artifact.title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="secondary" size="sm" onClick={() => openArtifact(artifact)}>
          <IconMaximize className="size-3.5" />
          Open
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={documentUrl(artifact)} download={artifact.fileName} target="_blank" rel="noreferrer">
            <IconDownload className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
};

// Two artifacts are interchangeable for rendering when they describe the same
// thing. A settled artifact is immutable for a given id — a tool call emits it
// once (only at state 'output-available') and never mutates it; a streaming turn
// merely deep-clones it on every throttled tick. So `id` (+ kind, defensively) is
// a sufficient content key, and this stays O(1): no serializing the spec on every
// parent re-render in the streaming hot path. A genuinely different artifact (e.g.
// a regenerated chart) carries a new id and re-renders.
const artifactsEqual = (a: Artifact, b: Artifact): boolean =>
  a === b || (a.id === b.id && a.kind === b.kind);

// ── Router ────────────────────────────────────────────────────────────────────
// memo() so the per-token reference churn of a streaming turn (each tick deep-
// clones the message, hence the artifact and its chart spec) stops here instead
// of propagating into EChart/Mermaid and remounting the visualization. EChart is
// itself reference-churn-resilient; this just spares it the wasted renders.
export const ArtifactCard = memo(
  function ArtifactCard({ artifact, live }: { artifact: Artifact; live?: boolean }) {
    if (artifact.kind === 'chart') return <ChartPreview artifact={artifact} live={live} />;
    if (artifact.kind === 'diagram') return <DiagramPreview artifact={artifact} live={live} />;
    return <DocumentCard artifact={artifact} live={live} />;
  },
  (prev, next) =>
    prev.live === next.live && artifactsEqual(prev.artifact, next.artifact),
);

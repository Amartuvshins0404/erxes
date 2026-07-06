import { memo, useState } from 'react';
import {
  IconAlertTriangle,
  IconDownload,
  IconHierarchy,
  IconLayoutSidebarRightExpand,
  IconMaximize,
  IconPhoto,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import {
  ChartArtifactView,
  ChartExpandDialog,
} from '~/modules/chat/components/ChartArtifactView';
import {
  artifactIcon,
  type Artifact,
  type ChartArtifact,
  type DiagramArtifact,
  type DocumentArtifact,
  type ImageArtifact,
  documentUrl,
} from '~/modules/chat/lib/artifacts';
import { formatFileSize } from '~/modules/chat/lib/attachments';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { MermaidViewer } from '~/modules/chat/preview/MermaidViewer';
import { CHECKERBOARD_STYLE } from '~/modules/chat/preview/checkerboard';

// ── Inline chart (borderless, flows in the message column) ────────────────────
// No card chrome — a large left-aligned heading with quiet actions on its
// right, then the interactive chart + totals + filter sliders directly in the
// chat flow, width-constrained by the message column itself.
const ChartPreview = ({ artifact }: { artifact: ChartArtifact }) => {
  const openArtifact = previewStore((s) => s.openArtifact);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ea-pop my-4">
      {/* Heading row */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-medium tracking-tight">{artifact.title}</h3>
          {artifact.spec.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {artifact.spec.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openArtifact(artifact)}
            aria-label="Open in side panel"
            title="Open in side panel"
          >
            <IconLayoutSidebarRightExpand className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(true)}
            aria-label="Expand chart"
            title="Expand"
          >
            <IconMaximize className="size-4" />
          </Button>
        </div>
      </div>
      {/* Chart + totals + local filter sliders */}
      <ChartArtifactView artifact={artifact} chartHeight={400} className="mt-2" />
      <ChartExpandDialog artifact={artifact} open={expanded} onOpenChange={setExpanded} />
    </div>
  );
};

// ── Diagram card (inline Mermaid + open in preview) ───────────────────────────
const DiagramPreview = ({ artifact }: { artifact: DiagramArtifact }) => {
  const openArtifact = previewStore((s) => s.openArtifact);

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
const DocumentCard = ({ artifact }: { artifact: DocumentArtifact }) => {
  const openArtifact = previewStore((s) => s.openArtifact);

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

// ── Image card (inline transparent-PNG preview + open in preview) ─────────────
const ImageCard = ({ artifact }: { artifact: ImageArtifact }) => {
  const openArtifact = previewStore((s) => s.openArtifact);

  return (
    <div className="ea-pop my-2 overflow-hidden rounded-xl border border-border/70 bg-background">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
        <IconPhoto className="size-4 text-primary shrink-0" />
        <p className="flex-1 min-w-0 truncate text-sm font-medium">{artifact.title}</p>
        <Button variant="ghost" size="sm" onClick={() => openArtifact(artifact)}>
          <IconLayoutSidebarRightExpand className="size-3.5" />
          Open
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={documentUrl(artifact)} download={artifact.fileName} target="_blank" rel="noreferrer">
            <IconDownload className="size-3.5" />
          </a>
        </Button>
      </div>
      <div className="flex items-center justify-center p-2" style={CHECKERBOARD_STYLE}>
        {/* Height cap as an inline style, not max-h-64 — that utility is used
            by no host/core code, so the prod CSS purge could drop it. */}
        <img
          src={documentUrl(artifact)}
          alt={artifact.title}
          className="max-w-full object-contain"
          style={{ maxHeight: '16rem' }}
        />
      </div>
    </div>
  );
};

// ── Failed artifact tool (visible fallback) ───────────────────────────────────
// Artifact tools are hidden from the run trace because they normally surface as
// a card — so when one errors (or its output yields no valid artifact) the turn
// would show NOTHING. This card makes that failure visible where the chart or
// document would have appeared.
const FAILURE_NOUNS: Record<string, string> = {
  renderchart: 'chart',
  renderdiagram: 'diagram',
};

export const ArtifactFailureCard = ({
  toolName,
  errorText,
}: {
  toolName: string;
  errorText?: string;
}) => {
  const noun =
    FAILURE_NOUNS[toolName.toLowerCase().replace(/[-_\s]/g, '')] ?? 'document';
  return (
    <div className="ea-pop my-2 flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <IconAlertTriangle className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{`The ${noun} could not be rendered`}</p>
        <p className="truncate text-xs text-muted-foreground" title={errorText}>
          {errorText || 'The tool call failed — ask the agent to try again.'}
        </p>
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
  function ArtifactCard({ artifact }: { artifact: Artifact }) {
    if (artifact.kind === 'chart') return <ChartPreview artifact={artifact} />;
    if (artifact.kind === 'diagram') return <DiagramPreview artifact={artifact} />;
    if (artifact.kind === 'image') return <ImageCard artifact={artifact} />;
    return <DocumentCard artifact={artifact} />;
  },
  (prev, next) => artifactsEqual(prev.artifact, next.artifact),
);

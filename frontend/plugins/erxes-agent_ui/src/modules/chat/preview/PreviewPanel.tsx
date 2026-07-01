import { useRef, useState } from 'react';
import {
  IconArrowLeft,
  IconDownload,
  IconFile,
  IconMaximize,
  IconMinimize,
  IconPresentation,
  IconX,
} from '@tabler/icons-react';
import { Button, cn } from 'erxes-ui';
import { EChart, type EChartHandle } from '~/modules/chat/charts';
import {
  artifactIcon,
  Artifact,
  DocumentArtifact,
  documentUrl,
} from '~/modules/chat/lib/artifacts';
import { MermaidViewer } from '~/modules/chat/preview/MermaidViewer';
import { formatFileSize } from '~/modules/chat/lib/attachments';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { DocumentViewer } from '~/modules/chat/preview/DocumentViewer';
import { PresentMode } from '~/modules/chat/preview/PresentMode';
import { useThreadArtifacts } from '~/modules/chat/hooks/useThreadArtifacts';

const canPresent = (a: Artifact): a is DocumentArtifact =>
  a.kind === 'document' && a.format === 'pptx' && !!a.slides?.length;

const slideLabel = (a: DocumentArtifact): string => {
  const n = a.slideCount ?? a.slides?.length;
  return n ? `${n} slide${n === 1 ? '' : 's'}` : '';
};

const artifactSubtitle = (a: Artifact): string => {
  if (a.kind === 'chart') return 'Interactive chart';
  if (a.kind === 'diagram') return 'Mermaid diagram';
  return [a.format.toUpperCase(), slideLabel(a), formatFileSize(a.size)]
    .filter(Boolean)
    .join(' · ');
};

// The Claude-artifacts-style side panel. Two views — a per-thread file list
// (persisted, survives reloads) and a single artifact (interactive chart or an
// inline document) — and two layouts: docked beside the chat, or fullscreen
// (whole window) with the file list pinned as a left sidebar. Reads
// view/artifact/fullscreen from previewStore.
export const PreviewPanel = ({ threadId }: { threadId?: string }) => {
  const view = previewStore((s) => s.view);
  const artifact = previewStore((s) => s.artifact);
  const fullscreen = previewStore((s) => s.fullscreen);
  const close = previewStore((s) => s.close);

  const showList = view === 'list' || !artifact;

  const body = showList ? (
    <FileListView threadId={threadId} onClose={close} />
  ) : (
    <ItemView artifact={artifact} onClose={close} />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex bg-background">
        {/* Sidebar: the full file list, pinned, while an item is open. */}
        {!showList && (
          <aside className="ea-preview-sidebar w-72 shrink-0 flex-col border-r">
            <SidebarFileList threadId={threadId} activeId={artifact?.id} />
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">{body}</div>
      </div>
    );
  }

  // Docked layout (right-side column ≥lg, full-area overlay below) is defined in
  // chat.css as .ea-preview-dock — the responsive/arbitrary width utilities it
  // replaces get purged from the production host CSS, which made the panel take
  // over the whole screen instead of docking.
  return <div className="ea-preview-dock">{body}</div>;
};

// ── A single file row (shared by the list view and the fullscreen sidebar) ────
const FileRow = ({
  artifact,
  active,
  onClick,
}: {
  artifact: Artifact;
  active?: boolean;
  onClick: () => void;
}) => {
  const Icon = artifactIcon(artifact);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-primary/40 bg-primary/5'
          : 'border-border/70 bg-background/60 hover:border-border hover:bg-accent/40',
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{artifact.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {artifactSubtitle(artifact)}
        </p>
      </div>
    </button>
  );
};

// ── Grouped, clickable file list (grouped by chat instance / turn) ───────────
const GroupedFiles = ({
  threadId,
  activeId,
}: {
  threadId?: string;
  activeId?: string;
}) => {
  const { groups } = useThreadArtifacts(threadId);
  const openArtifact = previewStore((s) => s.openArtifact);

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={group.turnId} className="space-y-1.5">
          <p className="truncate px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.prompt || `Conversation ${gi + 1}`}
          </p>
          <ul className="space-y-1.5">
            {group.items.map((a) => (
              <li key={a.id}>
                <FileRow
                  artifact={a}
                  active={a.id === activeId}
                  onClick={() => openArtifact(a)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// ── The fullscreen left sidebar ──────────────────────────────────────────────
const SidebarFileList = ({
  threadId,
  activeId,
}: {
  threadId?: string;
  activeId?: string;
}) => {
  const { artifacts } = useThreadArtifacts(threadId);
  return (
    <>
      <div className="flex h-12 items-center border-b px-4 shrink-0">
        <p className="text-sm font-medium">
          Files{artifacts.length ? ` · ${artifacts.length}` : ''}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <GroupedFiles threadId={threadId} activeId={activeId} />
      </div>
    </>
  );
};

// ── Full file list (docked panel, or fullscreen with no item selected) ───────
const FileListView = ({
  threadId,
  onClose,
}: {
  threadId?: string;
  onClose: () => void;
}) => {
  const { artifacts, loading } = useThreadArtifacts(threadId);
  const fullscreen = previewStore((s) => s.fullscreen);
  const toggleFullscreen = previewStore((s) => s.toggleFullscreen);

  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 py-2.5 shrink-0">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          Files{artifacts.length ? ` · ${artifacts.length}` : ''}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? (
            <IconMinimize className="size-4" />
          ) : (
            <IconMaximize className="size-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <IconX className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {artifacts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <IconFile className="size-8 opacity-40" />
            <p className="text-sm">
              {loading ? 'Loading…' : 'No charts or documents yet.'}
            </p>
            <p className="text-xs">
              Ask the agent to chart data or generate a report.
            </p>
          </div>
        ) : (
          <GroupedFiles threadId={threadId} />
        )}
      </div>
    </>
  );
};

// ── Single item ──────────────────────────────────────────────────────────────
const ItemView = ({
  artifact,
  onClose,
}: {
  artifact: Artifact;
  onClose: () => void;
}) => {
  const showList = previewStore((s) => s.showList);
  const fullscreen = previewStore((s) => s.fullscreen);
  const toggleFullscreen = previewStore((s) => s.toggleFullscreen);
  const chartRef = useRef<EChartHandle>(null);
  const [presenting, setPresenting] = useState(false);
  const typeLabel =
    artifact.kind === 'chart'
      ? 'Chart'
      : artifact.kind === 'diagram'
        ? 'Diagram'
        : artifact.format.toUpperCase();

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={showList}
          aria-label="Back to files"
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {typeLabel}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{artifact.title}</p>
          {artifact.kind === 'chart' && artifact.spec.description && (
            <p
              className="truncate text-xs text-muted-foreground"
              title={artifact.spec.description}
            >
              {artifact.spec.description}
            </p>
          )}
        </div>
        {artifact.kind === 'chart' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => chartRef.current?.downloadPng(artifact.title)}
          >
            <IconDownload className="size-3.5" />
            PNG
          </Button>
        )}
        {canPresent(artifact) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPresenting(true)}
          >
            <IconPresentation className="size-3.5" />
            Present
          </Button>
        )}
        {artifact.kind === 'document' && <DocumentActions artifact={artifact} />}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? (
            <IconMinimize className="size-4" />
          ) : (
            <IconMaximize className="size-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <IconX className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {artifact.kind === 'chart' ? (
          <div className="h-full w-full p-4">
            <EChart ref={chartRef} spec={artifact.spec} height="100%" />
          </div>
        ) : artifact.kind === 'diagram' ? (
          <MermaidViewer definition={artifact.definition} />
        ) : (
          <DocumentViewer artifact={artifact} />
        )}
      </div>

      {presenting && canPresent(artifact) && (
        <PresentMode
          artifact={artifact}
          onExit={() => setPresenting(false)}
        />
      )}
    </>
  );
};

const DocumentActions = ({ artifact }: { artifact: DocumentArtifact }) => (
  <Button asChild variant="secondary" size="sm">
    <a
      href={documentUrl(artifact)}
      download={artifact.fileName}
      target="_blank"
      rel="noreferrer"
    >
      <IconDownload className="size-3.5" />
      Download
    </a>
  </Button>
);

import { useEffect } from 'react';
import {
  IconChartBar,
  IconDownload,
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypePpt,
  IconFileTypeXls,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Artifact, documentUrl } from '~/modules/chat/lib/artifacts';
import { formatFileSize } from '~/modules/chat/lib/attachments';
import { previewStore } from '~/modules/chat/preview/previewStore';

// Icon per format — a display hint, not a gate: an unrecognized format still
// renders (generic file icon), so a new backend format needs no change here.
const docIcon = (format: string) => {
  if (format === 'pdf') return IconFileTypePdf;
  if (format === 'docx') return IconFileTypeDocx;
  if (format === 'pptx') return IconFileTypePpt;
  if (format === 'xlsx') return IconFileTypeXls;
  return IconFile;
};

// Inline card shown in the assistant message for a chart or generated document.
// "Open" reveals it in the Preview panel; documents also offer a direct download.
// During a live turn the artifact auto-opens the panel once.
export const ArtifactCard = ({
  artifact,
  live,
}: {
  artifact: Artifact;
  live?: boolean;
}) => {
  const openArtifact = previewStore((s) => s.openArtifact);
  const presentIfNew = previewStore((s) => s.presentIfNew);

  useEffect(() => {
    if (live) presentIfNew(artifact);
  }, [live, artifact, presentIfNew]);

  const isChart = artifact.kind === 'chart';
  const Icon = isChart ? IconChartBar : docIcon(artifact.format);

  const subtitle = isChart
    ? 'Interactive chart'
    : [artifact.format.toUpperCase(), formatFileSize(artifact.size)]
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openArtifact(artifact)}
        >
          <IconLayoutSidebarRightExpand className="size-3.5" />
          Open
        </Button>
        {artifact.kind === 'document' && (
          <Button asChild variant="ghost" size="sm">
            <a
              href={documentUrl(artifact)}
              download={artifact.fileName}
              target="_blank"
              rel="noreferrer"
            >
              <IconDownload className="size-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

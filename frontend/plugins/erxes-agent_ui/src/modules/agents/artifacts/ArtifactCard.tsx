import {
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize2,
  IconCheck,
  IconCopy,
  IconDownload,
  IconFileTypeDocx,
  IconFileTypeHtml,
  IconFileTypePdf,
  IconFileTypeXls,
  IconLoader2,
} from '@tabler/icons-react';
import { Badge, Button } from 'erxes-ui';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import type { ComponentType } from 'react';

import { parseDelimitedTable } from './converters/csv';
import { downloadBlob } from './download';
import { HtmlPreview } from './HtmlPreview';
import type { IArtifact } from './parseArtifacts';
import type { ISpreadsheetHandle } from './previews/SpreadsheetEditor';

const SpreadsheetEditor = lazy(() =>
  import('./previews/SpreadsheetEditor').then((m) => ({
    default: m.SpreadsheetEditor,
  })),
);
const DocxPreview = lazy(() =>
  import('./previews/DocxPreview').then((m) => ({ default: m.DocxPreview })),
);
const PdfPreview = lazy(() =>
  import('./previews/PdfPreview').then((m) => ({ default: m.PdfPreview })),
);

const TYPE_ICONS: Record<
  IArtifact['type'],
  ComponentType<{ className?: string }>
> = {
  html: IconFileTypeHtml,
  xlsx: IconFileTypeXls,
  docx: IconFileTypeDocx,
  pdf: IconFileTypePdf,
};

const TYPE_LABELS: Record<IArtifact['type'], string> = {
  html: 'HTML',
  xlsx: 'Spreadsheet',
  docx: 'Word',
  pdf: 'PDF',
};

const PreviewFallback = () => (
  <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
  </div>
);

interface IArtifactCardProps {
  artifact: IArtifact;
}

export const ArtifactCard = ({ artifact }: IArtifactCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const [documentFailed, setDocumentFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const spreadsheetRef = useRef<ISpreadsheetHandle | null>(null);

  const needsDocument = artifact.type === 'docx' || artifact.type === 'pdf';

  useEffect(() => {
    if (!needsDocument) {
      return;
    }

    let cancelled = false;
    setDocumentBlob(null);
    setDocumentFailed(false);

    const generate = async () => {
      try {
        const blob =
          artifact.type === 'docx'
            ? await (await import('./converters/docx')).markdownToDocxBlob(artifact.content)
            : await (await import('./converters/pdf')).markdownToPdfBlob(artifact.content);

        if (!cancelled) {
          setDocumentBlob(blob);
        }
      } catch {
        if (!cancelled) {
          setDocumentFailed(true);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [needsDocument, artifact.type, artifact.content, attempt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = async () => {
    setDownloadBusy(true);
    setDownloadFailed(false);

    try {
      if (artifact.type === 'html') {
        downloadBlob(
          new Blob([artifact.content], { type: 'text/html;charset=utf-8' }),
          artifact.filename,
        );
      } else if (artifact.type === 'xlsx') {
        const rows =
          spreadsheetRef.current?.readValues() ??
          parseDelimitedTable(artifact.content).rows;
        const { tableToXlsxBlob } = await import('./converters/xlsx');

        downloadBlob(await tableToXlsxBlob(rows), artifact.filename);
      } else if (documentBlob) {
        downloadBlob(documentBlob, artifact.filename);
      } else {
        setDownloadFailed(true);
      }
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloadBusy(false);
    }
  };

  const renderPreview = () => {
    if (artifact.type === 'html') {
      return <HtmlPreview html={artifact.content} />;
    }

    if (artifact.type === 'xlsx') {
      return (
        <Suspense fallback={<PreviewFallback />}>
          <SpreadsheetEditor content={artifact.content} handleRef={spreadsheetRef} />
        </Suspense>
      );
    }

    if (documentFailed) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            Preview could not be generated.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (!documentBlob) {
      return <PreviewFallback />;
    }

    return (
      <Suspense fallback={<PreviewFallback />}>
        {artifact.type === 'docx' ? (
          <DocxPreview blob={documentBlob} />
        ) : (
          <PdfPreview blob={documentBlob} />
        )}
      </Suspense>
    );
  };

  const Icon = TYPE_ICONS[artifact.type];

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/20">
      <div className="flex items-center justify-between gap-2 border-b bg-background/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{artifact.title}</span>
          <Badge variant="secondary" className="shrink-0">
            {TYPE_LABELS[artifact.type]}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            title="Copy source"
          >
            {copied ? (
              <IconCheck className="size-4 text-emerald-600" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={downloadBusy}
            title="Download"
          >
            {downloadBusy ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDownload className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((value) => !value)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <IconArrowsDiagonalMinimize2 className="size-4" />
            ) : (
              <IconArrowsDiagonal className="size-4" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={`p-3 transition-[height] duration-300 ease-in-out ${
          expanded ? 'h-[70vh] sm:h-[75vh]' : 'h-[320px] sm:h-[380px]'
        }`}
      >
        {renderPreview()}
      </div>
      {downloadFailed && (
        <p className="px-3 pb-2 text-xs text-destructive">
          Download failed — please try again.
        </p>
      )}
    </div>
  );
};

import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Suspense, lazy, useEffect, useState } from 'react';

import { parseDelimitedTable } from './converters/csv';
import { downloadBlob } from './download';
import { HtmlPreview } from './HtmlPreview';
import type { IArtifact } from './parseArtifacts';

const SpreadsheetPreview = lazy(() =>
  import('./previews/SpreadsheetPreview').then((m) => ({
    default: m.SpreadsheetPreview,
  })),
);
const DocxPreview = lazy(() =>
  import('./previews/DocxPreview').then((m) => ({ default: m.DocxPreview })),
);
const PdfPreview = lazy(() =>
  import('./previews/PdfPreview').then((m) => ({ default: m.PdfPreview })),
);

const PreviewFallback = () => (
  <div className="ea:flex ea:h-full ea:min-h-[120px] ea:items-center ea:justify-center">
    <IconLoader2 className="ea:size-5 ea:animate-spin ea:text-muted-foreground" />
  </div>
);

interface IArtifactCardProps {
  artifact: IArtifact;
}

/**
 * Minimalistic artifact card. The header is just the artifact title plus
 * copy/download icons — no type badge, no expand button, no decorative
 * background. The body height follows the content; HTML/DOCX/PDF
 * previews still cap themselves so the iframe does not dominate the
 * transcript.
 */
export const ArtifactCard = ({ artifact }: IArtifactCardProps) => {
  const [copied, setCopied] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const [documentFailed, setDocumentFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
        const rows = parseDelimitedTable(artifact.content).rows;
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
          <SpreadsheetPreview content={artifact.content} />
        </Suspense>
      );
    }

    if (documentFailed) {
      return (
        <div className="ea:flex ea:h-full ea:min-h-[120px] ea:flex-col ea:items-center ea:justify-center ea:gap-2 ea:rounded-md ea:border ea:border-dashed ea:p-6">
          <p className="ea:text-sm ea:text-muted-foreground">
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

  return (
    <div className="ea:overflow-hidden ea:rounded-lg ea:border">
      <div className="ea:flex ea:items-center ea:justify-between ea:gap-2 ea:px-3 ea:py-1.5">
        <span className="ea:truncate ea:text-sm ea:font-medium">
          {artifact.title}
        </span>
        <div className="ea:flex ea:shrink-0 ea:items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            title="Copy source"
            className="ea:size-7"
          >
            {copied ? (
              <IconCheck className="ea:size-3.5 ea:text-emerald-600" />
            ) : (
              <IconCopy className="ea:size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={downloadBusy}
            title="Download"
            className="ea:size-7"
          >
            {downloadBusy ? (
              <IconLoader2 className="ea:size-3.5 ea:animate-spin" />
            ) : (
              <IconDownload className="ea:size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={
          artifact.type === 'xlsx'
            ? ''
            : 'ea:h-[320px] ea:sm:h-[380px]'
        }
      >
        {renderPreview()}
      </div>
      {downloadFailed && (
        <p className="ea:px-3 ea:pb-2 ea:text-xs ea:text-destructive">
          Download failed — please try again.
        </p>
      )}
    </div>
  );
};

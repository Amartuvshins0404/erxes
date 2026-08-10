import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconCode, IconEye, IconLoader2 } from '@tabler/icons-react';
import {
  audioPlugin,
  imagePlugin,
  officePlugin,
  pdfPlugin,
  textPlugin,
  videoPlugin,
} from '@open-file-viewer/core';
import type { PreviewPlugin } from '@open-file-viewer/core';
import '@open-file-viewer/core/style.css';
import { FileViewer } from '@open-file-viewer/react';
import { Tabs } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '~/lib/useIsDark';
import {
  documentUrl,
  websiteNavigationUrl,
  websiteUrl,
  type DocumentArtifact,
  type WebsiteArtifact,
} from '~/modules/chat/lib/artifacts';

const pdfOptions = {
  workerSrc: new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString(),
};

const previewPlugins: PreviewPlugin[] = [
  imagePlugin(),
  pdfPlugin(pdfOptions),
  officePlugin({ pdf: pdfOptions }),
  textPlugin(),
  audioPlugin(),
  videoPlugin(),
];

const DocumentFileViewer = ({
  artifact,
}: {
  artifact: DocumentArtifact | WebsiteArtifact;
}) => {
  const isDark = useIsDark();

  return (
    <FileViewer
      key={`${artifact.id}:${artifact.fileKey}`}
      file={documentUrl(artifact)}
      fileName={artifact.fileName}
      mimeType={artifact.mimeType}
      width="100%"
      height="100%"
      fit="contain"
      plugins={previewPlugins}
      fallback="inline"
      theme={isDark ? 'dark' : 'light'}
      toolbar={{
        zoom: true,
        rotate: true,
        fullscreen: true,
        print: true,
        search: true,
        download: true,
      }}
      className="h-full min-h-0 w-full"
      style={{ minHeight: 0 }}
    />
  );
};

type HtmlDocumentView = 'code' | 'preview';
type HtmlPreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

const ViewerTabs = ({
  view,
  onViewChange,
  code,
  preview,
}: {
  view: HtmlDocumentView;
  onViewChange: (view: HtmlDocumentView) => void;
  code: ReactNode;
  preview: ReactNode;
}) => {
  const { t } = useTranslation('erxes-agent');

  return (
    <Tabs
      value={view}
      onValueChange={(value) =>
        onViewChange(value === 'preview' ? 'preview' : 'code')
      }
      className="flex h-full min-h-0 flex-col"
    >
      <div className="shrink-0 border-b px-3 py-2">
        <Tabs.List>
          <Tabs.Trigger value="code">
            <IconCode className="mr-1.5 size-4" />
            {t('artifact-html-code')}
          </Tabs.Trigger>
          <Tabs.Trigger value="preview">
            <IconEye className="mr-1.5 size-4" />
            {t('artifact-html-preview')}
          </Tabs.Trigger>
        </Tabs.List>
      </div>

      <Tabs.Content
        value="code"
        className="m-0 min-h-0 flex-1 data-[state=active]:flex"
      >
        {code}
      </Tabs.Content>
      <Tabs.Content
        value="preview"
        className="m-0 min-h-0 flex-1 data-[state=active]:flex"
      >
        {preview}
      </Tabs.Content>
    </Tabs>
  );
};

const isHtmlDocument = (artifact: DocumentArtifact): boolean => {
  const format = artifact.format.toLowerCase();
  const mimeType = artifact.mimeType.toLowerCase();

  return (
    format === 'html' ||
    format === 'htm' ||
    mimeType === 'text/html' ||
    /\.html?$/i.test(artifact.fileName)
  );
};

const HtmlDocumentViewer = ({ artifact }: { artifact: DocumentArtifact }) => {
  const { t } = useTranslation('erxes-agent');
  const [view, setView] = useState<HtmlDocumentView>('preview');
  const [html, setHtml] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<HtmlPreviewStatus>('idle');
  const sourceUrl = documentUrl(artifact);

  useEffect(() => {
    if (view !== 'preview' || html !== null) {
      return;
    }

    const controller = new AbortController();
    setPreviewStatus('loading');

    fetch(sourceUrl, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTML preview request failed: ${response.status}`);
        }

        return response.text();
      })
      .then((source) => {
        setHtml(source);
        setPreviewStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setPreviewStatus('error');
      });

    return () => controller.abort();
  }, [html, sourceUrl, view]);

  return (
    <ViewerTabs
      view={view}
      onViewChange={setView}
      code={<DocumentFileViewer artifact={artifact} />}
      preview={
        <>
          {previewStatus === 'loading' && (
            <div
              className="flex h-full w-full items-center justify-center"
              aria-label={t('artifact-html-preview-loading')}
            >
              <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {previewStatus === 'error' && (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-destructive">
              {t('artifact-html-preview-error')}
            </div>
          )}
          {previewStatus === 'ready' && html !== null && (
            <iframe
              title={t('artifact-html-preview-frame-title', {
                name: artifact.fileName,
              })}
              srcDoc={html}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              className="h-full w-full border-0 bg-white"
            />
          )}
        </>
      }
    />
  );
};

const WEBSITE_NAVIGATION_MESSAGE = 'erxes-agent:website-preview:navigate';

interface WebsiteNavigationMessage {
  type: typeof WEBSITE_NAVIGATION_MESSAGE;
  href: string;
}

const isWebsiteNavigationMessage = (
  value: unknown,
): value is WebsiteNavigationMessage => {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    message.type === WEBSITE_NAVIGATION_MESSAGE &&
    typeof message.href === 'string'
  );
};

export const WebsiteViewer = ({ artifact }: { artifact: WebsiteArtifact }) => {
  const { t } = useTranslation('erxes-agent');
  const [view, setView] = useState<HtmlDocumentView>('preview');
  const entryUrl = websiteUrl(artifact);
  const [previewUrl, setPreviewUrl] = useState(entryUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => setPreviewUrl(entryUrl), [entryUrl]);

  useEffect(() => {
    const handleNavigation = (event: MessageEvent<unknown>) => {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        !isWebsiteNavigationMessage(event.data)
      ) {
        return;
      }

      const target = websiteNavigationUrl(artifact, event.data.href);
      if (target) setPreviewUrl(target);
    };

    window.addEventListener('message', handleNavigation);
    return () => window.removeEventListener('message', handleNavigation);
  }, [artifact]);

  return (
    <ViewerTabs
      view={view}
      onViewChange={setView}
      code={<DocumentFileViewer artifact={artifact} />}
      preview={
        <iframe
          ref={iframeRef}
          title={t('artifact-website-frame-title', {
            name: artifact.title,
          })}
          src={previewUrl}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="h-full w-full border-0 bg-white"
        />
      }
    />
  );
};

export const DocumentViewer = ({ artifact }: { artifact: DocumentArtifact }) =>
  isHtmlDocument(artifact) ? (
    <HtmlDocumentViewer key={artifact.id} artifact={artifact} />
  ) : (
    <DocumentFileViewer artifact={artifact} />
  );

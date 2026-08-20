import { Button, Dialog, Spinner, cn, readImage, useUpload } from 'erxes-ui';
import { useRef, useState } from 'react';
import {
  IconDownload,
  IconFile,
  IconPaperclip,
  IconTrash,
} from '@tabler/icons-react';
import { AgencyAttachment } from '../types/form';
import { formatFileSize, getAttachmentType } from '../utils/attachment';
import { getAttachmentIcon } from './attachment-type';

export const MultipleDocumentUpload = ({
  value = [],
  onChange,
  disabled = false,
}: {
  value: AgencyAttachment[];
  onChange: (values: AgencyAttachment[]) => void;
  disabled?: boolean;
}) => {
  const { upload } = useUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    uploaded: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const total = files.length;
    let uploaded = 0;

    setIsLoading(true);
    setUploadProgress({ uploaded: 0, total });

    upload({
      files,
      afterUpload: ({ status, response, fileInfo }) => {
        if (status === 'ok' && response) {
          const nextValue = [
            ...latestValueRef.current,
            {
              url: typeof response === 'string' ? response : response.url,
              name: fileInfo.name,
              type: fileInfo.type,
              size: fileInfo.size,
              duration: fileInfo.duration,
            },
          ];
          latestValueRef.current = nextValue;
          onChange(nextValue);
        }

        uploaded += 1;
        setUploadProgress((prev) => ({ ...prev, uploaded }));

        if (uploaded === total) {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        disabled={isLoading || disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isLoading || disabled}
        className="flex w-1/4 items-center gap-2 aria-disabled:pointer-events-none"
        onClick={() => fileInputRef.current?.click()}
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>
              {uploadProgress.uploaded} / {uploadProgress.total}
            </span>
          </>
        ) : (
          <>
            <IconPaperclip size={16} />
            Add documents
          </>
        )}
      </Button>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {value.map((document, idx) => {
            const fileType = getAttachmentType(
              document?.type as string,
              document.name,
            );
            const IconComponent = getAttachmentIcon(fileType);
            return (
              <div
                key={document.url}
                className="flex items-center justify-between p-2 border rounded text-sm group max-w-[20rem]"
              >
                <Dialog>
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 truncate pr-2 text-left"
                    >
                      <IconComponent
                        size={14}
                        className="text-muted-foreground shrink-0"
                      />
                      <span className="flex-1 flex flex-col truncate">
                        <span
                          className={cn({ 'opacity-50': disabled }, 'truncate')}
                          title={document.name || document.url}
                        >
                          {document.name || document.url}
                        </span>
                        <span className="text-xs text-accent-foreground">
                          {getFileInfo(document)}
                        </span>
                      </span>
                    </button>
                  </Dialog.Trigger>
                  <Dialog.ContentCombined
                    className="max-w-3xl"
                    title={document.name || 'Document'}
                    description="Uploaded document preview"
                  >
                    <DocumentPreview document={document} />
                  </Dialog.ContentCombined>
                </Dialog>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  dir="rtl"
                  className="opacity-0 group-hover:opacity-100 w-0 group-hover:w-6 translate-x-8 group-hover:translate-x-0 h-6 transition-all ease-linear duration-300 shrink-0 aria-disabled:pointer-events-none"
                  disabled={disabled}
                  onClick={() => {
                    onChange(value.filter((_, i) => i !== idx));
                  }}
                >
                  <IconTrash size={14} className="text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const DocumentPreview = ({
  document,
}: {
  document: AgencyAttachment;
}) => {
  const kind = getAttachmentType(document.type ?? undefined, document.name);
  // `inline` makes /read-file answer with `Content-Disposition: inline`.
  // Without it the browser downloads the file instead of rendering it.
  const inlineUrl = readImage(document.url, undefined, true);

  if (kind === 'image') {
    return (
      <img
        src={inlineUrl}
        alt={document.name}
        className="w-full max-h-[70vh] object-contain rounded"
      />
    );
  }

  if (kind === 'video') {
    return (
      <video src={inlineUrl} controls className="w-full max-h-[70vh] rounded">
        <track kind="captions" />
      </video>
    );
  }

  if (kind === 'audio') {
    return (
      <audio src={inlineUrl} controls className="w-full">
        <track kind="captions" />
      </audio>
    );
  }

  if (kind === 'pdf') {
    return (
      <iframe
        src={inlineUrl}
        title={document.name}
        className="w-full h-[70vh] rounded border"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <IconFile className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        This file type cannot be previewed in the browser.
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href={readImage(document.url)} target="_blank" rel="noreferrer">
          <IconDownload size={16} />
          Download
        </a>
      </Button>
    </div>
  );
};

export const getFileInfo = (file: AgencyAttachment): string =>
  `${getAttachmentType(file.type ?? undefined, file.name)} · ${formatFileSize(
    file.size || 0,
  )}`;

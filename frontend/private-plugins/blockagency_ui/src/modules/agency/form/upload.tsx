import {
  IconPhotoCirclePlus,
  IconStar,
  IconStarFilled,
  IconX,
} from '@tabler/icons-react';
import {
  buttonVariants,
  cn,
  readImage,
  Spinner,
  Tooltip,
  useUpload,
} from 'erxes-ui';
import { Slot } from 'radix-ui';
import { forwardRef, useMemo, useRef, useState } from 'react';
import { Button, FileTrigger, FileTriggerProps } from 'react-aria-components';
import { UploadContext, useUploadContext } from '../context/UploadContext';
import { AgencyAttachment } from '../types/form';
import { formatFileSize, getAttachmentType } from '../utils/attachment';
import { getAttachmentIcon } from './attachment-type';

export const UploadProvider = ({
  children,
  value,
  mode = 'single',
  onValueChange,
  onUploadsFinished,
  onFileUploaded,
  acceptedFileTypes = ['image/*'],
}: {
  children: React.ReactNode;
  value?: string | string[];
  mode?: 'single' | 'multiple';
  onValueChange: (value?: string | string[]) => void;
  onUploadsFinished?: (value?: string | string[]) => void;
  /** Fires per uploaded file with the file info needed by `Attachment` fields */
  onFileUploaded?: (attachment: AgencyAttachment) => void;
  acceptedFileTypes?: string[];
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[] | undefined>();
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [finishedFilesCount, setFinishedFilesCount] = useState(0);
  const { upload, remove, isLoading } = useUpload();
  const accumulatedUrlsRef = useRef<string[]>([]);

  const responses = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value)
      ? value.map((url) => ({ url }))
      : [{ url: value }];
  }, [value]);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPreviewUrls(Array.from(files).map((file) => URL.createObjectURL(file)));
    setTotalFilesCount(files.length);
    setFinishedFilesCount(0);
    accumulatedUrlsRef.current = responses.map((r) => r.url);

    upload({
      files,
      afterUpload: ({ response, fileInfo }) => {
        const checked = typeof response === 'string' ? response : response.url;

        onFileUploaded?.({
          url: checked,
          name: fileInfo.name,
          type: fileInfo.type,
          size: fileInfo.size,
          duration: fileInfo.duration,
        });

        if (mode === 'single') {
          onValueChange(checked);
          onUploadsFinished?.(checked);
        } else {
          accumulatedUrlsRef.current = [...accumulatedUrlsRef.current, checked];
          onValueChange(accumulatedUrlsRef.current);
          onUploadsFinished?.(accumulatedUrlsRef.current);
        }

        setFinishedFilesCount((c) => {
          const next = c + 1;
          if (next >= totalFilesCount) setPreviewUrls(undefined);
          return next;
        });
      },
      maxHeight: 10000,
      maxWidth: 10000,
    });
  };

  const handleRemove = (url?: string) => {
    const removeUrl = url ?? responses.at(-1)?.url;
    if (!removeUrl) return;

    remove({
      fileName: removeUrl,
      afterRemove: () => {
        if (mode === 'single') {
          onValueChange(undefined);
        } else {
          const next = responses
            .filter((r) => r.url !== removeUrl)
            .map((r) => r.url);
          onValueChange(next);
          onUploadsFinished?.(next);
        }
      },
    });
  };

  const existingUrls = typeof value === 'string' ? [value] : value ?? [];
  const displayUrls = isLoading
    ? [...existingUrls, ...(previewUrls ?? [])]
    : existingUrls;

  return (
    <UploadContext.Provider
      value={{
        urls: displayUrls,
        mode,
        onValueChange,
        setPreviewUrls,
        handleFileChange,
        remove: handleRemove,
        isLoading,
        loadingCount: totalFilesCount,
        finishedCount: finishedFilesCount,
        acceptedFileTypes,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const Upload = forwardRef<
  HTMLButtonElement,
  Omit<FileTriggerProps, 'acceptedFileTypes'> & {
    children: React.ReactNode;
    className?: string;
    showLoadingCount?: boolean;
    disabled?: boolean;
  }
>(
  (
    {
      children,
      className,
      showLoadingCount = true,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const {
      handleFileChange,
      mode,
      acceptedFileTypes,
      isLoading,
      loadingCount,
      finishedCount,
    } = useUploadContext();

    return (
      <FileTrigger
        onSelect={handleFileChange}
        {...props}
        allowsMultiple={mode === 'multiple'}
        acceptedFileTypes={acceptedFileTypes}
      >
        <Button
          ref={ref}
          isDisabled={isLoading || disabled}
          className={cn(
            buttonVariants({
              variant: 'ghost',
              className:
                'h-auto relative px-0 py-0 block aria-disabled:pointer-events-none',
            }),
            className,
          )}
        >
          {children}
          {isLoading && (
            <>
              <Spinner containerClassName="absolute inset-0" />
              {showLoadingCount && loadingCount > 1 && (
                <div className="absolute inset-0 flex items-center justify-center pt-6 text-sm text-muted-foreground">
                  {finishedCount}/{loadingCount}
                </div>
              )}
            </>
          )}
        </Button>
      </FileTrigger>
    );
  },
);

export const UploadImage = ({
  value,
  onValueChange,
  className,
  uploaderClassName,
  disabled = false,
}: {
  value?: AgencyAttachment | null;
  onValueChange: (value?: AgencyAttachment) => void;
  className?: string;
  uploaderClassName?: string;
  disabled?: boolean;
}) => {
  return (
    <UploadProvider
      value={value?.url}
      onValueChange={(nextValue) => {
        if (!nextValue) {
          onValueChange(undefined);
        }
      }}
      onFileUploaded={onValueChange}
    >
      <Upload className={cn('relative', uploaderClassName)} disabled={disabled}>
        <div
          className={cn(
            'aspect-square relative flex items-center justify-center',
            className,
          )}
        >
          {value ? (
            <img
              src={readImage(value.url)}
              className="w-full h-full object-cover rounded"
              alt="cover"
            />
          ) : (
            <IconPhotoCirclePlus className="size-6 text-scroll" />
          )}
          <div className="absolute inset-0 border border-foreground/10 rounded" />
        </div>
      </Upload>
    </UploadProvider>
  );
};

export const UploadRemoveButton = ({
  children,
  url,
}: {
  children: React.ReactNode;
  url?: string;
}) => {
  const { remove } = useUploadContext();

  return <Slot.Root onClick={() => remove(url)}>{children}</Slot.Root>;
};

const UploadAttachmentsContent = ({
  className,
  featured,
  setFeatured,
}: {
  className?: string;
  featured?: string;
  setFeatured?: (url: string) => void;
}) => {
  const { urls = [], remove, isLoading } = useUploadContext();

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {urls.map((url) => {
        const isFeatured = featured === url;
        return (
          <div
            key={url}
            className="relative group bg-muted rounded-sm space-y-1 max-w-40 h-40 p-2"
          >
            <img
              src={readImage(url)}
              className={cn(
                'w-full object-contain bg-background rounded aspect-square',
                isFeatured && 'ring-2 ring-primary',
              )}
              alt="attachment"
            />
            {!isLoading && (
              <>
                {setFeatured && (
                  <Tooltip>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        onClick={() => setFeatured(url)}
                        className={cn(
                          'absolute top-0.5 left-0.5 bg-foreground ring-1 ring-primary-foreground/60 rounded-full p-0.5 transition-opacity',
                          isFeatured
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100',
                        )}
                      >
                        {isFeatured ? (
                          <IconStarFilled className="size-3 text-warning" />
                        ) : (
                          <IconStar className="size-3 text-primary-foreground" />
                        )}
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      {isFeatured ? 'Featured image' : 'Set as featured'}
                    </Tooltip.Content>
                  </Tooltip>
                )}
                <Tooltip>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      onClick={() => remove(url)}
                      className="absolute top-0.5 right-0.5 bg-foreground ring-1 ring-primary-foreground/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconX className="size-3 text-primary-foreground" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Remove</Tooltip.Content>
                </Tooltip>
              </>
            )}
          </div>
        );
      })}
      <Upload className="w-40 h-40 flex items-center justify-center border border-dashed border-foreground/20 rounded">
        <div>
          <IconPhotoCirclePlus size={32} className="text-scroll" />
        </div>
      </Upload>
    </div>
  );
};

/** Photo grid for fields that still store plain url strings. */
export const UploadAttachments = ({
  values = [],
  className,
  onValueChange,
  featured,
  setFeatured,
}: {
  values?: string[];
  onValueChange: (values: string[]) => void;
  className?: string;
  featured?: string;
  setFeatured?: (url: string) => void;
}) => {
  return (
    <UploadProvider
      value={values}
      mode="multiple"
      onValueChange={(values) => onValueChange(values as string[])}
    >
      <UploadAttachmentsContent
        className={className}
        featured={featured}
        setFeatured={setFeatured}
      />
    </UploadProvider>
  );
};

/**
 * `UploadProvider` for `Attachment` fields: the file info collected while
 * uploading is kept instead of only the url. The provider underneath works on
 * urls, so removals are mirrored back onto the attachment list.
 */
export const AttachmentUploadProvider = ({
  values = [],
  onValueChange,
  acceptedFileTypes,
  children,
}: {
  values?: AgencyAttachment[];
  onValueChange: (values: AgencyAttachment[]) => void;
  acceptedFileTypes?: string[];
  children: React.ReactNode;
}) => {
  const latestValuesRef = useRef(values);
  latestValuesRef.current = values;

  const handleChange = (next: AgencyAttachment[]) => {
    latestValuesRef.current = next;
    onValueChange(next);
  };

  return (
    <UploadProvider
      value={values.map((attachment) => attachment.url)}
      mode="multiple"
      acceptedFileTypes={acceptedFileTypes}
      onValueChange={(urls) => {
        const keptUrls = (urls as string[] | undefined) ?? [];
        const kept = latestValuesRef.current.filter((attachment) =>
          keptUrls.includes(attachment.url),
        );

        // Uploads arrive through `onFileUploaded`; only removals shorten the
        // list and need to be applied here.
        if (kept.length !== latestValuesRef.current.length) {
          handleChange(kept);
        }
      }}
      onFileUploaded={(attachment) =>
        handleChange([...latestValuesRef.current, attachment])
      }
    >
      {children}
    </UploadProvider>
  );
};

/** Same photo grid as `UploadAttachments`, for `Attachment` fields. */
export const MultipleImageUpload = ({
  values = [],
  className,
  onValueChange,
}: {
  values?: AgencyAttachment[];
  onValueChange: (values: AgencyAttachment[]) => void;
  className?: string;
}) => (
  <AttachmentUploadProvider values={values} onValueChange={onValueChange}>
    <UploadAttachmentsContent className={className} />
  </AttachmentUploadProvider>
);

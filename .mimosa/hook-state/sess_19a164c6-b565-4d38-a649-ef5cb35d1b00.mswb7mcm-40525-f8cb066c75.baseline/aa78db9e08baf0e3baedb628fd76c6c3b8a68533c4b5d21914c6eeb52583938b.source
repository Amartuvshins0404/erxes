import { IconPhotoCirclePlus } from '@tabler/icons-react';
import { buttonVariants, cn, readImage, Spinner, useUpload } from 'erxes-ui';
import { Slot } from 'radix-ui';
import { forwardRef, useMemo, useState } from 'react';
import { Button, FileTrigger, FileTriggerProps } from 'react-aria-components';
import { UploadContext, useUploadContext } from '../context/UploadContext';

export const UploadProvider = ({
  children,
  value,
  mode = 'single',
  onValueChange,
  onUploadsFinished,
  acceptedFileTypes = ['image/*'],
}: {
  children: React.ReactNode;
  value?: string | string[];
  mode?: 'single' | 'multiple';
  onValueChange: (value?: string | string[]) => void;
  onUploadsFinished?: (value?: string | string[]) => void;
  acceptedFileTypes?: string[];
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[] | undefined>();
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [finishedFilesCount, setFinishedFilesCount] = useState(0);
  const { upload, remove, isLoading } = useUpload();

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

    upload({
      files,
      afterUpload: ({ response }) => {
        const checked = typeof response === 'string' ? response : response.url;

        if (mode === 'single') {
          onValueChange(checked);
          onUploadsFinished?.(checked);
        } else {
          const next = [...responses.map((r) => r.url), checked];
          onValueChange(next);
          onUploadsFinished?.(next);
        }

        setFinishedFilesCount((c) => c + 1);
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

  return (
    <UploadContext.Provider
      value={{
        urls: typeof value === 'string' ? [value] : value || previewUrls || [],
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
  }
>(({ children, className, showLoadingCount = true, ...props }, ref) => {
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
        isDisabled={isLoading}
        className={cn(
          buttonVariants({
            variant: 'ghost',
            className: 'h-auto relative px-0 py-0 block',
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
                loading {finishedCount}/{loadingCount}
              </div>
            )}
          </>
        )}
      </Button>
    </FileTrigger>
  );
});

export const UploadImage = ({
  value,
  onValueChange,
  className,
  uploaderClassName,
}: {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  uploaderClassName?: string;
}) => {
  return (
    <UploadProvider
      value={value}
      onValueChange={(value) => onValueChange(value as string)}
    >
      <Upload className={uploaderClassName}>
        <div
          className={cn(
            'aspect-square relative flex items-center justify-center',
            className,
          )}
        >
          {value ? (
            <img
              src={readImage(value)}
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

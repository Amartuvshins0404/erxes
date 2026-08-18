import { forwardRef, useState } from 'react';
import { UploadContext, useUploadContext } from '../context/UploadContext';
import { FileTrigger, Button, FileTriggerProps } from 'react-aria-components';
import { buttonVariants, cn, Spinner, useUpload } from 'erxes-ui';
import { Slot } from 'radix-ui';
import { IconPhotoCirclePlus } from '@tabler/icons-react';

export const UploadProvider = ({
  children,
  value,
  mode = 'single',
  onValueChange,
  acceptedFileTypes = ['image/*'],
}: {
  children: React.ReactNode;
  value?: string | string[];
  mode?: 'single' | 'multiple';
  onValueChange: (value?: string | string[]) => void;
  acceptedFileTypes?: string[];
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[] | undefined>();
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [finishedFilesCount, setFinishedFilesCount] = useState(0);
  const { upload, remove, isLoading } = useUpload();
  const [responses, setResponses] = useState<{ url: string }[]>([]);

  const handleValueChange = (_responses: { url: string }[]) => {
    if (mode === 'single') {
      onValueChange(_responses[0]?.url);
      return;
    }
    onValueChange(_responses.map((r) => r?.url));
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPreviewUrls(Array.from(files).map((file) => URL.createObjectURL(file)));
    setTotalFilesCount(files.length);
    setFinishedFilesCount(0);

    await upload({
      files,
      afterUpload: ({ response }: { response: { url: string } }) => {
        const checkedResponse =
          typeof response === 'string' ? { url: response } : response;
        setResponses((prevResponses) => {
          const newResponses = [...prevResponses, checkedResponse];
          handleValueChange(newResponses);
          return newResponses;
        });

        setFinishedFilesCount((prev) => prev + 1);
      },
      maxHeight: 10000,
      maxWidth: 10000,
    });
  };

  const handleRemove = (url?: string) => {
    const removeUrl = url || (responses[responses.length - 1]?.url as string);
    remove({
      fileName: removeUrl,
      afterRemove: () => {
        handleValueChange(responses.filter((r) => r.url !== removeUrl));
        setResponses(responses.filter((r) => r.url !== removeUrl));
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
            className: 'h-auto relative px-0 py-0 btk',
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
              src={value}
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

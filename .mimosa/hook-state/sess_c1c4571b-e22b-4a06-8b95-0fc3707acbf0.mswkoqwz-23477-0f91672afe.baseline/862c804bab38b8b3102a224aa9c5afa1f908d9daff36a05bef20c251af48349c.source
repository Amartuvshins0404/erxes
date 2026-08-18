import { IconPhotoCirclePlus } from '@tabler/icons-react';
import { buttonVariants, cn } from 'erxes-ui';
import { forwardRef, useState } from 'react';
import { Button, FileTrigger, FileTriggerProps } from 'react-aria-components';
import { UploadContext, useUploadContext } from '../context/UploadContext';

export const UploadProvider = ({
  children,
  value,
  mode = 'single',
  acceptedFileTypes = ['image/*'],
}: {
  children: React.ReactNode;
  value?: string | string[];
  mode?: 'single' | 'multiple';
  acceptedFileTypes?: string[];
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[] | undefined>();

  return (
    <UploadContext.Provider
      value={{
        urls: typeof value === 'string' ? [value] : value || previewUrls || [],
        mode,
        setPreviewUrls,
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
  }
>(({ children, className, ...props }, ref) => {
  const { mode, acceptedFileTypes } = useUploadContext();

  return (
    <FileTrigger
      {...props}
      allowsMultiple={mode === 'multiple'}
      acceptedFileTypes={acceptedFileTypes}
    >
      <Button
        ref={ref}
        className={cn(
          buttonVariants({
            variant: 'ghost',
            className: 'h-auto relative px-0 py-0 block',
          }),
          className,
        )}
      >
        {children}
      </Button>
    </FileTrigger>
  );
});

export const UploadImage = ({
  value,
  className,
  uploaderClassName,
}: {
  value?: string;
  className?: string;
  uploaderClassName?: string;
}) => {
  return (
    <UploadProvider value={value}>
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

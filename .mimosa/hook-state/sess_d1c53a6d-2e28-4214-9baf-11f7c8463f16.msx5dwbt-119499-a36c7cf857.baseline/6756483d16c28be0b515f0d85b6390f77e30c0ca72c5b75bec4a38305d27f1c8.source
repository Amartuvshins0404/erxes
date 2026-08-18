import { Button, cn } from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';
import { useUpload } from 'erxes-ui/hooks/use-upload';

interface FileUploadCallbacks {
  onUploadStart?: (fileCount?: number) => void;
  onUploadProgress?: () => void;
  onAllUploadsComplete?: () => void;
}

interface MtoUploadChangeValue extends Record<string, unknown> {
  url?: string;
}

interface MtoUploadContextValue {
  url: string | undefined;
  multiple?: boolean;
  uploadUrl?: string;
  onChange: (value: MtoUploadChangeValue) => void;
  setPreviewUrl: (previewUrl: string | undefined) => void;
  previewRef: MutableRefObject<string | null>;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  handleTriggerClick: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  setCallbacks: (callbacks: FileUploadCallbacks) => void;
}

const MtoUploadContext = createContext<MtoUploadContextValue | null>(null);

interface MtoUploadRootProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'onChange'
> {
  value: string;
  onChange: (value: MtoUploadChangeValue) => void;
  uploadUrl?: string;
  multiple?: boolean;
}

const MtoUploadRoot = ({
  value,
  onChange,
  uploadUrl,
  multiple,
  className,
  children,
  ...props
}: MtoUploadRootProps) => {
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const { isLoading, upload } = useUpload();

  const totalFilesCountRef = useRef(0);
  const finishedFilesCountRef = useRef(0);
  const callbacksRef = useRef<FileUploadCallbacks>({});

  const setCallbacks = useCallback((callbacks: FileUploadCallbacks) => {
    callbacksRef.current = callbacks;
  }, []);

  const handleTriggerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;

      if (!files || files.length === 0) return;

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }

      totalFilesCountRef.current = files.length;
      finishedFilesCountRef.current = 0;

      callbacksRef.current.onUploadStart?.(files.length || 0);

      upload({
        files,
        url: uploadUrl,
        afterUpload: ({ response, fileInfo }) => {
          onChange({ url: response, ...fileInfo });

          finishedFilesCountRef.current += 1;
          callbacksRef.current.onUploadProgress?.();

          if (finishedFilesCountRef.current === totalFilesCountRef.current) {
            callbacksRef.current.onAllUploadsComplete?.();
          }
        },
        afterRead: ({ result }) => {
          setPreviewUrl(result);
        },
      });
    },
    [onChange, upload, uploadUrl],
  );

  const url = previewUrl || value;

  return (
    <MtoUploadContext.Provider
      value={{
        url,
        multiple,
        onChange,
        uploadUrl,
        previewRef,
        fileInputRef,
        setPreviewUrl,
        handleTriggerClick,
        handleFileChange,
        isLoading,
        setCallbacks,
      }}
    >
      <div className={cn('flex gap-4', className)} {...props}>
        {children}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple={multiple}
          disabled={isLoading}
        />
      </div>
    </MtoUploadContext.Provider>
  );
};

interface MtoUploadPreviewProps extends React.ComponentPropsWithoutRef<'img'> {
  onUploadStart?: (fileCount?: number) => void;
  onUploadProgress?: () => void;
  onAllUploadsComplete?: () => void;
}

const MtoUploadPreview = ({
  className,
  onUploadStart,
  onUploadProgress,
  onAllUploadsComplete,
  ...props
}: MtoUploadPreviewProps) => {
  const uploadContext = useContext(MtoUploadContext);

  if (!uploadContext) {
    throw new Error('MtoUpload must be used within MtoUpload.Root');
  }

  const { url, handleTriggerClick, setCallbacks } = uploadContext;

  // Register callbacks with Root so they can be called during upload
  useEffect(() => {
    setCallbacks({
      onUploadStart,
      onUploadProgress,
      onAllUploadsComplete,
    });
  }, [onUploadStart, onUploadProgress, onAllUploadsComplete, setCallbacks]);

  return (
    <>
      {url ? (
        <img
          src={readImage(url)}
          alt="Uploaded preview"
          className={cn('h-full w-full object-cover cursor-pointer', className)}
          onClick={handleTriggerClick}
          {...props}
        />
      ) : null}
    </>
  );
};

const MtoUploadButton = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>) => {
  const uploadContext = useContext(MtoUploadContext);

  if (!uploadContext) {
    throw new Error('MtoUpload must be used within MtoUpload.Root');
  }

  const { handleTriggerClick } = uploadContext;

  return (
    <Button
      className={cn('flex', className)}
      {...props}
      onClick={handleTriggerClick}
    />
  );
};

export const MtoUpload = {
  Root: MtoUploadRoot,
  Preview: MtoUploadPreview,
  Button: MtoUploadButton,
};

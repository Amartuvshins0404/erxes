import { Button, Spinner, cn, useUpload } from 'erxes-ui';
import { useRef, useState } from 'react';
import { IconPaperclip, IconTrash } from '@tabler/icons-react';

export const MultipleDocumentUpload = ({
  value = [],
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (values: string[]) => void;
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
      afterUpload: ({ status, response }) => {
        if (status === 'ok' && response) {
          const nextValue = [...latestValueRef.current, response as string];
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
          {value.map((url, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 border rounded text-sm group max-w-[20rem]"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <IconPaperclip
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span
                  className={cn({ 'opacity-50': disabled }, 'truncate')}
                  title={url}
                >
                  {url}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0 aria-disabled:pointer-events-none"
                disabled={disabled}
                onClick={() => {
                  onChange(value.filter((_, i) => i !== idx));
                }}
              >
                <IconTrash size={14} className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

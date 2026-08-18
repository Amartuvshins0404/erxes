import { IconPhotoCirclePlus, IconX } from '@tabler/icons-react';
import { Button, cn, readImage } from 'erxes-ui';
import { Upload, UploadProvider } from './upload';

export const MultiUploadImage = ({
  value,
  onValueChange,
  itemClassName,
  disabled,
}: {
  value?: string[];
  onValueChange: (next: string[]) => void;
  itemClassName?: string;
  disabled?: boolean;
}) => {
  const items = value || [];

  const handleRemove = (url: string) => {
    onValueChange(items.filter((u) => u !== url));
  };

  return (
    <UploadProvider
      mode="multiple"
      value={items}
      onValueChange={(v) => onValueChange((v as string[]) || [])}
    >
      <div className="flex flex-wrap gap-2">
        {items.map((url) => (
          <div
            key={url}
            className={cn(
              'relative size-16 rounded border border-foreground/10 overflow-hidden group',
              itemClassName,
            )}
          >
            <img
              src={readImage(url)}
              alt="attachment"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="opacity-0 group-hover:opacity-100 top-0.5 right-0.5 absolute size-5 transition-opacity"
              onClick={() => handleRemove(url)}
              disabled={disabled}
            >
              <IconX className="size-3" />
            </Button>
          </div>
        ))}
        <Upload
          className={cn('size-16', itemClassName)}
          showLoadingCount={false}
        >
          <div
            className={cn(
              'relative flex justify-center items-center size-16 rounded border border-foreground/10',
              itemClassName,
            )}
          >
            <IconPhotoCirclePlus className="size-6 text-scroll" />
          </div>
        </Upload>
      </div>
    </UploadProvider>
  );
};

export { IconPhotoCirclePlus };

import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  Upload,
  UploadProvider,
  UploadRemoveButton,
} from '@/block/components/upload';

import { Badge, Button, cn, Dialog, readImage } from 'erxes-ui';
import {
  IconFile,
  IconFilePlus,
  IconPhotoCirclePlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';

export const UploadCard = ({
  title,
  value,
  onValueChange,
  fit = 'contain',
  children,
  acceptedFileTypes = ['image/*'],
}: {
  title: string;
  value?: string;
  onValueChange: (value: string) => void;
  fit?: 'cover' | 'contain';
  children: React.ReactNode;
  acceptedFileTypes?: string[];
}) => {
  return (
    <InfoCard title={title}>
      <InfoCardContent className='space-y-3'>
        <UploadProvider
          value={value}
          onValueChange={(value) => onValueChange(value as string)}
          acceptedFileTypes={acceptedFileTypes}
        >
          {acceptedFileTypes.includes('image/*') ? (
            <ImageDisplay value={value} title={title} fit={fit} />
          ) : (
            <DocumentDisplay value={value} />
          )}
          {children}
        </UploadProvider>
      </InfoCardContent>
    </InfoCard>
  );
};

export const UploadButton = ({ value }: { value?: string }) => {
  return (
    <Upload>
      <Button asChild className="w-full" variant="secondary">
        <div>
          <IconUpload />
          {value ? 'Replace' : 'Upload'}
        </div>
      </Button>
    </Upload>
  );
};

export const RemoveButton = ({ value }: { value?: string }) => {
  return (
    <UploadRemoveButton>
      <Button variant="secondary" disabled={!value}>
        <IconTrash />
        Remove
      </Button>
    </UploadRemoveButton>
  );
};

interface DocumentDisplayProps {
  value?: string;
  title?: string;
}

export const ImageDisplay = ({
  value,
  title,
  fit = 'contain',
}: {
  value?: string;
  title?: string;
  fit?: 'cover' | 'contain';
}) => {
  return (
    <Upload>
      <div className="relative blk:aspect-2/1 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        {value ? (
          <>
            <img
              src={readImage(value)}
              className={cn(
                'size-full absolute inset-0',
                fit === 'cover' ? 'object-cover' : 'object-contain',
              )}
              alt={title}
            />
            <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
          </>
        ) : (
          <IconPhotoCirclePlus className="size-8 text-scroll" />
        )}
      </div>
    </Upload>
  );
};

export const DocumentDisplay = ({ value }: DocumentDisplayProps) => {
  const fileType = value?.split('.').pop();
  if (value) {
    return (
      <Dialog>
        <Dialog.Trigger>
          <div className="relative aspect-[2/1] bg-muted rounded-lg flex flex-col gap-2  items-center justify-center overflow-hidden p-4">
            <IconFile className="size-8 text-scroll" />
            <Badge className="absolute top-2 right-2">{fileType}</Badge>
            <div className="text-xs text-muted-foreground truncate max-w-full">
              {value?.split('/').pop()}
            </div>
          </div>
        </Dialog.Trigger>
        <Dialog.Content className="p-0">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              readImage(value),
            )}&embedded=true`}
            className="w-full aspect-[1/2] max-h-[80vh] rounded-lg"
            title="PDF Viewer"
          />
        </Dialog.Content>
      </Dialog>
    );
  }
  return (
    <Upload>
      <div className="relative aspect-[2/1] bg-muted rounded-lg flex flex-col gap-2  items-center justify-center overflow-hidden p-4">
        <IconFilePlus className="size-8 text-scroll" />
      </div>
    </Upload>
  );
};

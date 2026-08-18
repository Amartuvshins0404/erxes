import {
  IconFile,
  IconFilePlus,
  IconPhotoCirclePlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { Badge, Button, cn, Dialog, InfoCard, readImage } from 'erxes-ui';
import {
  Upload,
  UploadProvider,
  UploadRemoveButton,
} from '@/events/components/upload';

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
      <InfoCard.Content>
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
      </InfoCard.Content>
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
      <div
        style={{ aspectRatio: '2 / 1' }}
        className="min-h-10 relative flex justify-center items-center bg-muted rounded-lg overflow-hidden"
      >
        {value ? (
          <>
            <img
              src={readImage(value)}
              className={cn(
                'absolute inset-0 size-full',
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
          <div
            style={{ aspectRatio: '2 / 1' }}
            className="relative flex flex-col justify-center items-center gap-2 bg-muted p-4 rounded-lg overflow-hidden"
          >
            <IconFile className="size-8 text-scroll" />
            <Badge className="top-2 right-2 absolute">{fileType}</Badge>
            <div className="max-w-full text-muted-foreground text-xs truncate">
              {value?.split('/').pop()}
            </div>
          </div>
        </Dialog.Trigger>
        <Dialog.Content className="p-0">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              readImage(value),
            )}&embedded=true`}
            style={{ aspectRatio: '1 / 2' }}
            className="rounded-lg w-full max-h-[80vh]"
            title="PDF Viewer"
          />
        </Dialog.Content>
      </Dialog>
    );
  }
  return (
    <Upload>
      <div
        style={{ aspectRatio: '2 / 1' }}
        className="relative flex flex-col justify-center items-center gap-2 bg-muted p-4 rounded-lg overflow-hidden"
      >
        <IconFilePlus className="size-8 text-scroll" />
      </div>
    </Upload>
  );
};

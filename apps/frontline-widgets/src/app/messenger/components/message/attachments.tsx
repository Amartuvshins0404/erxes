import * as React from 'react';
import { IconX, IconZoomIn, type IconProps } from '@tabler/icons-react';
import { Button, cn, Dialog, readImage } from 'erxes-ui';
import type { IAttachment } from '../../types';
import { formatFileSize, getAttachmentType } from '@libs/format-file';
import { PreviewImage } from '../attachments/preview-image';
import { getAttachmentIcon } from '../attachments/attachment-type';
import { downloadAttachmentFile } from '../../utils/fileUpload';

type MessageAttachmentsProps = {
  attachments?: IAttachment[];
  align?: 'start' | 'end';
};

function PreviewDialogClose() {
  return (
    <Dialog.Close asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 z-10 rounded-full bg-popover/90 shadow-sm"
        aria-label="Close attachment preview"
      >
        <IconX />
      </Button>
    </Dialog.Close>
  );
}

type PreviewTriggerProps = {
  attachment: IAttachment;
  name: string;
} & React.ComponentProps<'button'>;

const ImagePreviewTrigger = React.forwardRef<
  HTMLButtonElement,
  PreviewTriggerProps
>(({ attachment, name, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    {...props}
    className="group relative block max-w-72 overflow-hidden rounded-2xl bg-muted shadow-card outline-none focus-visible:shadow-focus"
    aria-label={`Preview ${name}`}
  >
    <PreviewImage
      src={readImage(attachment.url)}
      alt={name}
      className="max-h-64 w-full rounded-2xl object-cover"
    />
    <span className="absolute inset-0 hidden items-center justify-center bg-overlay transition-opacity group-hover:flex group-focus-visible:flex [@media(hover:hover)]:flex [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
      <span className="flex items-center gap-1.5 rounded-full bg-popover/90 px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-sm">
        <IconZoomIn className="size-3.5" />
        Preview
      </span>
    </span>
  </button>
));
ImagePreviewTrigger.displayName = 'ImagePreviewTrigger';

function ImageAttachmentTrigger({
  attachment,
  name,
}: {
  attachment: IAttachment;
  name: string;
}) {
  return (
    <Dialog.Trigger asChild>
      <ImagePreviewTrigger attachment={attachment} name={name} />
    </Dialog.Trigger>
  );
}

function ImagePreviewContent({
  attachment,
  name,
}: {
  attachment: IAttachment;
  name: string;
}) {
  return (
    <Dialog.Content className="flex! h-auto! max-h-[90vh]! w-auto! max-w-[90vw]! items-center justify-center overflow-hidden! rounded-3xl! border-0! bg-popover! p-2!">
      <Dialog.Title className="sr-only">{name}</Dialog.Title>
      <Dialog.Description className="sr-only">
        Full-size image preview
      </Dialog.Description>
      <PreviewImage
        src={readImage(attachment.url)}
        alt={name}
        fit="contain"
        className="block max-h-[85vh] max-w-[88vw] rounded-2xl object-contain"
      />
      <PreviewDialogClose />
    </Dialog.Content>
  );
}

function AttachmentImage({ attachment }: { attachment: IAttachment }) {
  const name = attachment.name || 'Image';

  return (
    <Dialog>
      <ImageAttachmentTrigger attachment={attachment} name={name} />
      <ImagePreviewContent attachment={attachment} name={name} />
    </Dialog>
  );
}

const VideoPreviewTrigger = React.forwardRef<
  HTMLButtonElement,
  PreviewTriggerProps
>(({ attachment, name, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    {...props}
    className="group relative flex max-w-72 items-center overflow-hidden rounded-2xl bg-muted p-2 text-foreground shadow-card outline-none focus-visible:shadow-focus"
    aria-label={`Play ${name}`}
  >
    <video
      src={readImage(attachment.url)}
      muted
      playsInline
      preload="metadata"
      className="max-h-40 w-full rounded-xl object-contain"
    />
    <span className="absolute inset-0 flex items-center justify-center bg-overlay">
      <span className="flex items-center gap-1.5 rounded-full bg-popover/90 px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-sm">
        <IconZoomIn className="size-3.5" />
        Play video
      </span>
    </span>
  </button>
));
VideoPreviewTrigger.displayName = 'VideoPreviewTrigger';

function VideoAttachmentTrigger({
  attachment,
  name,
}: {
  attachment: IAttachment;
  name: string;
}) {
  return (
    <Dialog.Trigger asChild>
      <VideoPreviewTrigger attachment={attachment} name={name} />
    </Dialog.Trigger>
  );
}

function VideoPreviewContent({
  attachment,
  name,
}: {
  attachment: IAttachment;
  name: string;
}) {
  return (
    <Dialog.Content className="flex! h-auto! max-h-[90vh]! w-auto! max-w-[90vw]! items-center justify-center overflow-hidden! rounded-3xl! border-0! bg-popover! p-2!">
      <Dialog.Title className="sr-only">{name}</Dialog.Title>
      <Dialog.Description className="sr-only">
        Video attachment preview
      </Dialog.Description>
      <video
        src={readImage(attachment.url)}
        controls
        autoPlay
        playsInline
        className="block max-h-[85vh] max-w-[88vw] rounded-2xl object-contain"
      />
      <PreviewDialogClose />
    </Dialog.Content>
  );
}

function AttachmentVideo({ attachment }: { attachment: IAttachment }) {
  const name = attachment.name || 'Video';

  return (
    <Dialog>
      <VideoAttachmentTrigger attachment={attachment} name={name} />
      <VideoPreviewContent attachment={attachment} name={name} />
    </Dialog>
  );
}

function AttachmentFile({ attachment }: { attachment: IAttachment }) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const name = attachment.name || 'File';
  const IconComponent: React.FC<IconProps> = getAttachmentIcon(
    getAttachmentType(attachment.type, attachment.name),
  );

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadAttachmentFile(readImage(attachment.url), name);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex w-fit max-w-full min-w-44 items-center gap-2.5 rounded-2xl bg-card p-2 pr-3 text-left text-card-foreground shadow-card outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus disabled:cursor-wait disabled:opacity-70"
      aria-label={`Download ${name}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <IconComponent className="size-5" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-xs font-medium">{name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {formatFileSize(attachment.size || 0)} ·{' '}
          {isDownloading ? 'Downloading…' : 'Download'}
        </span>
      </span>
    </button>
  );
}

export function MessageAttachments({
  attachments,
  align = 'start',
}: MessageAttachmentsProps) {
  if (!attachments?.length) return null;

  return (
    <div
      data-slot="message-attachments"
      className={cn(
        'mt-1 flex w-full flex-col gap-1.5',
        align === 'end' ? 'items-end' : 'items-start',
      )}
    >
      {attachments.map((attachment, index) => {
        const key = `${attachment.url}-${index}`;
        const fileType = getAttachmentType(attachment.type, attachment.name);

        if (fileType === 'image') {
          return <AttachmentImage key={key} attachment={attachment} />;
        }
        if (fileType === 'video') {
          return <AttachmentVideo key={key} attachment={attachment} />;
        }
        if (fileType === 'audio') {
          return (
            <audio
              key={key}
              src={readImage(attachment.url)}
              controls
              preload="metadata"
              className="w-full min-w-56 max-w-72"
              aria-label={attachment.name || 'Audio attachment'}
            />
          );
        }
        return <AttachmentFile key={key} attachment={attachment} />;
      })}
    </div>
  );
}

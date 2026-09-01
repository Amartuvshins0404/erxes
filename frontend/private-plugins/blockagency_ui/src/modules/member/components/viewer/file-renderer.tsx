import { IconFileUnknown } from '@tabler/icons-react';
import { Button, readImage } from 'erxes-ui';
import { AgencyAttachment } from '~/modules/agency/types/form';
import { getAttachmentType } from '~/modules/agency/utils/attachment';

export const FileRenderer = ({
  attachment,
}: {
  attachment: AgencyAttachment;
}) => {
  const kind = getAttachmentType(attachment.type ?? undefined, attachment.name);
  const url = readImage(attachment.url, undefined, true);
  const name = attachment.name || 'File Preview';

  switch (kind) {
    case 'image':
      return (
        <img
          src={url}
          alt={name}
          className="max-h-[80vh] w-auto object-contain bg-accent"
        />
      );
    case 'pdf':
      return (
        <iframe
          src={`${url}#toolbar=1&navpanes=1&view=FitH`}
          title={name}
          className="w-full h-[80vh] rounded-md border-0 bg-background"
        />
      );
    case 'video':
      return (
        <video controls className="max-h-[80vh] w-auto">
          <source src={url} type={attachment.type || 'video/mp4'} />
        </video>
      );
    default:
      // Fallback
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <IconFileUnknown className="size-16 text-muted-foreground mb-4" />
          <p className="mb-4">No preview available for this file type.</p>
          <Button asChild>
            <a href={url} download target="_blank" rel="noreferrer">
              Download File
            </a>
          </Button>
        </div>
      );
  }
};

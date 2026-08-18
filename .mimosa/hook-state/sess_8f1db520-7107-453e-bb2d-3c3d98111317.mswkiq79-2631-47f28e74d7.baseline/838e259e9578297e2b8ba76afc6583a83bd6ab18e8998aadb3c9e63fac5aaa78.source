import { IconX } from '@tabler/icons-react';
import {
  Button,
  IAttachment,
  readImage,
  InfoCard,
  useErxesUpload,
  useRemoveFile,
  Dropzone,
  DropzoneEmptyState,
  DropzoneContent,
} from 'erxes-ui';
import { useState } from 'react';

export const ClientAttachment = ({
  attachment,
  label,
}: {
  attachment: string;
  label: string;
}) => {
  const [files, setFiles] = useState<any[]>([attachment].filter(Boolean));
  const { removeFile, isLoading } = useRemoveFile();

  const props = useErxesUpload({
    allowedMimeTypes: ['image/*'],
    maxFiles: 10,
    maxFileSize: 20 * 1024 * 1024,
    onFilesAdded: (addedFiles) => {
      setFiles([
        ...files.filter(
          (file) => !addedFiles.some((f) => f.name === file.name),
        ),
        ...addedFiles.map((file) => ({
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
        })),
      ]);
    },
  });
  return (
    <InfoCard title={label}>
      <InfoCard.Content>
        <div className="flex flex-wrap gap-4">
          {files.map((attachment) => (
            <div
              key={attachment.url}
              className="aspect-square w-32 rounded-md overflow-hidden shadow-xs relative"
            >
              <img
                src={readImage(attachment.url)}
                alt={attachment.name}
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
                disabled={isLoading}
                onClick={() =>
                  removeFile(attachment.name, (status) => {
                    if (status === 'ok') {
                      setFiles(
                        files.filter((file) => file.name !== attachment.name),
                      );
                    }
                  })
                }
              >
                <IconX size={12} />
              </Button>
            </div>
          ))}
          <Dropzone {...props} className="w-full">
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};

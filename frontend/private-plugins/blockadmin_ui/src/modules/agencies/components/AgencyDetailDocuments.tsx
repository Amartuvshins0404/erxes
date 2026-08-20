import { IconExternalLink, IconFileOff } from '@tabler/icons-react';
import { Button, Empty, InfoCard, readImage } from 'erxes-ui';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { formatFileSize, getAttachmentType } from '../utils/attachment';
import { getAttachmentIcon } from './attachment-type';
import { AgencyAttachment } from '../types/agencyTypes';

export const AgencyDetailDocuments = () => {
  const { agency } = useAgencyDetail();
  const documents = agency?.documents ?? [];

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Documents"
        description="Registration and license documents submitted for review"
      >
        <InfoCard.Content>
          {documents.length ? (
            <div className="grid grid-cols-2 gap-2">
              {documents.map((document) => {
                const DocumentIcon = getAttachmentIcon(
                  getAttachmentType(document.type ?? undefined, document.name),
                );

                return (
                  <div
                    key={document.url}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    <DocumentIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        title={document.name || document.url}
                      >
                        {document.name || document.url}
                      </p>

                      <span className="text-xs text-accent-foreground">
                        {getFileInfo(document)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      {/* `inline` makes /read-file answer with `Content-Disposition: inline`. */}
                      <a
                        href={readImage(document.url, undefined, true)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${document.name || 'document'}`}
                      >
                        <IconExternalLink className="size-4" />
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>
              <Empty.Content>
                <Empty.Header>
                  <Empty.Media>
                    <IconFileOff />
                  </Empty.Media>
                  <Empty.Title>No documents</Empty.Title>
                  <Empty.Description>
                    This agency has not uploaded any documents yet.
                  </Empty.Description>
                </Empty.Header>
              </Empty.Content>
            </Empty>
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const getFileInfo = (file: AgencyAttachment): string =>
  `${getAttachmentType(file.type ?? undefined, file.name)} · ${formatFileSize(
    file.size || 0,
  )}`;

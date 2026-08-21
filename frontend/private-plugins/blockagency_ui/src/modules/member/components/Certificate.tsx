import {
  IconClock,
  IconFilePlus,
  IconRosetteDiscountCheckFilled,
  IconX,
} from '@tabler/icons-react';
import { Badge, Button, Tooltip, cn, readImage } from 'erxes-ui';
import { Slot } from 'radix-ui';
import React, { createContext, useContext } from 'react';
import { getAttachmentIcon } from '~/modules/agency/form/attachment-type';
import { getFileInfo } from '~/modules/agency/form/MultipleDocumentUpload';
import { AttachmentUploadProvider, Upload } from '~/modules/agency/form/upload';
import { AgencyAttachment } from '~/modules/agency/types/form';
import { getAttachmentType } from '~/modules/agency/utils/attachment';
import { useUploadContext } from '~/modules/agency/context/UploadContext';
import {
  FileViewerProvider,
  useFileViewer,
} from './viewer/file-viewer-context';

const CERTIFICATE_FILE_TYPES = ['image/*', 'application/*', 'text/*'];

type ICertificateContext = {
  /** Rendered as a remove control on every item when provided. */
  onRemove?: (attachment: AgencyAttachment) => void;
  disabled: boolean;
};

const CertificateContext = createContext<ICertificateContext | null>(null);

const useCertificateContext = () => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('Certificate parts must be used within a Certificate');
  }
  return context;
};

const CertificateRoot = ({
  children,
  className,
  onRemove,
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  onRemove?: (attachment: AgencyAttachment) => void;
  disabled?: boolean;
}) => (
  <CertificateContext.Provider value={{ onRemove, disabled }}>
    <div className={cn('flex flex-col gap-3', className)}>{children}</div>
  </CertificateContext.Provider>
);

/**
 * Three column grid of certificates. `uploader` is rendered through a `Slot`
 * inside the last cell, so the caller keeps ownership of the trigger while the
 * grid owns the cell size and styling.
 *
 * `auto-rows-fr` keeps every row as tall as the tallest one, so the uploader
 * matches the cards instead of collapsing to its own content when it wraps
 * onto a row of its own. `aspect-square` is only the floor for the empty
 * state, where no card sets the row height.
 */
const CertificateGroup = ({
  children,
  className,
  uploader,
  uploaderClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  uploader?: React.ReactNode;
  uploaderClassName?: string;
}) => (
  <div className={cn('grid auto-rows-fr grid-cols-3 gap-3', className)}>
    {children}
    {uploader && (
      <div
        className={cn(
          'flex aspect-square h-full min-h-44 w-full flex-col rounded-lg border border-dashed border-foreground/20 bg-background shadow-2xs transition-colors hover:bg-accent',
          uploaderClassName,
        )}
      >
        <Slot.Root className="flex w-full flex-1 flex-col items-center justify-center gap-1 text-muted-foreground">
          {uploader}
        </Slot.Root>
      </div>
    )}
  </div>
);

const CertificatePreview = ({
  attachment,
}: {
  attachment: AgencyAttachment;
}) => {
  const kind = getAttachmentType(attachment.type ?? undefined, attachment.name);

  if (kind === 'image') {
    return (
      <img
        src={readImage(attachment.url, undefined, true)}
        alt={attachment.name}
        className="w-full aspect-square rounded object-contain"
        loading="lazy"
      />
    );
  }

  const IconComponent = getAttachmentIcon(kind);
  return (
    <div className="flex w-full aspect-square items-center justify-center bg-muted rounded">
      <IconComponent className="size-10 text-muted-foreground" />
      {/* Optional: Add a small badge indicating the file type */}
      <span className="absolute bottom-2 right-2 text-[10px] uppercase font-bold text-muted-foreground">
        {kind}
      </span>
    </div>
  );
};

const CertificateItem = ({
  attachment,
  verified,
  className,
  action,
}: {
  attachment: AgencyAttachment;
  /** Verification status. Not stored yet — pending until the api provides it. */
  verified?: boolean;
  className?: string;
  action?: (children: React.ReactNode) => React.ReactNode;
}) => {
  const { onRemove, disabled } = useCertificateContext();
  const name = attachment.name || attachment.url;

  const bodyContent = (
    <div className="flex flex-1 aspect-square w-full items-center justify-center bg-muted p-2">
      <CertificatePreview attachment={attachment} />
    </div>
  );

  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border bg-background shadow-2xs',
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
        <span className="flex-1 truncate text-sm font-medium" title={name}>
          {name}
        </span>
        {onRemove && (
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 aria-disabled:pointer-events-none"
                onClick={() => onRemove(attachment)}
              >
                <IconX className="size-3.5 text-destructive" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Remove</Tooltip.Content>
          </Tooltip>
        )}
      </div>

      {action ? action(bodyContent) : bodyContent}

      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-xs text-accent-foreground">
          {getFileInfo(attachment)}
        </span>
        <Badge
          variant={verified ? 'success' : 'secondary'}
          className="h-5 shrink-0 px-1.5"
        >
          {verified ? (
            <IconRosetteDiscountCheckFilled className="size-3" />
          ) : (
            <IconClock className="size-3" />
          )}
          {verified ? 'Verified' : 'Pending'}
        </Badge>
      </div>
    </div>
  );
};

// anchor
type Props = {
  attachment: AgencyAttachment;
  children?: React.ReactNode;
};
type CertificateLinkProps = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> &
  Props;

const CertificateLink = ({
  attachment,
  children,
  ...props
}: CertificateLinkProps) => {
  return (
    <a
      href={readImage(attachment?.url, undefined, true)}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </a>
  );
};

// dialog
type CertificateDialogTriggerProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'onclick'
> &
  Props;

const CertificateDialogTrigger = ({
  attachment,
  children,
  ...props
}: CertificateDialogTriggerProps) => {
  const { openViewer } = useFileViewer();
  return (
    <div onClick={() => openViewer(attachment)} {...props}>
      {children}
    </div>
  );
};

export const Certificate = Object.assign(CertificateRoot, {
  Group: CertificateGroup,
  Item: CertificateItem,
  Link: CertificateLink,
});

const CertificateUploadContent = ({
  values,
  disabled,
}: {
  values: AgencyAttachment[];
  disabled: boolean;
}) => {
  const { remove } = useUploadContext();

  return (
    <Certificate
      disabled={disabled}
      onRemove={(attachment) => remove(attachment.url)}
    >
      <Certificate.Group
        uploader={
          <Upload disabled={disabled}>
            <IconFilePlus className="size-8" />
            <span className="text-xs">Add certificate</span>
          </Upload>
        }
      >
        {values.map((attachment) => (
          <Certificate.Item
            key={attachment.url}
            attachment={attachment}
            action={(children) => (
              <CertificateDialogTrigger attachment={attachment}>
                {children}
              </CertificateDialogTrigger>
            )}
          />
        ))}
      </Certificate.Group>
    </Certificate>
  );
};

/** Certificate grid bound to an `Attachment[]` form field. */
export const CertificateUpload = ({
  values = [],
  onValueChange,
  disabled = false,
}: {
  values?: AgencyAttachment[];
  onValueChange: (values: AgencyAttachment[]) => void;
  disabled?: boolean;
}) => (
  <AttachmentUploadProvider
    values={values}
    onValueChange={onValueChange}
    acceptedFileTypes={CERTIFICATE_FILE_TYPES}
  >
    <FileViewerProvider>
      <CertificateUploadContent values={values} disabled={disabled} />
    </FileViewerProvider>
  </AttachmentUploadProvider>
);

import { IconAlertTriangle, IconCheck, IconPencil } from '@tabler/icons-react';
import { Spinner } from 'erxes-ui';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'invalid';

const formatTime = (value: Date | null) =>
  value ? value.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : '';

export const ProfileSaveStatus = ({
  status,
  savedAt,
}: {
  status: SaveStatus;
  savedAt: Date | null;
}) => {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Spinner size="sm" />
        Хадгалж байна…
      </span>
    );
  }

  if (status === 'invalid') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <IconAlertTriangle className="size-3.5" />
        Хадгалагдаагүй — талбаруудаа шалгана уу
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconCheck className="size-3.5 text-success" />
        {savedAt ? `${formatTime(savedAt)}-д хадгалагдсан` : 'Хадгалагдсан'}
      </span>
    );
  }

  return null;
};

import { IconPencil, IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { Badge, Button, Spinner } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

import { ProviderIcon } from '@/agent/components/ProviderIcon';

import type { IConnection, IConnectionType } from '../types';

interface IConnectionRowProps {
  connection: IConnection;
  type?: IConnectionType;
  canEdit: boolean;
  testing: boolean;
  testDisabled: boolean;
  onTest: (connection: IConnection) => void;
  onEdit: (connection: IConnection) => void;
  onRemove: (connection: IConnection) => void;
}

export const ConnectionRow = ({
  connection,
  type,
  canEdit,
  testing,
  testDisabled,
  onTest,
  onEdit,
  onRemove,
}: IConnectionRowProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const needsReentry = connection.secretsUnreadable.length > 0;
  const keyStored = !needsReentry && connection.secretsSet.length > 0;
  const isWorkspace = connection.scope === 'workspace';

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition-colors hover:bg-accent/40">
      <ProviderIcon provider={connection.type} className="size-8" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{connection.name}</p>
          <Badge variant="secondary" className="shrink-0">
            {isWorkspace
              ? t('scope-badge-workspace', 'Workspace')
              : t('scope-badge-personal', 'Personal')}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {type?.label ?? connection.type}
          {isWorkspace && connection.services.length > 0
            ? ` · ${t('shared-with', 'Shared with')} ${connection.services.join(
                ', ',
              )}`
            : ''}
        </p>
      </div>
      {needsReentry && (
        <span
          className="flex shrink-0 items-center gap-1.5 text-xs text-destructive"
          title={t(
            'needs-reentry-hint',
            'The stored key can no longer be opened. Edit the connection and enter it again.',
          )}
        >
          <span
            className="size-1.5 shrink-0 rounded-full bg-destructive"
            aria-hidden="true"
          />
          {t('needs-reentry', 'Needs re-entry')}
        </span>
      )}
      {keyStored && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-1.5 shrink-0 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          {t('key-stored', 'Key stored')}
        </span>
      )}
      {canEdit && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={testDisabled}
            onClick={() => onTest(connection)}
          >
            {testing ? <Spinner className="size-3.5" /> : <IconPlayerPlay />}
            {t('test', 'Test')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            disabled={!type}
            onClick={() => onEdit(connection)}
            aria-label={t('edit-aria', 'Edit {{name}}', {
              name: connection.name,
            })}
          >
            <IconPencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(connection)}
            aria-label={t('delete-aria', 'Delete {{name}}', {
              name: connection.name,
            })}
          >
            <IconTrash className="size-3.5" />
          </Button>
        </>
      )}
    </li>
  );
};

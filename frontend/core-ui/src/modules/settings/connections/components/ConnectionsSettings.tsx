import { IconAlertCircle, IconPlugConnected } from '@tabler/icons-react';
import { AlertDialog, Button, Empty, Spinner, buttonVariants } from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useConnectionTypes,
  useConnections,
  useCanManageConnections,
} from '../hooks/useConnections';
import {
  useConnectionsRemove,
  useConnectionsTest,
} from '../hooks/useConnectionMutations';
import type { IConnection } from '../types';
import { ConnectionFormSheet } from './ConnectionFormSheet';
import type { TConnectionSheetTarget } from './ConnectionFormSheet';
import { ConnectionsHeader } from './ConnectionsHeader';
import { ConnectionsList } from './ConnectionsList';

export const ConnectionsSettings = () => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const canManage = useCanManageConnections();
  const {
    connections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch,
  } = useConnections();
  const {
    types,
    typesByName,
    loading: typesLoading,
    error: typesError,
  } = useConnectionTypes();
  const [sheetTarget, setSheetTarget] = useState<TConnectionSheetTarget | null>(
    null,
  );
  const [removing, setRemoving] = useState<IConnection | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { removeConnection, loading: removeLoading } = useConnectionsRemove(
    () => setRemoving(null),
  );
  const { testConnection } = useConnectionsTest();

  const loading = connectionsLoading || typesLoading;
  const error = connectionsError ?? typesError;

  const handleTest = (connection: IConnection) => {
    setTestingId(connection._id);
    void testConnection({ variables: { _id: connection._id } }).finally(() =>
      setTestingId(null),
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex justify-center p-8">
          <Spinner className="size-5" />
        </div>
      );
    }

    if (error) {
      return (
        <Empty>
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconAlertCircle />
            </Empty.Media>
            <Empty.Title>
              {t('load-failed', 'Could not load connections')}
            </Empty.Title>
            <Empty.Description>{error}</Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button variant="outline" onClick={() => void refetch()}>
              {t('retry', 'Try again')}
            </Button>
          </Empty.Content>
        </Empty>
      );
    }

    if (connections.length === 0) {
      return (
        <Empty>
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconPlugConnected />
            </Empty.Media>
            <Empty.Title>{t('empty-title', 'No connections yet')}</Empty.Title>
            <Empty.Description>
              {t(
                'empty-description',
                'Add a connection to let the assistant and automations use your AI provider keys.',
              )}
            </Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button onClick={() => setSheetTarget({ mode: 'create' })}>
              {t('add-connection', 'Add connection')}
            </Button>
          </Empty.Content>
        </Empty>
      );
    }

    return (
      <ConnectionsList
        connections={connections}
        typesByName={typesByName}
        canManage={canManage}
        testingId={testingId}
        onTest={handleTest}
        onEdit={(connection) => setSheetTarget({ mode: 'edit', connection })}
        onRemove={setRemoving}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <ConnectionsHeader
        onAdd={() => setSheetTarget({ mode: 'create' })}
        addDisabled={loading || Boolean(error) || types.length === 0}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6">{renderBody()}</div>
      </div>

      <ConnectionFormSheet
        target={sheetTarget}
        types={types}
        typesByName={typesByName}
        canManage={canManage}
        onClose={() => setSheetTarget(null)}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>
              {t('delete-title', 'Delete {{name}}?', {
                name: removing?.name ?? '',
              })}
            </AlertDialog.Title>
            <AlertDialog.Description>
              {t(
                'delete-description',
                'Anything using this connection stops working until another one is chosen. The stored key is erased.',
              )}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>{t('cancel', 'Cancel')}</AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonVariants({ variant: 'destructive' })}
              disabled={removeLoading}
              onClick={(event) => {
                event.preventDefault();

                if (removing) {
                  void removeConnection({ variables: { _id: removing._id } });
                }
              }}
            >
              {removeLoading ? (
                <Spinner className="size-4" />
              ) : (
                t('delete', 'Delete')
              )}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};

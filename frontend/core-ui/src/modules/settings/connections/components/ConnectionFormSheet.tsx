import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft, IconPlugConnected } from '@tabler/icons-react';
import { Button, Form, Sheet, Spinner } from 'erxes-ui';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useConnectionServices } from '../hooks/useConnections';
import {
  useConnectionsAdd,
  useConnectionsEdit,
  useConnectionsTest,
} from '../hooks/useConnectionMutations';
import type {
  IConnection,
  IConnectionFormValues,
  IConnectionType,
} from '../types';
import {
  buildConnectionPayload,
  buildConnectionSchema,
  buildDefaultValues,
} from '../utils/connectionForm';
import { ConnectionFields } from './ConnectionFields';
import { ConnectionTypeGrid } from './ConnectionTypeGrid';

export type TConnectionSheetTarget =
  | { mode: 'create' }
  | { mode: 'edit'; connection: IConnection };

interface IConnectionFormProps {
  type: IConnectionType;
  connection?: IConnection;
  canManage: boolean;
  onClose: () => void;
  onBack?: () => void;
}

const ConnectionForm = ({
  type,
  connection,
  canManage,
  onClose,
  onBack,
}: IConnectionFormProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const { services } = useConnectionServices();
  const { addConnection, loading: adding } = useConnectionsAdd(onClose);
  const { editConnection, loading: editing } = useConnectionsEdit(onClose);
  const { testConnection, loading: testing } = useConnectionsTest();

  const schema = useMemo(
    () =>
      buildConnectionSchema(type, {
        storedSecrets: connection?.secretsSet ?? [],
      }),
    [type, connection],
  );

  const form = useForm<IConnectionFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(type, {
      connection,
      scope: canManage ? 'workspace' : 'personal',
    }),
  });

  const saving = adding || editing;

  const handleSubmit: SubmitHandler<IConnectionFormValues> = (values) => {
    const { config, secrets } = buildConnectionPayload(type, values, {
      editing: Boolean(connection),
    });
    const sharedServices =
      values.scope === 'workspace' ? values.services : undefined;

    if (connection) {
      void editConnection({
        variables: {
          _id: connection._id,
          input: {
            name: values.name.trim(),
            config,
            secrets,
            ...(sharedServices ? { services: sharedServices } : {}),
          },
        },
      });
      return;
    }

    void addConnection({
      variables: {
        input: {
          type: type.type,
          name: values.name.trim(),
          scope: values.scope,
          config,
          secrets,
          ...(sharedServices ? { services: sharedServices } : {}),
        },
      },
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex size-full flex-col gap-0"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Sheet.Header>
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label={t('back-to-types', 'Back to connection types')}
            >
              <IconArrowLeft />
            </Button>
          ) : (
            <IconPlugConnected />
          )}
          <Sheet.Title>
            {connection
              ? t('edit-title', 'Edit {{name}}', { name: connection.name })
              : t('add-title', 'Add {{type}}', { type: type.label })}
          </Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex size-full grow flex-col overflow-y-auto px-5 py-4">
          <ConnectionFields
            type={type}
            connection={connection}
            canManage={canManage}
            services={services}
          />
        </Sheet.Content>
        <Sheet.Footer>
          {connection && (
            <Button
              type="button"
              variant="outline"
              className="mr-auto"
              disabled={testing || saving}
              onClick={() =>
                void testConnection({ variables: { _id: connection._id } })
              }
            >
              {testing && <Spinner />}
              {t('test-saved', 'Test saved connection')}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : t('save', 'Save')}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

interface IConnectionFormSheetProps {
  target: TConnectionSheetTarget | null;
  types: IConnectionType[];
  typesByName: Map<string, IConnectionType>;
  canManage: boolean;
  onClose: () => void;
}

export const ConnectionFormSheet = ({
  target,
  types,
  typesByName,
  canManage,
  onClose,
}: IConnectionFormSheetProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const [pickedType, setPickedType] = useState<IConnectionType | null>(null);

  const handleClose = () => {
    setPickedType(null);
    onClose();
  };

  const editedType =
    target?.mode === 'edit'
      ? typesByName.get(target.connection.type)
      : undefined;

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <Sheet.View className="p-0">
        {target?.mode === 'edit' && editedType && (
          <ConnectionForm
            key={target.connection._id}
            type={editedType}
            connection={target.connection}
            canManage={canManage}
            onClose={handleClose}
          />
        )}
        {target?.mode === 'create' && pickedType && (
          <ConnectionForm
            key={pickedType.type}
            type={pickedType}
            canManage={canManage}
            onClose={handleClose}
            onBack={() => setPickedType(null)}
          />
        )}
        {target?.mode === 'create' && !pickedType && (
          <div className="flex size-full flex-col">
            <Sheet.Header>
              <IconPlugConnected />
              <Sheet.Title>{t('add-connection', 'Add connection')}</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>
            <Sheet.Content className="grow overflow-y-auto px-5 py-4">
              <ConnectionTypeGrid types={types} onSelect={setPickedType} />
            </Sheet.Content>
          </div>
        )}
      </Sheet.View>
    </Sheet>
  );
};

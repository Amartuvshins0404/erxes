import { ApolloCache, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

import {
  CONNECTIONS_ADD,
  CONNECTIONS_EDIT,
  CONNECTIONS_REMOVE,
  CONNECTIONS_TEST,
} from '../graphql/connections';
import type {
  IConnectionsAddData,
  IConnectionsAddVariables,
  IConnectionsEditData,
  IConnectionsEditVariables,
  IConnectionsRemoveData,
  IConnectionsRemoveVariables,
  IConnectionsTestData,
  IConnectionsTestVariables,
} from '../types';

const refreshConnectionQueries = (cache: ApolloCache<unknown>) => {
  cache.evict({ id: 'ROOT_QUERY', fieldName: 'connections' });
  cache.evict({ id: 'ROOT_QUERY', fieldName: 'agentsModels' });
  cache.gc();
};

const failure = (title: string, message: string) =>
  toast({ title, description: message, variant: 'destructive' });

const useConnectionsT = () =>
  useTranslation('settings', { keyPrefix: 'connections' }).t;

export const useConnectionsAdd = (onDone?: () => void) => {
  const t = useConnectionsT();
  const [mutate, { loading }] = useMutation<
    IConnectionsAddData,
    IConnectionsAddVariables
  >(CONNECTIONS_ADD, {
    update: refreshConnectionQueries,
    onCompleted: () => {
      toast({
        title: t('added', 'Connection added'),
        variant: 'success',
      });
      onDone?.();
    },
    onError: (error) =>
      failure(t('add-failed', 'Failed to add the connection'), error.message),
  });

  return { addConnection: mutate, loading };
};

export const useConnectionsEdit = (onDone?: () => void) => {
  const t = useConnectionsT();
  const [mutate, { loading }] = useMutation<
    IConnectionsEditData,
    IConnectionsEditVariables
  >(CONNECTIONS_EDIT, {
    update: refreshConnectionQueries,
    onCompleted: () => {
      toast({
        title: t('saved', 'Connection saved'),
        variant: 'success',
      });
      onDone?.();
    },
    onError: (error) =>
      failure(t('save-failed', 'Failed to save the connection'), error.message),
  });

  return { editConnection: mutate, loading };
};

export const useConnectionsRemove = (onDone?: () => void) => {
  const t = useConnectionsT();
  const [mutate, { loading }] = useMutation<
    IConnectionsRemoveData,
    IConnectionsRemoveVariables
  >(CONNECTIONS_REMOVE, {
    update: refreshConnectionQueries,
    onCompleted: () => {
      toast({
        title: t('deleted', 'Connection deleted'),
        variant: 'success',
      });
      onDone?.();
    },
    onError: (error) =>
      failure(
        t('delete-failed', 'Failed to delete the connection'),
        error.message,
      ),
  });

  return { removeConnection: mutate, loading };
};

export const useConnectionsTest = () => {
  const t = useConnectionsT();
  const [mutate, { loading }] = useMutation<
    IConnectionsTestData,
    IConnectionsTestVariables
  >(CONNECTIONS_TEST, {
    onCompleted: (data) => {
      const result = data.connectionsTest;
      if (result?.ok) {
        toast({
          title: t('test-ok', 'Connection works'),
          variant: 'success',
        });
        return;
      }
      failure(
        t('test-failed', 'Connection test failed'),
        result?.error || t('test-no-response', 'No response.'),
      );
    },
    onError: (error) =>
      failure(t('test-failed', 'Connection test failed'), error.message),
  });

  return { testConnection: mutate, loading };
};

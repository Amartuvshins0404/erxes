import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { usePermissionCheck } from 'ui-modules';

import {
  CONNECTIONS_LIST,
  CONNECTIONS_SERVICES,
  CONNECTIONS_TYPES,
} from '../graphql/connections';
import type {
  IConnection,
  IConnectionType,
  IConnectionsListData,
  IConnectionsServicesData,
  IConnectionsTypesData,
} from '../types';

export const CONNECTIONS_MANAGE_ACTION = 'connectionsManage';

export const useCanManageConnections = (): boolean => {
  const { isLoaded, hasActionPermission } = usePermissionCheck();
  return isLoaded && hasActionPermission(CONNECTIONS_MANAGE_ACTION);
};

export interface IUseConnectionsResult {
  connections: IConnection[];
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<unknown>;
}

export const useConnections = (): IUseConnectionsResult => {
  const { data, previousData, loading, error, refetch } =
    useQuery<IConnectionsListData>(CONNECTIONS_LIST);

  return {
    connections: (data ?? previousData)?.connections ?? [],
    loading: loading && !(data ?? previousData),
    error: error?.message,
    refetch,
  };
};

export interface IUseConnectionTypesResult {
  types: IConnectionType[];
  typesByName: Map<string, IConnectionType>;
  loading: boolean;
  error: string | undefined;
}

export const useConnectionTypes = (): IUseConnectionTypesResult => {
  const { data, loading, error } =
    useQuery<IConnectionsTypesData>(CONNECTIONS_TYPES);

  const types = useMemo(() => data?.connectionsTypes ?? [], [data]);
  const typesByName = useMemo(
    () => new Map(types.map((type) => [type.type, type])),
    [types],
  );

  return { types, typesByName, loading, error: error?.message };
};

export const useConnectionServices = (): {
  services: string[];
  loading: boolean;
} => {
  const { data, loading } =
    useQuery<IConnectionsServicesData>(CONNECTIONS_SERVICES);

  return { services: data?.connectionsServices ?? [], loading };
};

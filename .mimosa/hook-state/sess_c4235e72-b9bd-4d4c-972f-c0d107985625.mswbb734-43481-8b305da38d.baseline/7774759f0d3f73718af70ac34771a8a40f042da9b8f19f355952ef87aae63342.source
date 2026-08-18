import { createContext, useContext } from 'react';
import { AvatarProps } from 'erxes-ui';
import { ICVClient } from '../clientsTypes';

export interface IClientsInlineContext {
  clients: ICVClient[];
  loading: boolean;
  clientIds?: string[];
  placeholder: string;
  size?: AvatarProps['size'];
  updateClients?: (clients: ICVClient[]) => void;
  allowUnassigned?: boolean;
}

export const ClientsInlineContext = createContext<IClientsInlineContext | null>(
  null,
);

export const useClientsInlineContext = () => {
  const context = useContext(ClientsInlineContext);
  if (!context) {
    throw new Error(
      'useClientsInlineContext must be used within a ClientsInlineProvider',
    );
  }
  return context;
};


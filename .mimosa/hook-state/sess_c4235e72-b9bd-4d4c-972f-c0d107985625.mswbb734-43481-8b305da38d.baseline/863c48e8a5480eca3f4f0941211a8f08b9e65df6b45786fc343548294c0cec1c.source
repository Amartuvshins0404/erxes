import { createContext, useContext } from 'react';
import { ICVClient } from '../clientsTypes';

export type ISelectClientContext = {
  clientIds: string[];
  onSelect: (client: ICVClient | null) => void;
  clients: ICVClient[];
  setClients: (clients: ICVClient[]) => void;
  loading: boolean;
  allowUnassigned: boolean;
};

export const SelectClientContext = createContext<ISelectClientContext | null>(
  null,
);

export const useSelectClientContext = () => {
  const context = useContext(SelectClientContext);
  if (!context) {
    throw new Error(
      'useSelectClientContext must be used within a SelectClientProvider',
    );
  }
  return context;
};


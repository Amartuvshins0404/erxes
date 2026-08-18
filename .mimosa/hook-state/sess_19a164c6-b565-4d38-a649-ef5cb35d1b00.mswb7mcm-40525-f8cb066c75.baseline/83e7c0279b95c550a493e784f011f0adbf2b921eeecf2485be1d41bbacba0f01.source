import {
  Avatar,
  AvatarProps,
  Combobox,
  Tooltip,
  cn,
  isUndefinedOrNull,
} from 'erxes-ui';
import {
  ClientsInlineContext,
  useClientsInlineContext,
} from '../contexts/ClientsInlineContext';
import { useEffect, useState } from 'react';
import { IconBuilding, IconUserCancel } from '@tabler/icons-react';
import { useClientDetail } from '../hooks/useClients';
import { ICVClient } from '../clientsTypes';

export const ClientsInlineRoot = ({
  clients,
  clientIds,
  placeholder,
  updateClients,
  className,
  size = 'lg',
  allowUnassigned,
}: {
  clients?: ICVClient[];
  clientIds?: string[];
  placeholder?: string;
  updateClients?: (clients: ICVClient[]) => void;
  className?: string;
  size?: AvatarProps['size'];
  allowUnassigned?: boolean;
}) => {
  return (
    <ClientsInlineProvider
      clients={clients}
      clientIds={clientIds}
      placeholder={placeholder}
      updateClients={updateClients}
      size={size}
      allowUnassigned={allowUnassigned}
    >
      <ClientsInlineAvatar size={size} />
      <ClientsInlineTitle className={className} />
    </ClientsInlineProvider>
  );
};

export const ClientsInlineProvider = ({
  children,
  clientIds,
  clients,
  placeholder,
  updateClients,
  size,
  allowUnassigned,
}: {
  children?: React.ReactNode;
  clientIds?: string[];
  clients?: ICVClient[];
  placeholder?: string;
  updateClients?: (clients: ICVClient[]) => void;
  size?: AvatarProps['size'];
  allowUnassigned?: boolean;
}) => {
  const [_clients, _setClients] = useState<ICVClient[]>(clients || []);

  return (
    <ClientsInlineContext.Provider
      value={{
        clients: clients || _clients,
        loading: false,
        clientIds: clientIds || [],
        placeholder: isUndefinedOrNull(placeholder)
          ? 'Select clients'
          : placeholder,
        updateClients: updateClients || _setClients,
        size,
        allowUnassigned,
      }}
    >
      <Tooltip.Provider>{children}</Tooltip.Provider>
      {clientIds
        ?.filter((id) => !clients?.some((client) => client._id === id))
        .map((clientId) => (
          <ClientInlineEffectComponent key={clientId} clientId={clientId} />
        ))}
    </ClientsInlineContext.Provider>
  );
};

const ClientInlineEffectComponent = ({ clientId }: { clientId: string }) => {
  const { clients, clientIds, updateClients } = useClientsInlineContext();
  const { clientDetail } = useClientDetail({
    id: clientId,
  });

  useEffect(() => {
    const newClients = [...clients].filter(
      (c) => clientIds?.includes(c._id) && c._id !== clientId,
    );
    if (newClients.some((c) => c._id === clientId)) {
      updateClients?.(newClients);
      return;
    }
    if (clientDetail) {
      updateClients?.([
        ...newClients,
        {
          _id: clientDetail._id,
          name: clientDetail.name,
          client_type: clientDetail.client_type,
          lead_source: clientDetail.lead_source,
          registration_number: clientDetail.registration_number,
          operational_address: clientDetail.operational_address,
          business_type: clientDetail.business_type,
          business_category: clientDetail.business_category,
          status: clientDetail.status,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientDetail]);

  return null;
};

export const ClientsInlineAvatar = ({
  className,
  containerClassName,
  ...props
}: AvatarProps & {
  containerClassName?: string;
}) => {
  const { clients, loading, clientIds, size, allowUnassigned } =
    useClientsInlineContext();

  if (loading)
    return (
      <div className={cn('flex -space-x-1.5', containerClassName)}>
        {clientIds?.map((clientId) => (
          <Avatar key={clientId} className={cn('bg-background', className)}>
            <Avatar.Fallback />
          </Avatar>
        ))}
      </div>
    );

  const renderAvatar = (client: ICVClient) => {
    const initials = client.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'C';

    return (
      <Tooltip delayDuration={100} key={client._id}>
        <Tooltip.Trigger asChild>
          <Avatar
            className={cn(
              'bg-background',
              clients.length > 1 && 'ring-2 ring-background',
              className,
            )}
            size={size || 'lg'}
            {...props}
          >
            <Avatar.Fallback>
              <IconBuilding className="size-4" />
            </Avatar.Fallback>
          </Avatar>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{client.name}</p>
        </Tooltip.Content>
      </Tooltip>
    );
  };

  if (clients.length === 0) {
    if (allowUnassigned) {
      return (
        <IconUserCancel className="text-muted-foreground flex-none size-4" />
      );
    }
    return null;
  }

  if (clients.length === 1) return renderAvatar(clients[0]);

  const withAvatar = clients.slice(0, clients.length > 3 ? 2 : 3);
  const restClients = clients.slice(withAvatar.length);

  return (
    <div className="flex -space-x-1.5">
      {withAvatar.map((client) => renderAvatar(client))}
      {restClients.length > 0 && (
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Avatar
              className={cn('ring-2 ring-background bg-background', className)}
              size={size || 'lg'}
              {...props}
            >
              <Avatar.Fallback className="bg-primary/10 text-primary">
                +{restClients.length}
              </Avatar.Fallback>
            </Avatar>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>{restClients.map((c) => c.name).join(', ')}</p>
          </Tooltip.Content>
        </Tooltip>
      )}
    </div>
  );
};

export const ClientsInlineTitle = ({ className }: { className?: string }) => {
  const { clients, loading, placeholder, allowUnassigned } =
    useClientsInlineContext();

  const getDisplayValue = () => {
    if (!clients || clients.length === 0) {
      if (allowUnassigned) {
        return (
          <span className="capitalize text-muted-foreground/80">
            No client
          </span>
        );
      }
      return undefined;
    }

    if (clients.length === 1) {
      return clients?.[0].name;
    }

    return `${clients.length} clients`;
  };

  return (
    <Combobox.Value
      value={getDisplayValue()}
      loading={loading}
      placeholder={placeholder}
      className={className}
    />
  );
};

export const ClientsInline = Object.assign(ClientsInlineRoot, {
  Provider: ClientsInlineProvider,
  Avatar: ClientsInlineAvatar,
  Title: ClientsInlineTitle,
});


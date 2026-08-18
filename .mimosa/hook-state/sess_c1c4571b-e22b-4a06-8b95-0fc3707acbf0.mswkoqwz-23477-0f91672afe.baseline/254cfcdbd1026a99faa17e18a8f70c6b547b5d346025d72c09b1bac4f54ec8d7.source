import { useState } from 'react';
import {
  Button,
  isUndefinedOrNull,
  Sheet,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { IconPencil } from '@tabler/icons-react';
import { useClientDetail } from '../hooks/useClients';
import { ClientForm } from './ClientForms';
import { useClientsUpdate } from '../hooks/useClientsUpdate';

export const ClientEditSheet = () => {
  const [open, setOpen] = useState(false);
  const [activeClientId] = useQueryState<string | null>('activeClientId');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPencil />
          Edit
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Edit client</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {activeClientId && <ClientEdit id={activeClientId} setOpen={setOpen} />}
      </Sheet.View>
    </Sheet>
  );
};

export const ClientEdit = ({
  id,
  setOpen,
}: {
  id: string;
  setOpen: (open: boolean) => void;
}) => {
  const { clientDetail, loading } = useClientDetail({ id });
  const { updateClient, loading: updateLoading } = useClientsUpdate({ id });

  if (loading) return <Spinner />;

  return (
    <ClientForm
      defaultValues={Object.fromEntries(
        Object.entries(clientDetail || {}).map(([key, value]) => [
          key,
          isUndefinedOrNull(value) ? undefined : value,
        ]),
      )}
      onSubmit={(data) => {
        updateClient({
          variables: {
            id,
            input: data,
          },
          onCompleted: () => {
            setOpen(false);
          },
        });
      }}
      loading={updateLoading}
      isEdit={true}
    />
  );
};

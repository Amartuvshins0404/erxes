import { useQuery } from '@apollo/client';
import { GET_CV_CLIENTS } from '@/clients/graphql/cvClientsQueries';
import { Select, Form } from 'erxes-ui';
import { ICVClient } from '@/clients/clientsTypes';

export const SelectClient = ({
  value,
  onValueChange,
}: {
  value?: string;
  onValueChange: (value: string) => void;
}) => {
  const { data, loading } = useQuery(GET_CV_CLIENTS, {
    variables: { filter: {} },
  });

  const clients = data?.cvGetClients?.list || [];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={loading}>
      <Select.Trigger>
        <Select.Value placeholder="Select client" />
      </Select.Trigger>
      <Select.Content>
        {clients.map((client: ICVClient) => (
          <Select.Item key={client._id} value={client._id}>
            {client.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};


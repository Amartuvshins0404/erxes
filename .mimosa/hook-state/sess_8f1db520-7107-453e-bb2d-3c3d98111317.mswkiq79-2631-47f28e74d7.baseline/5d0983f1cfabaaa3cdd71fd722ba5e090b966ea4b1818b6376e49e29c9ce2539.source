import { useQuery, gql } from '@apollo/client';
import { Select } from 'erxes-ui';

const GET_AGENCIES = gql`
  query BlockGetAgencies {
    blockGetAgencies {
      _id
      name
      brandName
    }
  }
`;

type Agency = {
  _id: string;
  name: string;
  brandName?: string;
};

type Props = {
  value?: string;
  onValueChange: (value: string) => void;
};

const NONE_VALUE = '__none__';

export const SelectAgency: React.FC<Props> = ({ value, onValueChange }) => {
  const { data, loading } = useQuery<{ blockGetAgencies: Agency[] }>(
    GET_AGENCIES,
    { fetchPolicy: 'network-only' },
  );

  const agencies = data?.blockGetAgencies || [];

  const handleChange = (val: string) => {
    onValueChange(val === NONE_VALUE ? '' : val);
  };

  return (
    <Select value={value || NONE_VALUE} onValueChange={handleChange}>
      <Select.Trigger className="h-8 bg-background" disabled={loading}>
        <Select.Value placeholder="Select agency" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={NONE_VALUE}>None</Select.Item>
        {agencies.map((agency) => (
          <Select.Item key={agency._id} value={agency._id}>
            {agency.brandName || agency.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};

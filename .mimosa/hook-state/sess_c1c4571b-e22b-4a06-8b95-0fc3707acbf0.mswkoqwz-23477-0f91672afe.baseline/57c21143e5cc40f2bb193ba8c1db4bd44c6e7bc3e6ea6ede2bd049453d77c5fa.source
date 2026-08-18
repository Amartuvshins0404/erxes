import { Select } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { ONE_FIT_PROVIDERS } from '~/modules/provider/graphql/providerQueries';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';

interface SelectProviderProps {
  selected?: string;
  onSelect: (providerId: string | undefined) => void;
  disabled?: boolean;
}

export const SelectProvider = ({
  selected,
  onSelect,
  disabled = false,
}: SelectProviderProps) => {
  const { data, loading } = useQuery(ONE_FIT_PROVIDERS, {
    variables: {
      isActive: true,
      limit: 100,
    },
  });

  const providers = data?.oneFitProviders?.list || [];

  if (loading) {
    return (
      <Select disabled>
        <Select.Trigger>
          <Select.Value placeholder="Loading providers..." />
        </Select.Trigger>
      </Select>
    );
  }

  return (
    <Select
      value={selected || ''}
      onValueChange={(value) => onSelect(value === '__none__' ? undefined : value)}
      disabled={disabled}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a provider" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="__none__">None</Select.Item>
        {providers.map((provider: {
          _id: string;
          businessName: { en: string; mn: string };
        }) => {
          const businessName = getLocalizedString(provider.businessName, 'en');
          return (
            <Select.Item key={provider._id} value={provider._id}>
              {businessName}
            </Select.Item>
          );
        })}
      </Select.Content>
    </Select>
  );
};

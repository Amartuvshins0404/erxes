import { useQuery } from '@apollo/client';
import { Select } from 'erxes-ui';
import { GET_CLIENT_PORTALS_FOR_SELECT } from '@/registration/graphql/clientPortalUsersQueries';

interface ClientPortalRemoteSelectProps {
  value?: string | null;
  onValueChange?: (clientPortalId: string | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ClientPortalRemoteSelect({
  value,
  onValueChange,
  className,
  placeholder = 'Client portal…',
  disabled = false,
}: ClientPortalRemoteSelectProps) {
  const { data, loading } = useQuery(GET_CLIENT_PORTALS_FOR_SELECT);

  const portals = (data?.getClientPortals?.list ?? []) as {
    _id: string;
    name?: string;
  }[];

  return (
    <Select
      value={value || '__all__'}
      onValueChange={(v) => onValueChange?.(v === '__all__' ? undefined : v)}
      disabled={disabled || loading}
    >
      <Select.Trigger className={className}>
        <Select.Value placeholder={loading ? 'Ачаалж байна…' : placeholder} />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="__all__">Бүх портал</Select.Item>
        {portals.map((p) => (
          <Select.Item key={p._id} value={p._id}>
            {p.name ?? p._id}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}

import { Input, Select } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { MtoFilterBase } from '~/components/MtoFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { MTO_REGISTRATION_MEMBERSHIP_SUMMARIES } from '@/registration/graphql/registrationQueries';
import { RegistrationFilters as RegistrationFiltersType } from '@/registration/types/registrationFilters';
import { ClientPortalUserSelect } from '@/registration/components/ClientPortalUserSelect';
import { ClientPortalRemoteSelect } from '@/registration/components/ClientPortalRemoteSelect';
import { REGISTRATION_ACTIVITY_CATEGORY_OPTIONS } from '@/registration/constants/activityCategoryOptions';

const STATUS_OPTIONS = [
  { value: '__all__', label: 'Бүх төлөв' },
  { value: 'draft', label: 'Ноорог' },
  { value: 'submitted', label: 'Илгээсэн' },
  { value: 'under_review', label: 'Хянагдаж буй' },
  { value: 'approved', label: 'Зөвшөөрсөн' },
  { value: 'rejected', label: 'Татгалзсан' },
];

const ARCHIVED_OPTIONS = [
  { value: '__active__', label: 'Идэвхтэй' },
  { value: 'archived', label: 'Зөвхөн архив' },
];

interface RegistrationFiltersProps {
  filters: RegistrationFiltersType;
  onFiltersChange: (filters: RegistrationFiltersType) => void;
}

export function RegistrationFilters({
  filters,
  onFiltersChange,
}: RegistrationFiltersProps) {
  const [cpPortalRemoteId, setCpPortalRemoteId] = useState<
    string | undefined
  >();

  const { data } = useQuery(MTO_REGISTRATION_MEMBERSHIP_SUMMARIES);

  const summaries = data?.mtoRegistrationMembershipSummaries ?? [];

  function handleChange<K extends keyof RegistrationFiltersType>(
    key: K,
    value: RegistrationFiltersType[K] | undefined,
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <MtoFilterBase
      filters={filters}
      onFiltersChange={onFiltersChange}
      contentClassName="w-[36rem] max-w-[calc(100vw-2rem)]"
      bodyClassName="grid grid-cols-2 gap-4"
    >
      <FilterField label="Client portal">
        <ClientPortalRemoteSelect
          value={cpPortalRemoteId}
          onValueChange={(id) => {
            setCpPortalRemoteId(id);
            handleChange('cpUserId', undefined);
          }}
          placeholder="Бүх портал"
        />
      </FilterField>
      <FilterField label="CP хэрэглэгч">
        <ClientPortalUserSelect
          clientPortalIdFilter={cpPortalRemoteId}
          value={filters.cpUserId}
          onValueChange={(user) => handleChange('cpUserId', user?._id)}
          placeholder="Бүх CP хэрэглэгч"
        />
      </FilterField>
      <FilterField label="Төрөл">
        <Select
          value={filters.membershipTypeId || '__all__'}
          onValueChange={(v) =>
            handleChange('membershipTypeId', v === '__all__' ? undefined : v)
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Бүх төрөл" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">Бүх төрөл</Select.Item>
            {summaries.map((s: { membershipTypeId: string; title: string }) => (
              <Select.Item key={s.membershipTypeId} value={s.membershipTypeId}>
                {s.title}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Үйл ажиллагааны ангилал">
        <Select
          value={filters.activityCategory || '__all__'}
          onValueChange={(v) =>
            handleChange('activityCategory', v === '__all__' ? undefined : v)
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Бүх ангилал" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">Бүх ангилал</Select.Item>
            {REGISTRATION_ACTIVITY_CATEGORY_OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Төлөв">
        <Select
          value={filters.status || '__all__'}
          onValueChange={(v) =>
            handleChange('status', v === '__all__' ? undefined : v)
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Төлөв" />
          </Select.Trigger>
          <Select.Content>
            {STATUS_OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Нэр">
        <Input
          value={filters.name ?? ''}
          onChange={(e) => handleChange('name', e.target.value || undefined)}
          placeholder="Нэр (MN / EN)"
        />
      </FilterField>
      <FilterField label="Байгууллагын РД">
        <Input
          value={filters.registrationNumber ?? ''}
          onChange={(e) =>
            handleChange('registrationNumber', e.target.value || undefined)
          }
          placeholder="РД"
        />
      </FilterField>
      <FilterField label="Имэйл">
        <Input
          value={filters.email ?? ''}
          onChange={(e) => handleChange('email', e.target.value || undefined)}
          placeholder="Имэйл"
        />
      </FilterField>
      <FilterField label="Огноо эхлэх">
        <Input
          type="date"
          value={filters.createdAtFrom ?? ''}
          onChange={(e) =>
            handleChange('createdAtFrom', e.target.value || undefined)
          }
        />
      </FilterField>
      <FilterField label="Огноо дуусах">
        <Input
          type="date"
          value={filters.createdAtTo ?? ''}
          onChange={(e) =>
            handleChange('createdAtTo', e.target.value || undefined)
          }
        />
      </FilterField>
      <FilterField label="Архив" className="col-span-2">
        <Select
          value={filters.archived ? 'archived' : '__active__'}
          onValueChange={(v) =>
            handleChange('archived', v === 'archived' ? true : undefined)
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Идэвхтэй" />
          </Select.Trigger>
          <Select.Content>
            {ARCHIVED_OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
    </MtoFilterBase>
  );
}

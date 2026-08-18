import {
  IconCalendar,
  IconLabel,
  IconUser,
} from '@tabler/icons-react';
import { BlockTestHotKeyScope } from '~/modules/types';
import { ListFilter, ListFilterItem } from '~/components/filter';

export const RiskGroupsFilter = () => {
  return (
    <ListFilter
      filters={RISK_GROUPS_FILTERS as ListFilterItem[]}
      scope={BlockTestHotKeyScope.RiskGroupsPage}
    />
  );
};

export const RISK_GROUPS_FILTERS: ListFilterItem[] = [
  {
    filterKey: 'name',
    label: 'Name',
    icon: IconLabel,
    type: 'text',
  },
  {
    filterKey: 'client',
    label: 'Client',
    icon: IconUser,
    type: 'text',
  },
  {
    filterKey: 'effective_date',
    label: 'Effective Date',
    icon: IconCalendar,
    type: 'text',
  },
  {
    filterKey: 'expiration_date',
    label: 'Expiration Date',
    icon: IconCalendar,
    type: 'text',
  },
];


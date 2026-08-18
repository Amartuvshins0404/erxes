import {
  IconActivityHeartbeat,
  IconBrandStackshare,
  IconBuilding,
  IconCalendarEvent,
  IconCheck,
  IconLabel,
  IconMapPin,
  IconNumber,
  IconUser,
} from '@tabler/icons-react';
import { BlockTestHotKeyScope } from '~/modules/types';
import {
  CLIENT_BUSINESS_MAIN_TYPE_OPTIONS,
  CLIENT_LEAD_SOURCE_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  CLIENT_TYPE_OPTIONS,
} from '../constants/clientTypes';
import { SelectMember } from 'ui-modules';
import { ListFilter, ListFilterItem } from '~/components/filter';

export const ClientsFilter = () => {
  return (
    <ListFilter
      filters={CLIENT_FILTERS as ListFilterItem[]}
      scope={BlockTestHotKeyScope.ClientsPage}
    />
  );
};

export const CLIENT_FILTERS: ListFilterItem[] = [
  {
    filterKey: 'business_type',
    label: 'Business Type',
    icon: IconBuilding,
    type: 'select',
    selectOptions: CLIENT_BUSINESS_MAIN_TYPE_OPTIONS,
  },
  {
    filterKey: 'business_category',
    label: 'Business Category',
    icon: IconBuilding,
    type: 'text',
  },
  {
    filterKey: 'client_type',
    label: 'Client Type',
    icon: IconUser,
    type: 'select',
    selectOptions: CLIENT_TYPE_OPTIONS,
  },
  {
    filterKey: 'cvh_broker',
    label: 'CVH Broker',
    icon: IconUser,
    type: 'relation',
    filterView: <SelectMember.FilterView queryKey="cvh_broker" />,
    filterBar: <SelectMember.FilterBar queryKey="cvh_broker" />,
  },
  {
    filterKey: 'isActive',
    label: 'Active',
    icon: IconActivityHeartbeat,
    type: 'boolean',
  },
  {
    filterKey: 'lead_source',
    label: 'Lead Source',
    icon: IconBrandStackshare,
    type: 'select',
    selectOptions: CLIENT_LEAD_SOURCE_OPTIONS,
  },
  {
    filterKey: 'name',
    label: 'Name',
    icon: IconLabel,
    type: 'text',
  },
  {
    filterKey: 'operational_address',
    label: 'Operational Address',
    icon: IconMapPin,
    type: 'text',
  },
  {
    filterKey: 'registered_date',
    label: 'Registered Date',
    icon: IconCalendarEvent,
    type: 'text',
  },
  {
    filterKey: 'registration_number',
    label: 'Registration Number',
    icon: IconNumber,
    type: 'text',
  },
  {
    filterKey: 'status',
    label: 'Status',
    icon: IconCheck,
    type: 'select',
    selectOptions: CLIENT_STATUS_OPTIONS,
  },
];

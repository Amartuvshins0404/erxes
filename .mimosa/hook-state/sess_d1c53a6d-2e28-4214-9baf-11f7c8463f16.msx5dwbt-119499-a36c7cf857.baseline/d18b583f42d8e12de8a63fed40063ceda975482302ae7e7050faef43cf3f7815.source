import {
  IconAlignBoxBottomLeftFilled,
  IconBuilding,
  IconClipboardCheck,
  IconFlag,
  IconLabel,
  IconMapPin,
  IconNumber,
  IconProgressCheck,
  IconTextColor,
  IconTimezone,
  IconToggleRightFilled,
} from '@tabler/icons-react';
import { CountryPhoneCodes } from '~/modules/countryCodes.constant';
import { ListFilter, ListFilterItem } from '~/components/filter';
import {
  MARKET_ONBOARDING_STATUS_OPTIONS,
  MARKET_REGION_OPTIONS,
  MARKET_SPECIALIZATION_OPTIONS,
  MARKET_TYPE_OPTIONS,
} from '../constants/marketTypes';
import { BlockTestHotKeyScope } from '~/modules/types';

export const MarketsFilter = () => {
  return (
    <ListFilter
      filters={MARKETS_FILTERS as ListFilterItem[]}
      scope={BlockTestHotKeyScope.MarketsPage}
    />
  );
};

export const MARKETS_FILTERS: ListFilterItem[] = [
  {
    filterKey: 'name',
    label: 'Name',
    icon: IconLabel,
    type: 'text',
  },
  {
    filterKey: 'country',
    label: 'Country',
    icon: IconFlag,
    type: 'select',
    selectOptions: CountryPhoneCodes.map((country) => ({
      value: country.code,
      label: `${country.flag} ${country.name}`,
    })),
  },
  {
    filterKey: 'description',
    label: 'Description',
    icon: IconTextColor,
    type: 'text',
  },

  {
    filterKey: 'onboarded',
    label: 'Onboarded',
    icon: IconClipboardCheck,
    type: 'boolean',
  },
  {
    filterKey: 'onboarding_status',
    label: 'Onboarding Status',
    icon: IconProgressCheck,
    type: 'select',
    selectOptions: MARKET_ONBOARDING_STATUS_OPTIONS.map((status) => ({
      value: status.value,
      label: status.label,
    })),
  },
  {
    filterKey: 'operational_address',
    label: 'Operational Address',
    icon: IconMapPin,
    type: 'text',
  },

  {
    filterKey: 'region',
    label: 'Region',
    icon: IconTimezone,
    type: 'select',
    selectOptions: MARKET_REGION_OPTIONS.map((region) => ({
      value: region.value,
      label: region.label,
    })),
  },
  {
    filterKey: 'registration_number',
    label: 'Registration Number',
    icon: IconNumber,
    type: 'text',
  },
  {
    filterKey: 'specialization',
    label: 'Specialization',
    icon: IconAlignBoxBottomLeftFilled,
    type: 'select',
    selectOptions: MARKET_SPECIALIZATION_OPTIONS.map((specialization) => ({
      value: specialization.value,
      label: specialization.label,
    })),
  },
  {
    filterKey: 'type',
    label: 'Type',
    icon: IconBuilding,
    type: 'select',
    selectOptions: MARKET_TYPE_OPTIONS.map((type) => ({
      value: type.value,
      label: type.label,
    })),
  },
  {
    filterKey: 'ownership_chart_received',
    label: 'Ownership Chart Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'ownership_chart_sent',
    label: 'Ownership Chart Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'tob_received',
    label: 'Tob Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'tob_sent',
    label: 'Tob Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'audited_financial_reports_received',
    label: 'AFRs Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'audited_financial_reports_sent',
    label: 'AFRs Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'business_license_received',
    label: 'Business License Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'business_license_sent',
    label: 'Business License Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'business_partner_questionnaire_received',
    label: 'BPQR Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'business_partner_questionnaire_sent',
    label: 'BPQR Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'certificate_of_incorporation_received',
    label: 'COI Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'certificate_of_incorporation_sent',
    label: 'COI Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'compliance_policies_received',
    label: 'Compliance Policies Received',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
  {
    filterKey: 'compliance_policies_sent',
    label: 'Compliance Policies Sent',
    icon: IconToggleRightFilled,
    type: 'boolean',
  },
];

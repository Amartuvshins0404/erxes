import { useQuery } from '@apollo/client';
import { Input, Select } from 'erxes-ui';
import {
  BookingFilters,
  BookingStatus,
  AttendanceStatus,
} from '../types/booking';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { ONE_FIT_ACTIVITY_TYPES } from '~/modules/activity-type/graphql/activityTypeQueries';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';

interface BookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
}

export const BookingFiltersComponent = ({
  filters,
  onFiltersChange,
}: BookingFiltersProps) => {
  const handleFilterChange = (key: keyof BookingFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const { data: activityTypesData } = useQuery(ONE_FIT_ACTIVITY_TYPES, {
    variables: {
      isActive: true,
      providerId: filters.providerId || undefined,
    },
  });
  const activityTypes = activityTypesData?.oneFitActivityTypes?.list ?? [];

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="User">
        <SelectOneFitCustomer
          value={filters.userId || ''}
          onValueChange={(value) =>
            handleFilterChange('userId', value as string)
          }
        />
      </FilterField>
      <FilterField label="Provider">
        <SelectProviderSearchable
          value={filters.providerId || ''}
          onValueChange={(value) => handleFilterChange('providerId', value)}
        />
      </FilterField>
      <FilterField label="Booking ID" optional>
        <Input
          placeholder="Search by booking ID"
          value={filters.bookingId ?? ''}
          onChange={(e) =>
            handleFilterChange(
              'bookingId',
              e.target.value.trim() || undefined,
            )
          }
        />
      </FilterField>
      <FilterField label="Activity Type">
        <Select
          value={filters.activityTypeId || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'activityTypeId',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All activity types" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All activity types</Select.Item>
            {activityTypes.map((at) => (
              <Select.Item key={at._id} value={at._id}>
                {getLocalizedString(at.name)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Status">
        <Select
          value={filters.status || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'status',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All statuses" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All statuses</Select.Item>
            <Select.Item value={BookingStatus.CONFIRMED}>Confirmed</Select.Item>
            <Select.Item value={BookingStatus.CANCELLED}>Cancelled</Select.Item>
            <Select.Item value={BookingStatus.COMPLETED}>Completed</Select.Item>
            <Select.Item value={BookingStatus.NO_SHOW}>No Show</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Attendance Status">
        <Select
          value={filters.attendanceStatus || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'attendanceStatus',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All attendance statuses" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All attendance statuses</Select.Item>
            <Select.Item value={AttendanceStatus.PENDING}>Pending</Select.Item>
            <Select.Item value={AttendanceStatus.ATTENDED}>
              Attended
            </Select.Item>
            <Select.Item value={AttendanceStatus.NO_SHOW}>No Show</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Booking Date">
        <Input
          type="date"
          value={
            filters.bookingDate
              ? new Date(filters.bookingDate).toISOString().split('T')[0]
              : ''
          }
          onChange={(e) =>
            handleFilterChange(
              'bookingDate',
              e.target.value ? new Date(e.target.value) : undefined,
            )
          }
        />
      </FilterField>
    </OneFitFilterBase>
  );
};

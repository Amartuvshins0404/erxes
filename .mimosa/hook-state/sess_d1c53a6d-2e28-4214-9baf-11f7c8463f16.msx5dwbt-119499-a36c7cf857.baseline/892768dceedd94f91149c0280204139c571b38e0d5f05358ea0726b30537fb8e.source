import { Input, PageSubHeader } from 'erxes-ui';
import { STATUS_TYPES } from '../constants/listing';

export interface ListingFilterValue {
  status?: string;
  searchValue?: string;
}

const STATUS_TABS = [
  { label: 'All', value: '' },
  ...STATUS_TYPES.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  })),
] as const;

type Props = {
  filter: ListingFilterValue;
  onFilterChange: (filter: ListingFilterValue) => void;
};

export const ListingFilter = ({ filter, onFilterChange }: Props) => {
  const handleStatusChange = (status: string) =>
    onFilterChange({ ...filter, status: status || undefined });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onFilterChange({ ...filter, searchValue: e.target.value || undefined });

  return (
    <PageSubHeader>
      <div className="flex items-center gap-4 px-4 py-2 w-full">
        <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
          {STATUS_TABS.map(({ label, value }) => {
            const isActive = (filter.status ?? '') === value;
            return (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-accent-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Input
          placeholder="Search listings..."
          value={filter.searchValue ?? ''}
          onChange={handleSearchChange}
          className="max-w-xs h-8"
        />
      </div>
    </PageSubHeader>
  );
};

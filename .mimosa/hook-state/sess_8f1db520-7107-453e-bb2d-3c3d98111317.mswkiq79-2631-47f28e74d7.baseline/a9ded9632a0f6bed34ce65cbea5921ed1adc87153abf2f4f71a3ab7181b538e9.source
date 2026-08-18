import { cn } from 'erxes-ui';
import { useGetUnits } from '../hooks/useGetUnits';
import { useGetUnitStatusCounts } from '../hooks/useGetUnitStatusCounts';
import { BlockUnitStatus } from '../types/unit';

type StatusFilter = BlockUnitStatus | 'all';

const PILLS: {
  key: StatusFilter;
  label: string;
  color: string;
  active: string;
}[] = [
  {
    key: 'all',
    label: 'All',
    color: 'text-foreground',
    active: 'bg-foreground text-background',
  },
  {
    key: 'vacant',
    label: 'Vacant',
    color: 'text-green-600',
    active: 'bg-green-600 text-white',
  },
  {
    key: 'reserved',
    label: 'Reserved',
    color: 'text-amber-500',
    active: 'bg-amber-500 text-white',
  },
  {
    key: 'leased',
    label: 'Leased',
    color: 'text-purple-500',
    active: 'bg-purple-500 text-white',
  },
];

type Props = {
  activeStatus: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
};

export const UnitKPI = ({ activeStatus, onStatusChange }: Props) => {
  const { totalCount } = useGetUnits();
  const { counts } = useGetUnitStatusCounts();

  const values: Record<StatusFilter, number> = {
    all: totalCount,
    vacant: counts?.vacant ?? 0,
    reserved: counts?.reserved ?? 0,
    leased: counts?.leased ?? 0,
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b flex-wrap">
      {PILLS.map(({ key, label, color, active }) => {
        const isActive = activeStatus === key;
        return (
          <button
            key={key}
            onClick={() => onStatusChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
              isActive
                ? active + ' border-transparent'
                : 'border-border bg-background hover:bg-accent ' + color,
            )}
          >
            {label}
            <span
              className={cn(
                'text-xs font-semibold tabular-nums min-w-5 text-center',
                isActive ? 'opacity-90' : 'opacity-70',
              )}
            >
              {values[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

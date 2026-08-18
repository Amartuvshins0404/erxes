import {
  IconArrowsSort,
  IconBarcode,
  IconCalendar,
  IconHash,
  IconPencil,
  IconNotes,
  IconTrash,
} from '@tabler/icons-react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import {
  Button,
  Combobox,
  Command,
  Popover,
  RecordTable,
  RecordTableInlineCell,
  TextOverflowTooltip,
  useConfirm,
} from 'erxes-ui';
import { Can } from 'ui-modules';

import { getCarDisplayName } from '~/lib/car';
import { useCarMutations } from '~/hooks/useCarMutations';
import { ICar } from '~/types/car';

type Translate = (
  key: string,
  options: { defaultValue: string } & Record<string, unknown>,
) => string;

const SortableHead = ({
  label,
  icon: Icon,
  isActive,
  sortDirection,
  onClick,
}: {
  label: string;
  icon: typeof IconHash;
  isActive: boolean;
  sortDirection?: number | null;
  onClick: () => void;
}) => {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto px-0 text-xs font-mono uppercase tracking-wide text-accent-foreground hover:bg-transparent hover:text-primary"
      onClick={onClick}
    >
      <RecordTable.InlineHead icon={Icon} label={label} />
      <IconArrowsSort
        className={`size-3.5 transition ${
          isActive
            ? 'text-primary opacity-100'
            : 'text-muted-foreground opacity-60'
        } ${isActive && sortDirection === -1 ? 'rotate-180' : ''}`}
      />
    </Button>
  );
};

const CarsMoreCell = ({
  cell,
  onEditCar,
  t,
}: CellContext<ICar, unknown> & {
  onEditCar: (car: ICar) => void;
  t: Translate;
}) => {
  const car = cell.row.original;
  const { carsRemove, loading } = useCarMutations();
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    await confirm({
      message: t('Delete {{name}}?', {
        name: getCarDisplayName(car, t),
        defaultValue: 'Delete {{name}}?',
      }),
      options: {
        okLabel: t('Delete', { defaultValue: 'Delete' }),
        description: t('This permanently removes the car record.', {
          defaultValue: 'This permanently removes the car record.',
        }),
      },
    });

    await carsRemove({
      variables: {
        carIds: [car._id],
      },
    });
  };

  return (
    <Popover>
      <Can action="manageCars">
        <Popover.Trigger asChild>
          <RecordTable.MoreButton className="h-full w-full" />
        </Popover.Trigger>
      </Can>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.List>
            <Command.Item value="edit" onSelect={() => onEditCar(car)}>
              <IconPencil className="size-4" />
              {t('Edit', { defaultValue: 'Edit' })}
            </Command.Item>
            <Command.Item
              value="delete"
              onSelect={handleDelete}
              disabled={loading}
            >
              <IconTrash className="size-4" />
              {t('Delete', { defaultValue: 'Delete' })}
            </Command.Item>
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const createCarsColumns = ({
  sortField,
  sortDirection,
  onSort,
  onEditCar,
  t,
}: {
  sortField: string | null;
  sortDirection: number | null;
  onSort: (field: string) => void;
  onEditCar: (car: ICar) => void;
  t: Translate;
}): ColumnDef<ICar>[] => [
  {
    id: 'more',
    header: () => <RecordTable.ColumnSelector />,
    cell: (props) => <CarsMoreCell {...props} onEditCar={onEditCar} t={t} />,
    size: 33,
  },
  RecordTable.checkboxColumn as ColumnDef<ICar>,
  {
    id: 'plateNumber',
    accessorKey: 'plateNumber',
    header: () => (
      <SortableHead
        label={t('Plate Number', { defaultValue: 'Plate Number' })}
        icon={IconHash}
        isActive={sortField === 'plateNumber'}
        sortDirection={sortDirection}
        onClick={() => onSort('plateNumber')}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={(cell.getValue() as string) || '—'} />
      </RecordTableInlineCell>
    ),
    size: 180,
  },
  {
    id: 'vinNumber',
    accessorKey: 'vinNumber',
    header: () => (
      <SortableHead
        label={t('VIN', { defaultValue: 'VIN' })}
        icon={IconBarcode}
        isActive={sortField === 'vinNumber'}
        sortDirection={sortDirection}
        onClick={() => onSort('vinNumber')}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={(cell.getValue() as string) || '—'} />
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'vintageYear',
    accessorKey: 'vintageYear',
    header: () => (
      <SortableHead
        label={t('Vintage Year', { defaultValue: 'Vintage Year' })}
        icon={IconCalendar}
        isActive={sortField === 'vintageYear'}
        sortDirection={sortDirection}
        onClick={() => onSort('vintageYear')}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as number) || '—'}
      </RecordTableInlineCell>
    ),
    size: 140,
  },
  {
    id: 'importYear',
    accessorKey: 'importYear',
    header: () => (
      <SortableHead
        label={t('Import Year', { defaultValue: 'Import Year' })}
        icon={IconCalendar}
        isActive={sortField === 'importYear'}
        sortDirection={sortDirection}
        onClick={() => onSort('importYear')}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as number) || '—'}
      </RecordTableInlineCell>
    ),
    size: 140,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: () => (
      <SortableHead
        label={t('Description', { defaultValue: 'Description' })}
        icon={IconNotes}
        isActive={sortField === 'description'}
        sortDirection={sortDirection}
        onClick={() => onSort('description')}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={(cell.getValue() as string) || '—'} />
      </RecordTableInlineCell>
    ),
    size: 320,
  },
];

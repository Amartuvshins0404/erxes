import { IZoning } from '@/building/types/buildingTypes';
import { AddUnitsMultiple } from '@/unit/components/AddMultipleUnits';
import { BLOCK_GET_UNITS } from '@/unit/graphql/unitQueries';
import { useUnitRemove } from '@/unit/hooks/useUnitRemove';
import { useUnits } from '@/unit/hooks/useUnits';
import { useUnitUpdate } from '@/unit/hooks/useUnitUpdate';
import { IUnit } from '@/unit/types/unitType';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Spinner,
  useConfirm,
  useQueryState,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useUnitsContext } from '../context/unitsContext';
import { AddUnitSheet } from './AddUnit';
import { SelectUnitType } from './SelectUnitType';

export const UnitsList = ({
  zone,
  setUnitsCount,
}: {
  zone: IZoning;
  setUnitsCount: (count: number) => void;
}) => {
  const { units, loading } = useUnits({
    variables: { zoning: zone._id },
  });

  useEffect(() => {
    if (units?.length) {
      setUnitsCount(units?.length || 0);
    }
  }, [setUnitsCount, units]);

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  return <UnitsContent zone={zone} units={units} />;
};

const UnitsContent = ({
  zone,
  units = [],
}: {
  zone: IZoning;
  units?: IUnit[];
}) => {
  const { selected, toggleAll } = useUnitsContext();

  const sortedUnits = [...units].sort((a, b) =>
    a.number.localeCompare(b.number),
  );

  const unitIds = units.map((u) => u._id);
  const allSelected = !!unitIds.length && unitIds.every((id) => selected[id]);
  const someSelected = !!unitIds.length && unitIds.some((id) => selected[id]);

  return (
    <>
      <div className="grid gap-3 grid-cols-5 [&>span]:whitespace-nowrap min-w-[56rem]">
        <div className="flex gap-3 col-span-2">
          <Checkbox
            checked={allSelected || (someSelected && 'indeterminate')}
            onCheckedChange={(checked) => toggleAll(unitIds, Boolean(checked))}
            aria-label="Select all rows"
          />
          <Label asChild>
            <span>Дугаар</span>
          </Label>
        </div>
        <Label asChild>
          <span className="col-span-3">Unit type</span>
        </Label>
      </div>
      {sortedUnits?.map((unit) => (
        <UnitsListItem key={unit._id} unit={unit} zone={zone} />
      ))}
      <div className="grid grid-cols-2 gap-4">
        <AddUnitSheet zone={zone} units={sortedUnits} />
        <AddUnitsMultiple zone={zone} />
      </div>
    </>
  );
};

export const UnitsListItem = ({
  unit,
  zone,
}: {
  unit: IUnit;
  zone: IZoning;
}) => {
  const { number, type } = unit || {};
  const [unitNumber, setUnitNumber] = useState(number);
  const { updateUnit } = useUnitUpdate({ id: unit._id, zoning: zone._id });

  const { selected, toggleOne } = useUnitsContext();

  return (
    <div className="grid gap-3 grid-cols-5">
      <div className="flex items-center gap-3 col-span-2">
        <Checkbox
          checked={!!selected[unit._id]}
          onCheckedChange={(value) => toggleOne(unit._id, Boolean(value))}
          aria-label="Select rows"
        />
        <Input
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          onBlur={() =>
            unitNumber !== unit.number && updateUnit({ number: unitNumber })
          }
        />
      </div>
      <div className="flex items-center gap-3 col-span-3">
        <SelectUnitType
          value={type || ''}
          onValueChange={(value) => updateUnit({ type: value })}
        />
        <UnitListItemEdit unit={unit} />
      </div>
    </div>
  );
};

export const UnitListItemRemove = ({
  unit,
  zone,
}: {
  unit: IUnit;
  zone: IZoning;
}) => {
  const { removeUnit } = useUnitRemove();
  const { confirm } = useConfirm();
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() =>
        confirm({
          message: `Are you sure you want to remove '${unit.number}'`,
          options: { confirmationValue: '' },
        }).then(() =>
          removeUnit({
            variables: { id: unit._id },
            refetchQueries: [
              { query: BLOCK_GET_UNITS, variables: { zoning: zone._id } },
            ],
          }),
        )
      }
      className="text-destructive bg-destructive/10 hover:bg-destructive/20"
    >
      <IconTrash />
    </Button>
  );
};

export const UnitListItemEdit = ({ unit }: { unit: IUnit }) => {
  const [, setUnitId] = useQueryState('unitId');
  return (
    <Button variant="secondary" size="icon" onClick={() => setUnitId(unit._id)}>
      <IconPencil />
    </Button>
  );
};

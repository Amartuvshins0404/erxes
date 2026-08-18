import { IZoning } from '@/building/types/buildingTypes';
import { useUnits } from '@/unit/hooks/useUnits';
import { IUnit } from '@/unit/types/unitType';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { Badge, Button, Input, Label, Spinner } from 'erxes-ui';
import { useEffect, useMemo } from 'react';
import { useAgencies } from '../../agencies/hooks/useAgencies';
import { useUnitUpdate } from '../hooks/useUnitUpdate';
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
  const { agencies } = useAgencies();

  const agencyMap = useMemo(
    () =>
      Object.fromEntries(
        (agencies || [])
          .filter((a): a is typeof a & { entityId: string } =>
            Boolean(a.entityId),
          )
          .map((a) => [a.entityId, a.brandName || a.name]),
      ),
    [agencies],
  );

  useEffect(() => {
    if (units?.length) {
      setUnitsCount(units?.length || 0);
    }
  }, [setUnitsCount, units]);

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  const sortedUnits = units
    ? [...units].sort((a, b) => a.number.localeCompare(b.number))
    : undefined;

  return (
    <>
      <div className="flex gap-3 min-w-[40rem]">
        <div className="w-1/4">
          <Label>Дугаар</Label>
        </div>
        <div className="w-2/4">
          <Label>Unit type</Label>
        </div>
        <div className="w-1/4">
          <Label>Agency</Label>
        </div>
      </div>
      {sortedUnits?.map((unit) => (
        <UnitsListItem
          key={unit._id}
          unit={unit}
          zone={zone}
          agencyName={agencyMap[unit.agencyEntityId || '']}
        />
      ))}
    </>
  );
};

export const UnitsListItem = ({
  unit,
  zone,
  agencyName,
}: {
  unit: IUnit;
  zone: IZoning;
  agencyName?: string;
}) => {
  return (
    <div className="flex gap-3 items-center min-w-[40rem]">
      <div className="w-1/4">
        <Input value={unit.number} />
      </div>
      <div className="w-2/4 flex items-center gap-3">
        <SelectUnitType value={unit.type || ''} />
        <UnitListItemEdit unit={unit} zone={zone} />
      </div>
      <div className="w-1/4 flex items-center gap-2">
        {unit.agencyEntityId ? (
          <>
            <Badge variant="success">Assigned</Badge>
            <span className="text-sm font-medium truncate">{agencyName}</span>
          </>
        ) : (
          <Badge variant="secondary">Unassigned</Badge>
        )}
      </div>
    </div>
  );
};

export const UnitListItemEdit = ({
  unit,
  zone,
}: {
  unit: IUnit;
  zone: IZoning;
}) => {
  const { updateUnit } = useUnitUpdate({ id: unit._id, zoning: zone._id });

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => updateUnit({ isFeatured: !unit.isFeatured })}
    >
      {unit.isFeatured ? <IconStarFilled /> : <IconStar />}
    </Button>
  );
};

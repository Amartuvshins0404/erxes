import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { IUnitType } from '@/unit/types/unitType';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Button, CurrencyField, Empty, Label, Sheet, Spinner } from 'erxes-ui';
import { useState } from 'react';
import { SelectTenureType } from './SelectTenureType';
import { SelectUsageType } from './SelectUsageType';
import { UpdateUnitType } from './UpdateUnitType';
import { useParams } from 'react-router-dom';
import { useUnitTypeRemove } from '../hooks/useUnitTypeRemove';

export const UnitTypesList = () => {
  const { id } = useParams();
  const { unitTypes, loading } = useUnitTypes({ project: id || '' });

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  if (!unitTypes || unitTypes.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Title>No unit types found</Empty.Title>
          <Empty.Description>
            There seems to be no unit types.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <>
      <div className="gap-3 grid grid-cols-6 min-w-[56rem] [&>span]:whitespace-nowrap">
        <Label asChild className="col-span-1">
          <span>Name</span>
        </Label>
        <Label asChild className="col-span-1">
          <span>Type</span>
        </Label>
        <Label asChild className="col-span-1">
          <span>Tenure Type</span>
        </Label>
        <Label asChild className="col-span-1">
          <span>Size</span>
        </Label>
        <Label asChild className="col-span-1">
          <span>Price</span>
        </Label>
        <Label asChild className="col-span-1">
          <span>Actions</span>
        </Label>
      </div>
      <div className="flex flex-col gap-2">
        {unitTypes?.map((unitType) => (
          <UnitTypesListItem key={unitType._id} unitType={unitType} />
        ))}
      </div>
    </>
  );
};

const UnitTypesListItem = ({ unitType }: { unitType: IUnitType }) => {
  return (
    <div className="items-center gap-3 grid grid-cols-6">
      <div className="col-span-1 font-medium text-sm">{unitType.name}</div>
      <div className="col-span-1">
        <SelectUsageType value={unitType.type} readOnly />
      </div>
      <div className="col-span-1">
        <SelectTenureType
          value={{
            areaType: unitType.areaType,
            tenureTypes: unitType.tenureTypes,
          }}
          readOnly
        />
      </div>
      <div className="col-span-1">
        <CurrencyField.ValueInput value={unitType.size} disabled />
      </div>
      <div className="col-span-1">
        <CurrencyField.ValueInput value={unitType.price} disabled />
      </div>
      <div className="flex items-center gap-2 col-span-1">
        <UnitTypeListItemEdit unitType={unitType} />
        <UnitTypeListItemRemove unitTypeId={unitType._id} />
      </div>
    </div>
  );
};

const UnitTypeListItemEdit = ({ unitType }: { unitType: IUnitType }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary" size="icon">
          <IconPencil className="size-4" />
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="blk:md:w-[calc(100vw-(--spacing(4)))] blk:sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Edit unit type</Sheet.Title>
          <Sheet.Close tabIndex={-1} />
        </Sheet.Header>
        {open && (
          <UpdateUnitType unitType={unitType} onClose={() => setOpen(false)} />
        )}
      </Sheet.View>
    </Sheet>
  );
};

const UnitTypeListItemRemove = ({ unitTypeId }: { unitTypeId: string }) => {
  const { removeUnitType } = useUnitTypeRemove();

  return (
    <Button
      variant="secondary"
      size="icon"
      className="bg-destructive/10 hover:bg-destructive/20 size-8 text-destructive"
      onClick={() => removeUnitType(unitTypeId)}
    >
      <IconTrash className="size-4" />
    </Button>
  );
};

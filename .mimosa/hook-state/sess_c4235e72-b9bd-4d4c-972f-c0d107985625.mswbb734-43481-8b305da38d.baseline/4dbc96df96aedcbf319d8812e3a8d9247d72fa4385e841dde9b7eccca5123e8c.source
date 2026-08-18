import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { IUnitType } from '@/unit/types/unitType';
import { CurrencyField, Empty, Label, Spinner } from 'erxes-ui';
import { useParams } from 'react-router-dom';
import { SelectTenureType, SelectTenureTypes } from './SelectTenureType';
import { SelectUsageType } from './SelectUsageType';

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
      <div className="grid gap-3 grid-cols-5 [&>span]:whitespace-nowrap min-w-[56rem]">
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
      </div>
      <div className="flex flex-col gap-2">
        {unitTypes?.map((unitType: IUnitType) => (
          <UnitTypesListItem key={unitType._id} unitType={unitType} />
        ))}
      </div>
    </>
  );
};

const UnitTypesListItem = ({ unitType }: { unitType: IUnitType }) => {
  return (
    <div className="grid gap-3 grid-cols-5 items-center">
      <div className="col-span-1 text-sm font-medium">{unitType.name}</div>
      <div className="col-span-1">
        <SelectUsageType value={unitType.type} readOnly />
      </div>
      <div className="col-span-1">
        <SelectTenureTypes value={{areaType: unitType.areaType, tenureTypes: unitType.tenureTypes}} />
      </div>
      <div className="col-span-1">
        <CurrencyField.ValueInput value={unitType.size} disabled />
      </div>
      <div className="col-span-1">
        <CurrencyField.ValueInput value={unitType.price} disabled />
      </div>
    </div>
  );
};

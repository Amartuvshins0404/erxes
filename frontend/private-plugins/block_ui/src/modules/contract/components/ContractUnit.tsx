import { useUnit } from '@/unit/hooks/useUnit';
import { InfoCard, Label, useQueryState } from 'erxes-ui';

export const ContractUnit = ({ unitId: unitIdProp }: { unitId?: string } = {}) => {
  const [unitIdFromState] = useQueryState<string>('unitId');
  const unitId = unitIdProp || unitIdFromState;
  const { unit } = useUnit(unitId || '');

  if (!unitId || !unit) {
    return null;
  }

  const size = unit.unitType?.size;
  const price = unit.unitType?.price;
  const totalPrice =
    size != null && price != null ? size * Number(price) : null;
  const buildingName = unit.buildingData?.name;
  const currency =
    unit.zoningData?.priceList?.[0]?.currency || 'MNT';

  return (
    <InfoCard title="Unit Details">
      <InfoCard.Content>
        <div className="grid grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Unit number</Label>
            <div className="font-medium">{unit.number}</div>
          </div>
          <div className="space-y-2">
            <Label>Area</Label>
            <div className="font-medium">
              {size != null ? `${size}m²` : '-'}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Price/m²</Label>
            <div className="font-medium">
              {price != null
                ? `${Number(price).toLocaleString()} ${currency}`
                : '-'}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Total price</Label>
            <div className="font-medium">
              {totalPrice != null
                ? `${totalPrice.toLocaleString()} ${currency}`
                : '-'}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Building</Label>
            <div className="font-medium">{buildingName || '-'}</div>
          </div>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};

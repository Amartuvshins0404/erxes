import { useUnit } from '@/unit/hooks/useUnit';
import {
  CurrencyFormatedDisplay,
  InfoCard,
  Label,
  useQueryState,
} from 'erxes-ui';

export const ContractUnit = () => {
  const [unitId] = useQueryState<string>('unitId');
  const { unit } = useUnit(unitId || '');

  if (!unitId || !unit) {
    return null;
  }

  return (
    <div className="p-5 pb-0">
      <InfoCard title="Unit Details">
        <InfoCard.Content>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unit number</Label>
              <div className="font-medium">{unit.number}</div>
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <div className="font-medium">{unit.size}</div>
            </div>
            <div className="space-y-2">
              <Label>Total price</Label>
              <div className="font-medium">
                <CurrencyFormatedDisplay
                  currencyValue={{
                    amountMicros: unit.size * unit.mainPrice,
                    currencyCode: unit.currency,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Building</Label>
              <div className="font-medium">{unit.building}</div>
            </div>
          </div>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

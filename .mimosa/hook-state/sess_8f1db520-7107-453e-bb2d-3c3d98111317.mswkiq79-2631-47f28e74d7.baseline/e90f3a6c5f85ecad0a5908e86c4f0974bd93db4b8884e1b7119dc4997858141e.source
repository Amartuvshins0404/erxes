import { InfoCard, Label, useQueryState } from 'erxes-ui';
import { IUnitType } from '../types/unitType';
import { UNIT_AREA_TYPE, UNIT_USAGE_TYPE } from '@/unit/constants/unit';

export const UnitTypeSummary = ({ unitType }: { unitType?: IUnitType }) => {
  const [, setActiveTab] = useQueryState('activeTab');

  const tenureLabel = [
    unitType?.areaType
      ? UNIT_AREA_TYPE[unitType.areaType as keyof typeof UNIT_AREA_TYPE]?.mn
      : null,
    ...(unitType?.tenureTypes || []).map(
      (t) => UNIT_AREA_TYPE[t as keyof typeof UNIT_AREA_TYPE]?.mn,
    ),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <InfoCard title="Unit Type">
      <InfoCard.Content>
        <div className="gap-4 grid grid-cols-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <div className="font-medium">{unitType?.name || '—'}</div>
          </div>
          <div className="space-y-2">
            <Label>Total room</Label>
            <div className="font-medium">{unitType?.roomsCount ?? '—'}</div>
          </div>
          <div className="space-y-2">
            <Label>Size</Label>
            <div className="font-medium">{unitType?.size != null ? `${unitType.size} m²` : '—'}</div>
          </div>
          <div className="space-y-2">
            <Label>Price per m²</Label>
            <div className="font-medium">{unitType?.price != null ? unitType.price.toLocaleString() : '—'}</div>
          </div>
          <div className="space-y-2">
            <Label>Tenure Type</Label>
            <div className="font-medium">{tenureLabel || '—'}</div>
          </div>
          <div className="space-y-2">
            <Label>Usage Type</Label>
            <div className="font-medium">
              {unitType?.type ? UNIT_USAGE_TYPE[unitType.type]?.mn || unitType.type : '—'}
            </div>
          </div>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};

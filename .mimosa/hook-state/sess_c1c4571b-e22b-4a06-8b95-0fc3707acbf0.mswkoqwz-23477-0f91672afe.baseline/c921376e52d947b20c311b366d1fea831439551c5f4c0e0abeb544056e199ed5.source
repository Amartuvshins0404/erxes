import { readImage } from 'erxes-ui';
import { IUnit, IUnitType } from '@/unit/types/unitType';
import { UNIT_SALE_STATUS, UNIT_AREA_TYPE, UNIT_USAGE_TYPE } from '@/unit/constants/unit';
import { UnitTransferSection } from './UnitTransferSection';

const Field = ({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: boolean }) => (
  <div className="flex flex-col gap-1 min-w-0 shrink-0">
    <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    <span className={`text-sm font-medium whitespace-nowrap ${highlight ? 'text-primary' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

const Divider = () => <div className="h-8 w-px bg-border shrink-0" />;

export const UnitDetailHeader = ({
  unit,
  unitType,
}: {
  unit?: IUnit | null;
  unitType?: IUnitType;
}) => {
  const status = unit?.status ?? 'available';
  const statusConfig = UNIT_SALE_STATUS[status as keyof typeof UNIT_SALE_STATUS];

  const totalPrice =
    unitType?.size != null && unitType?.price != null
      ? (unitType.size * unitType.price).toLocaleString()
      : null;

  const tenureLabel = [
    unitType?.areaType ? UNIT_AREA_TYPE[unitType.areaType as keyof typeof UNIT_AREA_TYPE]?.en : null,
    ...(unitType?.tenureTypes ?? []).map((t) => UNIT_AREA_TYPE[t as keyof typeof UNIT_AREA_TYPE]?.en),
  ].filter(Boolean).join(', ') || '—';

  const usageLabel = unitType?.type
    ? UNIT_USAGE_TYPE[unitType.type]?.en ?? unitType.type
    : '—';

  const planImage = unitType?.planImages?.[0];

  return (
    <div className="p-5 flex flex-col gap-4 border-b">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-bold truncate">Unit {unit?.number ?? '—'}</h2>
          {statusConfig && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full border shrink-0"
              style={{
                color: statusConfig.color === 'var(--border)' ? 'hsl(var(--muted-foreground))' : statusConfig.color,
                borderColor: statusConfig.color === 'var(--border)' ? 'hsl(var(--border))' : `${statusConfig.color}40`,
                backgroundColor: statusConfig.color === 'var(--border)' ? 'transparent' : `${statusConfig.color}15`,
              }}
            >
              {statusConfig.en}
            </span>
          )}
        </div>
        {unit?._id && (
          <div className="shrink-0">
            <UnitTransferSection
              unitId={unit._id}
              agencyEntityId={unit.agencyEntityId}
              agencySubdomain={unit.agencySubdomain}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 overflow-x-auto pb-1">
        <Field label="Unit Type" value={unitType?.name} />
        <Divider />
        <Field label="Total Room" value={unitType?.roomsCount} />
        <Divider />
        <Field label="Size" value={unitType?.size != null ? `${unitType.size} m²` : null} />
        <Divider />
        <Field label="Price per m²" value={unitType?.price?.toLocaleString()} />
        <Divider />
        <Field label="Total Price" value={totalPrice} highlight />
        <Divider />
        <Field label="Usage Type" value={usageLabel} />
        <Divider />
        <Field label="Tenure Type" value={tenureLabel} />
        {planImage && (
          <>
            <Divider />
            <div className="shrink-0 ml-auto">
              <img
                src={readImage(planImage)}
                alt="Floor plan"
                className="h-16 w-24 object-contain rounded border bg-muted/30"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import { UNIT_AREA_TYPE, UNIT_MARKET_TYPE } from '@/unit/constants/unit';
import { ActivityLogCustomActivity, ActivityLogs, TActivityLog } from 'ui-modules';

const parseTenureLabel = (value?: string): string => {
  if (!value) return '';
  const [areaType, ...tenureTypes] = value.split(':');
  const areaLabel =
    UNIT_AREA_TYPE[areaType as keyof typeof UNIT_AREA_TYPE]?.mn || areaType;

  if (areaType !== 'common' || !tenureTypes.length) return areaLabel;

  const marketLabels = tenureTypes
    .map(
      (t) =>
        UNIT_MARKET_TYPE[t as keyof typeof UNIT_MARKET_TYPE]?.mn || t,
    )
    .join(', ');

  return `${areaLabel} (${marketLabels})`;
};

const TenureTypeActivityRow = ({ activity }: { activity: TActivityLog }) => {
  const { changes, metadata } = activity;
  const fieldLabel = metadata?.fieldLabel || 'Tenure Type';
  const prevRaw = changes?.prev?.tenureType;
  const currentRaw = changes?.current?.tenureType;

  const prevLabel = prevRaw ? parseTenureLabel(String(prevRaw)) : undefined;
  const currentLabel = currentRaw
    ? parseTenureLabel(String(currentRaw))
    : undefined;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
        <ActivityLogs.ActorName activity={activity} />
        <span className="text-muted-foreground">changed</span>
        <span className="font-medium">{fieldLabel.toLowerCase()}</span>
        {prevLabel !== undefined && (
          <>
            <span className="text-muted-foreground">from</span>
            <span className="font-medium">{prevLabel}</span>
          </>
        )}
        {currentLabel !== undefined && (
          <>
            <span className="text-muted-foreground">to</span>
            <span className="font-medium">{currentLabel}</span>
          </>
        )}
      </div>
    </div>
  );
};

export const tenureTypeActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.tenuretype_changed',
  render: (activity: TActivityLog) => (
    <TenureTypeActivityRow activity={activity} />
  ),
};

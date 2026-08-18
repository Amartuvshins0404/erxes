import { useUnitType } from '@/unit/hooks/useUnitType';
import {
  ActivityLogCustomActivity,
  ActivityLogs,
  TActivityLog,
} from 'ui-modules';

const UnitTypeActivityRow = ({ activity }: { activity: TActivityLog }) => {
  const { changes, metadata } = activity;
  const fieldLabel = metadata?.fieldLabel || 'Unit Type';
  const prevId = changes?.prev?.unitType;
  const currentId = changes?.current?.unitType;

  const { unitType: prevUnitType } = useUnitType(
    prevId ? String(prevId) : null,
  );
  const { unitType: currentUnitType } = useUnitType(
    currentId ? String(currentId) : null,
  );

  const prevName = prevUnitType?.name ?? (prevId ? String(prevId) : undefined);
  const currentName =
    currentUnitType?.name ?? (currentId ? String(currentId) : undefined);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
        <ActivityLogs.ActorName activity={activity} />
        <span className="text-muted-foreground">changed</span>
        <span className="font-medium">{fieldLabel.toLowerCase()}</span>
        {prevName !== undefined && (
          <>
            <span className="text-muted-foreground">from</span>
            <span className="font-medium">{prevName}</span>
          </>
        )}
        {currentName !== undefined && (
          <>
            <span className="text-muted-foreground">to</span>
            <span className="font-medium">{currentName}</span>
          </>
        )}
      </div>
    </div>
  );
};

export const unitTypeActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.unittype_changed',
  render: (activity: TActivityLog) => (
    <UnitTypeActivityRow activity={activity} />
  ),
};

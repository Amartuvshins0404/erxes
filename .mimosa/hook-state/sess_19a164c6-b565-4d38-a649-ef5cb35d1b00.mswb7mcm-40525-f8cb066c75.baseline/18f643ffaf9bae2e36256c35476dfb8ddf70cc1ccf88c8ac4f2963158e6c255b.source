import { useBuilding, useZoning } from '@/building/hooks/useBuildings';
import { useUnit } from '@/unit/hooks/useUnit';
import { ActivityLogCustomActivity, ActivityLogs, TActivityLog } from 'ui-modules';

const BuildingName = ({ buildingId }: { buildingId?: string | null }) => {
  const { building } = useBuilding(buildingId);
  const name = building?.name || buildingId;
  if (!name) return null;
  return <span className="font-medium">{name}</span>;
};

const ZoningName = ({ zoningId }: { zoningId?: string | null }) => {
  const { zoning } = useZoning(zoningId);
  const name = zoning ? `Floor ${zoning.floor}` : zoningId;
  if (!name) return null;
  return <span className="font-medium">{name}</span>;
};

const UnitName = ({ unitId }: { unitId?: string | null }) => {
  const { unit } = useUnit(unitId);
  const name = unit?.name || unit?.number || unitId;
  if (!name) return null;
  return <span className="font-medium">{name}</span>;
};

const BlockSelectedRow = ({ activity }: { activity: TActivityLog }) => {
  const { buildingId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">selected block</span>
      <BuildingName buildingId={buildingId} />
    </div>
  );
};

const BlockRemovedRow = ({ activity }: { activity: TActivityLog }) => {
  const { buildingId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">removed block</span>
      <BuildingName buildingId={buildingId} />
    </div>
  );
};

const ZoneSelectedRow = ({ activity }: { activity: TActivityLog }) => {
  const { buildingId, zoningId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">selected zone</span>
      <ZoningName zoningId={zoningId} />
      <span className="text-muted-foreground">in</span>
      <BuildingName buildingId={buildingId} />
    </div>
  );
};

const ZoneRemovedRow = ({ activity }: { activity: TActivityLog }) => {
  const { buildingId, zoningId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">removed zone</span>
      <ZoningName zoningId={zoningId} />
      <span className="text-muted-foreground">in</span>
      <BuildingName buildingId={buildingId} />
    </div>
  );
};

const UnitAddedRow = ({ activity }: { activity: TActivityLog }) => {
  const { unitId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">added unit</span>
      <UnitName unitId={unitId} />
    </div>
  );
};

const UnitRemovedRow = ({ activity }: { activity: TActivityLog }) => {
  const { unitId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">removed unit</span>
      <UnitName unitId={unitId} />
    </div>
  );
};

const MainUnitSetRow = ({ activity }: { activity: TActivityLog }) => {
  const { unitId, prevUnitId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">chosen main unit</span>
      {prevUnitId && (
        <>
          <span className="text-muted-foreground">from</span>
          <UnitName unitId={prevUnitId} />
        </>
      )}
      {prevUnitId && <span className="text-muted-foreground">to</span>}
      <UnitName unitId={unitId} />
    </div>
  );
};

const MainUnitRemovedRow = ({ activity }: { activity: TActivityLog }) => {
  const { unitId } = activity.metadata ?? {};
  return (
    <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
      <ActivityLogs.ActorName activity={activity} />
      <span className="text-muted-foreground">removed main unit</span>
      <UnitName unitId={unitId} />
    </div>
  );
};

export const blockSelectedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.block_selected',
  render: (activity: TActivityLog) => <BlockSelectedRow activity={activity} />,
};

export const blockRemovedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.block_removed',
  render: (activity: TActivityLog) => <BlockRemovedRow activity={activity} />,
};

export const zoneSelectedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.zone_selected',
  render: (activity: TActivityLog) => <ZoneSelectedRow activity={activity} />,
};

export const zoneRemovedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.zone_removed',
  render: (activity: TActivityLog) => <ZoneRemovedRow activity={activity} />,
};

export const unitAddedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.unit_added',
  render: (activity: TActivityLog) => <UnitAddedRow activity={activity} />,
};

export const unitRemovedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.unit_removed',
  render: (activity: TActivityLog) => <UnitRemovedRow activity={activity} />,
};

export const mainUnitSetActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.main_unit_set',
  render: (activity: TActivityLog) => <MainUnitSetRow activity={activity} />,
};

export const mainUnitRemovedActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.main_unit_removed',
  render: (activity: TActivityLog) => (
    <MainUnitRemovedRow activity={activity} />
  ),
};

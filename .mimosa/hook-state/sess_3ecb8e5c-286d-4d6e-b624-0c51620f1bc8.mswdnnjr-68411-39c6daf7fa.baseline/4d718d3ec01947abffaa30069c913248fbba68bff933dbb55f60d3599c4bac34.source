import { ActivityLogs, AddInternalNote } from 'ui-modules';
import {
  blockSelectedActivityLog,
  blockRemovedActivityLog,
  zoneSelectedActivityLog,
  zoneRemovedActivityLog,
  unitAddedActivityLog,
  unitRemovedActivityLog,
  mainUnitSetActivityLog,
  mainUnitRemovedActivityLog,
} from './activity-status/PropertyRowsActivityLog';
import { statusActivityLog } from './activity-status/StatusActivityLog';
import { tenureTypeActivityLog } from './activity-status/TenureTypeActivityLog';
import { unitTypeActivityLog } from './activity-status/UnitTypeActivityLog';

const customActivities = [
  statusActivityLog,
  unitTypeActivityLog,
  tenureTypeActivityLog,
  blockSelectedActivityLog,
  blockRemovedActivityLog,
  zoneSelectedActivityLog,
  zoneRemovedActivityLog,
  unitAddedActivityLog,
  unitRemovedActivityLog,
  mainUnitSetActivityLog,
  mainUnitRemovedActivityLog,
];

export const OpptyActivityLog = ({ opptyId }: { opptyId: string }) => {
  return (
    <div className="mb-4">
      <ActivityLogs
        targetId={opptyId}
        variant="backward"
        customActivities={customActivities}
      />

      <AddInternalNote contentTypeId={opptyId} contentType="block:oppty" />
    </div>
  );
};

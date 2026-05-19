import { ActivityLogs, AddInternalNote } from 'ui-modules';
import { contractStatusActivityLog } from './activity-status/StatusActivityLog';
import { contractCreatedFromOpptyActivityLog } from './activity-status/CreatedFromOpptyActivityLog';

const customActivities = [
  contractStatusActivityLog,
  contractCreatedFromOpptyActivityLog,
];

export const ContractActivityLog = ({ contractId }: { contractId: string }) => {
  return (
    <div className="mb-4">
      <ActivityLogs
        targetId={contractId}
        variant="backward"
        customActivities={customActivities}
      />
      <AddInternalNote contentTypeId={contractId} contentType="block:contract" />
    </div>
  );
};

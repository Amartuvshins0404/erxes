import {
  ActivityLogInput,
  activityBuilder,
  Config,
} from 'erxes-api-shared/core-modules';

const CONTRACT_ACTIVITY_FIELDS = [
  { field: 'status', label: 'Status' },
  { field: 'amount', label: 'Amount' },
  { field: 'amountType', label: 'Amount Type' },
  { field: 'currency', label: 'Currency' },
  { field: 'date', label: 'Contract Date' },
  { field: 'startDate', label: 'Start Date' },
  { field: 'endDate', label: 'End Date' },
  { field: 'isLifeTime', label: 'Lifetime' },
  { field: 'description', label: 'Description' },
  { field: 'party', label: 'Party' },
  { field: 'unit', label: 'Unit' },
  { field: 'paymentPlan', label: 'Payment Plan' },
  { field: 'user', label: 'Assigned User' },
] as const;

const buildContractTarget = (contract: any) => ({
  _id: contract._id,
  moduleName: 'block',
  collectionName: 'block_contracts',
  text: contract.number || String(contract._id),
});

const getFieldLabel = (field: string): string => {
  const match = CONTRACT_ACTIVITY_FIELDS.find((f) => f.field === field);
  return match?.label || field;
};

const CONTRACT_ACTIVITY_CONFIG: Config<ActivityLogInput> = {
  commonFields: CONTRACT_ACTIVITY_FIELDS.map(({ field }) => field),
  resolvers: {
    status: ({ field, prev, current }, ctx) => {
      if (!field) return [];
      const fieldLabel = getFieldLabel(field);
      return [
        {
          activityType: 'contract.status_changed',
          target: buildContractTarget(ctx.contract),
          action: {
            type: 'contract.status_changed',
            description: `changed ${fieldLabel.toLowerCase()}`,
          },
          changes: { prev: { [field]: prev }, current: { [field]: current } },
          metadata: { field, fieldLabel },
        },
      ];
    },
    $default: ({ field, prev, current }, ctx) => {
      if (!field) return [];
      const fieldLabel = getFieldLabel(field);
      return [
        {
          activityType: 'contract.field_changed',
          target: buildContractTarget(ctx.contract),
          action: {
            type: 'contract.field_changed',
            description: `changed ${fieldLabel.toLowerCase()}`,
          },
          changes: { prev: { [field]: prev }, current: { [field]: current } },
          metadata: { field, fieldLabel },
        },
      ];
    },
  },
  buildTarget: (document) => buildContractTarget(document),
};

export async function generateContractUpdateActivityLogs(
  prevDocument: any,
  currentDocument: any,
  createActivityLog: (
    activities: ActivityLogInput | ActivityLogInput[],
  ) => void,
): Promise<void> {
  try {
    const activities = await activityBuilder(
      prevDocument,
      currentDocument,
      CONTRACT_ACTIVITY_CONFIG,
      { contract: currentDocument },
    );
    if (activities.length > 0) {
      createActivityLog(activities);
    }
  } catch (error) {
    console.error('Failed to generate contract activity logs', error);
  }
}

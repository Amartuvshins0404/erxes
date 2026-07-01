import { useUnitContext } from '@/unit/context/unitContext';
import { useUnitType } from '@/unit/hooks/useUnitType';
import { useUnitUpdate } from '@/unit/hooks/useUnitUpdate';
import { Input, Label, Separator } from 'erxes-ui';
import { SelectUnitType } from './SelectUnitType';
import { UnitTypeSummary } from './UnitTypeSummary';
import { UnitTransferSection } from './UnitTransferSection';
import { UnitStatsSection } from './stats/UnitStatsSection';
import { UnitSignedContractStats } from './stats/UnitSignedContractStats';
import { UnitPaymentPlanChart } from './UnitPaymentPlanChart';
import { UnitPaymentHistoryTable } from './UnitPaymentHistoryTable';
import { UnitPaymentScheduleTable } from './UnitPaymentScheduleTable';
import { UnitPartyDetail } from './UnitPartyDetail';

export const UnitDetailOverview = () => {
  const { unit } = useUnitContext();

  const { number, type, agencyEntityId, agencySubdomain } = unit || {};

  const { unitType } = useUnitType(type);

  const { updateUnit } = useUnitUpdate({ id: unit?._id, zoning: unit?.zoning });

  return (
    <div>
      <div className="grid lg:grid-cols-3 grid-cols-2 blk:gap-x-3 blk:gap-y-5 p-8">
        <div className="space-y-2">
          <Label>Number</Label>
          <Input
            value={number}
            className="font-medium disabled:opacity-100"
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label>Unit Type</Label>
          <SelectUnitType
            value={type || ''}
            onValueChange={(value) => updateUnit({ type: value })}
          />
        </div>
        <UnitTransferSection
          unitId={unit?._id}
          agencyEntityId={agencyEntityId}
          agencySubdomain={agencySubdomain}
        />
      </div>
      <Separator />
      <div className="p-5 flex flex-col gap-4">
        {unit?.activeContract?.statusType === 'signed' && (
          <UnitPartyDetail
            partyId={unit.activeContract.partyId}
            partyType={unit.activeContract.partyType}
          />
        )}
        <UnitTypeSummary unitType={unitType} />
      </div>
      {unit?.activeContract?.statusType !== 'signed' && (
        <>
          <Separator />
          <div className="p-5">
            <UnitStatsSection
              unitId={unit?._id}
              projectId={unit?.projectData?._id ?? undefined}
            />
          </div>
        </>
      )}
      {unit?.activeContract?.statusType === 'signed' && unit._id && (
        <>
          <Separator />
          <div className="p-5 flex flex-col gap-4">
            <UnitSignedContractStats unitId={unit._id} />
            <UnitPaymentPlanChart unitId={unit._id} />
          </div>
          <Separator />
          <div className="p-5">
            <UnitPaymentHistoryTable unitId={unit._id} />
          </div>
          <Separator />
          <div className="p-5">
            <UnitPaymentScheduleTable unitId={unit._id} />
          </div>
        </>
      )}
    </div>
  );
};

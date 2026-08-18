import { useState } from 'react';
import UnitFilter from '~/modules/unit/components/UnitFilter';
import { UnitRecordTable } from '~/modules/unit/components/UnitRecordTable';
import { BlockUnitStatus } from '~/modules/unit/types/unit';

type StatusFilter = BlockUnitStatus | 'all';

export const UnitIndexPage = () => {
  const [status, setStatus] = useState<StatusFilter>('all');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <UnitFilter activeStatus={status} onStatusChange={setStatus} />
      <UnitRecordTable status={status === 'all' ? undefined : status} />
    </div>
  );
};

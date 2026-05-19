import { Badge, BoardCardProps, Button, Separator, Skeleton } from 'erxes-ui';
import { IconCalendarEventFilled } from '@tabler/icons-react';
import { format } from 'date-fns';

import { useAtomValue, atom } from 'jotai';
import { allOpptysMapState } from '@/oppty/states/allOpptysMapState';
import { IOppty } from '@/oppty/types/opptyTypes';
import { MembersInline, useCustomerDetail } from 'ui-modules';
import { useQueryState } from 'erxes-ui';
import { SelectCustomerSource } from '@/oppty/components/SelectCustomerSource';
import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { useUnit } from '@/unit/hooks/useUnit';
import { UNIT_AREA_TYPE, UNIT_MARKET_TYPE } from '@/unit/constants/unit';

export const opptyBoardItemAtom = atom(
  (get) => (id: string) => get(allOpptysMapState)[id],
);

const parseDate = (value: any) => {
  if (!value) return null;
  const num = Number(value);
  return new Date(isNaN(num) ? value : num);
};

export const OpptysBoardCard = ({ id, column }: BoardCardProps) => {
  const oppty = useAtomValue(opptyBoardItemAtom)(id);
  const [, setActiveOpptyId] = useQueryState<string>('activeOpptyId');

  const {
    _id,
    customerId,
    propertyRows,
    assignedUserId,
    createdAt,
    number,
    customerSource,
    startDate,
    targetDate,
    projectId,
    unitType,
    tenureType,
  } = oppty || ({} as Partial<IOppty>);

  const rows = propertyRows || [];

  const { customerDetail, loading: customerLoading } = useCustomerDetail(
    { variables: { _id: customerId }, skip: !customerId },
    true,
  );

  const customerDisplayName = customerDetail
    ? [customerDetail.firstName, customerDetail.lastName]
        .filter(Boolean)
        .join(' ') || customerDetail.primaryPhone || 'Unnamed'
    : '';

  const { unitTypes } = useUnitTypes({ project: projectId || '' });
  const unitTypeName = unitTypes?.find((t) => t._id === unitType)?.name;

  const mainUnitId = rows.find((r) => r.isMain)?.unitId;
  const { unit: mainUnit } = useUnit(mainUnitId);

  const tenureLabel = (() => {
    if (!tenureType) return '';
    const [areaType, ...marketTypes] = tenureType.split(':');
    if (marketTypes.length > 0) {
      return marketTypes
        .map((t) => UNIT_MARKET_TYPE[t as keyof typeof UNIT_MARKET_TYPE]?.mn || t)
        .join(' · ');
    }
    return UNIT_AREA_TYPE[areaType as keyof typeof UNIT_AREA_TYPE]?.mn || areaType;
  })();

  const uniqueBuildings = new Set(rows.map((r) => r.buildingId).filter(Boolean));
  const uniqueZonings = new Set(rows.map((r) => r.zoningId).filter(Boolean));
  const uniqueUnits = new Set(rows.map((r) => r.unitId).filter(Boolean));

  return (
    <div onClick={() => setActiveOpptyId(_id)}>
      <div className="flex flex-col gap-1 p-3">
        {number && (
          <span className="text-accent-foreground text-xs uppercase">
            #{number}
          </span>
        )}
        <div className="flex flex-col gap-1">
          {customerLoading ? (
            <Skeleton className="h-4 w-28 rounded" />
          ) : (
            <h5 className="font-semibold truncate">
              {customerDisplayName}
              {customerSource && (
                <span className="text-accent-foreground font-normal text-xs ml-1">
                  ({SelectCustomerSource.OPTIONS.find((o) => o.value === customerSource)?.label || customerSource})
                </span>
              )}
            </h5>
          )}
        </div>
        {(startDate || targetDate) && (
          <div className="text-accent-foreground text-xs flex items-center gap-1">
            {startDate && parseDate(startDate) && (
              <span>{format(parseDate(startDate) as Date, 'MMM dd')}</span>
            )}
            {startDate && targetDate && <span>-</span>}
            {targetDate && parseDate(targetDate) && (
              <span>{format(parseDate(targetDate) as Date, 'MMM dd')}</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {mainUnit?.number && (
            <Badge>
              {mainUnit.number}
              {mainUnit.unitType?.size != null &&
                ` · ${mainUnit.unitType.size}m²`}
              {mainUnit.unitType?.price != null &&
                ` · ${Number(mainUnit.unitType.price).toLocaleString()}`}
            </Badge>
          )}
          {unitTypeName && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs pointer-events-none"
            >
              {unitTypeName}
            </Button>
          )}
          {tenureLabel && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs pointer-events-none truncate max-w-full"
            >
              <span className="truncate">{tenureLabel}</span>
            </Button>
          )}
          {uniqueBuildings.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs pointer-events-none"
            >
              {uniqueBuildings.size} building{uniqueBuildings.size > 1 ? 's' : ''}
            </Button>
          )}
          {uniqueZonings.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs pointer-events-none"
            >
              {uniqueZonings.size} zone{uniqueZonings.size > 1 ? 's' : ''}
            </Button>
          )}
          {uniqueUnits.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs pointer-events-none"
            >
              {uniqueUnits.size} unit{uniqueUnits.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="h-9 flex items-center justify-between px-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground px-1 hover:bg-background"
        >
          <IconCalendarEventFilled />
          {createdAt && parseDate(createdAt) && (
            <span>{format(parseDate(createdAt) as Date, 'MMM dd, yyyy')}</span>
          )}
        </Button>
        {assignedUserId && (
          <MembersInline.Provider memberIds={[assignedUserId]}>
            <MembersInline.Avatar />
          </MembersInline.Provider>
        )}
      </div>
    </div>
  );
};

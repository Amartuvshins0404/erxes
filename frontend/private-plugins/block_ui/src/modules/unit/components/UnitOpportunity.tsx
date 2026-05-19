import { InfoCard, InfoCardContent } from '@/block/components/card';
import { GET_OPPTYS } from '@/oppty/graphql/queries/getOpptys';
import { opptyWidgetSheetState } from '@/oppty/states/opptyWidgetSheetState';
import { AddOpptyWidgetSheet } from '@/oppty/components/AddOpptyWidgetSheet';
import { IOppty } from '@/oppty/types/opptyTypes';
import { useUnitContext } from '@/unit/context/unitContext';
import { useQuery } from '@apollo/client';
import {
  IconCalendar,
  IconPlus,
  IconUser,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import {
  Badge,
  Button,
  Empty,
  ICursorListResponse,
  Skeleton,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { useSetAtom } from 'jotai';
import { MembersInline, useCustomerDetail } from 'ui-modules';

const parseDate = (value: unknown) => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? (value as string) : num);
  return isNaN(d.getTime()) ? null : d;
};

const OpptyGridCard = ({ oppty }: { oppty: IOppty }) => {
  const [, setActiveOpptyId] = useQueryState<string>('activeOpptyId');
  const { customerDetail, loading: customerLoading } = useCustomerDetail(
    {
      variables: { _id: oppty.customerId },
      skip: !oppty.customerId,
    },
    true,
  );

  const customerName = customerDetail
    ? [customerDetail.firstName, customerDetail.lastName]
        .filter(Boolean)
        .join(' ') ||
      customerDetail.primaryPhone ||
      customerDetail.primaryEmail ||
      'Unnamed'
    : '';

  const startLabel = parseDate(oppty.startDate);
  const targetLabel = parseDate(oppty.targetDate);
  const createdLabel = parseDate(oppty.createdAt);

  return (
    <div
      onClick={() => setActiveOpptyId(oppty._id)}
      className="border rounded-lg bg-background hover:border-primary/40 transition cursor-pointer flex flex-col"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-xs font-mono uppercase text-muted-foreground">
          #{oppty.number || oppty._id.slice(-6)}
        </span>
        {oppty.customerSource && (
          <Badge variant="secondary" className="capitalize">
            {oppty.customerSource.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        )}
      </div>
      <div className="px-4 pt-2 pb-3 flex-1">
        {customerLoading ? (
          <Skeleton className="h-5 w-32 rounded" />
        ) : (
          <h5 className="font-semibold truncate text-base">
            {customerName || 'No customer'}
          </h5>
        )}
        {oppty.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {oppty.description}
          </p>
        )}
      </div>
      <div className="px-4 pb-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
        {(startLabel || targetLabel) && (
          <div className="flex items-center gap-1.5">
            <IconCalendar className="size-3.5 flex-none" />
            <span className="truncate">
              {startLabel ? format(startLabel, 'MMM dd, yyyy') : '—'}
              {' – '}
              {targetLabel ? format(targetLabel, 'MMM dd, yyyy') : '—'}
            </span>
          </div>
        )}
        {createdLabel && (
          <div className="flex items-center gap-1.5">
            <IconCalendar className="size-3.5 flex-none" />
            <span className="truncate">
              Created {format(createdLabel, 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>
      {oppty.assignedUserId && (
        <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
          <IconUser className="size-3.5 flex-none" />
          <MembersInline.Provider memberIds={[oppty.assignedUserId]}>
            <MembersInline.Avatar />
            <MembersInline.Title />
          </MembersInline.Provider>
        </div>
      )}
    </div>
  );
};

export const UnitOpportunity = () => {
  const { unit } = useUnitContext();
  const unitId = unit?._id;
  const projectId = unit?.projectData?._id;
  const setOpen = useSetAtom(opptyWidgetSheetState);

  const hasSignedContract = unit?.activeContract?.statusType === 'signed';
  const canAdd = !hasSignedContract && !unit?.locked;

  const { data, loading } = useQuery<ICursorListResponse<IOppty>>(GET_OPPTYS, {
    variables: {
      projectId,
      filter: {
        unit: unitId,
        cursor: '',
        limit: 50,
        direction: 'forward',
      },
    },
    skip: !projectId || !unitId,
    fetchPolicy: 'cache-and-network',
  });

  const opptys = data?.blockGetOpptys?.list || [];

  return (
    <div className="p-8 flex flex-col gap-3">
      {canAdd && (
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <IconPlus />
            Add opportunity
          </Button>
          <AddOpptyWidgetSheet
            defaultValues={{
              projectId: projectId || '',
              unitRows: [
                {
                  buildingId: unit?.building || '',
                  zoningId: unit?.zoning || '',
                  unitId: unit?._id || '',
                  isMain: true,
                },
              ],
            }}
          />
        </div>
      )}
      <InfoCard title="Opportunities">
        <InfoCardContent>
          {loading ? (
            <Spinner containerClassName="blk:py-16" />
          ) : opptys.length === 0 ? (
            <Empty>
              <Empty.Header>
                <Empty.Title>No opportunities</Empty.Title>
                <Empty.Description>
                  There are no opportunities for this unit yet.
                </Empty.Description>
              </Empty.Header>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opptys.map((oppty) => (
                <OpptyGridCard key={oppty._id} oppty={oppty} />
              ))}
            </div>
          )}
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};

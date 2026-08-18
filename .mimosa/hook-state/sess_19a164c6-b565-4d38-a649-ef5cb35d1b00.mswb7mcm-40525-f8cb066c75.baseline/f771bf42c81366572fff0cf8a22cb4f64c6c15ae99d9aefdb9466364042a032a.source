import { Badge, Card, Separator, Spinner, useQueryState } from 'erxes-ui';
import { IconCalendarEventFilled } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useGetOppty } from '@/oppty/hooks/useGetOppty';
import { MembersInline, useCustomerDetail } from 'ui-modules';

const parseDate = (value: any) => {
  if (!value) return null;
  const num = Number(value);
  return new Date(isNaN(num) ? value : num);
};

export const OpptyWidgetCard = ({ opptyId }: { opptyId: string }) => {
  const { oppty, loading } = useGetOppty({
    variables: { _id: opptyId },
  });

  const { customerDetail } = useCustomerDetail(
    { variables: { _id: oppty?.customerId }, skip: !oppty?.customerId },
    true,
  );

  const [, setActiveOpptyId] = useQueryState<string>('activeOpptyId');

  if (loading) {
    return <Spinner containerClassName="py-10" />;
  }

  if (!oppty) return null;

  const customerName = customerDetail
    ? [customerDetail.firstName, customerDetail.lastName]
        .filter(Boolean)
        .join(' ') || 'Unnamed'
    : '';

  const createdDate = parseDate(oppty.createdAt);

  const handleClick = () => {
    setActiveOpptyId(oppty._id);
  };

  return (
    <Card className="bg-background cursor-pointer" onClick={handleClick}>
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold truncate">
            {customerName || oppty.description}
          </h5>
          {oppty.customerSource && (
            <Badge variant="default" className="capitalize text-xs">
              {oppty.customerSource}
            </Badge>
          )}
        </div>
        {customerName && oppty.description && (
          <p className="text-sm text-muted-foreground truncate">
            {oppty.description}
          </p>
        )}
      </div>
      <Separator />
      <div className="h-9 flex items-center justify-between px-1.5">
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <IconCalendarEventFilled className="size-3.5" />
          {oppty.number && <span className="uppercase">#{oppty.number}</span>}
          {createdDate && (
            <>
              <span className="mx-0.5">·</span>
              {format(createdDate, 'MMM dd, yyyy')}
            </>
          )}
        </div>
        {oppty.assignedUserId && (
          <MembersInline.Provider memberIds={[oppty.assignedUserId]}>
            <MembersInline.Avatar />
          </MembersInline.Provider>
        )}
      </div>
    </Card>
  );
};

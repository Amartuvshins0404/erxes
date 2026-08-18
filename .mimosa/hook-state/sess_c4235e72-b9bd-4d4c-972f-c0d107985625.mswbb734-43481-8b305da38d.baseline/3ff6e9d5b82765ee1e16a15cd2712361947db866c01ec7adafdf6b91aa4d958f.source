import {
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconActivity,
} from '@tabler/icons-react';
import { Button, Separator, Spinner, SideMenu } from 'erxes-ui';
import { OneFitCustomersInline } from './OneFitCustomersInline';
import { OneFitCustomerDetailContent } from './OneFitCustomerDetailContent';
import { useOneFitCustomerDetail } from '../hooks/useOneFitCustomerDetail';

export const OneFitCustomerWidget = ({
  customerIds,
  scope,
}: {
  customerIds: string[];
  scope: string;
}) => {
  return (
    <SideMenu.Content
      value="onefitcustomer"
      className="bg-sidebar data-[state=active]:w-[min(44rem,calc(100vw-4rem))]"
    >
      <OneFitCustomerWidgetHeader />
      <OneFitCustomerWidgetContent customerIds={customerIds} scope={scope} />
    </SideMenu.Content>
  );
};

export const OneFitCustomerWidgetTrigger = () => (
  <SideMenu.Trigger
    value="onefitcustomer"
    label="OneFit Customer"
    Icon={IconActivity}
  />
);

const OneFitCustomerWidgetHeader = () => {
  return <SideMenu.Header label="OneFit Customer" Icon={IconActivity} />;
};

const OneFitCustomerWidgetContent = ({
  customerIds,
  scope,
}: {
  customerIds: string[];
  scope: string;
}) => {
  if (!customerIds || customerIds.length === 0) {
    return <div className="p-4">No OneFit customers found</div>;
  }
  if (customerIds.length === 1) {
    return (
      <OneFitCustomerWidgetDetail customerId={customerIds[0]} scope={scope} />
    );
  }
  return (
    <div className="p-4 space-y-2">
      {customerIds.map((customerId: string) => {
        return (
          <OneFitCustomerWidgetItem
            key={customerId}
            customerId={customerId}
            scope={scope}
          />
        );
      })}
    </div>
  );
};

const OneFitCustomerWidgetItem = ({
  customerId,
  scope,
}: {
  customerId: string;
  scope: string;
}) => {
  const { oneFitCustomer, loading } = useOneFitCustomerDetail({
    variables: {
      _id: customerId,
    },
    skip: !customerId,
  });

  const { primaryEmail, primaryPhone, oneFitCurrentCreditBalance } =
    oneFitCustomer || {};

  if (loading) {
    return (
      <Spinner containerClassName="py-6 bg-background rounded-lg shadow-xs" />
    );
  }

  if (!oneFitCustomer) {
    return null;
  }

  return (
    <OneFitCustomersInline.Provider customers={[oneFitCustomer]}>
      <div className="bg-background rounded-lg shadow-xs">
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <OneFitCustomersInline.Avatar size="xl" />
            <OneFitCustomersInline.Title />
          </div>
          <div className="text-sm text-accent-foreground flex items-center gap-2 justify-between">
            Credit Balance
            <span className="text-foreground">
              {oneFitCurrentCreditBalance ?? 0}
            </span>
          </div>
          <div className="text-sm text-accent-foreground flex items-center gap-2 justify-between">
            Phone
            <span className="text-foreground">{primaryPhone || '-'}</span>
          </div>
          <div className="text-sm text-accent-foreground flex items-center gap-2 justify-between">
            Email
            <span className="text-foreground">{primaryEmail || '-'}</span>
          </div>
        </div>
        <Separator />
        <div className="py-1 px-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-accent-foreground"
          >
            View details
            <IconCaretDownFilled />
          </Button>
        </div>
      </div>
    </OneFitCustomersInline.Provider>
  );
};

const OneFitCustomerWidgetDetail = ({
  customerId,
  scope,
}: {
  customerId: string;
  scope: string;
}) => {
  const { oneFitCustomer, loading, refetch } = useOneFitCustomerDetail({
    variables: {
      _id: customerId,
    },
    skip: !customerId,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
      <OneFitCustomerDetailContent
        customerId={customerId}
        oneFitCustomer={oneFitCustomer}
        loading={loading}
        refetch={refetch}
        bookingsScrollable
      />
    </div>
  );
};

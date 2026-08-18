import {
  Badge,
  Combobox,
  Command,
  Filter,
  PopoverScoped,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import {
  IconCheck,
  IconCircleX,
  IconFileText,
  IconHome,
  IconLabelFilled,
  IconRefresh,
  IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';
import { SelectCustomer } from 'ui-modules';

export type PaymentFilterValue = 'unpaid' | 'paid' | 'overdue';

const PAYMENT_FILTER_OPTIONS: {
  value: PaymentFilterValue;
  label: string;
  variant: 'success' | 'destructive' | 'secondary';
  icon: typeof IconCheck;
}[] = [
  {
    value: 'unpaid',
    label: 'Unpaid',
    variant: 'secondary',
    icon: IconRefresh,
  },
  {
    value: 'overdue',
    label: 'Overdue',
    variant: 'destructive',
    icon: IconCircleX,
  },
  { value: 'paid', label: 'Paid', variant: 'success', icon: IconCheck },
];

const StatusValue = ({ value }: { value?: PaymentFilterValue | null }) => {
  const opt = PAYMENT_FILTER_OPTIONS.find((o) => o.value === value);
  if (!opt) {
    return <span className="text-muted-foreground">Select status</span>;
  }
  const Icon = opt.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4" />
      <Badge variant={opt.variant}>{opt.label}</Badge>
    </div>
  );
};

const StatusContent = ({
  value,
  onValueChange,
}: {
  value?: PaymentFilterValue | null;
  onValueChange: (v: PaymentFilterValue) => void;
}) => (
  <Command>
    <Command.Input placeholder="Search status" />
    <Command.Empty>No status found</Command.Empty>
    <Command.List>
      {PAYMENT_FILTER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <Command.Item
            key={opt.value}
            value={opt.value}
            onSelect={() => onValueChange(opt.value)}
          >
            <div className="flex items-center gap-2 flex-1">
              <Icon className="size-4" />
              <Badge variant={opt.variant}>{opt.label}</Badge>
            </div>
            <Combobox.Check checked={value === opt.value} />
          </Command.Item>
        );
      })}
    </Command.List>
  </Command>
);

const StatusFilterBar = () => {
  const [value, setValue] = useQueryState<PaymentFilterValue>('payment_filter');
  const [open, setOpen] = useState(false);
  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Filter.BarButton filterKey="payment_filter">
        <StatusValue value={value as PaymentFilterValue | null} />
      </Filter.BarButton>
      <Combobox.Content>
        <StatusContent
          value={value as PaymentFilterValue | null}
          onValueChange={(v) => {
            setValue(v);
            setOpen(false);
          }}
        />
      </Combobox.Content>
    </PopoverScoped>
  );
};

const StatusFilterView = () => {
  const [value, setValue] = useQueryState<PaymentFilterValue>('payment_filter');
  return (
    <Filter.View filterKey="payment_filter">
      <StatusContent
        value={value as PaymentFilterValue | null}
        onValueChange={(v) => setValue(v)}
      />
    </Filter.View>
  );
};

const PaymentsFilterPopover = () => {
  const [queries] = useMultiQueryState<{
    payment_filter: string;
    payment_contractNumber: string;
    payment_customerId: string;
    payment_unitNumber: string;
  }>(['payment_filter', 'payment_contractNumber', 'payment_customerId', 'payment_unitNumber']);
  const hasFilters = Object.values(queries || {}).some((v) => v !== null);

  return (
    <Filter.Popover>
      <Filter.Trigger isFiltered={hasFilters} />
      <Combobox.Content>
        <Filter.View>
          <Command>
            <Filter.CommandInput
              placeholder="Filter"
              variant="secondary"
              className="bg-background"
            />
            <Command.List className="p-1">
              <Filter.Item value="payment_filter">
                <IconLabelFilled />
                Status
              </Filter.Item>
              <Command.Separator className="my-1" />
              <Filter.Item value="payment_contractNumber" inDialog>
                <IconFileText />
                Contract Number
              </Filter.Item>
              <Filter.Item value="payment_unitNumber" inDialog>
                <IconHome />
                Unit Number
              </Filter.Item>
              <Filter.Item value="payment_customerId">
                <IconUser />
                Customer
              </Filter.Item>
            </Command.List>
          </Command>
        </Filter.View>
        <StatusFilterView />
        <SelectCustomer.FilterView filterKey="payment_customerId" mode="single" />
      </Combobox.Content>
    </Filter.Popover>
  );
};

export const PaymentsFilter = () => {
  const [queries] = useMultiQueryState<{
    payment_filter: string;
    payment_contractNumber: string;
    payment_customerId: string;
    payment_unitNumber: string;
  }>(['payment_filter', 'payment_contractNumber', 'payment_customerId', 'payment_unitNumber']);
  const { payment_filter, payment_contractNumber, payment_customerId, payment_unitNumber } =
    queries || {};

  return (
    <Filter id="payments-filter">
      <Filter.Bar>
        <Filter.BarItem queryKey="payment_filter">
          <Filter.BarName>
            <IconLabelFilled />
            Status
          </Filter.BarName>
          <StatusFilterBar />
        </Filter.BarItem>
        {payment_contractNumber && (
          <Filter.BarItem queryKey="payment_contractNumber">
            <Filter.BarName>
              <IconFileText />
              Contract
            </Filter.BarName>
            <Filter.BarButton filterKey="payment_contractNumber" inDialog>
              {payment_contractNumber}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        {payment_unitNumber && (
          <Filter.BarItem queryKey="payment_unitNumber">
            <Filter.BarName>
              <IconHome />
              Unit
            </Filter.BarName>
            <Filter.BarButton filterKey="payment_unitNumber" inDialog>
              {payment_unitNumber}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        {payment_customerId && (
          <Filter.BarItem queryKey="payment_customerId">
            <Filter.BarName>
              <IconUser />
              Customer
            </Filter.BarName>
            <SelectCustomer.FilterBar
              filterKey="payment_customerId"
              label="Customer"
              mode="single"
            />
          </Filter.BarItem>
        )}
        <PaymentsFilterPopover />
      </Filter.Bar>
      <Filter.Dialog>
        <Filter.View filterKey="payment_contractNumber" inDialog>
          <Filter.DialogStringView filterKey="payment_contractNumber" label="Contract Number" />
        </Filter.View>
        <Filter.View filterKey="payment_unitNumber" inDialog>
          <Filter.DialogStringView filterKey="payment_unitNumber" label="Unit Number" />
        </Filter.View>
      </Filter.Dialog>
    </Filter>
  );
};

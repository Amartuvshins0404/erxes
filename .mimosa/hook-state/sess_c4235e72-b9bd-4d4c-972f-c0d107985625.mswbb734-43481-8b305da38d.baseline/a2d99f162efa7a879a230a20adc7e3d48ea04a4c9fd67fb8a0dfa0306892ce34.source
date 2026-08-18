import { SelectOneFitCustomerContext } from '../contexts/SelectOneFitCustomerContext';
import { OneFitCustomer } from '../types/onefitCustomer';
import { useSelectOneFitCustomerContext } from '../hooks/useSelectOneFitCustomerContext';
import { useOneFitCustomers } from '../hooks/useOneFitCustomers';
import { useDebounce } from 'use-debounce';
import { useState, useEffect } from 'react';
import {
  cn,
  Combobox,
  Command,
  Form,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
  EnumCursorDirection,
} from 'erxes-ui';
import { OneFitCustomersInline } from './OneFitCustomersInline';
import { useQuery } from '@apollo/client';
import { ONE_FIT_CUSTOMER } from '../graphql/onefitCustomerQueries';

interface SelectOneFitCustomerProviderProps {
  children: React.ReactNode;
  value?: string[] | string;
  onValueChange?: (value: string[] | string) => void;
  mode?: 'single' | 'multiple';
  type?: 'onefit' | 'erxes';
}

const SelectOneFitCustomerProvider = ({
  children,
  value,
  onValueChange,
  mode = 'single',
  type = 'onefit',
}: SelectOneFitCustomerProviderProps) => {
  const [customers, setCustomers] = useState<OneFitCustomer[]>([]);
  const customerIds = !value ? [] : Array.isArray(value) ? value : [value];

  const onSelect = (customer: OneFitCustomer) => {
    if (!customer) return;
    if (mode === 'single') {
      setCustomers([customer]);
      onValueChange?.(customer._id);
      return;
    }
    const arrayValue = Array.isArray(value) ? value : [];
    const isCustomerSelected = arrayValue.includes(customer._id);
    const newSelectedCustomerIds = isCustomerSelected
      ? arrayValue.filter((id) => id !== customer._id)
      : [...arrayValue, customer._id];

    setCustomers((prevCustomers) => {
      const customerMap = new Map(prevCustomers.map((c) => [c._id, c]));
      customerMap.set(customer._id, customer);
      return newSelectedCustomerIds
        .map((id) => customerMap.get(id))
        .filter((c): c is OneFitCustomer => c !== undefined);
    });
    onValueChange?.(newSelectedCustomerIds);
  };

  return (
    <SelectOneFitCustomerContext.Provider
      value={{
        customerIds,
        onSelect,
        customers,
        setCustomers,
        loading: false,
        error: null,
        type,
      }}
    >
      {children}
    </SelectOneFitCustomerContext.Provider>
  );
};

const SelectOneFitCustomerContent = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const { customerIds, customers, type } = useSelectOneFitCustomerContext();
  const {
    customers: customersData,
    loading,
    handleFetchMore,
    totalCount,
    error,
  } = useOneFitCustomers({
    searchValue: debouncedSearch,
    type,
  });

  return (
    <Command shouldFilter={false}>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        variant="secondary"
        wrapperClassName="flex-auto"
        focusOnMount
        placeholder="Search customers..."
      />
      <Command.List className="max-h-[300px] overflow-y-auto">
        {customers?.length > 0 && (
          <>
            {customers.map((customer) => (
              <SelectOneFitCustomerCommandItem
                key={customer._id}
                customer={customer}
              />
            ))}
            <Command.Separator className="my-1" />
          </>
        )}
        <Combobox.Empty loading={loading} error={error} />
        {!loading &&
          customersData
            ?.filter((customer: OneFitCustomer) => {
              return !customerIds.find(
                (customerId) => customerId === customer._id,
              );
            })
            .map((customer: OneFitCustomer) => (
              <SelectOneFitCustomerCommandItem
                key={customer._id}
                customer={customer}
              />
            ))}

        {!loading && (
          <Combobox.FetchMore
            fetchMore={() =>
              handleFetchMore({ direction: EnumCursorDirection.FORWARD })
            }
            currentLength={customersData?.length || 0}
            totalCount={totalCount || 0}
          />
        )}
      </Command.List>
    </Command>
  );
};

const SelectOneFitCustomerCommandItem = ({
  customer,
}: {
  customer: OneFitCustomer;
}) => {
  const { onSelect, customerIds } = useSelectOneFitCustomerContext();
  const getCustomerDisplayName = (customer: OneFitCustomer) => {
    const { firstName, lastName, primaryEmail, primaryPhone } = customer;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return primaryEmail || primaryPhone || 'Unnamed customer';
  };

  return (
    <Command.Item
      value={customer._id}
      onSelect={() => {
        onSelect(customer);
      }}
    >
      <OneFitCustomersInline
        customers={[customer]}
        placeholder="Unnamed customer"
      />
      <Combobox.Check checked={customerIds.includes(customer._id)} />
    </Command.Item>
  );
};

const SelectOneFitCustomerInlineCell = ({
  onValueChange,
  scope,
  ...props
}: Omit<
  React.ComponentProps<typeof SelectOneFitCustomerProvider>,
  'children'
> & {
  scope?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectOneFitCustomerProvider
      onValueChange={(value) => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      <PopoverScoped open={open} onOpenChange={setOpen} scope={scope}>
        <RecordTableInlineCell.Trigger>
          <SelectOneFitCustomer.Value />
        </RecordTableInlineCell.Trigger>
        <RecordTableInlineCell.Content>
          <SelectOneFitCustomer.Content />
        </RecordTableInlineCell.Content>
      </PopoverScoped>
    </SelectOneFitCustomerProvider>
  );
};

const SelectOneFitCustomerRoot = ({
  onValueChange,
  className,
  mode = 'single',
  ...props
}: Omit<
  React.ComponentProps<typeof SelectOneFitCustomerProvider>,
  'children'
> & {
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectOneFitCustomerProvider
      onValueChange={(value) => {
        if (mode === 'single') {
          setOpen(false);
        }
        onValueChange?.(value);
      }}
      mode={mode}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Combobox.Trigger
          className={cn('w-full inline-flex', className)}
          variant="outline"
        >
          <SelectOneFitCustomer.Value />
        </Combobox.Trigger>
        <Combobox.Content>
          <SelectOneFitCustomer.Content />
        </Combobox.Content>
      </Popover>
    </SelectOneFitCustomerProvider>
  );
};

const SelectOneFitCustomerValue = () => {
  const { customerIds, customers, setCustomers } =
    useSelectOneFitCustomerContext();
  const value = customerIds.length > 0 ? customerIds[0] : undefined;
  const { data, loading } = useQuery(ONE_FIT_CUSTOMER, {
    variables: { _id: value || '' },
    skip: !value || customers.some((c) => c._id === value),
  });

  useEffect(() => {
    if (
      data?.oneFitCustomer &&
      !customers.some((c) => c._id === data.oneFitCustomer._id)
    ) {
      setCustomers([...customers, data.oneFitCustomer]);
    }
  }, [data, customers, setCustomers]);

  return (
    <OneFitCustomersInline
      customerIds={customerIds}
      customers={customers}
      updateCustomers={setCustomers}
    />
  );
};

const SelectOneFitCustomerFormItem = ({
  onValueChange,
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof SelectOneFitCustomerProvider>,
  'children'
> & {
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectOneFitCustomerProvider
      onValueChange={(value) => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Form.Control>
          <Combobox.Trigger className={cn('w-full shadow-xs', className)}>
            <SelectOneFitCustomer.Value />
          </Combobox.Trigger>
        </Form.Control>

        <Combobox.Content>
          <SelectOneFitCustomer.Content />
        </Combobox.Content>
      </Popover>
    </SelectOneFitCustomerProvider>
  );
};

export const SelectOneFitCustomer = Object.assign(SelectOneFitCustomerRoot, {
  Provider: SelectOneFitCustomerProvider,
  Content: SelectOneFitCustomerContent,
  Item: SelectOneFitCustomerCommandItem,
  InlineCell: SelectOneFitCustomerInlineCell,
  Value: SelectOneFitCustomerValue,
  FormItem: SelectOneFitCustomerFormItem,
});

import {
  OneFitCustomersInlineContext,
  useOneFitCustomersInlineContext,
} from '../contexts/OneFitCustomersInlineContext';
import {
  Avatar,
  AvatarProps,
  cn,
  Combobox,
  isUndefinedOrNull,
  Tooltip,
} from 'erxes-ui';
import { OneFitCustomer } from '../types/onefitCustomer';
import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { ONE_FIT_CUSTOMER } from '../graphql/onefitCustomerQueries';

interface OneFitCustomersInlineProviderProps {
  children: React.ReactNode;
  customerIds?: string[];
  customers?: OneFitCustomer[];
  placeholder?: string;
  updateCustomers?: (customers: OneFitCustomer[]) => void;
}

const OneFitCustomersInlineProvider = ({
  children,
  placeholder,
  customerIds,
  customers,
  updateCustomers,
}: OneFitCustomersInlineProviderProps) => {
  const [_customers, _setCustomers] = useState<OneFitCustomer[]>(
    customers || [],
  );

  const getCustomerTitle = (customer?: OneFitCustomer) => {
    const { firstName, lastName, primaryEmail, primaryPhone } = customer || {};
    if (primaryPhone) {
      return primaryPhone;
    }
    if (primaryEmail) {
      return primaryEmail;
    }
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return placeholder || 'Unnamed customer';
  };

  return (
    <OneFitCustomersInlineContext.Provider
      value={{
        customers: customers || _customers,
        loading: false,
        placeholder: isUndefinedOrNull(placeholder)
          ? 'Select Customers'
          : placeholder,
        updateCustomers: updateCustomers || _setCustomers,
        getCustomerTitle,
      }}
    >
      <Tooltip.Provider>{children}</Tooltip.Provider>
      {customerIds
        ?.filter((id) => !customers?.some((customer) => customer._id === id))
        ?.map((id) => (
          <OneFitCustomerInlineEffectComponent key={id} customerId={id} />
        ))}
    </OneFitCustomersInlineContext.Provider>
  );
};

const OneFitCustomerInlineEffectComponent = ({
  customerId,
}: {
  customerId: string;
}) => {
  const { updateCustomers, customers } = useOneFitCustomersInlineContext();
  const { data } = useQuery(ONE_FIT_CUSTOMER, {
    variables: { _id: customerId },
    skip: !customerId,
  });

  const customer = data?.oneFitCustomer;

  useEffect(() => {
    if (customer) {
      const newCustomers = (customers || []).filter(
        (c) => c._id !== customerId,
      );

      if (newCustomers.some((c) => c._id === customerId)) {
        updateCustomers?.(newCustomers);
        return;
      }
      updateCustomers?.([...newCustomers, { ...customer }]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  return null;
};

const OneFitCustomersInlineAvatar = ({ className, ...props }: AvatarProps) => {
  const { customers, loading, customerIds, getCustomerTitle } =
    useOneFitCustomersInlineContext();

  if (loading)
    return (
      <div className="flex -space-x-1.5">
        {customerIds?.map((customerId) => (
          <Avatar key={customerId} className={cn('bg-background', className)}>
            <Avatar.Fallback />
          </Avatar>
        ))}
      </div>
    );

  const renderAvatar = (customer?: OneFitCustomer) => {
    return (
      <Tooltip delayDuration={100}>
        <Tooltip.Trigger asChild>
          <Avatar
            key={customer?._id}
            className={cn(
              'bg-background',
              customers && customers.length > 1 && 'ring-2 ring-background',
              className,
            )}
            size="lg"
            {...props}
          >
            <Avatar.Fallback>
              {getCustomerTitle(customer).charAt(0)}
            </Avatar.Fallback>
          </Avatar>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{getCustomerTitle(customer)}</p>
        </Tooltip.Content>
      </Tooltip>
    );
  };

  if (customers?.length === 0) return null;

  if (customers?.length === 1) return renderAvatar(customers[0]);

  const withAvatar = customers?.slice(0, customers.length > 3 ? 2 : 3);
  const restMembers = customers?.slice(withAvatar?.length || 0);

  return (
    <div className="flex -space-x-1.5">
      {withAvatar?.map(renderAvatar)}
      {restMembers && restMembers?.length > 0 && (
        <Tooltip delayDuration={100}>
          <Tooltip.Trigger asChild>
            <Avatar
              key={restMembers?.[0]?._id}
              className={cn('ring-2 ring-background bg-background', className)}
              {...props}
              size="lg"
            >
              <Avatar.Fallback className="bg-primary/10 text-primary">
                +{restMembers.length}
              </Avatar.Fallback>
            </Avatar>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>
              {restMembers
                .map((c) => `${c.firstName || ''} ${c.lastName || ''}`.trim())
                .filter(Boolean)
                .join(', ')}
            </p>
          </Tooltip.Content>
        </Tooltip>
      )}
    </div>
  );
};

const OneFitCustomersInlineTitle = ({ className }: { className?: string }) => {
  const { getCustomerTitle, customers, loading, placeholder } =
    useOneFitCustomersInlineContext();

  const getDisplayValue = () => {
    if (!customers || customers.length === 0) return;

    if (customers.length === 1) {
      return getCustomerTitle(customers[0]);
    }

    return `${customers.length} customers`;
  };

  return (
    <Combobox.Value
      value={getDisplayValue()}
      loading={loading}
      placeholder={placeholder}
      className={className}
    />
  );
};

const OneFitCustomersInlineRoot = React.forwardRef<
  HTMLSpanElement,
  Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> &
    Omit<OneFitCustomersInlineProviderProps, 'children'>
>(
  (
    {
      customerIds,
      customers,
      placeholder,
      updateCustomers,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <OneFitCustomersInlineProvider
        customerIds={customerIds}
        customers={customers}
        placeholder={placeholder}
        updateCustomers={updateCustomers}
      >
        <span
          ref={ref}
          {...props}
          className={cn(
            'inline-flex items-center gap-2 overflow-hidden',
            className,
          )}
        >
          <OneFitCustomersInlineAvatar />
          <OneFitCustomersInlineTitle />
        </span>
      </OneFitCustomersInlineProvider>
    );
  },
);

export const OneFitCustomersInline = Object.assign(OneFitCustomersInlineRoot, {
  Provider: OneFitCustomersInlineProvider,
  Avatar: OneFitCustomersInlineAvatar,
  Title: OneFitCustomersInlineTitle,
});

import { IconCaretRightFilled } from '@tabler/icons-react';
import {
  Button,
  Collapsible,
  Label,
  ScrollArea,
  Separator,
  Spinner,
  cn,
  toast,
} from 'erxes-ui';
import { format } from 'date-fns';
import { type ReactNode, useState } from 'react';
import { BookingsList } from '~/modules/booking/components/BookingsList';
import { useMutation, useQuery } from '@apollo/client';
import {
  OneFitCustomer,
  OneFitMembershipStatus,
} from '../types/onefitCustomer';
import { ONE_FIT_MEMBERSHIP_HOLD_CANCEL } from '../graphql/onefitCustomerMutations';
import { ONE_FIT_CUSTOMER } from '../graphql/onefitCustomerQueries';
import { ONE_FIT_MEMBERSHIP_PLAN } from '~/modules/membership/graphql/membershipPlanQueries';
import { StartMembershipHoldDialog } from './StartMembershipHoldDialog';
import { UpdateMembershipDialog } from './UpdateMembershipDialog';

function formatDate(dateString?: string | null) {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return '-';
  }
}

function getMembershipStatusBadge(status?: OneFitMembershipStatus) {
  if (!status) return null;
  const statusColors = {
    [OneFitMembershipStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [OneFitMembershipStatus.EXPIRED]: 'bg-red-100 text-red-800',
    [OneFitMembershipStatus.NONE]: 'bg-gray-100 text-gray-800',
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const tabTriggerBaseClass =
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent';

function TabTriggerButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        tabTriggerBaseClass,
        active
          ? 'bg-transparent text-primary shadow-none after:bg-primary hover:bg-accent hover:text-primary'
          : 'text-accent-foreground',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface OneFitCustomerDetailContentProps {
  oneFitCustomer: OneFitCustomer | null | undefined;
  loading: boolean;
  refetch?: () => void;
  /** Known id (e.g. route param) when the customer document is still loading */
  customerId?: string;
  /** Scroll the bookings table in narrow side panels */
  bookingsScrollable?: boolean;
}

export function OneFitCustomerDetailContent({
  oneFitCustomer,
  loading,
  refetch,
  customerId: customerIdProp,
  bookingsScrollable = false,
}: OneFitCustomerDetailContentProps) {
  const [startHoldDialogOpen, setStartHoldDialogOpen] = useState(false);
  const [updateExpirationDialogOpen, setUpdateExpirationDialogOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'bookings'>(
    'customer',
  );
  const resolvedCustomerId = customerIdProp ?? oneFitCustomer?._id;

  const [cancelHold, { loading: cancellingHold }] = useMutation(
    ONE_FIT_MEMBERSHIP_HOLD_CANCEL,
    {
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Membership hold cancelled.',
        });
        refetch?.();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to cancel hold',
          variant: 'destructive',
        });
      },
      refetchQueries: resolvedCustomerId
        ? [{ query: ONE_FIT_CUSTOMER, variables: { _id: resolvedCustomerId } }]
        : [],
    },
  );

  const handleCancelHold = () => {
    if (
      !resolvedCustomerId ||
      !oneFitCustomer?.oneFitIsMembershipOnHold ||
      !window.confirm(
        'Cancel hold? Membership will resume and expiry will be extended by the number of days held.',
      )
    ) {
      return;
    }
    cancelHold({ variables: { userId: resolvedCustomerId } });
  };
  const {
    primaryEmail,
    primaryPhone,
    oneFitMembershipPlanId,
    oneFitMembershipExpiresAt,
    oneFitMembershipStatus,
    oneFitIsMembershipOnHold,
    oneFitMembershipHoldStartAt,
    oneFitMembershipHoldEndAt,
    oneFitMembershipHoldEndedAt,
    oneFitCurrentCreditBalance,
    oneFitTotalCreditsEarned,
    oneFitTotalCreditsUsed,
    oneFitPreferredActivityTypes,
    oneFitBookingPreferences,
    oneFitLastBookingDate,
    oneFitTotalBookings,
  } = oneFitCustomer || {};

  const { data: membershipPlanData } = useQuery(ONE_FIT_MEMBERSHIP_PLAN, {
    variables: { _id: oneFitMembershipPlanId || '' },
    skip: !oneFitMembershipPlanId,
  });

  const membershipPlanName = membershipPlanData?.oneFitMembershipPlan?.name;

  const customerBookingsListProps = resolvedCustomerId
    ? {
        filters: { userId: resolvedCustomerId },
        excludeCancelled: true as const,
        sessionKey: `onefit-customer-bookings-${resolvedCustomerId}`,
        customerDetailView: true as const,
        creditSummary: {
          totalCreditsUsed: oneFitTotalCreditsUsed,
          currentCreditBalance: oneFitCurrentCreditBalance,
        },
      }
    : null;

  const bookingsPanel =
    resolvedCustomerId && customerBookingsListProps ? (
      bookingsScrollable ? (
        <ScrollArea className="h-[min(70vh,32rem)] pr-2">
          <BookingsList {...customerBookingsListProps} />
        </ScrollArea>
      ) : (
        <BookingsList {...customerBookingsListProps} />
      )
    ) : null;

  const customerSections = (
    <div className="space-y-2">
      {/* Membership Section */}
      <Collapsible className="group/collapsible-menu bg-background" defaultOpen>
        <div className="p-4">
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              className="w-full text-accent-foreground justify-start text-left"
              size="sm"
            >
              <IconCaretRightFilled className="transition-transform group-data-[state=open]/collapsible-menu:rotate-90" />
              Membership
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-4">
            {loading ? (
              <Spinner containerClassName="py-20" />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Membership Status
                  </Label>
                  <div className="flex items-center gap-2">
                    {getMembershipStatusBadge(oneFitMembershipStatus)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Membership Plan
                  </Label>
                  <div className="text-sm text-foreground">
                    {membershipPlanName || oneFitMembershipPlanId || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Expiration Date
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {formatDate(oneFitMembershipExpiresAt)}
                    </span>
                    {resolvedCustomerId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUpdateExpirationDialogOpen(true)}
                      >
                        Modify
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Collapsible.Content>
        </div>
        <Separator />
      </Collapsible>

      {/* Membership hold (Hold information) */}
      <Collapsible className="group/collapsible-menu bg-background" defaultOpen>
        <div className="p-4">
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              className="w-full text-accent-foreground justify-start text-left"
              size="sm"
            >
              <IconCaretRightFilled className="transition-transform group-data-[state=open]/collapsible-menu:rotate-90" />
              Membership hold
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-4">
            {loading ? (
              <Spinner containerClassName="py-20" />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    On hold
                  </Label>
                  <div className="text-sm text-foreground">
                    {oneFitIsMembershipOnHold ? (
                      <span className="text-amber-600 font-medium">Yes</span>
                    ) : (
                      'No'
                    )}
                  </div>
                </div>
                {oneFitMembershipHoldStartAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-accent-foreground">
                      Hold start
                    </Label>
                    <div className="text-sm text-foreground">
                      {formatDate(oneFitMembershipHoldStartAt)}
                    </div>
                  </div>
                )}
                {oneFitMembershipHoldEndAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-accent-foreground">
                      Hold end
                    </Label>
                    <div className="text-sm text-foreground">
                      {formatDate(oneFitMembershipHoldEndAt)}
                    </div>
                  </div>
                )}
                {oneFitMembershipHoldEndedAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-accent-foreground">
                      Hold ended at
                    </Label>
                    <div className="text-sm text-foreground">
                      {formatDate(oneFitMembershipHoldEndedAt)}
                    </div>
                  </div>
                )}
                {!oneFitIsMembershipOnHold &&
                  !oneFitMembershipHoldStartAt &&
                  !oneFitMembershipHoldEndAt &&
                  !oneFitMembershipHoldEndedAt && (
                    <div className="text-sm text-muted-foreground">
                      No hold history
                    </div>
                  )}
                {!loading && resolvedCustomerId && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {oneFitIsMembershipOnHold ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelHold}
                        disabled={cancellingHold}
                      >
                        {cancellingHold ? <Spinner className="size-3" /> : null}
                        Cancel hold
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStartHoldDialogOpen(true)}
                        disabled={
                          oneFitMembershipStatus !==
                          OneFitMembershipStatus.ACTIVE
                        }
                      >
                        Start hold
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Collapsible.Content>
        </div>
        <Separator />
      </Collapsible>

      {/* Credits Section */}
      <Collapsible className="group/collapsible-menu bg-background" defaultOpen>
        <div className="p-4">
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              className="w-full text-accent-foreground justify-start text-left"
              size="sm"
            >
              <IconCaretRightFilled className="transition-transform group-data-[state=open]/collapsible-menu:rotate-90" />
              Credits
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-4">
            {loading ? (
              <Spinner containerClassName="py-20" />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Current Balance
                  </Label>
                  <div className="text-sm font-medium text-foreground">
                    {oneFitCurrentCreditBalance ?? 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Total Earned
                  </Label>
                  <div className="text-sm text-foreground">
                    {oneFitTotalCreditsEarned ?? 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Total Used
                  </Label>
                  <div className="text-sm text-foreground">
                    {oneFitTotalCreditsUsed ?? 0}
                  </div>
                </div>
              </div>
            )}
          </Collapsible.Content>
        </div>
        <Separator />
      </Collapsible>

      {/* Bookings Section */}
      <Collapsible className="group/collapsible-menu bg-background" defaultOpen>
        <div className="p-4">
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              className="w-full text-accent-foreground justify-start text-left"
              size="sm"
            >
              <IconCaretRightFilled className="transition-transform group-data-[state=open]/collapsible-menu:rotate-90" />
              Bookings
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-4">
            {loading ? (
              <Spinner containerClassName="py-20" />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Total Bookings
                  </Label>
                  <div className="text-sm font-medium text-foreground">
                    {oneFitTotalBookings ?? 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Last Booking Date
                  </Label>
                  <div className="text-sm text-foreground">
                    {formatDate(oneFitLastBookingDate)}
                  </div>
                </div>
                {oneFitPreferredActivityTypes &&
                  oneFitPreferredActivityTypes.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs text-accent-foreground">
                        Preferred Activity Types
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {oneFitPreferredActivityTypes.map((type, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs bg-primary/10 text-primary"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {oneFitBookingPreferences && (
                  <div className="space-y-2">
                    <Label className="text-xs text-accent-foreground">
                      Booking Preferences
                    </Label>
                    {oneFitBookingPreferences.preferredTimeSlots &&
                      oneFitBookingPreferences.preferredTimeSlots.length >
                        0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-accent-foreground">
                            Preferred Time Slots:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {oneFitBookingPreferences.preferredTimeSlots.map(
                              (slot, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground"
                                >
                                  {slot}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {oneFitBookingPreferences.preferredDays &&
                      oneFitBookingPreferences.preferredDays.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-accent-foreground">
                            Preferred Days:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {oneFitBookingPreferences.preferredDays.map(
                              (day, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground"
                                >
                                  {day}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {oneFitBookingPreferences.notificationEnabled !==
                      undefined && (
                      <div className="space-y-1">
                        <div className="text-xs text-accent-foreground">
                          Notifications:
                        </div>
                        <div className="text-sm text-foreground">
                          {oneFitBookingPreferences.notificationEnabled
                            ? 'Enabled'
                            : 'Disabled'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Collapsible.Content>
        </div>
        <Separator />
      </Collapsible>

      {/* Contact Information */}
      <Collapsible className="group/collapsible-menu bg-background">
        <div className="p-4">
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              className="w-full text-accent-foreground justify-start text-left"
              size="sm"
            >
              <IconCaretRightFilled className="transition-transform group-data-[state=open]/collapsible-menu:rotate-90" />
              Contact Information
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-4">
            {loading ? (
              <Spinner containerClassName="py-20" />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Email
                  </Label>
                  <div className="text-sm text-foreground">
                    {primaryEmail || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-accent-foreground">
                    Phone
                  </Label>
                  <div className="text-sm text-foreground">
                    {primaryPhone || '-'}
                  </div>
                </div>
              </div>
            )}
          </Collapsible.Content>
        </div>
        <Separator />
      </Collapsible>
    </div>
  );

  return (
    <>
      {resolvedCustomerId ? (
        <div className="flex w-full min-h-0 flex-col gap-4">
          <div
            role="tablist"
            className="flex w-full min-w-0 flex-wrap shrink-0 gap-2 border-b border-border bg-transparent px-0 py-1 text-accent-foreground"
          >
            <TabTriggerButton
              active={activeTab === 'customer'}
              onClick={() => setActiveTab('customer')}
            >
              Customer
            </TabTriggerButton>
            <TabTriggerButton
              active={activeTab === 'bookings'}
              onClick={() => setActiveTab('bookings')}
            >
              Bookings
            </TabTriggerButton>
          </div>
          {activeTab === 'customer' ? customerSections : bookingsPanel}
        </div>
      ) : (
        customerSections
      )}
      {resolvedCustomerId ? (
        <>
          <StartMembershipHoldDialog
            customerId={resolvedCustomerId}
            open={startHoldDialogOpen}
            onOpenChange={setStartHoldDialogOpen}
            onSuccess={refetch}
          />
          <UpdateMembershipDialog
            customerId={resolvedCustomerId}
            open={updateExpirationDialogOpen}
            onOpenChange={setUpdateExpirationDialogOpen}
            initialMembershipPlanId={oneFitMembershipPlanId}
            initialExpiresAt={oneFitMembershipExpiresAt}
            onSuccess={refetch}
          />
        </>
      ) : null}
    </>
  );
}

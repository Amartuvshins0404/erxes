import {
  Badge,
  Button,
  Calendar,
  Command,
  FocusSheet,
  InfoCard,
  Popover,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  Table,
  Tabs,
  useConfirm,
  useQueryState,
} from 'erxes-ui';
import { useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  ActivityLogs,
  CustomersInline,
  RelationWidgetSideTabs,
  usePermissionCheck,
} from 'ui-modules';
import { useMemberDetail } from '../hooks/useMemberDetail';
import { useUpdateMembershipEndDate } from '../hooks/useUpdateMembershipEndDate';
import { useUpdateMembershipStatus } from '../hooks/useUpdateMembershipStatus';
import { IMember } from '../types';
import { SelectMemberStatus } from './SelectMemberStatus';
import { membershipCustomActivities } from './MembershipActivityRows';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'active', label: 'Active' },
  // { value: 'paused', label: 'Paused' },
  // { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Row = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | React.ReactNode;
}) => (
  <Table.Row>
    <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground">
      {label}
    </Table.Cell>
    <Table.Cell className="p-2 h-auto min-h-10 break-all whitespace-normal">
      {value ?? '-'}
    </Table.Cell>
  </Table.Row>
);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const daysRemaining = (t: TFunction, endDate?: string) => {
  if (!endDate) return null;
  const diff = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return t('Expired');
  if (diff === 0) return t('Expires today');
  return t('{{count}} days remaining', { count: diff });
};

const MemberSidebar = () => {
  const { t } = useTranslation('mushop');
  const [selectedTab, setSelectedTab] = useQueryState<string>('tab');

  return (
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent className="mt-2">
          <Sidebar.Menu>
            {['overview', 'activity'].map((tab) => (
              <Sidebar.MenuItem key={tab}>
                <Sidebar.MenuButton
                  isActive={
                    selectedTab === tab || (tab === 'overview' && !selectedTab)
                  }
                  onClick={() => setSelectedTab(tab)}
                >
                  {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
  );
};

const EndDateEditor = ({
  _id,
  startDate,
  endDate,
}: {
  _id: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const { updateEndDate, loading } = useUpdateMembershipEndDate();
  const { hasActionPermission } = usePermissionCheck();
  const { confirm } = useConfirm();

  const canEdit = hasActionPermission('mushopUpdateMembershipEndDate');

  const currentEnd = endDate ? new Date(endDate) : undefined;

  let minDate: Date | undefined;
  let startMonth: Date | undefined;

  if (startDate) {
    minDate = new Date(startDate);
    minDate.setDate(minDate.getDate() + 1);

    const s = new Date(startDate);
    startMonth = new Date(s.getFullYear(), s.getMonth(), 1);
  }

  const handleSelect = (date?: Date) => {
    if (!date) return;

    if (currentEnd && date.toDateString() === currentEnd.toDateString()) {
      setOpen(false);
      return;
    }

    setOpen(false);

    const oldLabel = formatDate(endDate);
    const newLabel = formatDate(date.toISOString());

    confirm({
      message: t('Change membership end date?'),
      options: {
        description: t(
          "This membership will end on {{newLabel}} instead of {{oldLabel}}. The customer's access period will change accordingly.",
          { newLabel, oldLabel },
        ),
        confirmationValue: "update",
        okLabel: t('Update'),
      },
    }).then(() => {
      updateEndDate(_id, date);
    });
  };

  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-1">
        <span>{startDate ? formatDate(startDate) : '-'}</span>
        <span className="text-muted-foreground">→</span>
        <span>{formatDate(endDate)}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span>{startDate ? formatDate(startDate) : '-'}</span>
      <span className="text-muted-foreground">→</span>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={loading}
            className="inline-flex items-center gap-1 hover:bg-accent disabled:opacity-50 -mx-1 px-1 rounded hover:text-accent-foreground cursor-pointer"
          >
            {formatDate(endDate)}
          </button>
        </Popover.Trigger>
        <Popover.Content className="p-0 w-auto" align="end">
          <Calendar
            mode="single"
            selected={currentEnd}
            defaultMonth={currentEnd}
            startMonth={startMonth}
            onSelect={handleSelect}
            disabled={minDate ? { before: minDate } : undefined}
          />
        </Popover.Content>
      </Popover>
    </span>
  );
};

const StatusEditor = ({
  _id,
  status,
}: {
  _id: string;
  status?: string;
}) => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const { updateStatus, loading } = useUpdateMembershipStatus();
  const { hasActionPermission } = usePermissionCheck();
  const { confirm } = useConfirm();

  const canEdit = hasActionPermission('mushopUpdateMembershipStatus');

  const badge = (
    <Badge variant={SelectMemberStatus.statusVariant(status)}>
      {status || '-'}
    </Badge>
  );

  if (!canEdit) {
    return badge;
  }

  const handleSelect = (next: string) => {
    setOpen(false);

    if (next === status) return;

    const rawLabel = STATUS_OPTIONS.find((o) => o.value === next)?.label;
    const nextLabel = rawLabel ? t(rawLabel) : next;

    confirm({
      message: t('Change membership status?'),
      options: {
        description: t('Status will change from "{{from}}" to "{{to}}".', {
          from: status || '-',
          to: nextLabel,
        }),
        confirmationValue: "update",
        okLabel: t('Update'),
      },
    }).then(() => {
      updateStatus(_id, next);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={loading}
          className="inline-flex items-center gap-1 rounded disabled:opacity-50 cursor-pointer"
        >
          {badge}
          {loading && <Spinner size="sm" />}
        </button>
      </Popover.Trigger>
      <Popover.Content className="p-0 w-44" align="start">
        <Command>
          <Command.List>
            {STATUS_OPTIONS.map((o) => (
              <Command.Item
                key={o.value}
                value={o.value}
                onSelect={() => handleSelect(o.value)}
              >
                {t(o.label)}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover>
  );
};

const MemberInfo = ({ member }: { member: IMember }) => {
  const { t } = useTranslation('mushop');
  const {
    _id,
    customerId,
    plan,
    status,
    startDate,
    endDate,
    amount,
    currency,
    createdAt,
    pausedDaysRemaining,
  } = member;

  const [selectedTab] = useQueryState<string>('tab');

  return (
    <CustomersInline.Provider customerIds={[customerId]}>
      <FocusSheet.SideBar>
        <MemberSidebar />
      </FocusSheet.SideBar>

      <div className="flex flex-1 overflow-hidden">
        <Tabs
          value={selectedTab ?? 'overview'}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <Tabs.Content
            value="overview"
            className="flex-1 mt-0 overflow-hidden"
          >
            <ScrollArea className="h-full">
              <div className="p-4">
                <InfoCard title={t('Membership')}>
                  <InfoCard.Content className="shadow-none p-0 overflow-hidden">
                    <Table>
                      <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
                        <Row
                          label={t('Customer')}
                          value={
                            <span className="inline-flex items-center gap-2">
                              <CustomersInline.Avatar />
                              <CustomersInline.Title />
                            </span>
                          }
                        />
                        <Table.Row>
                          <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground">
                            {t('Status')}
                          </Table.Cell>
                          <Table.Cell className="p-1 px-2 h-auto min-h-10">
                            <StatusEditor _id={_id} status={status} />
                          </Table.Cell>
                        </Table.Row>
                        <Row
                          label={t('Plan')}
                          value={
                            plan
                              ? `${plan.name} · ${
                                  plan.durationMonths
                                } ${t('months')} · ${plan.price.toLocaleString()} ${
                                  plan.currency
                                }`
                              : '-'
                          }
                        />
                        <Row
                          label={t('Period')}
                          value={
                            <EndDateEditor
                              _id={_id}
                              startDate={startDate}
                              endDate={endDate}
                            />
                          }
                        />
                        <Row
                          label={t('Time Left')}
                          value={
                            status === 'paused'
                              ? t('{{count}} days remaining (paused)', {
                                  count: pausedDaysRemaining ?? 0,
                                })
                              : daysRemaining(t, endDate)
                          }
                        />
                        <Row
                          label={t('Amount')}
                          value={
                            amount != null
                              ? `${amount.toLocaleString()} ${
                                  currency || 'MNT'
                                }`
                              : undefined
                          }
                        />
                        <Row label={t('Created')} value={formatDate(createdAt)} />
                      </Table.Body>
                    </Table>
                  </InfoCard.Content>
                </InfoCard>
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content
            value="activity"
            className="flex-1 mt-0 overflow-hidden"
          >
            <ScrollArea className="h-full">
              <div className="pt-3">
                <ActivityLogs
                  targetId={_id}
                  customActivities={membershipCustomActivities}
                  variant="backward"
                  emptyMessage={t('No activity yet')}
                />
              </div>
            </ScrollArea>
          </Tabs.Content>
        </Tabs>

        <RelationWidgetSideTabs
          contentId={_id}
          contentType="mushop:membership"
          access={{ customer: 'read' }}
        />
      </div>
    </CustomersInline.Provider>
  );
};

export const MemberDetailSheet = () => {
  const { t } = useTranslation('mushop');
  const [activeMemberId, setActiveMemberId] =
    useQueryState<string>('activeMemberId');
  const { member, loading } = useMemberDetail(activeMemberId);

  return (
    <FocusSheet
      open={!!activeMemberId}
      onOpenChange={() => setActiveMemberId(null)}
    >
      <FocusSheet.View className="sm:max-w-5xl">
        <FocusSheet.Header title={t('Membership Detail')} />
        <FocusSheet.Content className="flex flex-auto p-0 overflow-hidden">
          {loading && (
            <div className="flex flex-1 justify-center items-center">
              <Spinner />
            </div>
          )}
          {!loading && member && <MemberInfo member={member} />}
          {!loading && !member && (
            <div className="p-4">{t('Membership not found')}</div>
          )}
        </FocusSheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              {t('Close')}
            </Button>
          </Sheet.Close>
        </Sheet.Footer>
      </FocusSheet.View>
    </FocusSheet>
  );
};

import {
  Badge,
  Button,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  Table,
  Tabs,
  useQueryState,
} from 'erxes-ui';
import { ActivityLogs } from 'ui-modules';
import { useTranslation } from 'react-i18next';
import { useMembershipPlanDetail } from '../hooks/useMembershipPlanDetail';
import { membershipPlanCustomActivities } from './MembershipPlanActivityRows';

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
    <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal break-all">
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

const PlanSidebar = () => {
  const { t } = useTranslation('mushop');
  const [selectedTab, setSelectedTab] = useQueryState<string>('planTab');

  return (
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent className="mt-2">
          <Sidebar.Menu>
            {['overview', 'activity'].map((tab) => (
              <Sidebar.MenuItem key={tab}>
                <Sidebar.MenuButton
                  isActive={
                    selectedTab === tab ||
                    (tab === 'overview' && !selectedTab)
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

const PlanDetail = ({ plan }: { plan: any }) => {
  const { t } = useTranslation('mushop');
  const [selectedTab] = useQueryState<string>('planTab');

  return (
    <div className="flex flex-1 overflow-hidden">
      <FocusSheet.SideBar>
        <PlanSidebar />
      </FocusSheet.SideBar>

      <Tabs
        value={selectedTab ?? 'overview'}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <Tabs.Content value="overview" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <InfoCard title={t('Plan Details')}>
                <InfoCard.Content className="shadow-none p-0 overflow-hidden">
                  <Table>
                    <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
                      <Row label={t('Name')} value={plan.name} />
                      <Row label={t('Description')} value={plan.description} />
                      <Row
                        label={t('Price')}
                        value={`${plan.price.toLocaleString()} ${plan.currency}`}
                      />
                      <Row
                        label={t('Duration')}
                        value={t('{{count}} months', {
                          count: plan.durationMonths,
                        })}
                      />
                      <Table.Row>
                        <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground">
                          {t('Status')}
                        </Table.Cell>
                        <Table.Cell className="p-1 px-2 h-auto min-h-10">
                          <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                            {plan.isActive ? t('Active') : t('Inactive')}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                      <Row label={t('Created')} value={formatDate(plan.createdAt)} />
                    </Table.Body>
                  </Table>
                </InfoCard.Content>
              </InfoCard>
            </div>
          </ScrollArea>
        </Tabs.Content>

        <Tabs.Content value="activity" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="pt-3">
              <ActivityLogs
                targetId={plan._id}
                customActivities={membershipPlanCustomActivities}
                variant="backward"
                emptyMessage={t('No activity yet')}
              />
            </div>
          </ScrollArea>
        </Tabs.Content>
      </Tabs>
    </div>
  );
};

export const MembershipPlanDetailSheet = () => {
  const { t } = useTranslation('mushop');
  const [activePlanId, setActivePlanId] = useQueryState<string>('activePlanId');
  const { plan, loading } = useMembershipPlanDetail(activePlanId);

  return (
    <FocusSheet
      open={!!activePlanId}
      onOpenChange={() => setActivePlanId(null)}
    >
      <FocusSheet.View className="sm:max-w-2xl">
        <FocusSheet.Header title={t('Membership Plan')} />
        <FocusSheet.Content className="flex flex-auto overflow-hidden p-0">
          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          )}
          {!loading && plan && <PlanDetail plan={plan} />}
          {!loading && !plan && (
            <div className="p-4">{t('Plan not found')}</div>
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

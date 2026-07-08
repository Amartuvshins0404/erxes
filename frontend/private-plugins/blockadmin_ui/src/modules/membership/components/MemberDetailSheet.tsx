import {
  Badge,
  Button,
  FocusSheet,
  InfoCard,
  Input,
  ScrollArea,
  Sheet,
  Spinner,
  Table,
  useQueryState,
} from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomersInline } from 'ui-modules';
import { useMemberDetail } from '../hooks/useMemberDetail';
import {
  useCancelMembership,
  useUpdateMembershipEndDate,
  useUpdateMembershipStatus,
} from '../hooks/useMemberActions';
import { IMember } from '../types';
import { SelectMemberStatus } from './SelectMemberStatus';

const Row = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | React.ReactNode;
}) => (
  <Table.Row>
    <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
      {label}
    </Table.Cell>
    <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal">
      {value ?? '-'}
    </Table.Cell>
  </Table.Row>
);

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString() : undefined;

const MemberInfo = ({ member }: { member: IMember }) => {
  const { t } = useTranslation('blockadmin');
  const { handleCancel, loading: cancelling } = useCancelMembership();
  const { updateStatus } = useUpdateMembershipStatus();
  const { updateEndDate } = useUpdateMembershipEndDate();
  const [endDate, setEndDate] = useState(
    member.endDate ? member.endDate.slice(0, 10) : '',
  );

  const {
    _id,
    customerId,
    customer,
    plan,
    status,
    startDate,
    amount,
    currency,
  } = member;

  return (
    <div className="flex flex-col gap-4 p-4">
      <InfoCard title={t('General')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Row
                label={t('Customer')}
                value={
                  <CustomersInline
                    customerIds={[customerId]}
                    customers={customer ? [customer] : undefined}
                    placeholder="—"
                  />
                }
              />
              <Row label={t('Plan')} value={plan?.name} />
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                  {t('Status')}
                </Table.Cell>
                <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal">
                  <Badge variant={SelectMemberStatus.statusVariant(status)}>
                    {status || '-'}
                  </Badge>
                </Table.Cell>
              </Table.Row>
              <Row
                label={t('Amount')}
                value={
                  amount != null
                    ? `${amount.toLocaleString()} ${currency || 'MNT'}`
                    : undefined
                }
              />
              <Row label={t('Start Date')} value={formatDate(startDate)} />
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title={t('Manage')}>
        <InfoCard.Content className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="max-w-44"
            />
            <Button
              variant="secondary"
              disabled={!endDate}
              onClick={() => updateEndDate(_id, new Date(endDate))}
            >
              {t('Update end date')}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {status !== 'active' && (
              <Button
                variant="secondary"
                onClick={() => updateStatus(_id, 'active')}
              >
                {t('Activate')}
              </Button>
            )}
            {status === 'active' && (
              <Button
                variant="destructive"
                disabled={cancelling}
                onClick={() => handleCancel(_id)}
              >
                {t('Cancel membership')}
              </Button>
            )}
          </div>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const MemberDetailSheet = () => {
  const { t } = useTranslation('blockadmin');
  const [activeMemberId, setActiveMemberId] =
    useQueryState<string>('activeMemberId');
  const { member, loading } = useMemberDetail(activeMemberId);

  return (
    <FocusSheet
      open={!!activeMemberId}
      onOpenChange={() => setActiveMemberId(null)}
    >
      <FocusSheet.View className="w-[50%] md:w-[50%]">
        <FocusSheet.Header title={t('Membership Detail')} />
        <FocusSheet.Content className="flex flex-col flex-auto min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            {loading && (
              <div className="p-4">
                <Spinner />
              </div>
            )}
            {!loading && member && <MemberInfo member={member} />}
            {!loading && !member && (
              <div className="p-4">{t('Membership not found')}</div>
            )}
          </ScrollArea>

          <Sheet.Footer className="flex-none border-t">
            <Sheet.Close asChild>
              <Button variant="secondary" className="bg-border">
                {t('Close')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </FocusSheet.Content>
      </FocusSheet.View>
    </FocusSheet>
  );
};

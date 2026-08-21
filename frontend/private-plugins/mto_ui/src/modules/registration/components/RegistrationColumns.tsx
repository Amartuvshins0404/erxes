/* eslint-disable react-hooks/rules-of-hooks */
import {
  IconArchive,
  IconCalendar,
  IconCircleFilled,
  IconCoin,
  IconDots,
  IconEye,
  IconMailOpened,
  IconPhone,
  IconProgressCheck,
  IconTag,
  IconUser,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  useConfirm,
} from 'erxes-ui';
import { useMutation, useQuery } from '@apollo/client';
import { useSetAtom } from 'jotai';
import {
  formatCpUserLabel,
  IClientPortalUserRow,
} from '@/registration/components/ClientPortalUserSelect';
import { GET_CLIENT_PORTAL_USER_FOR_SELECT } from '@/registration/graphql/clientPortalUsersQueries';
import {
  MTO_REGISTRATION_APPLICATION_MARK_READ,
  MTO_REGISTRATION_APPLICATION_REMOVE,
  MTO_REGISTRATION_APPLICATION_UPDATE,
} from '@/registration/graphql/registrationMutations';
import { registrationDetailSheetState } from '@/registration/states/registrationDetailSheetState';
import { MtoRegistrationApplication } from '@/registration/types/registration';

function useCpUser(cpUserId?: string | null) {
  const { data, loading } = useQuery(GET_CLIENT_PORTAL_USER_FOR_SELECT, {
    variables: { _id: cpUserId || '' },
    skip: !cpUserId,
  });
  return {
    user: data?.getClientPortalUser as IClientPortalUserRow | undefined,
    loading,
  };
}

function paymentStatusBadgeVariant(
  paymentStatus?: string | null,
): 'success' | 'warning' | 'secondary' {
  if (paymentStatus === 'paid' || paymentStatus === 'manual_verified') {
    return 'success';
  }
  if (paymentStatus === 'unpaid') {
    return 'warning';
  }
  return 'secondary';
}

function paymentStatusLabel(paymentStatus?: string | null) {
  if (paymentStatus === 'manual_verified') return 'Manual';
  return paymentStatus ?? 'unpaid';
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const ALL_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
] as const;

function statusBadgeVariant(
  status: string,
): 'success' | 'destructive' | 'warning' | 'default' | 'secondary' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'under_review':
      return 'warning';
    case 'submitted':
      return 'default';
    default:
      return 'secondary';
  }
}

function ApplicantCell({ cpUserId }: { cpUserId?: string | null }) {
  const { user, loading } = useCpUser(cpUserId);

  if (!cpUserId) {
    return (
      <RecordTableInlineCell>
        <span className="text-muted-foreground">—</span>
      </RecordTableInlineCell>
    );
  }

  if (loading) {
    return (
      <RecordTableInlineCell>
        <span className="text-muted-foreground">…</span>
      </RecordTableInlineCell>
    );
  }

  return (
    <RecordTableInlineCell className="min-w-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-medium truncate">
          {user ? formatCpUserLabel(user) : cpUserId}
        </span>
        {user?.phone ? (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1 truncate">
            <IconPhone className="size-3 shrink-0" />
            {user.phone}
          </span>
        ) : null}
      </div>
    </RecordTableInlineCell>
  );
}

export const registrationColumns = ({
  hideArchive,
  onChanged,
}: {
  hideArchive?: boolean;
  onChanged: () => void;
}): ColumnDef<MtoRegistrationApplication>[] => [
  {
    id: 'isRead',
    accessorKey: 'isRead',
    header: () => <span />,
    cell: ({ row }) => {
      const [markRead, { loading }] = useMutation(
        MTO_REGISTRATION_APPLICATION_MARK_READ,
      );
      const isRead = Boolean(row.original.isRead);

      return (
        <RecordTableInlineCell>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={loading}
            title={isRead ? 'Уншсан' : 'Уншаагүй — тэмдэглэх'}
            onClick={() => {
              void markRead({
                variables: { _id: row.original._id, isRead: !isRead },
              }).then(onChanged);
            }}
            className={
              isRead
                ? 'h-7 w-7 text-muted-foreground'
                : 'h-7 w-7 text-primary'
            }
          >
            {isRead ? (
              <IconMailOpened className="size-4" />
            ) : (
              <IconCircleFilled className="size-2.5" />
            )}
          </Button>
        </RecordTableInlineCell>
      );
    },
    size: 44,
  },
  {
    id: 'membershipTypeTitle',
    accessorKey: 'membershipTypeTitle',
    header: () => <RecordTable.InlineHead label="Төрөл" icon={IconTag} />,
    cell: ({ cell, row }) => {
      const setActiveId = useSetAtom(registrationDetailSheetState);
      return (
        <RecordTableInlineCell.Anchor
          className="ml-1 cursor-pointer font-medium truncate"
          onClick={() => setActiveId(row.original._id)}
        >
          {(cell.getValue() as string) || '—'}
        </RecordTableInlineCell.Anchor>
      );
    },
    size: 220,
  },
  {
    id: 'applicant',
    accessorKey: 'cpUserId',
    header: () => <RecordTable.InlineHead label="Хэрэглэгч" icon={IconUser} />,
    cell: ({ cell }) => (
      <ApplicantCell cpUserId={cell.getValue() as string | null | undefined} />
    ),
    size: 200,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => (
      <RecordTable.InlineHead label="Төлөв" icon={IconProgressCheck} />
    ),
    cell: ({ cell }) => {
      const status = (cell.getValue() as string) || 'draft';
      return (
        <RecordTableInlineCell>
          <Badge variant={statusBadgeVariant(status)} className="capitalize">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </RecordTableInlineCell>
      );
    },
    size: 130,
  },
  {
    id: 'paymentStatus',
    accessorKey: 'paymentStatus',
    header: () => <RecordTable.InlineHead label="Төлбөр" icon={IconCoin} />,
    cell: ({ cell }) => {
      const paymentStatus = cell.getValue() as string | null | undefined;
      return (
        <RecordTableInlineCell>
          <Badge
            variant={paymentStatusBadgeVariant(paymentStatus)}
            className="capitalize"
          >
            {paymentStatusLabel(paymentStatus)}
          </Badge>
        </RecordTableInlineCell>
      );
    },
    size: 110,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => <RecordTable.InlineHead label="Огноо" icon={IconCalendar} />,
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell>
          {value ? (
            <RelativeDateDisplay value={value} asChild>
              <RelativeDateDisplay.Value value={value} />
            </RelativeDateDisplay>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 130,
  },
  {
    id: 'actions',
    header: () => <span />,
    cell: ({ row }) => {
      const setActiveId = useSetAtom(registrationDetailSheetState);
      const { confirm } = useConfirm();
      const [updateStatus, { loading: statusLoading }] = useMutation(
        MTO_REGISTRATION_APPLICATION_UPDATE,
      );
      const [removeApplication, { loading: removeLoading }] = useMutation(
        MTO_REGISTRATION_APPLICATION_REMOVE,
      );
      const id = row.original._id;
      const currentStatus = row.original.status ?? 'draft';

      return (
        <RecordTableInlineCell>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={statusLoading || removeLoading}
              >
                <IconDots className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="mto:min-w-44" align="end">
              <DropdownMenu.Item
                className="cursor-pointer"
                onClick={() => setActiveId(id)}
              >
                <IconEye className="size-4" />
                <span>Дэлгэрэнгүй</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Label>Төлөв солих</DropdownMenu.Label>
              {ALL_STATUSES.filter((status) => status !== currentStatus).map(
                (status) => (
                  <DropdownMenu.Item
                    key={status}
                    className="cursor-pointer capitalize"
                    onClick={() => {
                      void updateStatus({
                        variables: { _id: id, status },
                      }).then(onChanged);
                    }}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </DropdownMenu.Item>
                ),
              )}
              {!hideArchive ? (
                <>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => {
                      void confirm({
                        message:
                          'Та энэ бүртгэлийг архивлахдаа итгэлтэй байна уу?',
                        options: { confirmationValue: 'archive' },
                      }).then(() => {
                        void removeApplication({ variables: { _id: id } }).then(
                          onChanged,
                        );
                      });
                    }}
                  >
                    <IconArchive className="size-4" />
                    <span>Архивлах</span>
                  </DropdownMenu.Item>
                </>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu>
        </RecordTableInlineCell>
      );
    },
    size: 50,
  },
];

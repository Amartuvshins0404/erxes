/* eslint-disable react-hooks/rules-of-hooks */
import {
  IconCircleFilled,
  IconMailOpened,
  IconSelector,
  IconTrash,
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

function CpUserCell({ cpUserId }: { cpUserId?: string | null }) {
  const { user, loading } = useCpUser(cpUserId);

  if (!cpUserId) {
    return (
      <RecordTableInlineCell className="text-muted-foreground text-xs">
        —
      </RecordTableInlineCell>
    );
  }
  if (loading) {
    return (
      <RecordTableInlineCell className="text-xs text-muted-foreground">
        …
      </RecordTableInlineCell>
    );
  }

  return (
    <RecordTableInlineCell className="text-xs max-w-[200px]">
      {user ? formatCpUserLabel(user) : cpUserId}
    </RecordTableInlineCell>
  );
}

function CpUserPhoneCell({ cpUserId }: { cpUserId?: string | null }) {
  const { user, loading } = useCpUser(cpUserId);

  if (!cpUserId) {
    return (
      <RecordTableInlineCell className="text-muted-foreground text-xs">
        —
      </RecordTableInlineCell>
    );
  }
  if (loading) {
    return (
      <RecordTableInlineCell className="text-xs text-muted-foreground">
        …
      </RecordTableInlineCell>
    );
  }

  return (
    <RecordTableInlineCell className="text-xs max-w-[160px]">
      {user?.phone || '—'}
    </RecordTableInlineCell>
  );
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

const ALL_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
] as const;

function StatusChangeCell({
  id,
  currentStatus,
  onChanged,
}: {
  id: string;
  currentStatus: string;
  onChanged: () => void;
}) {
  const [updateStatus, { loading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_UPDATE,
  );

  const handleSelect = (status: string) => {
    void updateStatus({ variables: { _id: id, status } }).then(onChanged);
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          className="capitalize gap-1"
        >
          {currentStatus}
          <IconSelector size={14} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {ALL_STATUSES.filter((s) => s !== currentStatus).map((s) => (
          <DropdownMenu.Item key={s} onSelect={() => handleSelect(s)}>
            {s}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

function MarkReadCell({
  id,
  isRead,
  onChanged,
}: {
  id: string;
  isRead: boolean;
  onChanged: () => void;
}) {
  const [markRead, { loading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_MARK_READ,
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={loading}
      onClick={() => {
        void markRead({ variables: { _id: id, isRead: !isRead } }).then(
          onChanged,
        );
      }}
      title={isRead ? 'Уншсан' : 'Уншаагүй — тэмдэглэх'}
      className={isRead ? 'text-muted-foreground' : 'text-primary'}
    >
      {isRead ? <IconMailOpened size={16} /> : <IconCircleFilled size={10} />}
    </Button>
  );
}

function RemoveApplicationButton({
  id,
  onRemoved,
}: {
  id: string;
  onRemoved: () => void;
}) {
  const { confirm } = useConfirm();
  const [removeApplication, { loading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_REMOVE,
  );

  return (
    <Button
      type="button"
      variant="destructive"
      size="icon"
      disabled={loading}
      title="Архивлах"
      onClick={() => {
        void confirm({
          message: 'Та энэ бүртгэлийг архивлахдаа итгэлтэй байна уу?',
          options: { confirmationValue: 'archive' },
        }).then(() => {
          void removeApplication({ variables: { _id: id } }).then(onRemoved);
        });
      }}
    >
      <IconTrash size={16} />
    </Button>
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
    accessorKey: 'isRead',
    header: '',
    cell: ({ row }) => (
      <RecordTableInlineCell className="w-8">
        <MarkReadCell
          id={row.original._id}
          isRead={Boolean(row.original.isRead)}
          onChanged={onChanged}
        />
      </RecordTableInlineCell>
    ),
  },
  {
    accessorKey: 'membershipTypeTitle',
    header: () => <RecordTable.InlineHead label="Төрөл" />,
    cell: ({ cell, row }) => {
      const setActiveId = useSetAtom(registrationDetailSheetState);
      return (
        <RecordTableInlineCell.Anchor
          className="text-sm font-medium max-w-[240px] cursor-pointer"
          onClick={() => setActiveId(row.original._id)}
        >
          {(cell.getValue() as string) || '—'}
        </RecordTableInlineCell.Anchor>
      );
    },
  },
  {
    accessorKey: 'cpUserId',
    header: () => <RecordTable.InlineHead label="Хэрэглэгч" />,
    cell: ({ cell }) => (
      <CpUserCell cpUserId={cell.getValue() as string | null | undefined} />
    ),
  },
  {
    id: 'cpUserPhone',
    accessorKey: 'cpUserId',
    header: () => <RecordTable.InlineHead label="Утас" />,
    cell: ({ cell }) => (
      <CpUserPhoneCell
        cpUserId={cell.getValue() as string | null | undefined}
      />
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: () => <RecordTable.InlineHead label="Төлбөр" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <Badge
          variant={paymentStatusBadgeVariant(cell.getValue() as string | null)}
          className="capitalize text-xs"
        >
          {(cell.getValue() as string | null) ?? 'unpaid'}
        </Badge>
      </RecordTableInlineCell>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: () => <RecordTable.InlineHead label="Огноо" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-xs">
        <RelativeDateDisplay value={cell.getValue() as string} asChild>
          <RelativeDateDisplay.Value value={cell.getValue() as string} />
        </RelativeDateDisplay>
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const setActiveId = useSetAtom(registrationDetailSheetState);
      const id = row.original._id;
      const status = row.original.status ?? 'draft';

      return (
        <RecordTableInlineCell className="flex justify-end items-center gap-2">
          <StatusChangeCell
            id={id}
            currentStatus={status}
            onChanged={onChanged}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveId(id)}
          >
            Дэлгэрэнгүй
          </Button>
          {!hideArchive && (
            <RemoveApplicationButton id={id} onRemoved={onChanged} />
          )}
        </RecordTableInlineCell>
      );
    },
  },
];

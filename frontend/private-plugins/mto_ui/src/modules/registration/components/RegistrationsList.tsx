import { IconCircleFilled, IconMailOpened, IconSelector, IconUsers } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  Collapsible,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useRegistrations } from '@/registration/hooks/useRegistrations';
import { REGISTRATIONS_CURSOR_SESSION_KEY } from '@/registration/constants/registrationsCursorSessionKey';
import { RegistrationFilters as RegistrationFiltersType } from '@/registration/types/registrationFilters';
import { RegistrationDetailSheet } from '@/registration/components/RegistrationDetailSheet';
import { GET_CLIENT_PORTAL_USER_FOR_SELECT } from '@/registration/graphql/clientPortalUsersQueries';
import { IClientPortalUserRow } from '@/registration/components/ClientPortalUserSelect';
import { MTO_REGISTRATION_APPLICATION_UPDATE, MTO_REGISTRATION_APPLICATION_MARK_READ } from '@/registration/graphql/registrationMutations';

function formatCpUserLabel(u: IClientPortalUserRow): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (u.email) return u.email;
  if (u.phone) return u.phone;
  if (u.username) return u.username;
  return u._id;
}

function useCpUser(cpUserId?: string | null) {
  const { data, loading } = useQuery(GET_CLIENT_PORTAL_USER_FOR_SELECT, {
    variables: { _id: cpUserId || '' },
    skip: !cpUserId,
  });
  return { user: data?.getClientPortalUser as IClientPortalUserRow | undefined, loading };
}

function CpUserCell({ cpUserId }: { cpUserId?: string | null }) {
  const { user, loading } = useCpUser(cpUserId);

  if (!cpUserId) return <RecordTableInlineCell className="text-muted-foreground text-xs">—</RecordTableInlineCell>;
  if (loading) return <RecordTableInlineCell className="text-xs text-muted-foreground">…</RecordTableInlineCell>;

  return (
    <RecordTableInlineCell className="text-xs max-w-[200px]">
      {user ? formatCpUserLabel(user) : cpUserId}
    </RecordTableInlineCell>
  );
}

function CpUserPhoneCell({ cpUserId }: { cpUserId?: string | null }) {
  const { user, loading } = useCpUser(cpUserId);

  if (!cpUserId) return <RecordTableInlineCell className="text-muted-foreground text-xs">—</RecordTableInlineCell>;
  if (loading) return <RecordTableInlineCell className="text-xs text-muted-foreground">…</RecordTableInlineCell>;

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

function PaymentStatusCell({ paymentStatus }: { paymentStatus?: string | null }) {
  return (
    <RecordTableInlineCell>
      <Badge
        variant={paymentStatusBadgeVariant(paymentStatus)}
        className="capitalize text-xs"
      >
        {paymentStatus ?? 'unpaid'}
      </Badge>
    </RecordTableInlineCell>
  );
}

const ALL_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected'] as const;

function StatusChangeCell({
  id,
  currentStatus,
  onChanged,
}: {
  id: string;
  currentStatus: string;
  onChanged: () => void;
}) {
  const [updateStatus, { loading }] = useMutation(MTO_REGISTRATION_APPLICATION_UPDATE);

  const handleSelect = (status: string) => {
    void updateStatus({ variables: { _id: id, status } }).then(onChanged);
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={loading} className="capitalize gap-1">
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
  const [markRead, { loading }] = useMutation(MTO_REGISTRATION_APPLICATION_MARK_READ);

  const handleToggle = () => {
    void markRead({ variables: { _id: id, isRead: !isRead } }).then(onChanged);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={loading}
      onClick={handleToggle}
      title={isRead ? 'Уншсан' : 'Уншаагүй — тэмдэглэх'}
      className={isRead ? 'text-muted-foreground' : 'text-primary'}
    >
      {isRead ? <IconMailOpened size={16} /> : <IconCircleFilled size={10} />}
    </Button>
  );
}

function GroupSection({
  cpUserId,
  registrations,
  refetch,
  onOpenDetail,
}: {
  cpUserId: string | null;
  registrations: Record<string, unknown>[];
  refetch: () => void;
  onOpenDetail: (id: string) => void;
}) {
  const { user } = useCpUser(cpUserId);

  const label = cpUserId
    ? user
      ? formatCpUserLabel(user)
      : cpUserId
    : 'Хэрэглэгчгүй';

  const innerColumns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'isRead',
      header: '',
      cell: ({ row }) => (
        <RecordTableInlineCell className="w-8">
          <MarkReadCell
            id={row.original._id as string}
            isRead={Boolean(row.original.isRead)}
            onChanged={refetch}
          />
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'membershipTypeTitle',
      header: 'Төрөл',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-sm font-medium max-w-[240px]">
          {(cell.getValue() as string) || '—'}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Төлбөр',
      cell: ({ cell }) => (
        <PaymentStatusCell paymentStatus={cell.getValue() as string | null} />
      ),
    },

    {
      accessorKey: 'createdAt',
      header: 'Огноо',
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
        const id = row.original._id as string;
        const status = row.original.status as string;
        return (
          <RecordTableInlineCell className="flex justify-start items-center gap-2">
            <StatusChangeCell id={id} currentStatus={status} onChanged={refetch} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDetail(id)}
            >
              Дэлгэрэнгүй
            </Button>
          </RecordTableInlineCell>
        );
      },
    },
  ];

  return (
    <Collapsible defaultOpen className="border rounded-md overflow-hidden">
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 bg-muted/50 hover:bg-muted text-sm font-medium text-left"
        >
          <Collapsible.TriggerIcon size={14} />
          <span className="flex-1 truncate">{label}</span>
          {user?.phone && (
            <span className="text-xs text-muted-foreground font-normal shrink-0">
              {user.phone}
            </span>
          )}
          <Badge variant="secondary" className="shrink-0">
            {registrations.length}
          </Badge>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <RecordTable.Provider columns={innerColumns} data={registrations}>
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              <RecordTable.RowList />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.Provider>
      </Collapsible.Content>
    </Collapsible>
  );
}

function GroupedRegistrationsView({
  groups,
  refetch,
  onOpenDetail,
}: {
  groups: [string | null, Record<string, unknown>[]][];
  refetch: () => void;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <div className="m-3 space-y-2">
      {groups.map(([cpUserId, regs]) => (
        <GroupSection
          key={cpUserId ?? '__none__'}
          cpUserId={cpUserId}
          registrations={regs}
          refetch={refetch}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

interface RegistrationsListProps {
  filters?: RegistrationFiltersType;
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'submitted':
      return 'default';
    case 'under_review':
      return 'warning';
    case 'draft':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function RegistrationsList({ filters }: RegistrationsListProps) {
  const { registrations, handleFetchMore, loading, pageInfo, refetch } =
    useRegistrations(filters);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [groupByUser, setGroupByUser] = useState(false);

  const grouped = useMemo(() => {
    if (!groupByUser || !registrations) return [];
    const map = new Map<string | null, Record<string, unknown>[]>();
    for (const reg of registrations as Record<string, unknown>[]) {
      const key = (reg.cpUserId as string | null) ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(reg);
    }
    return Array.from(map.entries());
  }, [groupByUser, registrations]);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'isRead',
      header: '',
      cell: ({ row }) => (
        <RecordTableInlineCell className="w-8">
          <MarkReadCell
            id={row.original._id as string}
            isRead={Boolean(row.original.isRead)}
            onChanged={() => void refetch()}
          />
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'cpUserId',
      header: 'Хэрэглэгч',
      cell: ({ cell }) => (
        <CpUserCell cpUserId={cell.getValue() as string | null | undefined} />
      ),
    },
    {
      id: 'cpUserPhone',
      accessorKey: 'cpUserId',
      header: 'Утас',
      cell: ({ cell }) => (
        <CpUserPhoneCell cpUserId={cell.getValue() as string | null | undefined} />
      ),
    },
    {
      accessorKey: 'membershipTypeTitle',
      header: 'Төрөл',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-sm font-medium max-w-[240px]">
          {(cell.getValue() as string) || '—'}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Төлбөр',
      cell: ({ cell }) => (
        <PaymentStatusCell paymentStatus={cell.getValue() as string | null} />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Огноо',
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
        const id = row.original._id as string;
        const status = row.original.status as string;
        return (
          <RecordTableInlineCell className="flex justify-start items-center gap-2">
            <StatusChangeCell id={id} currentStatus={status} onChanged={() => void refetch()} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailId(id);
                setDetailOpen(true);
              }}
            >
              Дэлгэрэнгүй
            </Button>
          </RecordTableInlineCell>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex justify-end px-3 pt-3">
        <Button
          variant={groupByUser ? 'default' : 'outline'}
          size="sm"
          type="button"
          onClick={() => setGroupByUser((v) => !v)}
        >
          <IconUsers size={14} className="mr-1" />
          Хэрэглэгчээр бүлэглэх
        </Button>
      </div>

      {groupByUser ? (
        <GroupedRegistrationsView
          groups={grouped}
          refetch={() => void refetch()}
          onOpenDetail={(id) => {
            setDetailId(id);
            setDetailOpen(true);
          }}
        />
      ) : (
        <RecordTable.Provider
          columns={columns}
          data={registrations || []}
          className="m-3"
        >
          <RecordTable.CursorProvider
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            dataLength={registrations?.length}
            sessionKey={REGISTRATIONS_CURSOR_SESSION_KEY}
          >
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                <RecordTable.CursorBackwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
                {loading && <RecordTable.RowSkeleton rows={40} />}
                <RecordTable.RowList />
                <RecordTable.CursorForwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.CursorProvider>
        </RecordTable.Provider>
      )}

      <RegistrationDetailSheet
        applicationId={detailId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailId(null);
        }}
        onSaved={() => {
          void refetch();
        }}
      />
    </>
  );
}

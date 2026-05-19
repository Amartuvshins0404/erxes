import { IconSelector } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useRegistrations } from '@/registration/hooks/useRegistrations';
import { REGISTRATIONS_CURSOR_SESSION_KEY } from '@/registration/constants/registrationsCursorSessionKey';
import { RegistrationFilters as RegistrationFiltersType } from '@/registration/types/registrationFilters';
import { RegistrationDetailSheet } from '@/registration/components/RegistrationDetailSheet';
import { GET_CLIENT_PORTAL_USER_FOR_SELECT } from '@/registration/graphql/clientPortalUsersQueries';
import { IClientPortalUserRow } from '@/registration/components/ClientPortalUserSelect';
import { MTO_REGISTRATION_APPLICATION_UPDATE } from '@/registration/graphql/registrationMutations';

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
        <Button type="button" variant="outline" size="icon" disabled={loading}>
          <IconSelector size={16} />
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

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<Record<string, unknown>>[] = [
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
      accessorKey: 'membershipTypeId',
      header: 'ID төрөл',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="font-mono text-xs">
          {cell.getValue() as string}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'schemaVersion',
      header: 'Хувилбар',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="font-mono text-xs">
          {cell.getValue() as string}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Төлөв',
      cell: ({ cell }) => {
        const status = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            <Badge variant={statusBadgeVariant(status)} className="capitalize">
              {status}
            </Badge>
          </RecordTableInlineCell>
        );
      },
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
          <RecordTableInlineCell className="flex gap-2">
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

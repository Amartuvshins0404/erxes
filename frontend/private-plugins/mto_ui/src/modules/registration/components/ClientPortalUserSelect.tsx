import { useQuery } from '@apollo/client';
import { useDebounce } from 'use-debounce';
import {
  cn,
  Combobox,
  Command,
  EnumCursorDirection,
  mergeCursorData,
  Popover,
  validateFetchMore,
} from 'erxes-ui';
import { useCallback, useMemo, useState } from 'react';
import {
  GET_CLIENT_PORTAL_USERS_FOR_SELECT,
  GET_CLIENT_PORTAL_USER_FOR_SELECT,
} from '@/registration/graphql/clientPortalUsersQueries';

const PAGE_SIZE = 20;

export interface IClientPortalUserRow {
  _id: string;
  clientPortalId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}

export function formatCpUserLabel(u: IClientPortalUserRow): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (u.email) return u.email;
  if (u.phone) return u.phone;
  if (u.username) return u.username;
  return 'CP хэрэглэгч';
}

function formatCpUserMeta(u: IClientPortalUserRow): string {
  return [u.phone, u.email].filter(Boolean).join(' · ');
}

interface ClientPortalUserSelectProps {
  /** When set, `getClientPortalUsers` is scoped to this client portal `_id`. */
  clientPortalIdFilter?: string | null;
  value?: string | null;
  onValueChange?: (user: IClientPortalUserRow | null) => void;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ClientPortalUserSelect({
  clientPortalIdFilter,
  value,
  onValueChange,
  allowClear = true,
  disabled = false,
  className,
  placeholder = 'Client portal user…',
}: ClientPortalUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);

  const { data, loading, fetchMore } = useQuery(
    GET_CLIENT_PORTAL_USERS_FOR_SELECT,
    {
      variables: {
        searchValue: debouncedSearch || undefined,
        clientPortalId: clientPortalIdFilter || undefined,
        limit: PAGE_SIZE,
        direction: EnumCursorDirection.FORWARD,
        cursor: undefined,
      },
    },
  );

  const listData = data?.getClientPortalUsers;
  const users = (listData?.list ?? []) as IClientPortalUserRow[];
  const pageInfo = listData?.pageInfo;
  const totalCount = listData?.totalCount ?? 0;

  const { data: selectedData, loading: selectedLoading } = useQuery(
    GET_CLIENT_PORTAL_USER_FOR_SELECT,
    {
      variables: { _id: value || '' },
      skip: !value,
    },
  );

  const selectedUser = selectedData?.getClientPortalUser as
    | IClientPortalUserRow
    | undefined;

  const displayLabel = useMemo(() => {
    if (!value) return '';
    if (selectedUser && selectedUser._id === value) {
      const meta = formatCpUserMeta(selectedUser);
      const name = formatCpUserLabel(selectedUser);
      return meta ? `${name} · ${meta}` : name;
    }
    return '';
  }, [value, selectedUser]);

  const handleFetchMore = useCallback(() => {
    if (
      !validateFetchMore({
        direction: EnumCursorDirection.FORWARD,
        pageInfo,
      })
    ) {
      return;
    }
    void fetchMore({
      variables: {
        searchValue: debouncedSearch || undefined,
        clientPortalId: clientPortalIdFilter || undefined,
        limit: PAGE_SIZE,
        direction: EnumCursorDirection.FORWARD,
        cursor: pageInfo?.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          getClientPortalUsers: mergeCursorData({
            direction: EnumCursorDirection.FORWARD,
            fetchMoreResult: fetchMoreResult.getClientPortalUsers,
            prevResult: prev.getClientPortalUsers,
          }),
        });
      },
    });
  }, [clientPortalIdFilter, debouncedSearch, fetchMore, pageInfo]);

  const selectUser = (user: IClientPortalUserRow | null) => {
    onValueChange?.(user);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger
        className={cn('w-full inline-flex', className)}
        variant="outline"
        disabled={disabled}
      >
        <Combobox.Value
          placeholder={placeholder}
          loading={!!value && !selectedUser && selectedLoading}
          value={value ? displayLabel : undefined}
        />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            variant="secondary"
            wrapperClassName="flex-auto"
            focusOnMount
            placeholder="Search email, phone, name…"
          />
          <Command.List className="max-h-[280px] overflow-y-auto">
            {allowClear && value ? (
              <>
                <Command.Item
                  value="__clear__"
                  onSelect={() => selectUser(null)}
                >
                  <span className="text-muted-foreground">Clear selection</span>
                </Command.Item>
                <Command.Separator className="my-1" />
              </>
            ) : null}
            {selectedUser && value === selectedUser._id ? (
              <>
                <Command.Item
                  value={selectedUser._id}
                  onSelect={() => selectUser(selectedUser)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatCpUserLabel(selectedUser)}
                    </span>
                    {formatCpUserMeta(selectedUser) ? (
                      <span className="text-xs text-muted-foreground">
                        {formatCpUserMeta(selectedUser)}
                      </span>
                    ) : null}
                  </div>
                  <Combobox.Check checked />
                </Command.Item>
                <Command.Separator className="my-1" />
              </>
            ) : null}
            <Combobox.Empty loading={loading} />
            {!loading &&
              users
                .filter((u) => u._id !== value)
                .map((u) => (
                  <Command.Item
                    key={u._id}
                    value={u._id}
                    onSelect={() => selectUser(u)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatCpUserLabel(u)}
                      </span>
                      {formatCpUserMeta(u) ? (
                        <span className="text-xs text-muted-foreground">
                          {formatCpUserMeta(u)}
                        </span>
                      ) : null}
                    </div>
                    <Combobox.Check checked={value === u._id} />
                  </Command.Item>
                ))}
            <Combobox.FetchMore
              fetchMore={handleFetchMore}
              currentLength={users.length}
              totalCount={totalCount}
            />
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
}

import { useQuery } from '@apollo/client';
import {
  IconArchive,
  IconBuilding,
  IconCalendarClock,
  IconCalendarTime,
  IconCheck,
  IconId,
  IconMail,
  IconProgress,
  IconSearch,
  IconTag,
  IconUser,
} from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useFilterContext,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { ClientPortalRemoteSelect } from '@/registration/components/ClientPortalRemoteSelect';
import { ClientPortalUserSelect } from '@/registration/components/ClientPortalUserSelect';
import { REGISTRATION_ACTIVITY_CATEGORY_OPTIONS } from '@/registration/constants/activityCategoryOptions';
import { REGISTRATIONS_CURSOR_SESSION_KEY } from '@/registration/constants/registrationsCursorSessionKey';
import { MTO_REGISTRATION_MEMBERSHIP_SUMMARIES } from '@/registration/graphql/registrationQueries';
import { RegistrationsTotalCount } from '@/registration/components/RegistrationsTotalCount';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'submitted', label: 'Илгээсэн' },
  { value: 'under_review', label: 'Хянагдаж буй' },
  { value: 'approved', label: 'Зөвшөөрсөн' },
  { value: 'rejected', label: 'Татгалзсан' },
];

const ARCHIVED_OPTIONS = [
  { value: 'true', label: 'Зөвхөн архив' },
];

interface MembershipSummary {
  membershipTypeId: string;
  title: string;
}

const RegistrationStatusFilterView = () => {
  const [status, setStatus] = useQueryState<string>('status');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="status">
      <Command>
        <Command.List className="p-1">
          {STATUS_OPTIONS.map((option) => (
            <Command.Item
              key={option.value}
              value={option.value}
              onSelect={() => {
                void setStatus(status === option.value ? null : option.value);
                resetFilterState();
              }}
            >
              {option.label}
              {status === option.value && <IconCheck className="ml-auto" />}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const MembershipTypeFilterView = () => {
  const [membershipTypeId, setMembershipTypeId] =
    useQueryState<string>('membershipTypeId');
  const { resetFilterState } = useFilterContext();
  const { data } = useQuery(MTO_REGISTRATION_MEMBERSHIP_SUMMARIES);
  const summaries = (data?.mtoRegistrationMembershipSummaries ??
    []) as MembershipSummary[];

  return (
    <Filter.View filterKey="membershipTypeId">
      <Command>
        <Command.Input placeholder="Төрөл хайх" />
        <Command.List className="p-1">
          <Command.Empty>Төрөл олдсонгүй</Command.Empty>
          {summaries.map((summary) => (
            <Command.Item
              key={summary.membershipTypeId}
              value={summary.title}
              onSelect={() => {
                void setMembershipTypeId(
                  membershipTypeId === summary.membershipTypeId
                    ? null
                    : summary.membershipTypeId,
                );
                resetFilterState();
              }}
            >
              {summary.title}
              {membershipTypeId === summary.membershipTypeId && (
                <IconCheck className="ml-auto" />
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const ActivityCategoryFilterView = () => {
  const [activityCategory, setActivityCategory] =
    useQueryState<string>('activityCategory');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="activityCategory">
      <Command>
        <Command.Input placeholder="Ангилал хайх" />
        <Command.List className="p-1">
          <Command.Empty>Ангилал олдсонгүй</Command.Empty>
          {REGISTRATION_ACTIVITY_CATEGORY_OPTIONS.map((option) => (
            <Command.Item
              key={option.value}
              value={option.label}
              onSelect={() => {
                void setActivityCategory(
                  activityCategory === option.value ? null : option.value,
                );
                resetFilterState();
              }}
            >
              {option.label}
              {activityCategory === option.value && (
                <IconCheck className="ml-auto" />
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const ArchivedFilterView = () => {
  const [archived, setArchived] = useQueryState<string>('archived');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="archived">
      <Command>
        <Command.List className="p-1">
          {ARCHIVED_OPTIONS.map((option) => (
            <Command.Item
              key={option.value}
              value={option.value}
              onSelect={() => {
                void setArchived(
                  archived === option.value ? null : option.value,
                );
                resetFilterState();
              }}
            >
              {option.label}
              {archived === option.value && <IconCheck className="ml-auto" />}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const ClientPortalFilterView = () => {
  const [cpPortalId, setCpPortalId] = useQueryState<string>('cpPortalId');
  const [, setCpUserId] = useQueryState<string>('cpUserId');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="cpPortalId">
      <div className="p-2 w-72">
        <ClientPortalRemoteSelect
          value={cpPortalId}
          onValueChange={(id) => {
            void setCpPortalId(id ?? null);
            void setCpUserId(null);
            resetFilterState();
          }}
          placeholder="Бүх портал"
        />
      </div>
    </Filter.View>
  );
};

const CpUserFilterView = () => {
  const [cpUserId, setCpUserId] = useQueryState<string>('cpUserId');
  const [cpPortalId] = useQueryState<string>('cpPortalId');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="cpUserId">
      <div className="p-2 w-80">
        <ClientPortalUserSelect
          clientPortalIdFilter={cpPortalId}
          value={cpUserId}
          onValueChange={(user) => {
            void setCpUserId(user?._id ?? null);
            resetFilterState();
          }}
          placeholder="Бүх CP хэрэглэгч"
        />
      </div>
    </Filter.View>
  );
};

const RegistrationFiltersPopover = () => {
  const [queries] = useMultiQueryState<{
    name: string;
    registrationNumber: string;
    email: string;
    membershipTypeId: string;
    activityCategory: string;
    status: string;
    cpPortalId: string;
    cpUserId: string;
    createdAtFrom: string;
    createdAtTo: string;
    archived: string;
  }>([
    'name',
    'registrationNumber',
    'email',
    'membershipTypeId',
    'activityCategory',
    'status',
    'cpPortalId',
    'cpUserId',
    'createdAtFrom',
    'createdAtTo',
    'archived',
  ]);

  const hasFilters = Object.values(queries || {}).some((value) => value !== null);

  return (
    <>
      <Filter.Popover>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder="Шүүлт"
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="name" inDialog>
                  <IconSearch />
                  Нэр
                </Filter.Item>
                <Filter.Item value="registrationNumber" inDialog>
                  <IconId />
                  Байгууллагын РД
                </Filter.Item>
                <Filter.Item value="email" inDialog>
                  <IconMail />
                  Имэйл
                </Filter.Item>
                <Command.Separator className="my-1" />
                <Filter.Item value="cpPortalId">
                  <IconBuilding />
                  Client portal
                </Filter.Item>
                <Filter.Item value="cpUserId">
                  <IconUser />
                  CP хэрэглэгч
                </Filter.Item>
                <Filter.Item value="membershipTypeId">
                  <IconTag />
                  Төрөл
                </Filter.Item>
                <Filter.Item value="activityCategory">
                  <IconTag />
                  Үйл ажиллагааны ангилал
                </Filter.Item>
                <Filter.Item value="status">
                  <IconProgress />
                  Төлөв
                </Filter.Item>
                <Filter.Item value="createdAtFrom">
                  <IconCalendarClock />
                  Огноо эхлэх
                </Filter.Item>
                <Filter.Item value="createdAtTo">
                  <IconCalendarTime />
                  Огноо дуусах
                </Filter.Item>
                <Filter.Item value="archived">
                  <IconArchive />
                  Архив
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <ClientPortalFilterView />
          <CpUserFilterView />
          <MembershipTypeFilterView />
          <ActivityCategoryFilterView />
          <RegistrationStatusFilterView />
          <ArchivedFilterView />
          <Filter.View filterKey="createdAtFrom">
            <Filter.DateView filterKey="createdAtFrom" />
          </Filter.View>
          <Filter.View filterKey="createdAtTo">
            <Filter.DateView filterKey="createdAtTo" />
          </Filter.View>
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="name" inDialog>
          <Filter.DialogStringView filterKey="name" />
        </Filter.View>
        <Filter.View filterKey="registrationNumber" inDialog>
          <Filter.DialogStringView filterKey="registrationNumber" />
        </Filter.View>
        <Filter.View filterKey="email" inDialog>
          <Filter.DialogStringView filterKey="email" />
        </Filter.View>
        <Filter.View filterKey="createdAtFrom" inDialog>
          <Filter.DialogDateView filterKey="createdAtFrom" />
        </Filter.View>
        <Filter.View filterKey="createdAtTo" inDialog>
          <Filter.DialogDateView filterKey="createdAtTo" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const RegistrationFilters = () => {
  const [queries] = useMultiQueryState<{
    name: string;
    registrationNumber: string;
    email: string;
    membershipTypeId: string;
    activityCategory: string;
    status: string;
    cpUserId: string;
    archived: string;
  }>([
    'name',
    'registrationNumber',
    'email',
    'membershipTypeId',
    'activityCategory',
    'status',
    'cpUserId',
    'archived',
  ]);

  const { data } = useQuery(MTO_REGISTRATION_MEMBERSHIP_SUMMARIES);
  const summaries = (data?.mtoRegistrationMembershipSummaries ??
    []) as MembershipSummary[];

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === queries?.status)?.label ??
    queries?.status;
  const membershipTitle =
    summaries.find(
      (summary) => summary.membershipTypeId === queries?.membershipTypeId,
    )?.title ?? queries?.membershipTypeId;
  const activityLabel =
    REGISTRATION_ACTIVITY_CATEGORY_OPTIONS.find(
      (option) => option.value === queries?.activityCategory,
    )?.label ?? queries?.activityCategory;

  return (
    <Filter
      id="registrations-filter"
      sessionKey={REGISTRATIONS_CURSOR_SESSION_KEY}
    >
      <Filter.Bar>
        {queries?.name && (
          <Filter.BarItem queryKey="name">
            <Filter.BarName>
              <IconSearch />
              Нэр
            </Filter.BarName>
            <Filter.BarButton filterKey="name" inDialog>
              {queries.name}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        {queries?.registrationNumber && (
          <Filter.BarItem queryKey="registrationNumber">
            <Filter.BarName>
              <IconId />
              РД
            </Filter.BarName>
            <Filter.BarButton filterKey="registrationNumber" inDialog>
              {queries.registrationNumber}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        {queries?.email && (
          <Filter.BarItem queryKey="email">
            <Filter.BarName>
              <IconMail />
              Имэйл
            </Filter.BarName>
            <Filter.BarButton filterKey="email" inDialog>
              {queries.email}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="cpPortalId">
          <Filter.BarName>
            <IconBuilding />
            Client portal
          </Filter.BarName>
          <Filter.BarButton filterKey="cpPortalId">Портал</Filter.BarButton>
        </Filter.BarItem>
        {queries?.cpUserId && (
          <Filter.BarItem queryKey="cpUserId">
            <Filter.BarName>
              <IconUser />
              CP хэрэглэгч
            </Filter.BarName>
            <Filter.BarButton filterKey="cpUserId">
              {queries.cpUserId}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="membershipTypeId">
          <Filter.BarName>
            <IconTag />
            Төрөл
          </Filter.BarName>
          <Filter.BarButton filterKey="membershipTypeId">
            {membershipTitle}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="activityCategory">
          <Filter.BarName>
            <IconTag />
            Ангилал
          </Filter.BarName>
          <Filter.BarButton filterKey="activityCategory">
            {activityLabel}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgress />
            Төлөв
          </Filter.BarName>
          <Filter.BarButton filterKey="status">{statusLabel}</Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="createdAtFrom">
          <Filter.BarName>
            <IconCalendarClock />
            Огноо эхлэх
          </Filter.BarName>
          <Filter.Date filterKey="createdAtFrom" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="createdAtTo">
          <Filter.BarName>
            <IconCalendarTime />
            Огноо дуусах
          </Filter.BarName>
          <Filter.Date filterKey="createdAtTo" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="archived">
          <Filter.BarName>
            <IconArchive />
            Архив
          </Filter.BarName>
          <Filter.BarButton filterKey="archived">Зөвхөн архив</Filter.BarButton>
        </Filter.BarItem>
        <RegistrationFiltersPopover />
        <RegistrationsTotalCount />
      </Filter.Bar>
    </Filter>
  );
};

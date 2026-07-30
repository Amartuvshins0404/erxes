import { ContractsTotalCount } from '@/contract/components/ContractsTotalCount';
import { CONTRACTS_CURSOR_SESSION_KEY } from '@/contract/hooks/useGetContractsList';
import { useBlockContractStatusesByType } from '@/contract-status/hooks/useGetBlockContractStatuses';
import {
  IconSearch,
  IconProgressCheck,
  IconUser,
  IconCoin,
} from '@tabler/icons-react';
import {
  Badge,
  Combobox,
  Command,
  Filter,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { useParams } from 'react-router-dom';

const ContractsFilterPopover = () => {
  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';
  const { statuses } = useBlockContractStatusesByType({ projectId });

  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    partyType: string;
    currency: string;
  }>(['searchValue', 'status', 'partyType', 'currency']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  return (
    <>
      <Filter.Popover>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder="Filter"
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  Search
                </Filter.Item>
                <Command.Separator className="my-1" />
                <Filter.Item value="status">
                  <IconProgressCheck />
                  Status
                </Filter.Item>
                <Filter.Item value="partyType">
                  <IconUser />
                  Party Type
                </Filter.Item>
                <Filter.Item value="currency">
                  <IconCoin />
                  Currency
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <ContractStatusFilterView statuses={statuses || []} />
          <PartyTypeFilterView />
          <CurrencyFilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

const ContractStatusFilterView = ({
  statuses,
}: {
  statuses: { _id: string; name: string; color: string; type: string }[];
}) => {
  const [status, setStatus] = useQueryState<string>('status');

  return (
    <Filter.View filterKey="status">
      <Command>
        <Command.List className="p-1">
          {statuses.map((s) => (
            <Command.Item
              key={s._id}
              value={s._id}
              onSelect={() => setStatus(s._id)}
            >
              <span
                className="rounded-full size-2"
                style={{ backgroundColor: s.color || '#A0A0A0' }}
              />
              {s.name}
              {status === s._id && (
                <span className="ml-auto text-primary">&#10003;</span>
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const PartyTypeFilterView = () => {
  const [partyType, setPartyType] = useQueryState<string>('partyType');
  const options = [
    { value: 'customer', label: 'Customer' },
    { value: 'company', label: 'Company' },
  ];

  return (
    <Filter.View filterKey="partyType">
      <Command>
        <Command.List className="p-1">
          {options.map((opt) => (
            <Command.Item
              key={opt.value}
              value={opt.value}
              onSelect={() => setPartyType(opt.value)}
            >
              {opt.label}
              {partyType === opt.value && (
                <span className="ml-auto text-primary">&#10003;</span>
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const CurrencyFilterView = () => {
  const [currency, setCurrency] = useQueryState<string>('currency');
  const options = [
    { value: 'MNT', label: 'MNT' },
    { value: 'USD', label: 'USD' },
  ];

  return (
    <Filter.View filterKey="currency">
      <Command>
        <Command.List className="p-1">
          {options.map((opt) => (
            <Command.Item
              key={opt.value}
              value={opt.value}
              onSelect={() => setCurrency(opt.value)}
            >
              {opt.label}
              {currency === opt.value && (
                <span className="ml-auto text-primary">&#10003;</span>
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

export const ContractsFilter = () => {
  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';
  const { statuses } = useBlockContractStatusesByType({ projectId });

  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    partyType: string;
    currency: string;
  }>(['searchValue', 'status', 'partyType', 'currency']);
  const { searchValue } = queries || {};

  const statusDoc = statuses?.find((s) => s._id === queries?.status);

  return (
    <Filter id="Contracts-filter" sessionKey={CONTRACTS_CURSOR_SESSION_KEY}>
      <Filter.Bar>
        {searchValue && (
          <Filter.BarItem queryKey="searchValue">
            <Filter.BarName>
              <IconSearch />
              Search
            </Filter.BarName>
            <Filter.BarButton filterKey="searchValue" inDialog>
              {searchValue}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgressCheck />
            Status
          </Filter.BarName>
          <Filter.BarButton filterKey="status">
            {statusDoc ? (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: statusDoc.color
                    ? `${statusDoc.color}20`
                    : undefined,
                  color: statusDoc.color || undefined,
                }}
              >
                {statusDoc.name}
              </Badge>
            ) : (
              queries?.status
            )}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="partyType">
          <Filter.BarName>
            <IconUser />
            Party Type
          </Filter.BarName>
          <Filter.BarButton filterKey="partyType">
            {queries?.partyType === 'customer' ? 'Customer' : 'Company'}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="currency">
          <Filter.BarName>
            <IconCoin />
            Currency
          </Filter.BarName>
          <Filter.BarButton filterKey="currency">
            {queries?.currency}
          </Filter.BarButton>
        </Filter.BarItem>
        <ContractsFilterPopover />
        <ContractsTotalCount />
      </Filter.Bar>
    </Filter>
  );
};

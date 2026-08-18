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
import { OFFERS_CURSOR_SESSION_KEY } from '@/offer/hooks/useGetOffersList';
import { OffersTotalCount } from './OffersTotalCount';
import { SelectCustomer } from 'ui-modules';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
];

const CURRENCY_OPTIONS = [
  { value: 'MNT', label: 'MNT' },
  { value: 'USD', label: 'USD' },
];

const OfferStatusFilterView = () => {
  const [status, setStatus] = useQueryState<string>('status');
  return (
    <Filter.View filterKey="status">
      <Command>
        <Command.List className="p-1">
          {STATUS_OPTIONS.map((opt) => (
            <Command.Item
              key={opt.value}
              value={opt.value}
              onSelect={() => setStatus(opt.value)}
            >
              {opt.label}
              {status === opt.value && (
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
  return (
    <Filter.View filterKey="currency">
      <Command>
        <Command.List className="p-1">
          {CURRENCY_OPTIONS.map((opt) => (
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

const OffersFilterPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    customerId: string;
    currency: string;
  }>(['searchValue', 'status', 'customerId', 'currency']);

  const hasFilters = Object.values(queries || {}).some((v) => v !== null);

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
                <Filter.Item value="customerId">
                  <IconUser />
                  Customer
                </Filter.Item>
                <Filter.Item value="currency">
                  <IconCoin />
                  Currency
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <OfferStatusFilterView />
          <SelectCustomer.FilterView filterKey="customerId" mode="single" />
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

export const OffersFilter = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    customerId: string;
    currency: string;
  }>(['searchValue', 'status', 'customerId', 'currency']);

  const { searchValue, customerId } = queries || {};
  const statusLabel =
    STATUS_OPTIONS.find((s) => s.value === queries?.status)?.label ??
    queries?.status;

  return (
    <Filter id="Offers-filter" sessionKey={OFFERS_CURSOR_SESSION_KEY}>
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
            <Badge variant={queries?.status === 'sent' ? 'default' : 'secondary'}>
              {statusLabel}
            </Badge>
          </Filter.BarButton>
        </Filter.BarItem>
        {customerId && (
          <Filter.BarItem queryKey="customerId">
            <Filter.BarName>
              <IconUser />
              Customer
            </Filter.BarName>
            <SelectCustomer.FilterBar
              filterKey="customerId"
              label="Customer"
              mode="single"
            />
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="currency">
          <Filter.BarName>
            <IconCoin />
            Currency
          </Filter.BarName>
          <Filter.BarButton filterKey="currency">
            {queries?.currency}
          </Filter.BarButton>
        </Filter.BarItem>
        <OffersFilterPopover />
        <OffersTotalCount />
      </Filter.Bar>
    </Filter>
  );
};
